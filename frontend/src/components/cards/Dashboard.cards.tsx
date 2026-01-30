import { FiTrendingUp } from "react-icons/fi";
import { HiUser } from "react-icons/hi";
import { type ReactNode } from "react";

interface ReviewCardsProps {
  title: string;
  date: string;
  numbers: string;
  comment: string;
  icon?: ReactNode;
}

interface RemainderCardsProps {
  icon: ReactNode,
  title: string,
  message: string
}

export function ReviewCards({ title, date, numbers, comment, icon }: ReviewCardsProps) {
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
        <span className="text-xs text-blue-500 font-medium">{date}</span>
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

interface AbsentSampleCardsProps {
  name: string;
  classroom: string;
  reason: string;
}

export function AbsentSampleCards({ name, classroom, reason }: AbsentSampleCardsProps) {
  return (
    <div className="w-full rounded-lg bg-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="min-w-0">
        <h2 className="font-semibold text-main text-[0.8rem]">{name}</h2>
        <p className="text-xs text-gray-500">{classroom}</p>
      </div>
      <button className="bg-main text-white hover:bg-main-hover active:bg-main-active py-1 text-[11px] rounded-lg w-20" title={reason}>
        {reason ? reason.length > 6 ? reason.slice(0, 6) + "..." : reason : "NA"}
      </button>
    </div>
  )
};

interface SickStudentCardsProps {
  name: string;
  classroom: string;
  reason: string;
  notes?: string;
}

export function SickStudentCards({ name, classroom, reason, notes }: SickStudentCardsProps) {
  const displayText = notes || "N/A";
  const buttonTitle = notes ? `Notes: ${notes}` : `Reason: ${reason}`;

  return (
    <div className="w-full rounded-lg bg-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="min-w-0">
        <h2 className="font-semibold text-main text-[0.8rem]">{name}</h2>
        <p className="text-xs text-gray-500">{classroom}</p>
      </div>
      <button className="bg-main text-white hover:bg-main-hover active:bg-main-active py-1 text-[11px] rounded-lg w-20" title={buttonTitle}>
        {displayText.length > 6 ? displayText.slice(0, 6) + "..." : displayText}
      </button>
    </div>
  )
};

export function RemainderCards({ icon, title, message }: RemainderCardsProps) {
  return (
    <div className="w-full rounded-lg bg-main my-5 p-6">
      <div className="flex items-center gap-7 mb-2">
        <div className="text-white text-xl">
          {icon || <HiUser key={title} />}
        </div>
        <h2 className="font-semibold text-white text-sm">{title}</h2>
      </div>
      <p className="text-white text-[.8rem]">{message}</p>
    </div>
  )
}

export function TeacherRemainderCards({ title, message }: { title: string, message: string }) {
  return (
    <div className="w-full rounded-lg bg-main my-5 p-6">
      <div className="flex items-center gap-3 mb-2 justify-between">
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-white">{title}</h2>
          <p className="text-sm text-white">{message}</p>
        </div>
        <button className="bg-[#062350] hover:bg-[#062350]/70 text-white px-4 py-2 rounded-lg">submit</button>
      </div>
    </div>
  )
}

interface IHomeTeacherProps {
  title: string;
  date?: string;
  icon: string | ReactNode;
  comment: string;
  number: number;
}

export function HomeTeacherCards(props: IHomeTeacherProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 w-full transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:cursor-pointer"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
      }}>
      <div className="mb-4">
        <h1 className="text-sm text-gray-800 font-semibold inline">{props.title}</h1>
        {props.date && (<p className="text-xs text-blue-500 font-medium inline"> | {props.date}</p>)}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-main rounded-full flex justify-center items-center shadow-md">
          {typeof props.icon === 'string' ? (
            <img src={props.icon} alt="" className="w-6 h-6" />
          ) : (
            <div className="text-white text-xl">{props.icon}</div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800 mb-1">{props.number}</p>
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-3 h-3 text-main" aria-hidden />
            <p className="text-sm text-gray-500">{props.comment}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

