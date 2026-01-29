import { HiUser } from "react-icons/hi";
import type { ReactElement } from "react";

interface ReviewCardsProps {
  title: string;
  numbers: string;
  comment: string;
  icon?: ReactElement;
}
  

export function AttendanceNurseReviewCards({ title, numbers, comment, icon }: ReviewCardsProps) {
  return (
    <div 
      className="w-[95%] bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90" 
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <span className="text-sm font-semibold text-gray-800">{title}</span> 
        <span className="text-gray-400 mx-2">|</span>
        <span className="text-xs text-blue-500 font-medium">Today</span>
      </div>

      {/* Body */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
          <div className="text-white text-xl">
            {icon || <HiUser />}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-800 mb-1">{numbers}</div>
          <div className="text-xs text-gray-500">{comment}</div>
        </div>
      </div>
    </div>
  );
}