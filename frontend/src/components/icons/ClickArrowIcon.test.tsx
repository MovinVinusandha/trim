import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import ClickArrowIcon from './ClickArrowIcon';

describe('ClickArrowIcon', () => {
  it('matches snapshot', () => {
    const { container } = render(<ClickArrowIcon />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('accepts custom className', () => {
    const { container } = render(<ClickArrowIcon className="w-8 h-8" />);
    expect(container.firstChild).toHaveClass('w-8 h-8');
  });
});
