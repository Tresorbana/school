import type { ReactNode } from "react";
import { FiTrendingUp, FiClock } from "react-icons/fi";
import { HiUser, HiUsers } from "react-icons/hi";

interface ReportsReviewCardsProps {
  title: string;
  classroom?: string;
  comment: string;
  icon: ReactNode;
}

export function ReportAdminReviewCards({title, classroom, comment, icon}: ReportsReviewCardsProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 w-full box-border">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-semibold text-main">{title}</h4>
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-main -translate-x-2 translate-y-10 scale-125">
          {icon || <HiUser key={title}/>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-3xl font-bold text-gray-900">{classroom}</div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-gray-600">
        <FiTrendingUp className="text-[16px]" />
        <span className="text-sm">{comment}</span>
      </div>
    </div>
  );
}

export function ReportDisplineReviewCards(prop: ReportsReviewCardsProps & { message: string }) {
  return (
    <div className="border-2 border-gray-100 overflow-hidden p-3 rounded-lg">
      <h1 className="text-main text-lg font-semibold">{prop.title}</h1>
      <div className="flex justify-between mt-5">
        <div className="bg-main w-10 h-10 rounded-full flex items-center justify-center">
          {prop.icon || <HiUser key={prop.title}/>}
        </div>
        <div className="flex flex-col justify-center items-center text-main gap-5">
          <h1 className="text-semibold text-lg">{prop.message}</h1>
          <div className="flex gap-2 items-center">
            <FiTrendingUp className="w-3 h-3 text-main" aria-hidden />
            <p className="text-sm">{prop.comment}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


export interface IReportTeacherClasseCardsProps {
  classRoom: string;
  className: string;
  subjects: string[];
  attendance: string;
  students: number;
  updatedAt: string;
  studentsList?: string[];
  onViewDetails?: () => void;
}

export function TeacherClassesCards(props: IReportTeacherClasseCardsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      {/* Header with class name and status */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-md font-bold text-black">{props.classRoom}</h1>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[0.75rem] rounded">
          {Math.random() > 0.5 ? "Submitted" : "Pending"}
        </span>
      </div>

      {/* Students count with icon */}
      <div className="flex items-center gap-2 mb-3">
        <HiUsers className="text-black text-base" />
        <span className="text-gray-600 text-[.8rem]">{props.students} students</span>
      </div>

      {/* Last updated with clock icon */}
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="text-gray-400 text-base" />
        <span className="text-gray-500 text-[.8rem]">Updated {props.updatedAt}</span>
      </div>

      {/* View Class button */}
      <div className="w-full flex justify-center">
        <button
          className="w-[10rem] text-center bg-main text-white py-2 rounded-md text-sm font-medium hover:bg-main/90 transition-colors"
          onClick={props.onViewDetails}
        >
          View class
        </button>
      </div>
    </div>
  )
}
