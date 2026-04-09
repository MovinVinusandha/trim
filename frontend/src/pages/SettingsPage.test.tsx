import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../api/axiosInstance', () => ({
  default: { put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 1, name: 'John Doe', email: 'john@example.com', publicId: 'USR-123' },
      logout: vi.fn(),
    });
  });

  it('renders user publicId', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(screen.getByDisplayValue('USR-123')).toBeInTheDocument();
  });

  it('updating name form submission', async () => {
    (axiosInstance.put as any).mockResolvedValue({ data: {} });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    
    const saveButtons = screen.getAllByText('Save Changes');
    // First save button is for name
    fireEvent.click(saveButtons[0]);
    
    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/users/me', { name: 'Jane Doe', email: 'john@example.com' });
      expect(screen.getByText('Name updated successfully.')).toBeInTheDocument();
    });
  });

  it('updating email form submission', async () => {
    (axiosInstance.put as any).mockResolvedValue({ data: {} });
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    
    const emailInput = screen.getByDisplayValue('john@example.com');
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    
    const saveButtons = screen.getAllByText('Save Changes');
    // Second save button is for email
    fireEvent.click(saveButtons[1]);
    
    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/users/me', { name: 'John Doe', email: 'jane@example.com' });
      expect(screen.getByText('Email updated successfully.')).toBeInTheDocument();
    });
  });

  it('opens Delete Account confirmation modal and requires typing confirmation string', async () => {
    (axiosInstance.delete as any).mockResolvedValue({ data: {} });
    const logoutMock = vi.fn();
    (useAuth as any).mockReturnValue({
      user: { id: 1, name: 'John Doe', email: 'john@example.com', publicId: 'USR-123' },
      logout: logoutMock,
    });

    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    
    // Open modal
    const openModalButton = screen.getByRole('button', { name: 'Delete Account' });
    fireEvent.click(openModalButton);
    
    expect(screen.getByText(/Warning: This will permanently delete your account/i)).toBeInTheDocument();
    
    // Find confirm button in modal, should be disabled initially
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Account' });
    const confirmDeleteBtn = deleteButtons[1];
    expect(confirmDeleteBtn).toBeDisabled();

    // Find input and type the wrong string
    const input = screen.getByPlaceholderText('confirm delete account');
    fireEvent.change(input, { target: { value: 'wrong string' } });
    expect(confirmDeleteBtn).toBeDisabled();

    // Type the correct string
    fireEvent.change(input, { target: { value: 'confirm delete account' } });
    expect(confirmDeleteBtn).toBeEnabled();

    // Click confirm
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith('/users/me');
      expect(logoutMock).toHaveBeenCalled();
    });
  });
});
