import React, { useState, useEffect, useRef } from 'react';

interface DateOption {
  value: string; // Real date (YYYY-MM-DD)
  label: string; // Display label
  date: Date;
}

interface InfiniteScrollDatePickerProps {
  onDateChange: (date: string) => void;
  className?: string;
}

const InfiniteScrollDatePicker: React.FC<InfiniteScrollDatePickerProps> = ({
  onDateChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const onDateChangeRef = useRef(onDateChange);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  // Generate date options
  const generateDateOptions = (startDate: Date, count: number): DateOption[] => {
    const options: DateOption[] = [];
    
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      
      const value = date.toISOString().split('T')[0]; // YYYY-MM-DD
      let label: string;
      
      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Yesterday';
      } else {
        // Format as "Wed 8th Jan 2026"
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        
        // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
        const getOrdinalSuffix = (n: number) => {
          const s = ["th", "st", "nd", "rd"];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        
        label = `${dayName} ${getOrdinalSuffix(day)} ${month} ${year}`;
      }
      
      options.push({ value, label, date });
    }
    
    return options;
  };

  // Initialize with today and some past dates
  useEffect(() => {
    const today = new Date();
    const initialOptions = generateDateOptions(today, 30); // Start with 30 days
    setDateOptions(initialOptions);
    
    // Set today as default
    const todayOption = initialOptions[0];
    setSelectedDate(todayOption);
    onDateChangeRef.current(todayOption.value);
  }, []); // Empty dependency array - runs only once

  // Handle scroll to load more dates
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // If scrolled near bottom (within 100px), load more dates
    if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading) {
      setIsLoading(true);
      
      // Get the oldest date from current options
      const oldestDate = dateOptions[dateOptions.length - 1]?.date;
      if (oldestDate) {
        const nextDay = new Date(oldestDate);
        nextDay.setDate(nextDay.getDate() - 1);
        
        // Generate 20 more dates
        const newOptions = generateDateOptions(nextDay, 20);
        
        setTimeout(() => {
          setDateOptions(prev => [...prev, ...newOptions]);
          setIsLoading(false);
        }, 200); // Small delay to show loading
      }
    }
  };

  const handleDateSelect = (option: DateOption) => {
    setSelectedDate(option);
    setIsOpen(false);
    onDateChangeRef.current(option.value);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected date display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-200 rounded-md w-32 md:w-40 bg-main text-white text-xs px-2 py-1 flex items-center justify-between hover:bg-opacity-90 transition-colors"
      >
        <span className="truncate">{selectedDate?.label || 'Select Date'}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown with infinite scroll */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            {dateOptions.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                onClick={() => handleDateSelect(option)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                  selectedDate?.value === option.value 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="px-3 py-2 text-center text-xs text-gray-500">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading more dates...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default InfiniteScrollDatePicker;