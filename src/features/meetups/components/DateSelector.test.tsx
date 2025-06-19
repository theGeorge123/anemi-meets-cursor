import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DateSelector from './DateSelector';

// Mock holidays util
vi.mock('../../../utils/holidays', () => ({
  getHolidaysForDate: () => []
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'meetup.chooseDates': 'Pick your dates!',
        'meetup.chooseTimes': 'Choose your preferred times',
        'meetup.selectedDates': 'Selected dates',
        'common.morning': 'Morning',
        'common.afternoon': 'Afternoon',
        'common.evening': 'Evening'
      };
      return translations[key] || key;
    }
  })
}));

describe('DateSelector', () => {
  it('renders with default props', () => {
    const setSelectedDates = vi.fn();
    const setDateTimeOptions = vi.fn();
    render(
      <DateSelector 
        selectedDates={[]}
        setSelectedDates={setSelectedDates}
        dateTimeOptions={[]}
        setDateTimeOptions={setDateTimeOptions}
      />
    );

    expect(screen.getByText('Pick your dates!')).toBeInTheDocument();
  });

  it('displays selected date with time slots', () => {
    const setSelectedDates = vi.fn();
    const setDateTimeOptions = vi.fn();
    const selectedDate = new Date('2025-06-19');
    render(
      <DateSelector 
        selectedDates={[selectedDate]}
        setSelectedDates={setSelectedDates}
        dateTimeOptions={[]}
        setDateTimeOptions={setDateTimeOptions}
      />
    );

    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('allows selecting and deselecting time slots', () => {
    const setSelectedDates = vi.fn();
    const setDateTimeOptions = vi.fn();
    const selectedDate = new Date('2025-06-19');
    render(
      <DateSelector 
        selectedDates={[selectedDate]}
        setSelectedDates={setSelectedDates}
        dateTimeOptions={[]}
        setDateTimeOptions={setDateTimeOptions}
      />
    );

    fireEvent.click(screen.getByText('Morning'));
    expect(setDateTimeOptions).toHaveBeenCalled();
  });

  it('allows removing a selected date', () => {
    const setSelectedDates = vi.fn();
    const setDateTimeOptions = vi.fn();
    const selectedDate = new Date('2025-06-19');
    render(
      <DateSelector 
        selectedDates={[selectedDate]}
        setSelectedDates={setSelectedDates}
        dateTimeOptions={[]}
        setDateTimeOptions={setDateTimeOptions}
      />
    );

    fireEvent.click(screen.getByLabelText('Remove date'));
    expect(setSelectedDates).toHaveBeenCalledWith([]);
  });

  it('displays error message when provided', () => {
    const setSelectedDates = vi.fn();
    const setDateTimeOptions = vi.fn();
    render(
      <DateSelector 
        selectedDates={[]}
        setSelectedDates={setSelectedDates}
        dateTimeOptions={[]}
        setDateTimeOptions={setDateTimeOptions}
        error="Please select at least one date"
      />
    );

    expect(screen.getByText('Please select at least one date')).toBeInTheDocument();
  });
}); 