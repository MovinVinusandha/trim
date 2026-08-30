import axiosInstance, { extractBackendError } from './axiosInstance';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: actual.default.create,
      isAxiosError: (err: any) => err?.isAxiosError === true,
      post: vi.fn(),
    },
  };
});

describe('axiosInstance interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock the adapter to simulate network responses without hitting the real network
    axiosInstance.defaults.adapter = async (config) => {
      if (config.url === '/test-200') {
        return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config } as any;
      }
      if (config.url === '/test-401') {
        const error: any = new Error('Unauthorized');
        error.response = { status: 401, data: {} };
        error.isAxiosError = true;
        error.config = config;
        throw error;
      }
      return { data: 'not found', status: 404, statusText: 'Not Found', headers: {}, config } as any;
    };
  });

  it('attaches Authorization header if token exists in localStorage', async () => {
    localStorage.setItem('token', 'fake-jwt-token');
    
    const response = await axiosInstance.get('/test-200');
    
    expect(response.config.headers['Authorization']).toBe('Bearer fake-jwt-token');
  });

  it('does not attach Authorization header if token does not exist', async () => {
    const response = await axiosInstance.get('/test-200');
    
    expect(response.config.headers['Authorization']).toBeUndefined();
  });

  it('triggers silent refresh on 401 response', async () => {
    (axios.post as any).mockResolvedValue({
      data: { token: 'new-refreshed-token' }
    });

    let callCount = 0;
    axiosInstance.defaults.adapter = async (config) => {
      callCount++;
      if (callCount === 1) {
        const error: any = new Error('Unauthorized');
        error.response = { status: 401, data: {} };
        error.isAxiosError = true;
        error.config = config;
        throw error;
      }
      return { data: 'retry ok', status: 200, statusText: 'OK', headers: {}, config } as any;
    };

    const response = await axiosInstance.get('/test-401');
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      { withCredentials: true }
    );
    
    expect(localStorage.getItem('token')).toBe('new-refreshed-token');
    expect(response.config.headers['Authorization']).toBe('Bearer new-refreshed-token');
    expect(response.data).toBe('retry ok');
  });

  it('clears token on refresh token failure', async () => {
    localStorage.setItem('token', 'old-token');
    (axios.post as any).mockRejectedValue(new Error('Refresh failed'));

    await expect(axiosInstance.get('/test-401')).rejects.toThrow();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('extractBackendError', () => {
  it('returns raw string data if response data is string', () => {
    const err = {
      isAxiosError: true,
      response: { data: 'Custom backend error string' },
    };
    expect(extractBackendError(err)).toBe('Custom backend error string');
  });

  it('extracts message property from JSON response', () => {
    const err = {
      isAxiosError: true,
      response: { data: { message: 'Invalid credentials' } },
    };
    expect(extractBackendError(err)).toBe('Invalid credentials');
  });

  it('extracts error property from JSON response', () => {
    const err = {
      isAxiosError: true,
      response: { data: { error: 'Bad Request' } },
    };
    expect(extractBackendError(err)).toBe('Bad Request');
  });

  it('extracts validation field errors (longUrl, email, password)', () => {
    expect(extractBackendError({ isAxiosError: true, response: { data: { longUrl: 'Invalid URL format' } } })).toBe('Invalid URL format');
    expect(extractBackendError({ isAxiosError: true, response: { data: { email: 'Email required' } } })).toBe('Email required');
    expect(extractBackendError({ isAxiosError: true, response: { data: { password: 'Password too short' } } })).toBe('Password too short');
  });

  it('extracts values from generic validation error maps', () => {
    const err = {
      isAxiosError: true,
      response: { data: { fieldA: 'Field A error', fieldB: 'Field B error' } },
    };
    expect(extractBackendError(err)).toBe('Field A error. Field B error');
  });

  it('returns fallback string when error is not an axios error or empty', () => {
    expect(extractBackendError(null)).toBe('An unexpected error occurred. Please try again.');
    expect(extractBackendError(new Error('Generic'), 'Default fallback')).toBe('Default fallback');
    expect(extractBackendError({ isAxiosError: true, response: {} }, 'Default fallback')).toBe('Default fallback');
  });
});
