import { FiClock, FiTrendingUp } from "react-icons/fi";
import { HiCheckCircle, HiUsers } from "react-icons/hi";

interface IClassNurseReviewCardsProps {
  title: string;
  comment: string;
  icon: string;
  number: string;
}

const resolveIcon = (icon: string, className = "h-4 w-4") => {
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

export function ClassNurseReviewCards(props: IClassNurseReviewCardsProps) {
  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 w-full">
      <div className="flex mb-4 gap-3">
        <h1 className="text-main font-bold inline">{props.title}</h1>
      </div>

      <div className="flex justify-between ">
        <div className="h-10 w-10 bg-main rounded-full flex justify-center items-center text-white">
          {resolveIcon(props.icon, "h-4 w-4")}
        </div>

        <div className="flex flex-col justify-center items-center">
          <h1 className="text-md font-semibold text-lg">{props.number}</h1>

          <div className="flex gap-2 items-center">
            <FiTrendingUp className="w-3 h-3 text-main" aria-hidden />
            <p className="text-black text-sm">{props.comment}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface INurseClassesProps {
  classRoom: string;
  className: string;
  healthy: string;
  sick: string;
  updatedAt: string;
}

export function NurseClasses(props: INurseClassesProps) {
  return (
    <div className="col-span-1 flex flex-col w-full p-5 border-2 border-gray-200 rounded-lg gap-4">
      <h1 className="text-main text-lg font-semibold">{props.classRoom}</h1>
      <p className="text-main text-lg font-semibold">{props.className}</p>
      <div className="flex gap-4 items-center">
        <HiCheckCircle className="w-3 h-3 text-main" aria-hidden />
        <p className="">Health: {props.healthy}</p>
      </div>
      <div className="flex gap-4 items-center">
        <HiUsers className="w-3 h-3 text-main" aria-hidden />
        <p className="">Sick: {props.sick}</p>
      </div>
      <div className="flex gap-4 items-center">
        <FiClock className="w-3 h-3 text-main" aria-hidden />
        <p className="">Updated: {props.updatedAt}</p>
      </div>

      <div className="w-full flex justify-center">
        <button className="bg-main text-white px-3 py-2 rounded-lg text-center">View details</button>
      </div>
    </div>
  )
}