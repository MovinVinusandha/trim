import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExpiredPage from './ExpiredPage';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

describe('ExpiredPage', () => {
  it('testRendersExpiredPageHeading', () => {
    render(
      <BrowserRouter>
        <ExpiredPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Expired link/i)).toBeInTheDocument();
  });

  it('testRendersLoginAndSignupButtons', () => {
    render(
      <BrowserRouter>
        <ExpiredPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });
});
