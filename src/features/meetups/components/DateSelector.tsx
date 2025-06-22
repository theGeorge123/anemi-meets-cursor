import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { enGB } from 'date-fns/locale/en-GB';
import { nl } from 'date-fns/locale/nl';
import { getHolidaysForDate } from '../../../utils/holidays';

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
  setSelectedDates: React.Dispatch<React.SetStateAction<Date[]>>;
  dateTimeOptions: { date: string; times: string[] }[];
  setDateTimeOptions: React.Dispatch<React.SetStateAction<{ date: string; times: string[] }[]>>;
  error?: string | null;
}

// Updated time slots to match new logic: 07:00–19:00
const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;

const TIME_SLOT_HOURS: Record<string, string> = {
  morning: '07:00–12:00',
  afternoon: '12:00–16:00',
  evening: '16:00–19:00',
};

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDates,
  setSelectedDates,
  dateTimeOptions,
  setDateTimeOptions,
  error,
}) => {
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === 'nl' ? 'nl' : 'en-GB';

  // Helper: get local date string in YYYY-MM-DD
  const getLocalDateString = (date: Date) =>
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0');

  // Highlight dates that are already selected
  const dayClassName = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const exists = selectedDates.some((d) => getLocalDateString(d) === dateStr);
    return exists ? 'date-selected' : null;
  };

  // Add or remove a date
  const handleDatePickerChange = (date: Date) => {
    const dateStr = getLocalDateString(date);
    setSelectedDates((prevSelected) => {
      const exists = prevSelected.some((d) => getLocalDateString(d) === dateStr);
      setDateTimeOptions((prevOptions) =>
        exists
          ? prevOptions.filter((opt) => opt.date !== dateStr)
          : [...prevOptions, { date: dateStr, times: [] }],
      );
      return exists
        ? prevSelected.filter((d) => getLocalDateString(d) !== dateStr)
        : [...prevSelected, date];
    });
  };

  // Toggle a time slot for a date
  const handleTimeToggle = (dateStr: string, time: string) => {
    setDateTimeOptions((prevOptions) =>
      prevOptions.map((opt) =>
        opt.date === dateStr
          ? {
              ...opt,
              times: opt.times.includes(time)
                ? opt.times.filter((t) => t !== time)
                : [...opt.times, time],
            }
          : opt,
      ),
    );
  };

  // Remove a date
  const handleRemoveDate = (dateStr: string) => {
    setSelectedDates((prevDates) => prevDates.filter((d) => getLocalDateString(d) !== dateStr));
    setDateTimeOptions((prevOptions) => prevOptions.filter((opt) => opt.date !== dateStr));
  };

  return (
    <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
      <h2 className="text-lg sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6">
        {t('createMeetup.chooseDates')}
      </h2>
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
        <p className="text-xs sm:text-sm text-gray-500 mt-2">{t('createMeetup.chooseDaysInfo')}</p>
      </div>
      <div className="mb-3 text-xs text-gray-500 text-center">
        {t('createMeetup.timeDisclaimer')}
      </div>
      {selectedDates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">{t('createMeetup.selectedDates')}</h3>
          {selectedDates.map((date) => {
            const dateStr = getLocalDateString(date);
            const dateOpt = dateTimeOptions.find((opt) => opt.date === dateStr);
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
                    aria-label={t('createMeetup.remove')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline">{t('createMeetup.remove')}</span>
                  </button>
                </div>
                {holidays.length > 0 && (
                  <div className="text-xs text-blue-600 mb-1">
                    {holidays.map((h, i) => (
                      <div key={i}>
                        {t('meetup.holidayInfo', { holiday: h.name, country: h.country })}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {TIME_SLOTS.map((time) => {
                    const isSelected = dateOpt?.times.includes(time) || false;
                    const now = new Date();
                    const isToday = getLocalDateString(date) === getLocalDateString(now);
                    const currentHour = now.getHours();
                    let isDisabled = false;

                    if (isToday) {
                      if (time === 'morning' && currentHour >= 12) isDisabled = true;
                      if (time === 'afternoon' && currentHour >= 16) isDisabled = true;
                      if (time === 'evening' && currentHour >= 19) isDisabled = true;
                    }

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeToggle(dateStr, time)}
                        className={`w-full p-3 rounded-xl border-2 font-semibold text-base shadow-sm flex flex-col items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-500
                          ${
                            isSelected
                              ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300'
                              : isDisabled
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        aria-pressed={isSelected}
                        disabled={isDisabled}
                      >
                        {t(`common.${time}`)}
                        <span
                          className={`text-xs mt-1 ${
                            isDisabled ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {TIME_SLOT_HOURS[time]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedDates.length === 0 && error && (
        <div className="text-red-500 text-sm mb-2" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
};

export default DateSelector;
