import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { enGB } from 'date-fns/locale/en-GB';
import { nl } from 'date-fns/locale/nl';
import { getHolidaysForDate } from '../../utils/holidays';

// Register locales once when the module is loaded
registerLocale('en-GB', enGB);
registerLocale('nl', nl);

/**
 * DateSelector component for selecting dates and times for a meetup.
 * Handles date picking, time slot selection, and validation.
 *
 * @param {Object} props
 * @param {Date[]} props.selectedDates - Currently selected dates
 * @param {(dates: Date[]) => void} props.setSelectedDates - Setter for selected dates
 * @param {Array<{ date: string; times: string[] }>} props.dateTimeOptions - Date/time options state
 * @param {(opts: Array<{ date: string; times: string[] }>) => void} props.setDateTimeOptions - Setter for date/time options
 * @param {string | null} props.error - Error message to display
 */
export interface DateSelectorProps {
  selectedDates: Date[];
  setSelectedDates: (dates: Date[]) => void;
  dateTimeOptions: { date: string; times: string[] }[];
  setDateTimeOptions: (opts: { date: string; times: string[] }[]) => void;
  error?: string | null;
}

const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDates,
  setSelectedDates,
  dateTimeOptions,
  setDateTimeOptions,
  error,
}) => {
  const { t, i18n } = useTranslation('meetup');

  const dateLocale = i18n.language === 'nl' ? 'nl' : 'en-GB';

  // Helper: get local date string in YYYY-MM-DD
  const getLocalDateString = (date: Date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

  // Highlight dates that are already selected
  const dayClassName = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const exists = selectedDates.some(d => getLocalDateString(d) === dateStr);
    return exists ? 'date-selected' : undefined;
  };

  // Add or remove a date
  const handleDatePickerChange = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const exists = selectedDates.some(d => getLocalDateString(d) === dateStr);
    if (exists) {
      setSelectedDates(selectedDates.filter(d => getLocalDateString(d) !== dateStr));
      setDateTimeOptions(dateTimeOptions.filter(opt => opt.date !== dateStr));
    } else {
      setSelectedDates([...selectedDates, date]);
      setDateTimeOptions([...dateTimeOptions, { date: dateStr, times: [] }]);
    }
  };

  // Toggle a time slot for a date
  const handleTimeToggle = (dateStr: string, time: string) => {
    // If setDateTimeOptions does not accept an updater, compute new value first
    const newOptions = dateTimeOptions.map((opt: { date: string; times: string[] }) =>
      opt.date === dateStr
        ? { ...opt, times: opt.times.includes(time) ? opt.times.filter((t: string) => t !== time) : [...opt.times, time] }
        : opt
    );
    setDateTimeOptions(newOptions);
  };

  // Remove a date
  const handleRemoveDate = (dateStr: string) => {
    setSelectedDates(selectedDates.filter(d => getLocalDateString(d) !== dateStr));
    setDateTimeOptions(dateTimeOptions.filter(opt => opt.date !== dateStr));
  };

  return (
    <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
      <h2 className="text-lg sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6">{t('meetup.chooseDates', 'Pick your dates!')}</h2>
      <div className="mb-4 sm:mb-6">
        <DatePicker
          selected={null}
          onChange={handleDatePickerChange}
          locale={dateLocale}
          className="anemi-datepicker"
          dayClassName={dayClassName}
          inline
          minDate={new Date()}
        />
        <p className="text-xs sm:text-sm text-gray-500 mt-2">{t('meetup.chooseDaysInfo', 'Pick as many days as you like! The more, the merrier ☀️')}</p>
      </div>
      {selectedDates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">{t('meetup.selectedDates', 'Your picked days')}</h3>
          {selectedDates.map((date, idx) => {
            const dateStr = getLocalDateString(date);
            const dateOpt = dateTimeOptions.find(opt => opt.date === dateStr);
            // New: compact date display
            const dayShort = date.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = date.getDate();
            const monthShort = date.toLocaleDateString(undefined, { month: 'short' }).toLowerCase();
            const holidays = getHolidaysForDate(date);
            return (
              <div key={dateStr} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="font-medium flex flex-col items-start">
                    <span className="text-xs text-gray-500">{dayShort}</span>
                    <span className="text-2xl font-bold leading-none">{dayNum}</span>
                    <span className="text-xs text-gray-400 lowercase">{monthShort}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="flex items-center gap-1 text-red-500 hover:text-white hover:bg-red-500 transition px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label={t('meetup.remove', 'Remove this day')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="hidden sm:inline">{t('meetup.remove', 'Remove')}</span>
                  </button>
                </div>
                {holidays.length > 0 && (
                  <div className="text-xs text-blue-600 mb-1">
                    {holidays.map((h, i) => (
                      <div key={i}>
                        {t('meetup.holidayInfo', 'Did you know this day is {{holiday}} in {{country}}?', { holiday: h.name, country: h.country })}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {TIME_SLOTS.map((time: string) => {
                    const isSelected = dateOpt?.times.includes(time) || false;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeToggle(dateStr, time)}
                        className={`w-full p-3 rounded-xl border-2 font-semibold text-base shadow-sm flex flex-col items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-500
                          ${isSelected ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                        aria-pressed={isSelected}
                      >
                        {t(time, { ns: 'common' })}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedDates.length === 0 && error && <div className="text-red-500 text-sm mb-2" aria-live="polite">{error}</div>}
    </div>
  );
};

export default DateSelector; 