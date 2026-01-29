import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  placeholder = "Select an option",
  onSelect,
  disabled = false,
  loading = false,
  className = ""
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    setSearchTerm("");
    setIsOpen(false);
    onSelect(option.value);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg cursor-pointer
          ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-main/50'}
          ${isOpen ? 'border-main ring-1 ring-main/20' : ''}
        `}
        onClick={handleInputClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          {isOpen ? (
            <div className="flex items-center flex-1">
              <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={14} />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teachers..."
                className="flex-1 outline-none text-xs bg-transparent"
                disabled={disabled || loading}
              />
            </div>
          ) : selectedOption ? (
            <div className="flex items-center justify-between flex-1">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {selectedOption.label}
                </div>
                {selectedOption.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-500 truncate">
              {loading ? 'Loading...' : placeholder}
            </span>
          )}
        </div>
        
        {!selectedOption && (
          <FiChevronDown 
            className={`text-gray-400 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            size={14} 
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-hidden">
          {filteredOptions.length > 0 ? (
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className="px-3 py-2 cursor-pointer hover:bg-main/5 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-xs font-medium text-gray-900">
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {option.subtitle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              {searchTerm ? 'No teachers found' : 'No teachers available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}