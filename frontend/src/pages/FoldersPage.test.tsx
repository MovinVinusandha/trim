import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FoldersPage from './FoldersPage';
import axiosInstance from '../api/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as routerDom from 'react-router-dom';

vi.mock('../api/axiosInstance', () => ({
  default: { delete: vi.fn(), get: vi.fn() },
}));

const mockNavigate = vi.fn();
const mockSetActiveFolderId = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      folders: [
        { id: 1, name: 'Links', linkCount: 10 },
        { id: 2, name: 'Marketing', linkCount: 5 },
        { id: 3, name: 'Personal', linkCount: 1 },
      ],
      setFolders: vi.fn(),
      setActiveFolderId: mockSetActiveFolderId,
      setFolderToEdit: vi.fn(),
      setIsFolderModalOpen: vi.fn(),
    }),
    useNavigate: () => mockNavigate,
    useSearchParams: vi.fn().mockReturnValue([new URLSearchParams()]),
  };
});

describe('FoldersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default Links folder card and custom folder cards', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('10 links')).toBeInTheDocument();
    expect(screen.getByText('5 links')).toBeInTheDocument();
    expect(screen.getByText('1 link')).toBeInTheDocument();
  });

  it('filters folders by search input', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    const searchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'mark' } });
    
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });

  it('clicking default Links folder card navigates to dashboard and sets active folder', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    const defaultFolder = screen.getByText('Links');
    fireEvent.click(defaultFolder);
    
    expect(mockSetActiveFolderId).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/f/links');
  });

  it('clicking a custom folder card navigates to dashboard and sets active folder', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    const marketingFolder = screen.getByText('Marketing');
    fireEvent.click(marketingFolder);
    
    expect(mockSetActiveFolderId).toHaveBeenCalledWith(2);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/f/marketing');
  });

  it('clicking Analytics in 3-dot menu of a folder navigates to analytics with folderId', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    // Find more buttons
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[1]); // Marketing folder
    
    const analyticsBtn = screen.getByText('Analytics');
    expect(analyticsBtn).toBeInTheDocument();
    
    fireEvent.click(analyticsBtn);
    
    expect(mockSetActiveFolderId).toHaveBeenCalledWith(2);
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/f/marketing');
  });

  it('clicking Analytics in 3-dot menu of default Links folder navigates to folder analytics', () => {
    render(<MemoryRouter><FoldersPage /></MemoryRouter>);
    
    // First more button is for default Links folder
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[0]);
    
    const analyticsBtn = screen.getByText('Analytics');
    expect(analyticsBtn).toBeInTheDocument();
    
    fireEvent.click(analyticsBtn);
    
    expect(mockSetActiveFolderId).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/f/links');
  });
});
