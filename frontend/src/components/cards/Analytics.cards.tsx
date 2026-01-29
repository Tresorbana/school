import type { ReactNode } from "react";
import { FiTrendingUp } from "react-icons/fi";

interface AnalyticsReviewCardsProps {
  title: string;
  numbers: number;
  comment: string;
  icon: ReactNode;
}

export function AnalyticsReviewCards({ title, numbers, comment, icon }: AnalyticsReviewCardsProps) {

  // console.log({title, numbers, comment, icon});
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_-1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_-2px_4px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.12)] transition-all p-4 w-full duration-300 hover:scale-105 hover:cursor-pointer">
      {/* Title */}
      <h4 className="text-base font-semibold text-gray-700 mb-6">{title}</h4>

      {/* Content Area */}
      <div className="flex items-center justify-between">
        {/* Icon Circle */}
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white text-xl">
          {icon}
        </div>

        {/* Numbers and Trend */}
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 mb-1">{numbers}</div>
          <div className="flex items-center gap-1 text-gray-600 justify-end">
            <FiTrendingUp className="text-xs" />
            <span className="text-xs font-medium">{comment}</span>
          </div>
        </div>
      </div>
    </div>
  );
}