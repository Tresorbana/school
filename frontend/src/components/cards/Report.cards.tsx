import { FiTrendingUp } from "react-icons/fi";
import type { ReactNode } from "react";

interface ReportCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
}

export function ReportTeacherReviewCard({ title, value, subtitle, icon }: ReportCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 w-full transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:cursor-pointer"
         style={{
           boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
         }}>
      <div className="mb-4">
        <h1 className="text-sm text-gray-800 font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-main rounded-full flex justify-center items-center shadow-md">
          <div className="text-white text-xl">{icon}</div>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
          {subtitle && (
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-3 h-3 text-main" aria-hidden />
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReportCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 w-full animate-pulse"
         style={{
           boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
         }}>
      <div className="mb-4">
        <div className="h-4 bg-gray-300 rounded w-24"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}