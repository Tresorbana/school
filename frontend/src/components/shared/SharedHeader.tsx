import NoficationProfile from "./NoficationProfile"
import Search from "./Search"

interface SharedHeaderProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

// sharedHeader which stick to the top
function SharedHeader({ placeholder, onSearch }: SharedHeaderProps) {
    return (
        <>
            <div className="sticky top-0 z-50 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <div className="flex-1 sm:flex-none sm:max-w-md">
                        <Search placeholder={placeholder} onSearch={onSearch} />
                    </div>
                    <div className="flex justify-end sm:justify-start">
                        <NoficationProfile />
                    </div>
                </div>
            </div>
        </>
    )
}

export default SharedHeader