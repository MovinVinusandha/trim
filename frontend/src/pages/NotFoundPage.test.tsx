import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

describe('NotFoundPage', () => {
  it('renders NotFoundPage heading and subtext', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/404 - Link Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/The short link you are trying to visit does not exist or has been removed./i)).toBeInTheDocument();
  });

  it('renders Try Trim Today and Back to Home action buttons', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Try Trim Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });
});
