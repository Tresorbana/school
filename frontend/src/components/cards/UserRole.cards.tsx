import { FiTrendingUp } from "react-icons/fi";
import { type ReactNode } from "react";

interface UserRoleReviewCardsProps {
    title: string;
    number: number;
    icon: string | ReactNode;
    comment: string;
}

export function UserRoleReviewCards({ title, number, icon, comment }: UserRoleReviewCardsProps) {
  return (
    <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="font-semibold text-gray-800 mb-3 text-[15px]">{title}</div>
      {/* Body */}
      <div className="flex items-center gap-10 md:justify-between">
        <div className="w-14 h-14 rounded-full bg-main flex items-center justify-center overflow-hidden shrink-0">
          {typeof icon === 'string' ? (
            <img src={icon} alt="icon" className="w-6 h-6 object-contain invert-0" />
          ) : (
            <div className="text-white text-xl">{icon}</div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 leading-none">{number}</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <FiTrendingUp className="w-4 h-4 text-main" aria-hidden />
            <span>{comment}</span>
          </div>
        </div>
      </div>
    </div>
  );
}