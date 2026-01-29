import React, { useState } from 'react';
import { FiX, FiEye, FiUserCheck } from 'react-icons/fi';
import ModalWrapper from '../../shared/ModalWrapper';
import SelfStudyAttendanceRecordModal from './SelfStudyAttendanceRecord.modal';
import SelfStudyAttendanceViewModal from './SelfStudyAttendanceView.modal';

interface SelfStudyAttendanceActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceRecorded?: () => void;
  attendanceRow: {
    class_id: string;
    class_name: string;
    period: string;
    period_display: string;
    time_range: string;
    status: string;
    can_record: boolean;
    session_id?: string;
  };
  date: string;
}

const SelfStudyAttendanceActionsModal: React.FC<SelfStudyAttendanceActionsModalProps> = ({
  isOpen,
  onClose,
  onAttendanceRecorded,
  attendanceRow,
  date
}) => {
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleActionClick = (action: 'record' | 'view') => {
    if (action === 'record') {
      setRecordModalOpen(true);
    } else if (action === 'view') {
      setViewModalOpen(true);
    }
  };

  const handleAttendanceRecordedCallback = () => {
    setRecordModalOpen(false);
    onClose();
    onAttendanceRecorded?.();
  };

  const getAvailableActions = () => {
    const actions = [];

    // Record Attendance - only if can record and status is pending
    if (attendanceRow.can_record && attendanceRow.status === 'pending') {
      actions.push({
        id: 'record',
        label: 'Record Self-Study Attendance',
        icon: <FiUserCheck className="w-5 h-5" />,
        description: 'Record attendance for this self-study session'
      });
    }

    // View Attendance - only if already completed
    if (attendanceRow.status === 'completed' && attendanceRow.session_id) {
      actions.push({
        id: 'view',
        label: 'View Self-Study Attendance',
        icon: <FiEye className="w-5 h-5" />,
        description: 'View recorded attendance for this session'
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <>
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-md"
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Self-Study Attendance</h3>
            <p className="text-sm text-gray-600">{attendanceRow.class_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Session Information */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Period:</span>
              <span className="ml-2 font-medium text-gray-900">{attendanceRow.period_display}</span>
            </div>
            <div>
              <span className="text-gray-600">Time:</span>
              <span className="ml-2 font-medium text-gray-900">{attendanceRow.time_range}</span>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-2 font-medium text-gray-900">{new Date(date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                attendanceRow.status === 'completed' ? 'bg-green-100 text-green-800' :
                attendanceRow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                attendanceRow.status === 'missed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {attendanceRow.status === 'completed' ? 'Completed' :
                 attendanceRow.status === 'pending' ? 'Pending' :
                 attendanceRow.status === 'missed' ? 'Missed Out' :
                 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4">
          {availableActions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No actions available for this session</p>
              <p className="text-xs text-gray-400 mt-1">
                {attendanceRow.status === 'missed' ? 'This session has been missed' : 
                 attendanceRow.status === 'pending' && !attendanceRow.can_record ? 'Session is not ready for recording' :
                 'Session status does not allow actions'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Available Actions:</h4>
              <div className="space-y-2">
                {availableActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id as 'record' | 'view')}
                    className="w-full p-3 bg-white hover:bg-main hover:text-white border border-gray-200 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-main group-hover:text-white">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-white text-sm">
                          {action.label}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-white/80 mt-1">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>

    {/* Self-Study Attendance Record Modal */}
    <SelfStudyAttendanceRecordModal
      isOpen={recordModalOpen}
      onClose={() => setRecordModalOpen(false)}
      classId={attendanceRow.class_id}
      className={attendanceRow.class_name}
      period={attendanceRow.period}
      periodDisplay={attendanceRow.period_display}
      date={date}
      onAttendanceRecorded={handleAttendanceRecordedCallback}
    />

    {/* Self-Study Attendance View Modal */}
    <SelfStudyAttendanceViewModal
      isOpen={viewModalOpen}
      onClose={() => setViewModalOpen(false)}
      sessionId={attendanceRow.session_id || ''}
      classId={attendanceRow.class_id}
      className={attendanceRow.class_name}
      period={attendanceRow.period}
      periodDisplay={attendanceRow.period_display}
      date={date}
    />
  </>
  );
};

export default SelfStudyAttendanceActionsModal;