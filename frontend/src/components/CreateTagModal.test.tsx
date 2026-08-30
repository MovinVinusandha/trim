import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTagModal from './CreateTagModal';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../api/axiosInstance', () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));

describe('CreateTagModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects color pills and submits new tag', async () => {
    (axiosInstance.post as any).mockResolvedValue({ data: { id: 1, name: 'New Tag', color: 'blue' } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(<CreateTagModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    
    // Type in tag name
    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing'), { target: { value: 'New Tag' } });
    
    // Select color (Blue)
    const blueRadio = screen.getByDisplayValue('blue');
    fireEvent.click(blueRadio);
    expect(blueRadio).toBeChecked();
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Create tag' }));
    
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/tags', { name: 'New Tag', color: 'blue' });
      expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'New Tag', color: 'blue' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles edit mode with existing tag', async () => {
    (axiosInstance.put as any).mockResolvedValue({ data: { id: 5, name: 'Updated Tag', color: 'green' } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CreateTagModal 
        isOpen={true} 
        onClose={onClose} 
        onSuccess={onSuccess} 
        tagToEdit={{ id: 5, name: 'Old Tag', color: 'purple' }} 
      />
    );

    expect(screen.getByText('Edit tag')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Tag')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Old Tag'), { target: { value: 'Updated Tag' } });
    fireEvent.click(screen.getByDisplayValue('green'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/tags/5', { name: 'Updated Tag', color: 'green' });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 409 conflict error', async () => {
    const err409 = new Error('Conflict') as any;
    err409.response = { status: 409 };
    (axiosInstance.post as any).mockRejectedValue(err409);

    render(<CreateTagModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing'), { target: { value: 'Existing Tag' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create tag' }));

    await waitFor(() => {
      expect(screen.getByText('A tag with this name already exists.')).toBeInTheDocument();
    });
  });

  it('handles generic error with custom message', async () => {
    const err500 = new Error('Server error') as any;
    err500.response = { status: 500, data: { message: 'Custom server error' } };
    (axiosInstance.post as any).mockRejectedValue(err500);

    render(<CreateTagModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Marketing'), { target: { value: 'Tag' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create tag' }));

    await waitFor(() => {
      expect(screen.getByText('Custom server error')).toBeInTheDocument();
    });
  });

  it('handles close button click and does not submit if empty', () => {
    const onClose = vi.fn();
    render(<CreateTagModal isOpen={true} onClose={onClose} onSuccess={vi.fn()} />);

    // Click close icon
    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    // Form submit with blank input
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
