import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as routerDom from 'react-router-dom';

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), put: vi.fn() },
  extractBackendError: vi.fn((err, fallback) => err?.response?.data?.message || fallback),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useOutletContext
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(() => ({
      triggerRefresh: null,
      tags: [],
      folders: [],
      activeFolderId: null,
    })),
  };
});

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_, prop: string) => {
          return React.forwardRef(({ children, layout, initial, animate, exit, transition, ...props }: any, ref: any) => {
            const Component = prop as any;
            return <Component ref={ref} {...props}>{children}</Component>;
          });
        },
      }
    ),
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('URL table renders links and click counts correctly', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({
      data: [
        {
          longUrl: 'https://example.com/one',
          shortUrl: 'http://trim.sh/abc123',
          accessed_times: 42,
          createdAt: new Date().toISOString(),
        },
        {
          longUrl: 'https://example.com/two',
          shortUrl: 'http://trim.sh/def456',
          accessed_times: 7,
          createdAt: new Date().toISOString(),
        }
      ]
    });
    
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
      expect(screen.getByText('https://example.com/one')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      
      expect(screen.getByText(/def456/)).toBeInTheDocument();
      expect(screen.getByText('https://example.com/two')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('typing into Search Bar filters the displayed links', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({
      data: [
        {
          longUrl: 'https://example.com/one',
          shortUrl: 'http://trim.sh/abc123',
          accessed_times: 42,
          createdAt: new Date().toISOString(),
        },
        {
          longUrl: 'https://example.com/two',
          shortUrl: 'http://trim.sh/def456',
          accessed_times: 7,
          createdAt: new Date().toISOString(),
        }
      ]
    });
    
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by short link or URL');
    fireEvent.change(searchInput, { target: { value: 'def' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/abc123/)).not.toBeInTheDocument();
      expect(screen.getByText(/def456/)).toBeInTheDocument();
    });
  });

  it('URL query parameters correctly initialize selectedFilterTags', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({
      data: [
        { longUrl: 'https://example.com/one', shortUrl: 'http://trim.sh/abc123', tags: [{ id: 1, name: 'youtube', color: '#ff0000' }] },
        { longUrl: 'https://example.com/two', shortUrl: 'http://trim.sh/def456', tags: [] }
      ]
    });
    
    // Override useOutletContext to provide a tag
    vi.spyOn(routerDom, 'useOutletContext').mockReturnValue({
      triggerRefresh: null,
      tags: [{ id: 1, name: 'youtube', color: '#ff0000' }],
      folders: [],
      activeFolderId: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard?tag=youtube']}>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
      // def456 should be filtered out
      expect(screen.queryByText(/def456/)).not.toBeInTheDocument();
    });
  });

  it('Display dropdown changes sort order and hides properties', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({
      data: [
        { longUrl: 'https://example.com/one', shortUrl: 'http://trim.sh/abc123', accessed_times: 10, createdAt: '2023-01-01T00:00:00Z' },
        { longUrl: 'https://example.com/two', shortUrl: 'http://trim.sh/def456', accessed_times: 50, createdAt: '2023-01-02T00:00:00Z' }
      ]
    });
    
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });
    
    // Open Display Dropdown
    fireEvent.click(screen.getByText(/Display/));
    
    // Click 'Destination URL' to hide it
    fireEvent.click(screen.getByText('Destination URL'));
    
    expect(screen.queryByText('https://example.com/one')).not.toBeInTheDocument();

    // Open Sort Menu
    fireEvent.click(screen.getAllByText('Date created')[0]);
    
    // Click 'Total clicks'
    fireEvent.click(screen.getAllByText('Total clicks')[0]);
    
    // Wait for the re-sort (in DOM, visually this would change order, we just assert no crash and elements exist)
    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no links are found', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({ data: [] });
    
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('No links found.')).toBeInTheDocument();
    });
  });

  it('displays all links when no folder is active, and filters links when a folder slug/ID is active', async () => {
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockResolvedValue({
      data: [
        { longUrl: 'https://example.com/default-link', shortUrl: 'http://trim.sh/def001', folderId: null },
        { longUrl: 'https://example.com/marketing-link', shortUrl: 'http://trim.sh/mkt002', folderId: 5, folderName: 'Marketing' }
      ]
    });

    // When activeFolderId is null ("All Links" workspace)
    vi.spyOn(routerDom, 'useOutletContext').mockReturnValue({
      triggerRefresh: null,
      tags: [],
      folders: [{ id: 5, name: 'Marketing', linkCount: 1 }],
      activeFolderId: null,
    } as any);

    const { unmount } = render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/def001/)).toBeInTheDocument();
      expect(screen.getByText(/mkt002/)).toBeInTheDocument();
    });

    unmount();

    // When folder is active
    vi.spyOn(routerDom, 'useOutletContext').mockReturnValue({
      triggerRefresh: null,
      tags: [],
      folders: [{ id: 5, name: 'Marketing', linkCount: 1 }],
      activeFolderId: 5,
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard/f/marketing']}>
        <routerDom.Routes>
          <routerDom.Route path="/dashboard/f/:folderSlug" element={<DashboardPage />} />
        </routerDom.Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/mkt002/)).toBeInTheDocument();
      expect(screen.queryByText(/def001/)).not.toBeInTheDocument();
    });
  });
});
