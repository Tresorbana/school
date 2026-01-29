import React, { useState } from 'react';
import { FiClock, FiAlertTriangle, FiX, FiEye, FiEdit, FiUserCheck } from 'react-icons/fi';
import ModalWrapper from '../../shared/ModalWrapper';
import { useToast } from '../../../utils/context/ToastContext';
import { attendanceService } from '../../../services/attendanceService';

interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenRecordAttendance?: (classInfo: {
    className: string;
    subject: string;
    period: string;
    day: string;
    classId: string;
  }, viewOnly: boolean) => void;
  periodInfo: {
    teacherId: string;
    timetableRosterId: string;
    classId: string;
    className: string;
    subject: string;
    period: string;
    date: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    category: string;
    can_record: boolean;
    can_view: boolean;
    recorded_attendance: number;
  };
}

interface AttendanceAction {
  id: 'record' | 'view-last' | 'request-permission' | 'view-only';
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AttendanceActionsModal: React.FC<ActionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenRecordAttendance,
  periodInfo
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string>('');
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const reasonOptions = [
    { value: 'forgot', label: 'Forgot to record attendance', icon: '🤦‍♂️' },
    { value: 'technical_issue', label: 'Technical issue/system problem', icon: '💻' },
    { value: 'emergency', label: 'Emergency situation', icon: '🚨' },
    { value: 'other', label: 'Other reason', icon: '📝' }
  ];

  // Get available actions for this period
  const getAvailableActions = () => {
    const actions: AttendanceAction[] = [];

    if (periodInfo.category === 'PENDING_REQUEST') {
      return actions;
    }

    // Record Attendance
    if (periodInfo.can_record) {
      actions.push({
        id: 'record',
        label: 'Record Attendance',
        icon: <FiUserCheck className="w-5 h-5" />,
        description: 'Record new attendance for students in this period'
      });
    }

    // View Last Attendance - only show ONE view option
    if (periodInfo.recorded_attendance > 0) {
      actions.push({
        id: 'view-last',
        label: 'View Last Attendance',
        icon: <FiEye className="w-5 h-5" />,
        description: 'View attendance that was already recorded today for this period'
      });
    }

    // Request Permission
    if (periodInfo.category === 'MISSED') {
      actions.push({
        id: 'request-permission',
        label: 'Request Permission',
        icon: <FiClock className="w-5 h-5" />,
        description: 'Request permission to record late attendance for this missed period'
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  const handleActionClick = (actionId: string) => {
    if (actionId === 'request-permission') {
      setSelectedAction(actionId);
    } else if (actionId === 'record' || actionId === 'view-last' || actionId === 'view-only') {
      // Open record attendance modal via parent callback
      if (onOpenRecordAttendance) {
        const classInfo = {
          className: periodInfo.className,
          subject: periodInfo.subject,
          period: periodInfo.period,
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          classId: periodInfo.classId
        };
        const viewOnly = actionId === 'view-last' || actionId === 'view-only' || !periodInfo.can_record;
        onOpenRecordAttendance(classInfo, viewOnly);
      }
      onClose(); // Close actions modal
    }
  };

  const handlePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reasonCategory) {
      addToast({ message: 'Please select a reason category', type: 'error' });
      return;
    }

    if (reasonCategory === 'other' && !reasonNotes.trim()) {
      addToast({ message: 'Please provide details for "Other" reason', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await attendanceService.requestPermission({
        timetable_roster_id: periodInfo.timetableRosterId,
        class_id: periodInfo.classId,
        period_date: periodInfo.date,
        reason: reasonCategory,
        reason_notes: reasonNotes.trim() || undefined
      });

      if (result.success) {
        addToast({ 
          message: 'Permission request submitted successfully! Admins will review your request.', 
          type: 'success' 
        });
        onSuccess?.();
        onClose();
        
        // Reset form
        setSelectedAction(null);
        setReasonCategory('');
        setReasonNotes('');
      } else {
        addToast({ message: result.message || 'Failed to submit request', type: 'error' });
      }
    } catch (error) {
      console.error('Permission request error:', error);
      addToast({ message: error instanceof Error ? error.message : 'Failed to submit permission request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedAction(null);
      setReasonCategory('');
      setReasonNotes('');
      onClose();
    }
  };

  return (
    <>
      <ModalWrapper 
        isOpen={isOpen} 
        onClose={handleClose}
        className="w-full max-w-md max-h-[80vh]"
        preventClose={isSubmitting}
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-main/10 rounded-full flex items-center justify-center">
                <FiEdit className="w-4 h-4 text-main" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Available Actions</h3>
                <p className="text-xs text-gray-500">Choose an action for this period</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">

          {/* Period Information */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-main">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Period Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Class:</span>
                <span className="ml-1 font-medium text-gray-900">{periodInfo.className}</span>
              </div>
              <div>
                <span className="text-gray-600">Subject:</span>
                <span className="ml-1 font-medium text-gray-900">{periodInfo.subject}</span>
              </div>
              <div>
                <span className="text-gray-600">Period:</span>
                <span className="ml-1 font-medium text-gray-900">{periodInfo.period}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-1 font-medium text-gray-900">{new Date(periodInfo.date).toLocaleDateString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Time:</span>
                <span className="ml-1 font-medium text-gray-900">{periodInfo.startTime} - {periodInfo.endTime}</span>
              </div>
            </div>
          </div>

          {!selectedAction ? (
            /* Action Selection */
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Select an action:</h4>

              {periodInfo.category === 'PENDING_REQUEST' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  Permission request pending admin review for this missed period.
                </div>
              ) : availableActions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No actions available for this period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action.id)}
                      className="w-full p-3 bg-white hover:bg-main hover:text-white border border-gray-200 rounded-lg text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-main group-hover:text-white">
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-white text-sm">{action.label}</div>
                          <div className="text-xs text-gray-500 group-hover:text-white/80 mt-1">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : selectedAction === 'request-permission' ? (
            /* Permission Request Form */
            <div className="space-y-4">
              {/* Warning Notice */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-yellow-800 mb-1">Important Notice</p>
                    <p className="text-yellow-700">
                      Late attendance recording requires admin approval. Please provide a clear reason for missing the original recording time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Why did you miss recording attendance? *
                </label>
                <div className="space-y-2">
                  {reasonOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        reasonCategory === option.value
                          ? 'border-main bg-main text-white'
                          : 'border-gray-200 hover:border-main/30 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason_category"
                        value={option.value}
                        checked={reasonCategory === option.value}
                        onChange={(e) => setReasonCategory(e.target.value)}
                        className="sr-only"
                      />
                      <span className={`text-sm ${reasonCategory === option.value ? 'text-white' : 'text-gray-600'}`}>
                        {option.icon}
                      </span>
                      <span className={`text-xs font-medium flex-1 ${
                        reasonCategory === option.value ? 'text-white' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </span>
                      {reasonCategory === option.value && (
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-main rounded-full"></div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Additional Details {reasonCategory === 'other' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  placeholder={
                    reasonCategory === 'other' 
                      ? 'Please explain the reason for missing attendance recording...'
                      : 'Provide any additional context or details (optional)...'
                  }
                  rows={3}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main resize-none"
                  maxLength={500}
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {reasonNotes.length}/500 characters
                </div>
              </div>
            </div>
          ) : null}
          </div>

          {/* Footer - Fixed */}
          {selectedAction === 'request-permission' && (
            <div className="flex gap-2 justify-end p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                disabled={isSubmitting}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePermissionSubmit}
                disabled={isSubmitting || !reasonCategory}
                className="px-4 py-1.5 bg-main text-white rounded-lg hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-1"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          )}
        </div>
      </ModalWrapper>
    </>
  );
};

export default AttendanceActionsModal;