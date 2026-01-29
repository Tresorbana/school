import { FiClock, FiTrendingUp } from "react-icons/fi";
import { HiCheckCircle, HiUsers } from "react-icons/hi";

export interface ITimetableReviewCardsProps {
  title: string;
  number: string;
  icon: string;
  comment: string;
  period?: string;
}

const resolveIcon = (icon: string, className = "w-6 h-6") => {
  const normalized = icon.toLowerCase();

  if (normalized.includes("clock")) {
    return <FiClock className={className} />;
  }

  if (normalized.includes("check")) {
    return <HiCheckCircle className={className} />;
  }

  if (normalized.includes("people") || normalized.includes("users")) {
    return <HiUsers className={className} />;
  }

  return <HiUsers className={className} />;
};

export function TimetableReviewCards(prop: ITimetableReviewCardsProps) {
  return (
    <div className="border-2 border-gray-200 p-4 px-5 rounded-lg">
      <div className="flex">
        <h1 className="text-lg text-bold text-main inline">{prop.title}</h1>
        {prop.period && (
          <p className="text-sm text-gray-500 inline translate-y-1">&nbsp; | {prop.period}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="bg-main rounded-full w-8 h-8 flex items-center justify-center text-white">
          {resolveIcon(prop.icon, "w-6 h-6")}
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-lg text-bold text-main font-semibold">{prop.number}</h1>
          <div className="flex items-center gap-2 justify-center">
            <FiTrendingUp className="w-3 h-3 text-main" aria-hidden />
            <p className="text-sm">{prop.comment}</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export interface ITimetableCardsProps {
  day: string;
  period?: string;
  classroom?: string;
  attendance?: string;
  students?: number;
  updatedAt?: string;
  status?: string;
}

export function TimetableCard(prop: ITimetableCardsProps) {
  return (
    <>
      {prop.period && (
        <div className="flex flex-col gap-4 border-2 border-gray-200 p-4 px-5 rounded-lg">
          <h1 className="text-lg text-bold text-main mb-6">{prop.classroom}</h1>
          <div className="flex gap-4 items-center">
            <HiCheckCircle className="w-5 h-5 text-main" aria-hidden />
            <p className="text-sm">Attendance: {prop.attendance}</p>
          </div>
          <div className="flex gap-4 items-center">
            <HiUsers className="w-5 h-5 text-main" aria-hidden />
            <p className="text-sm">{prop.students} students</p>
          </div>
          <div className="flex gap-4 items-center">
            <FiClock className="w-5 h-5 text-main" aria-hidden />
            <p className="text-sm">Updated: {prop.updatedAt}</p>
          </div>
          <div className="flex gap-4 items-center">
            <FiClock className="w-5 h-5 text-main" aria-hidden />
            <p className="text-sm">{prop.status}</p>
          </div>

        </div>
      )}

      {!prop.period && (
        <div className="flex justify-center items-center">
          <p className="text-lg text-bold text-main">Free</p>
        </div>
      )}
    </>
  )
}