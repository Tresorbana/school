import React, { useState, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface CustomCalendarProps {
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ 
  onDateRangeChange,
  className = "" 
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  // Check if date is in selected range
  const isInRange = (date: Date) => {
    if (!startDate) return false;
    if (!endDate) return false;
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;
    return date >= start && date <= end;
  };

  // Check if date is start or end date
  const isStartDate = (date: Date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    return endDate && date.toDateString() === endDate.toDateString();
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!startDate) {
      // First selection - set start date
      setStartDate(date);
      setEndDate(null);
      setIsSelectingEnd(true);
    } else if (!endDate || !isSelectingEnd) {
      // Second selection - set end date
      if (date >= startDate) {
        setEndDate(date);
        setIsSelectingEnd(false);
      } else {
        // If selected date is before start, make it the new start
        setEndDate(startDate);
        setStartDate(date);
        setIsSelectingEnd(false);
      }
    } else {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setIsSelectingEnd(true);
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = new Date();
    
    if (direction === 'prev') {
      // Don't go before January 2018
      if (currentYear === 2018 && currentMonth === 0) {
        return; // Stop at January 2018
      }
      
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      // Don't go beyond current month of current year
      if (currentYear === currentDate.getFullYear() && currentMonth === currentDate.getMonth()) {
        return; // Stop at current month
      }
      
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Notify parent of date range changes
  useEffect(() => {
    if (startDate && endDate && onDateRangeChange && !isSelectingEnd) {
      // Ensure start is before end
      const start = startDate < endDate ? startDate : endDate;
      const end = startDate < endDate ? endDate : startDate;
      onDateRangeChange(start, end);
    }
  }, [startDate, endDate, isSelectingEnd]); // Removed onDateRangeChange from dependencies

  const calendarDays = generateCalendarDays();

  // Reset to default (today)
  const handleReset = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setIsSelectingEnd(false);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  return (
    <div className={`bg-white border-2 border-gray-400 rounded-lg p-2 shadow-2xl shadow-black/30 ring-1 ring-gray-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <HiChevronLeft className="w-3 h-3 text-gray-600" />
        </button>
        
        <h3 className="text-xs font-semibold text-main">
          {months[currentMonth]} {currentYear}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <HiChevronRight className="w-3 h-3 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const minDate = new Date(2018, 0, 1); // January 1, 2018
          const today = new Date();
          const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Today's date
          const isValidDate = date ? date >= minDate && date <= maxDate : false;
          
          return (
            <div key={index} className="h-6">
              {date ? (
                <button
                  onClick={() => isValidDate ? handleDateClick(date) : null}
                  disabled={!isValidDate}
                  className={`
                    w-full h-6 text-xs rounded transition-colors
                    ${!isValidDate
                      ? 'text-gray-300 cursor-not-allowed'
                      : isStartDate(date) || isEndDate(date)
                      ? 'bg-main text-white font-semibold'
                      : isInRange(date)
                      ? 'bg-main/20 text-main'
                      : startDate && !endDate && isSelectingEnd
                      ? 'text-gray-700 hover:bg-main/10 border border-main/30'
                      : isToday(date)
                      ? 'bg-gray-100 text-main font-medium border border-main'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected range display and reset button */}
      {startDate && endDate && (
        <div className="mt-2 p-2 bg-main/5 rounded border border-main/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Selected:</span>
              </div>
              <div className="text-xs text-main font-medium">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              title="Reset to today"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {!startDate 
          ? 'Click a date to start selection' 
          : isSelectingEnd 
          ? 'Click another date to complete range' 
          : 'Click dates to select new range'
        }
      </div>
    </div>
  );
};

export default CustomCalendar;