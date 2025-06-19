import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'meetup'],
    defaultNS: 'common',
    resources: {
      en: {
        common: {
          morning: 'Morning',
          afternoon: 'Afternoon',
          evening: 'Evening'
        },
        meetup: {
          'meetup.chooseDates': 'Pick your dates!',
          'meetup.chooseDaysInfo': 'Pick as many days as you like! The more, the merrier ☀️',
          'meetup.timeDisclaimer': "Our time slots are intentionally broad, so you and your friend can pick the exact time that works for you. Just agree together, but it's nice if you arrive within the chosen slot!",
          'meetup.selectedDates': 'Your picked days',
          'meetup.remove': 'Remove',
          'meetup.holidayInfo': 'Did you know this day is {{holiday}} in {{country}}?'
        }
      },
      nl: {
        common: {
          morning: 'Ochtend',
          afternoon: 'Middag',
          evening: 'Avond'
        },
        meetup: {
          'meetup.chooseDates': 'Kies je dagen!',
          'meetup.chooseDaysInfo': 'Kies zoveel dagen als je wilt! Hoe meer, hoe beter ☀️',
          'meetup.timeDisclaimer': 'Onze tijdvakken zijn lekker breed, zodat je zelf een tijd kunt kiezen die past. Spreek samen af wat werkt, maar het is wel zo leuk als je binnen het gekozen blok aankomt!',
          'meetup.selectedDates': 'Gekozen dagen',
          'meetup.remove': 'Verwijderen',
          'meetup.holidayInfo': 'Wist je dat het vandaag {{holiday}} is in {{country}}?'
        }
      }
    },
    interpolation: {
      escapeValue: false
    }
  });

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
}); 