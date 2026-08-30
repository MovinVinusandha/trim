import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), put: vi.fn() },
  extractBackendError: vi.fn((err, fallback) => err?.response?.data?.message || fallback),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(() => ({
      triggerRefresh: null,
      tags: [
        { id: 1, name: 'youtube', color: '#ff0000', linkCount: 1 },
        { id: 2, name: 'work', color: '#00ff00', linkCount: 2 },
      ],
      folders: [{ id: 5, name: 'Marketing', linkCount: 1 }],
      activeFolderId: null,
    })),
  };
});

const mockLinks = [
  {
    longUrl: 'https://example.com/one',
    shortUrl: 'http://trim.sh/abc123',
    accessed_times: 42,
    createdAt: '2026-08-01T00:00:00Z',
    tags: [
      { id: 1, name: 'youtube', color: '#ff0000' },
      { id: 2, name: 'work', color: '#00ff00' },
    ],
    hasPassword: true,
    expiresAt: '2099-01-01T00:00:00Z',
    isActive: true,
  },
  {
    longUrl: 'https://example.com/two',
    shortUrl: 'http://trim.sh/def456',
    accessed_times: 7,
    createdAt: '2026-08-02T00:00:00Z',
    tags: [],
    expiresAt: '2020-01-01T00:00:00Z',
    isActive: false,
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/qr')) {
        return Promise.resolve({ data: new Blob(['fake-qr'], { type: 'image/png' }) });
      }
      return Promise.resolve({ data: mockLinks });
    });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-qr-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('URL table renders links, multi-tags, status badges, and click counts correctly', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getAllByText(/abc123/)[0]).toBeInTheDocument();
      expect(screen.getByText('https://example.com/one')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getAllByText(/youtube/)[0]).toBeInTheDocument();
    });
  });

  it('typing into Search Bar filters the displayed links', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getAllByText(/abc123/)[0]).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by short link or URL');
    fireEvent.change(searchInput, { target: { value: 'def' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/abc123/)).not.toBeInTheDocument();
      expect(screen.getByText(/def456/)).toBeInTheDocument();
    });
  });

  it('handles copy link, QR code modal opening and deletion flow', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    (axiosInstance.delete as any).mockResolvedValue({});

    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getAllByText(/abc123/)[0]).toBeInTheDocument();
    });

    // Copy link button
    const copyBtns = screen.getAllByTitle('Copy link');
    if (copyBtns[0]) {
      fireEvent.click(copyBtns[0]);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }

    // QR Code button
    const qrBtns = screen.getAllByTitle('QR Code');
    if (qrBtns[0]) {
      fireEvent.click(qrBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('QR Code')).toBeInTheDocument();
        expect(screen.getByText('Download PNG')).toBeInTheDocument();
      });
      // Close QR Modal
      fireEvent.click(screen.getByText('Close'));
    }

    // Open more menu for the first link
    const moreButtons = screen.getAllByRole('button');
    const moreIconBtn = moreButtons.find(b => b.querySelector('svg.lucide-ellipsis-vertical') || b.querySelector('svg.lucide-more-vertical'));
    if (moreIconBtn) {
      fireEvent.click(moreIconBtn);

      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(axiosInstance.delete).toHaveBeenCalledWith('/url/def456');
      });
    }
  });

  it('handles 3-dot menu dropdown actions (Analytics, Copy Link, Edit, QR, Backdrop close)', async () => {
    (axiosInstance.put as any).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics/:hash" element={<div>Analytics View</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/abc123/)[0]).toBeInTheDocument();
    });

    const moreButtons = screen.getAllByRole('button');
    const moreIconBtn = moreButtons.find(b => b.querySelector('svg.lucide-ellipsis-vertical') || b.querySelector('svg.lucide-more-vertical'))!;

    // 1. Open menu and click backdrop to close
    fireEvent.click(moreIconBtn);
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    const backdrop = document.querySelector('.fixed.inset-0.z-40')!;
    fireEvent.click(backdrop);

    // 2. Copy Link from menu
    fireEvent.click(moreIconBtn);
    fireEvent.click(screen.getByText('Copy Link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // 3. QR Code from menu
    fireEvent.click(moreIconBtn);
    fireEvent.click(screen.getByText('QR Code'));
    await waitFor(() => {
      expect(screen.getByText('Download PNG')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Close'));

    // 4. Edit from menu and submit edit modal
    fireEvent.click(moreIconBtn);
    fireEvent.click(screen.getByText('Edit'));
    await waitFor(() => {
      expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    const form = document.getElementById('create-link-form')!;
    fireEvent.submit(form);
  });

  it('handles QR code generation failure error display', async () => {
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/qr')) {
        return Promise.reject(new Error('QR error'));
      }
      return Promise.resolve({ data: mockLinks });
    });

    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getAllByText(/abc123/)[0]).toBeInTheDocument();
    });

    const qrBtns = screen.getAllByTitle('QR Code');
    if (qrBtns[0]) {
      fireEvent.click(qrBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Failed to generate QR code.')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Close'));
    }
  });

  it('handles tag filter popover and checkbox selection', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    fireEvent.click(screen.getByText('Tag'));

    await waitFor(() => {
      expect(screen.getAllByText('youtube').length).toBeGreaterThan(0);
    });

    const tagCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(tagCheckbox);
  });

  it('handles display properties and sorting controls', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /display/i })).toBeInTheDocument();
    });

    // Open Display menu
    fireEvent.click(screen.getByRole('button', { name: /display/i }));

    // Toggle sorting
    fireEvent.click(screen.getByText(/Date created/i));
    fireEvent.click(screen.getByText(/Total clicks/i));

    // Toggle display property buttons
    fireEvent.click(screen.getByText('Destination URL'));
    fireEvent.click(screen.getByText('Analytics'));
    fireEvent.click(screen.getByText('Created Date'));
    fireEvent.click(screen.getByText('Tags'));
    fireEvent.click(screen.getByText('Status'));
    fireEvent.click(screen.getByText('Password'));
  });

  it('renders empty state when no links exist', async () => {
    (axiosInstance.get as any).mockResolvedValue({ data: [] });

    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No links found.')).toBeInTheDocument();
    });
  });
});
