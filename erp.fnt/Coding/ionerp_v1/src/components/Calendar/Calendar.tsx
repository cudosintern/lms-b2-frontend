import React from 'react';

interface CalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange, className = '' }) => {
  return (
    <div className={`calendar-container ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Calendar Date
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default Calendar;
