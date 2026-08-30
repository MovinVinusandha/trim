import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from './AnalyticsPage';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as routerDom from 'react-router-dom';

vi.mock('../api/axiosInstance', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn((cb) => {
  if (typeof cb === 'function') {
    mockSearchParams = cb(mockSearchParams);
  } else {
    mockSearchParams = cb;
  }
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      folders: [
        { id: 1, name: 'Main Folder', slug: 'main' },
        { id: 2, name: 'Marketing', slug: 'marketing' },
      ],
      tags: [
        { id: 10, name: 'Campaign', color: 'blue' },
        { id: 20, name: 'Social', color: 'green' },
      ],
      activeFolderId: null,
      setActiveFolderId: vi.fn(),
    }),
    useParams: vi.fn().mockReturnValue({}),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    useNavigate: () => mockNavigate,
  };
});

vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  };
});

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.spyOn(routerDom, 'useParams').mockReturnValue({});
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url === '/url/all') {
        return Promise.resolve({
          data: [
            { id: 1, shortUrl: 'http://localhost:8080/xyz789', longUrl: 'https://example.com/target', accessed_times: 15 },
          ],
        });
      }
      return Promise.resolve({
        data: {
          totalClicks: 1234,
          clicksByDate: [
            { date: '2026-08-01T00:00:00Z', count: 12 },
            { date: '2026-08-02T00:00:00Z', count: 24 },
          ],
          clicksByCountry: [{ country: 'US', count: 100 }, { country: 'GB', count: 50 }],
          clicksByDevice: [{ device: 'Desktop', count: 80 }, { device: 'Mobile', count: 40 }],
          clicksByBrowser: [{ browser: 'Chrome', count: 90 }, { browser: 'Safari', count: 30 }],
        },
      });
    });
  });

  it('renders summary metrics, countries, devices, browsers, and date breakdowns', async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText(/Desktop/)).toBeInTheDocument();
      expect(screen.getByText(/Mobile/)).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('GB')).toBeInTheDocument();
      expect(screen.getAllByText('Chrome')[0]).toBeInTheDocument();
    });
  });

  it('handles /analytics/:hash specific analytics route', async () => {
    vi.spyOn(routerDom, 'useParams').mockReturnValue({ hash: 'xyz789' });

    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/analytics/xyz789', expect.any(Object));
    });
  });

  it('handles Link filter dropdown, search, and selection', async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    fireEvent.click(screen.getByText('Link'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search links...')).toBeInTheDocument();
      expect(screen.getByText('/xyz789')).toBeInTheDocument();
    });

    // Search links
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'xyz' } });

    // Select link
    fireEvent.click(screen.getByText('/xyz789'));
  });

  it('handles Tag filter dropdown, search, and checkbox toggling', async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    fireEvent.click(screen.getByText('Tag'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tag...')).toBeInTheDocument();
      expect(screen.getByText('Campaign')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tag...');
    fireEvent.change(searchInput, { target: { value: 'Camp' } });

    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) fireEvent.click(checkbox);
  });

  it('handles Folder filter dropdown, search, and selection', async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    fireEvent.click(screen.getByText('Folder'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search folders...')).toBeInTheDocument();
      expect(screen.getByText('Main Folder')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'Main' } });

    fireEvent.click(screen.getByText('Main Folder'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/analytics/f/main'));
  });

  it('handles active compound filter pills (Tag pill, Folder pill, Link pill)', async () => {
    mockSearchParams = new URLSearchParams('tagId=10,20&folderId=1');
    vi.spyOn(routerDom, 'useParams').mockReturnValue({ hash: 'xyz789' });

    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('2 Tags')).toBeInTheDocument();
      expect(screen.getByText('Main Folder')).toBeInTheDocument();
    });

    // Click Tag pill trigger to open popover
    fireEvent.click(screen.getByText('2 Tags'));
    expect(screen.getByPlaceholderText('Tag...')).toBeInTheDocument();

    // Toggle tag checkbox in popover
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) fireEvent.click(checkboxes[0]);

    // Clear tag filter via tag pill X button
    const tagCloseButtons = screen.getAllByRole('button');
    const xButtons = tagCloseButtons.filter(b => b.querySelector('svg.lucide-x'));
    if (xButtons.length > 0) {
      xButtons.forEach(btn => fireEvent.click(btn));
    }
  });

  it('handles active folder pill popover search and selection', async () => {
    mockSearchParams = new URLSearchParams('folderId=1');

    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Main Folder')).toBeInTheDocument();
    });

    // Click Folder pill trigger to open popover
    fireEvent.click(screen.getByText('Main Folder'));
    expect(screen.getByPlaceholderText('Search folders...')).toBeInTheDocument();

    // Search and select folder inside folder pill popover
    const folderSearchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(folderSearchInput, { target: { value: 'Market' } });
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Marketing'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/analytics/f/marketing'));
  });

  it('renders single active tag pill correctly', async () => {
    mockSearchParams = new URLSearchParams('tagId=10');

    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Campaign')).toBeInTheDocument();
    });
  });

  it('displays API error states gracefully', async () => {
    (axiosInstance.get as any).mockRejectedValue(new Error('Network Error'));

    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Network Error|Failed to load/i)).toBeInTheDocument();
    });
  });
});
