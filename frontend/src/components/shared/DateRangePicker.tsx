import React, { useState, useRef, useEffect } from 'react';
import { HiCalendar } from 'react-icons/hi';
import CustomCalendar from './CustomCalendar';

interface DateRangePickerProps {
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  placeholder?: string;
  className?: string;
  position?: 'left' | 'right';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  placeholder = "Select date range",
  className = "",
  position = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle date range change from calendar
  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    if (onDateRangeChange) {
      onDateRangeChange(start, end);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate || !endDate) return placeholder;
  
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${formatDate(startDate)} (Single Date)`;
    }

    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent bg-white min-w-0"
      >
        <HiCalendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="text-xs text-gray-500 font-medium">Date Range</span>
          <span className="text-gray-700 truncate text-sm">
            {formatDateRange()}
          </span>
        </div>
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown calendar */}
      {isOpen && (
        <>
          {/* Semi-transparent backdrop */}
          <div 
            className="fixed inset-0 bg-black/10 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Calendar with stronger visual separation */}
          <div className={`absolute top-full mt-2 z-50 ${position === 'right' ? 'right-0' : 'left-0'}`}>
            <div className="bg-black/5 p-1 rounded-lg">
              <CustomCalendar
                onDateRangeChange={handleDateRangeChange}
                className="w-80"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;