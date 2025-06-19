import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';
import BadgeShareModal from './BadgeShareModal';

describe('BadgeShareModal', () => {
  const mockBadge = {
    emoji: '🌟',
    label: 'Early Adopter',
    description: 'One of the first to join Anemi Meets!'
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Mock navigator.share
    Object.defineProperty(window.navigator, 'share', {
      value: vi.fn().mockResolvedValue(true),
      writable: true
    });

    // Mock navigator.clipboard
    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    });

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders badge details', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={mockBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('Early Adopter')).toBeInTheDocument();
    expect(screen.getByText('One of the first to join Anemi Meets!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share achievement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={mockBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('attempts to share when share button is clicked', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={mockBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /share achievement/i }));
    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Badge Earned: Early Adopter',
        text: 'I just earned the "Early Adopter" badge on Anemi Meets! 🌟',
        url: window.location.href
      });
    });
  });

  it('falls back to clipboard when share is not available', async () => {
    // Remove share API
    Object.defineProperty(window.navigator, 'share', {
      value: undefined,
      writable: true
    });

    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={mockBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /share achievement/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'I just earned the "Early Adopter" badge on Anemi Meets! 🌟'
      );
      expect(window.alert).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('handles share failure gracefully', async () => {
    const shareMock = vi.fn().mockRejectedValue(new Error('Share failed'));
    const clipboardMock = vi.fn().mockResolvedValue(undefined);

    // Mock share API to fail
    Object.defineProperty(window.navigator, 'share', {
      value: shareMock,
      writable: true
    });

    // Mock clipboard as fallback
    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: clipboardMock
      },
      writable: true
    });

    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={mockBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /share achievement/i }));
    
    // Wait for the share to fail
    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled();
    });

    // Wait for the clipboard fallback
    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalledWith(
        'I just earned the "Early Adopter" badge on Anemi Meets! 🌟'
      );
      expect(window.alert).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('handles different badge types', () => {
    const socialBadge = {
      emoji: '🦋',
      label: 'Social Butterfly',
      description: 'Connected with many coffee lovers!'
    };

    render(
      <I18nextProvider i18n={i18n}>
        <BadgeShareModal 
          badge={socialBadge}
          onClose={mockOnClose}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('🦋')).toBeInTheDocument();
    expect(screen.getByText('Social Butterfly')).toBeInTheDocument();
    expect(screen.getByText('Connected with many coffee lovers!')).toBeInTheDocument();
  });
}); 