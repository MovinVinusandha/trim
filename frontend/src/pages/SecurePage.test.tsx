import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SecurePage from './SecurePage';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('SecurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ token: null });
  });

  it('renders password protection form with login and register links when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Password Required')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('renders dashboard link when user is authenticated with token', () => {
    (useAuth as any).mockReturnValue({ token: 'mock-jwt-token' });

    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = input.nextElementSibling as HTMLElement;
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(input.type).toBe('password');
  });

  it('handles successful link unlocking and redirection', async () => {
    (axiosInstance.post as any).mockResolvedValue({
      data: { longUrl: 'https://example.com/unlocked-target' }
    });

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('••••••••');
    fireEvent.change(input, { target: { value: 'Secret123' } });

    const submitBtn = screen.getByRole('button', { name: /Unlock Link/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/unlock/abc123', { password: 'Secret123' });
      expect(window.location.href).toBe('https://example.com/unlocked-target');
    });

    window.location = originalLocation;
  });

  it('handles 401 incorrect password error', async () => {
    const err401 = new Error('Unauthorized') as any;
    err401.response = { status: 401 };
    (axiosInstance.post as any).mockRejectedValue(err401);

    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('••••••••');
    fireEvent.change(input, { target: { value: 'WrongPass' } });

    fireEvent.click(screen.getByRole('button', { name: /Unlock Link/i }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles 404 not found error', async () => {
    const err404 = new Error('Not Found') as any;
    err404.response = { status: 404 };
    (axiosInstance.post as any).mockRejectedValue(err404);

    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('••••••••');
    fireEvent.change(input, { target: { value: 'AnyPass' } });

    fireEvent.click(screen.getByRole('button', { name: /Unlock Link/i }));

    await waitFor(() => {
      expect(screen.getByText('Link not found or no longer active.')).toBeInTheDocument();
    });
  });

  it('handles generic 500 server error', async () => {
    const err500 = new Error('Server Error') as any;
    err500.response = { status: 500 };
    (axiosInstance.post as any).mockRejectedValue(err500);

    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('••••••••');
    fireEvent.change(input, { target: { value: 'AnyPass' } });

    fireEvent.click(screen.getByRole('button', { name: /Unlock Link/i }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred while unlocking the link.')).toBeInTheDocument();
    });
  });

  it('does not submit when password is blank', () => {
    render(
      <MemoryRouter initialEntries={['/secure/abc123']}>
        <Routes>
          <Route path="/secure/:hash" element={<SecurePage />} />
        </Routes>
      </MemoryRouter>
    );

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
