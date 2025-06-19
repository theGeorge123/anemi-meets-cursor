import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../supabaseClient';
import BetaSignup from './BetaSignup';

// Mock the supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

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
        'betaSignup.alreadyOnList': "You're already on the waitlist! We'll let you know when you can join.",
        'betaSignup.invalidEmail': 'Please enter a valid email address.',
        'close': 'Close'
      };
      return translations[key] || key;
    }
  })
}));

describe('BetaSignup', () => {
  beforeEach(() => {
    render(<BetaSignup />);
  });

  it('renders the signup form', () => {
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
    });
  });

  it('handles successful signup', async () => {
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("You're on the list! We'll let you know when you can join.");
    });
  });

  it('handles duplicate email error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' }
      })
    } as any);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("You're already on the waitlist! We'll let you know when you can join.");
    });
  });

  it('handles API error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Internal server error' }
      })
    } as any);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Oops! Something went wrong. Please try again.');
    });
  });
}); 