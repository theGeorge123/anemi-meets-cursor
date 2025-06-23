import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { enGB } from 'date-fns/locale/en-GB';
import { nl } from 'date-fns/locale/nl';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);
registerLocale('nl', nl);

const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
type TimeSlot = (typeof TIME_SLOTS)[number];

const TIME_SLOT_HOURS: Record<TimeSlot, string> = {
  morning: '07:00–12:00',
  afternoon: '12:00–16:00',
  evening: '16:00–19:00',
};

interface SimpleDateTimePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  selectedTime: string;
  onTimeChange: (time: TimeSlot) => void;
}

const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'nl' ? 'nl' : 'en-GB';

  return (
    <div className="grid grid-cols-1 gap-4">
      <DatePicker
        selected={selectedDate}
        onChange={onDateChange}
        locale={dateLocale}
        dateFormat="P"
        className="input-field w-full"
        placeholderText={t('solo.datePlaceholder')}
        minDate={new Date()}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedTime === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onTimeChange(slot)}
              className={`w-full p-3 rounded-xl border-2 font-semibold text-base shadow-sm flex flex-col items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isSelected
                  ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105'
                  : 'border-gray-200 bg-white hover:border-primary-400'
              }`}
              aria-pressed={isSelected}
            >
              {t(`common.${slot}`)}
              <span className="text-xs mt-1 text-gray-500">{TIME_SLOT_HOURS[slot]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleDateTimePicker;
