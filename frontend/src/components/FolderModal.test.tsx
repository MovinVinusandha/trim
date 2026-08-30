import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FolderModal from './FolderModal';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));

describe('FolderModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('folder name input and creation submission', async () => {
    (axiosInstance.post as any).mockResolvedValue({ data: { id: 1, name: 'New Folder' } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(<FolderModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    
    // Type in folder name
    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing Campaigns'), { target: { value: 'New Folder' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Save folder' }));
    
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/folders', { name: 'New Folder' });
      expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'New Folder' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles edit mode with existing folder', async () => {
    (axiosInstance.put as any).mockResolvedValue({ data: { id: 10, name: 'Updated Folder' } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <FolderModal 
        isOpen={true} 
        onClose={onClose} 
        onSuccess={onSuccess} 
        folderToEdit={{ id: 10, name: 'Old Folder' }} 
      />
    );

    expect(screen.getByText('Edit folder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Folder')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Old Folder'), { target: { value: 'Updated Folder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save folder' }));

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/folders/10', { name: 'Updated Folder' });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 409 conflict error', async () => {
    const err409 = new Error('Conflict') as any;
    err409.response = { status: 409 };
    (axiosInstance.post as any).mockRejectedValue(err409);

    render(<FolderModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing Campaigns'), { target: { value: 'Existing Folder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save folder' }));

    await waitFor(() => {
      expect(screen.getByText('A folder with this name already exists.')).toBeInTheDocument();
    });
  });

  it('handles generic error with fallback message', async () => {
    const err500 = new Error('Server error') as any;
    err500.response = { status: 500 };
    (axiosInstance.post as any).mockRejectedValue(err500);

    render(<FolderModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing Campaigns'), { target: { value: 'Folder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save folder' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to save folder. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles close button click and does not submit if empty', () => {
    const onClose = vi.fn();
    render(<FolderModal isOpen={true} onClose={onClose} onSuccess={vi.fn()} />);

    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
