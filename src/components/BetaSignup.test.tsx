import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import BetaSignup from './BetaSignup';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'betaSignup.title': 'Join the Beta',
        'betaSignup.description': 'Be one of the first to try Anemi Meets!',
        'betaSignup.tagline': 'Connect with fellow coffee lovers in your city.',
        'betaSignup.emailPlaceholder': 'Enter your email',
        'betaSignup.cta': 'Join Waitlist',
        'betaSignup.sending': 'Joining...',
        'betaSignup.success': "You're on the list! We'll let you know when you can join.",
        'betaSignup.error': 'Oops! Something went wrong. Please try again.',
        'betaSignup.alreadyOnList':
          "You're already on the waitlist! We'll let you know when you can join.",
        'betaSignup.invalidEmail': 'Please enter a valid email address.',
        close: 'Close',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock environment variables
vi.mock('import.meta.env', () => ({
  env: {
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('BetaSignup', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders the signup form', () => {
    render(<BetaSignup />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<BetaSignup />);
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
    });
  });

  it('handles successful signup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Successfully added to beta list' }),
    });

    render(<BetaSignup />);
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://bijyercgpgaheeoeumtv.functions.supabase.co/beta-signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: 'test-anon-key',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        },
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        "You're on the list! We'll let you know when you can join.",
      );
    });
  });

  it('handles duplicate email error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'DUPLICATE_EMAIL' }),
    });

    render(<BetaSignup />);
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "You're already on the waitlist! We'll let you know when you can join.",
      );
    });
  });

  it('handles API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    render(<BetaSignup />);
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Oops! Something went wrong. Please try again.',
      );
    });
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<BetaSignup />);
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Oops! Something went wrong. Please try again.',
      );
    });
  });
});
