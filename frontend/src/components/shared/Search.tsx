import { BiSearch } from "react-icons/bi";
import { FiSearch } from "react-icons/fi";

interface SearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export function Search({placeholder = "Search anything...", onSearch}: SearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-lg w-full bg-white shadow-sm">
      <div className="pl-3 pr-2 py-2 flex-shrink-0">
        <BiSearch className="text-gray-400 text-lg"/>
      </div>
      <input 
        type="search" 
        placeholder={placeholder} 
        onChange={handleInputChange}
        className="outline-none flex-1 min-w-0 py-2 pr-2 text-sm text-gray-600 placeholder-gray-400"
      />
      <div className="bg-main p-2 sm:p-3 rounded-r-lg flex justify-center items-center min-w-[36px] sm:min-w-[40px] flex-shrink-0">
        <FiSearch className="text-white w-3 h-3 sm:w-4 sm:h-4" aria-label="search" />
      </div>
    </div>
  )
}

export default Search;