import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateRangePicker } from './DateRangePicker';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('DateRangePicker', () => {
  it('renders trigger button with preset label', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ type: 'preset', value: '24h' }} onChange={onChange} />);

    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
  });

  it('renders trigger button with custom date range format', () => {
    const onChange = vi.fn();
    const start = new Date(2026, 7, 1);
    const end = new Date(2026, 7, 10);
    render(<DateRangePicker value={{ type: 'custom', start, end }} onChange={onChange} />);

    expect(screen.getByText('Aug 1 - 10, 2026')).toBeInTheDocument();
  });

  it('renders trigger button with cross-month custom date range format', () => {
    const onChange = vi.fn();
    const start = new Date(2026, 6, 25);
    const end = new Date(2026, 7, 5);
    render(<DateRangePicker value={{ type: 'custom', start, end }} onChange={onChange} />);

    expect(screen.getByText('Jul 25, 2026 - Aug 5, 2026')).toBeInTheDocument();
  });

  it('toggles calendar popover on trigger click and closes on outside click', async () => {
    const onChange = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <DateRangePicker value={{ type: 'preset', value: '7d' }} onChange={onChange} />
      </div>
    );

    const trigger = screen.getByText('Last 7 days');
    fireEvent.click(trigger);

    expect(screen.getByText('Apply')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    await waitFor(() => {
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });
  });

  it('selects preset filters correctly', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ type: 'preset', value: '7d' }} onChange={onChange} />);

    // Open popover by clicking trigger
    fireEvent.click(screen.getByText('Last 7 days'));
    
    // Click 30d preset
    fireEvent.click(screen.getByText('Last 30 days'));
    expect(onChange).toHaveBeenCalledWith({ type: 'preset', value: '30d' });

    // Open again and click Month to date (custom)
    const trigger = screen.getAllByText('Last 7 days')[0];
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Month to date'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom' }));

    // Open again and click Year to date (custom)
    fireEvent.click(screen.getAllByText('Last 7 days')[0]);
    fireEvent.click(screen.getByText('Year to date'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom' }));
  });

  it('allows selecting custom range and applying', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ type: 'preset', value: 'all' }} onChange={onChange} />);

    fireEvent.click(screen.getByText('All time'));

    // Apply button is initially disabled for preset
    const applyBtn = screen.getByText('Apply');
    expect(applyBtn).toBeDisabled();

    // Click a day in the left calendar grid
    const days = screen.getAllByText('15');
    fireEvent.click(days[0]);

    // Hover another day
    const hoverDays = screen.getAllByText('20');
    fireEvent.mouseEnter(hoverDays[0]);

    // Click end day
    fireEvent.click(hoverDays[0]);

    expect(applyBtn).not.toBeDisabled();
    fireEvent.click(applyBtn);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom' }));
  });

  it('handles month navigation arrows', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ type: 'preset', value: '7d' }} onChange={onChange} />);

    fireEvent.click(screen.getByText('Last 7 days'));

    const chevronButtons = screen.getAllByRole('button');
    chevronButtons.forEach(b => fireEvent.click(b));

    expect(screen.getByText('Apply')).toBeInTheDocument();
  });
});
