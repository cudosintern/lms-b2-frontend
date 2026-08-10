import React, { useState } from 'react';
import UIButton from '../../../../components/FormBuilder/fields/Button';


interface TimetableOptionsDropdownProps {
  onCopyClassDay: () => void;
  onResetTimetableDate: () => void;
  onDeleteTimetable: () => void;
}

const TimetableOptionsDropdown: React.FC<TimetableOptionsDropdownProps> = ({
  onCopyClassDay,
  onResetTimetableDate,
  onDeleteTimetable
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div>
        <UIButton
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
        >
          Options
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </UIButton>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={() => {
                onCopyClassDay();
                setIsOpen(false);
              }}
              className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Copy Class Day
            </button>
            <button
              onClick={() => {
                onResetTimetableDate();
                setIsOpen(false);
              }}
              className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Reset Timetable Date
            </button>
            <button
              onClick={() => {
                onDeleteTimetable();
                setIsOpen(false);
              }}
              className="text-red-600 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Delete Timetable
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableOptionsDropdown;
