import { render, screen, fireEvent } from '@testing-library/react';
import CreateLinkModal from './CreateLinkModal';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('CreateLinkModal', () => {
  it('rendering when isOpen={true}', () => {
    render(
      <CreateLinkModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    expect(screen.getByText('Destination URL')).toBeInTheDocument();
  });

  it('returning null when isOpen={false}', () => {
    const { container } = render(
      <CreateLinkModal 
        isOpen={false} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('typing in Destination URL updates the field', () => {
    render(
      <CreateLinkModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    
    const input = screen.getByPlaceholderText('https://dub.co/help/article/dub-links');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    expect((input as HTMLInputElement).value).toBe('https://example.com');
  });

  it('clicking expiration pill buttons updates active state', () => {
    render(
      <CreateLinkModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    
    const btn1Hour = screen.getByText('1 Hour');
    const btn24Hours = screen.getByText('24 Hours');
    
    fireEvent.click(btn1Hour);
    expect(btn1Hour.className).toContain('bg-gray-900');
    expect(btn24Hours.className).not.toContain('bg-gray-900');
    
    fireEvent.click(btn24Hours);
    expect(btn24Hours.className).toContain('bg-gray-900');
    expect(btn1Hour.className).not.toContain('bg-gray-900');
  });

  it('password field has a working show/hide toggle', () => {
    render(
      <CreateLinkModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    
    const input = screen.getByPlaceholderText('Optional password...');
    expect((input as HTMLInputElement).type).toBe('password');
    
    const toggleButton = input.nextElementSibling as HTMLButtonElement;
    
    fireEvent.click(toggleButton);
    expect((input as HTMLInputElement).type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect((input as HTMLInputElement).type).toBe('password');
  });

  describe('Edit Mode', () => {
    const mockUrlToEdit = {
      shortUrl: 'http://trim.sh/abc123',
      longUrl: 'https://example.com/edit',
      folderId: 1,
      folderName: 'My Folder',
      tags: [{ id: 1, name: 'youtube', color: 'red' }],
      hasPassword: true,
      expiresAt: '2025-12-31T23:59:59',
      isActive: true,
    };

    it('pre-fills inputs and disables short URL input', () => {
      render(
        <CreateLinkModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onSuccess={vi.fn()} 
          folders={[{ id: 1, name: 'My Folder' }]} 
          tags={[{ id: 1, name: 'youtube', color: 'red' }]}
          urlToEdit={mockUrlToEdit}
        />
      );

      // Destination URL is pre-filled
      const longUrlInput = screen.getByDisplayValue('https://example.com/edit');
      expect(longUrlInput).toBeInTheDocument();

      // Short Link is disabled
      const shortUrlInput = screen.getByDisplayValue('abc123');
      expect(shortUrlInput).toBeDisabled();
      
      // Submit button text changes
      expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    it('submits using axiosInstance.put when in edit mode', async () => {
      const onSuccessMock = vi.fn();
      
      // Need to mock axiosInstance for put
      const axiosInstance = (await import('../api/axiosInstance')).default;
      (axiosInstance.put as any) = vi.fn().mockResolvedValue({ data: { success: true } });

      render(
        <CreateLinkModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onSuccess={onSuccessMock} 
          folders={[]} 
          tags={[]}
          urlToEdit={mockUrlToEdit}
        />
      );

      // Change long URL
      const longUrlInput = screen.getByDisplayValue('https://example.com/edit');
      fireEvent.change(longUrlInput, { target: { value: 'https://example.com/updated' } });

      // Click save
      const saveBtn = screen.getByText('Save changes');
      fireEvent.click(saveBtn);

      // Assert put was called correctly
      expect(axiosInstance.put).toHaveBeenCalledWith('/url/abc123', expect.objectContaining({
        longUrl: 'https://example.com/updated',
      }));
    });
  });

  describe('Default Folder Selection', () => {
    const mockFolders = [
      { id: 10, name: 'Marketing', slug: 'marketing' },
      { id: 20, name: 'Links', slug: 'links' },
      { id: 30, name: 'Social', slug: 'social' }
    ];

    it('defaults folder selection to the system "Links" folder when creating a new link', () => {
      render(
        <CreateLinkModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onSuccess={vi.fn()} 
          folders={mockFolders} 
          tags={[]} 
        />
      );
      
      // Combobox trigger should render "Links"
      expect(screen.getAllByText('Links').length).toBeGreaterThan(0);
    });

    it('falls back to the first folder if no "Links" folder exists', () => {
      const customFolders = [
        { id: 100, name: 'Work', slug: 'work' },
        { id: 200, name: 'Personal', slug: 'personal' }
      ];

      render(
        <CreateLinkModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onSuccess={vi.fn()} 
          folders={customFolders} 
          tags={[]} 
        />
      );
      
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });

  it('renders custom calendar date picker when Custom expiration preset is clicked', () => {
    render(
      <CreateLinkModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={vi.fn()} 
        folders={[]} 
        tags={[]} 
      />
    );
    
    const customBtn = screen.getByText('Custom');
    fireEvent.click(customBtn);

    // Trigger button should be rendered
    const triggerBtn = screen.getByRole('button', { name: /select custom date and time|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i });
    expect(triggerBtn).toBeInTheDocument();

    // Clicking trigger button toggles popover grid with weekdays
    fireEvent.click(triggerBtn);
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });
});
