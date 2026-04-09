import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import BrandLogo from './BrandLogo';

describe('BrandLogo', () => {
  it('matches snapshot', () => {
    const { container } = render(<BrandLogo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('accepts custom className', () => {
    const { container } = render(<BrandLogo className="text-red-500" />);
    expect(container.firstChild).toHaveClass('text-red-500');
  });
});
