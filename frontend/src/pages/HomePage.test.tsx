import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('rendering of the main headline', () => {
    (useAuth as any).mockReturnValue({ token: null });
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getAllByText(/Shorten, track &/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/manage your links/i)[0]).toBeInTheDocument();
  });

  it('URL input field accepts text and shortens URL successfully', async () => {
    (useAuth as any).mockReturnValue({ token: null });
    (axiosInstance.post as any).mockResolvedValue({
      data: {
        shortUrl: 'http://trim.sh/quick123',
        longUrl: 'https://example.com/very-long-url',
      },
    });

    render(<MemoryRouter><HomePage /></MemoryRouter>);
    
    const input = screen.getByPlaceholderText('Paste your long URL here…');
    fireEvent.change(input, { target: { value: 'https://example.com/very-long-url' } });
    
    const submitBtn = screen.getByRole('button', { name: /shorten it/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/shorten', {
        longUrl: 'https://example.com/very-long-url',
      });
      expect(screen.getByText('Your short link is ready')).toBeInTheDocument();
      expect(screen.getByText('http://trim.sh/quick123')).toBeInTheDocument();
    });

    // Copy to clipboard
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://trim.sh/quick123');
  });

  it('handles shortening errors gracefully', async () => {
    (useAuth as any).mockReturnValue({ token: null });
    (axiosInstance.post as any).mockRejectedValue({
      response: { data: { message: 'Invalid URL destination' } },
    });

    render(<MemoryRouter><HomePage /></MemoryRouter>);
    
    const input = screen.getByPlaceholderText('Paste your long URL here…');
    fireEvent.change(input, { target: { value: 'https://invalid-domain' } });
    
    const submitBtn = screen.getByRole('button', { name: /shorten it/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid URL destination')).toBeInTheDocument();
    });
  });

  it('Try it now button triggers smooth scrolling', () => {
    (useAuth as any).mockReturnValue({ token: null });
    window.scrollTo = vi.fn();
    
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    
    const tryItNowButton = screen.getByText('Try it now');
    fireEvent.click(tryItNowButton);
    
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('renders Dashboard link in header when token is present', () => {
    (useAuth as any).mockReturnValue({ token: 'active-token' });
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders theme toggle button in header', () => {
    (useAuth as any).mockReturnValue({ token: null });
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    const themeBtn = document.getElementById('theme-toggle');
    expect(themeBtn).toBeInTheDocument();
  });
});
