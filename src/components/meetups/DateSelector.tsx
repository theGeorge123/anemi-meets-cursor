import React from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation(['common', 'meetup']);
  const dateLocale = i18n.language === 'en' ? undefined : undefined; // Add locale if needed

  // Helper: get local date string in YYYY-MM-DD
  const getLocalDateString = (date: Date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

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
    <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('createMeetup.chooseDateTime')}</h2>
      <div className="mb-6">
        <DatePicker
          selected={null}
          onChange={handleDatePickerChange}
          locale={dateLocale}
          inline
          minDate={new Date()}
        />
        <p className="text-sm text-gray-500 mt-2">{t('createMeetup.chooseDaysInfo')}</p>
      </div>
      {selectedDates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">{t('common.selectedDates')}</h3>
          {selectedDates.map((date, idx) => {
            const dateStr = getLocalDateString(date);
            const dateOpt = dateTimeOptions.find(opt => opt.date === dateStr);
            return (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{date.toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="text-red-500 hover:text-red-700"
                  >
                    {t('common.remove')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {TIME_SLOTS.map((time: string) => {
                    const isSelected = dateOpt?.times.includes(time) || false;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeToggle(dateStr, time)}
                        className={`w-full p-3 rounded-xl border-2 font-semibold text-base shadow-sm flex flex-col items-center justify-center transition-all duration-150
                          ${isSelected ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                        aria-pressed={isSelected}
                      >
                        {t(`common.${time}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedDates.length === 0 && error && <div className="text-red-500 text-sm mb-2" aria-live="assertive">{error}</div>}
    </div>
  );
};

export default DateSelector; 