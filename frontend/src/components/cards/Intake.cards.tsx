import { FaGraduationCap } from "react-icons/fa";

export interface Intake {
  id: number;
  name: string;
  academicYear: string;
  graduationYear: string;
  studentCount: number;
  courseCount: number;
  status: 'active' | 'completed' | 'upcoming' | 'inactive';
}

export interface IAdminIntakeCard {
  intake: Intake;
  setIntakeDetails: (intake: Intake) => void;
  setModalOpen: () => void;
}

export function AdminIntakeCard({ intake, setIntakeDetails, setModalOpen }: IAdminIntakeCard) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-gray-900';
      case 'completed': return 'text-gray-500';
      case 'upcoming': return 'text-gray-600';
      case 'inactive': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'upcoming': return 'Upcoming';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return(
    <div className="relative">
      <div 
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90 hover:scale-[1.001] cursor-pointer"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-800">{intake.name}</span>
          <span className="text-gray-400 mx-2">|</span>
          <span className={`text-xs font-medium ${getStatusColor(intake.status)}`}>
            {getStatusText(intake.status)}
          </span>
        </div>

        {/* Body */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
            <FaGraduationCap className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-800 mb-1">{intake.academicYear}</div>
            <div className="text-xs text-gray-500">Academic Year</div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total Students:</span>
            <span className="text-xs font-semibold text-gray-800">{intake.studentCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total Courses:</span>
            <span className="text-xs font-semibold text-gray-800">{intake.courseCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Graduation Year:</span>
            <span className="text-xs font-semibold text-gray-800">{intake.graduationYear}</span>
          </div>
        </div>

        {/* Actions */}
        {/* It was flex but it is hidden */}
        <div className=" gap-2 hidden">
          <button 
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-main text-white hover:bg-main/80 transition-colors"
            onClick={() => {
              setIntakeDetails(intake);
              setModalOpen();
            }}
          >
            View Details
          </button>
          <button className="flex-1 text-xs px-3 py-2 rounded-lg border border-main text-main hover:bg-main/5 transition-colors">
            View Classes
          </button>
        </div>
        
      </div>
    </div>
  )
}