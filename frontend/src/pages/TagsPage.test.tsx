import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TagsPage from './TagsPage';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockNavigate = vi.fn();
const mockSetTags = vi.fn();
const mockSetTagToEdit = vi.fn();
const mockSetIsCreateTagModalOpen = vi.fn();

let mockContextValue = {
  tags: [
    { id: 1, name: 'Important', color: 'red', linkCount: 3 },
    { id: 2, name: 'Work', color: 'green', linkCount: 1 },
    { id: 3, name: 'Other', color: 'purple', linkCount: 0 },
  ],
  setTags: mockSetTags,
  setTagToEdit: mockSetTagToEdit,
  setIsCreateTagModalOpen: mockSetIsCreateTagModalOpen,
  isTagsLoading: false,
};

vi.mock('../api/axiosInstance', () => ({
  default: { delete: vi.fn(), get: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => mockContextValue,
    useNavigate: () => mockNavigate,
  };
});

describe('TagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = {
      tags: [
        { id: 1, name: 'Important', color: 'red', linkCount: 3 },
        { id: 2, name: 'Work', color: 'green', linkCount: 1 },
        { id: 3, name: 'Other', color: 'purple', linkCount: 0 },
      ],
      setTags: mockSetTags,
      setTagToEdit: mockSetTagToEdit,
      setIsCreateTagModalOpen: mockSetIsCreateTagModalOpen,
      isTagsLoading: false,
    };
  });

  it('renders tag list with colors and link counts', () => {
    render(<MemoryRouter><TagsPage /></MemoryRouter>);
    
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('3 links')).toBeInTheDocument();
    expect(screen.getByText('1 link')).toBeInTheDocument();
  });

  it('filters tags by search input and handles empty search results', () => {
    render(<MemoryRouter><TagsPage /></MemoryRouter>);
    
    const searchInput = screen.getByPlaceholderText('Search tags...');
    fireEvent.change(searchInput, { target: { value: 'imp' } });
    
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.queryByText('Work')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No tags found.')).toBeInTheDocument();
  });

  it('clicking a tag navigates to dashboard with tag query', () => {
    render(<MemoryRouter><TagsPage /></MemoryRouter>);
    
    const tag = screen.getByText('Important');
    fireEvent.click(tag);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?tag=Important');
  });

  it('opens edit modal when edit button is clicked from dropdown menu', () => {
    render(<MemoryRouter><TagsPage /></MemoryRouter>);
    
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[0]);

    const editBtn = screen.getByText('Edit');
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);

    expect(mockSetTagToEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Important' }));
    expect(mockSetIsCreateTagModalOpen).toHaveBeenCalledWith(true);
  });

  it('handles delete tag flow with confirmation and cancellation', async () => {
    (axiosInstance.delete as any).mockResolvedValue({});

    render(<MemoryRouter><TagsPage /></MemoryRouter>);
    
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[0]);

    const deleteOption = screen.getByText('Delete');
    fireEvent.click(deleteOption);

    expect(screen.getByRole('heading', { name: 'Delete Tag' })).toBeInTheDocument();
    expect(screen.getByText(/This tag is currently used in 3 links/)).toBeInTheDocument();

    // Cancel deletion
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete Tag' })).not.toBeInTheDocument();
    });

    // Open delete modal again and confirm delete
    fireEvent.click(moreButtons[0]);
    fireEvent.click(screen.getByText('Delete'));
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete Tag' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith('/tags/1');
      expect(mockSetTags).toHaveBeenCalled();
    });
  });

  it('renders skeletons when isTagsLoading is true', () => {
    mockContextValue.isTagsLoading = true;

    const { container } = render(<MemoryRouter><TagsPage /></MemoryRouter>);
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });
});
