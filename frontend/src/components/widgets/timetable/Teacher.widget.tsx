
import { useEffect, useState } from "react";
import ViewHeader from "../../shared/ViewHeader";
import RecordAttendanceModal from "../../modals/attendance/RecordAttendance.modal";
import ClassDetailsModal from "../../modals/academic/ClassDetails.modal";
import Role from "../../../utils/constants";
import { useAuth } from "../../../utils/context/AuthContext";
import { useToast } from "../../../utils/context/ToastContext";
import { timetableService } from "../../../services/timetableService";
import { attendanceService } from "../../../services/attendanceService";
import SharedHeader from "../../shared/SharedHeader";
import { days, periodTimes } from "../../../utils/timetable.helper";

function TimetableTeacherWidget() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userRole = user?.role;
  const userId = user?.id;
  const isTeacher = userRole === Role.TEACHER;

  const [teacherTimetableData, setTeacherTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [slotStatuses, setSlotStatuses] = useState<{ [key: string]: any }>({});

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedClassInfo, setSelectedClassInfo] = useState<{
    className: string;
    subject: string;
    period: string;
    day: string;
    classId?: string;
  } | null>(null);
  const [attendanceViewOnly, setAttendanceViewOnly] = useState(false);

  const [classDetailsModalOpen, setClassDetailsModalOpen] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<{
    className: string;
    subject: string;
    period: string;
    day: string;
  } | null>(null);

  useEffect(() => {
    if (isTeacher) {
      loadTeacherTimetable();
    }
  }, [isTeacher]);

  useEffect(() => {
    if (!isTeacher || !teacherTimetableData || !teacherTimetableData.found) return;

    const interval = setInterval(() => {
      loadSlotStatuses(teacherTimetableData);
    }, 30000);

    return () => clearInterval(interval);
  }, [isTeacher, teacherTimetableData]);

  const loadTeacherTimetable = async () => {
    if (!isTeacher || !userId) return;

    try {
      setLoading(true);
      const response = await timetableService.getTeacherTimetable(userId);

      if (response.success) {
        setTeacherTimetableData(response.data);
        await loadSlotStatuses(response.data);
      } else {
        setTeacherTimetableData(null);
        setSlotStatuses({});
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load teacher timetable',
        type: 'error'
      });
      setTeacherTimetableData(null);
      setSlotStatuses({});
    } finally {
      setLoading(false);
    }
  };

  const loadSlotStatuses = async (timetableData: any) => {
    if (!timetableData || !timetableData.found) return;

    const statuses: { [key: string]: any } = {};

    try {
      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const daySlots = timetableData.actions?.[dayIdx] || [];
        for (let periodIdx = 0; periodIdx < periodTimes
          .length; periodIdx++) {
          const slotData = daySlots[periodIdx];
          if (slotData && slotData.subject && slotData.class_id) {
            const key = `${dayIdx}-${periodIdx}`;
            const day = days[dayIdx];
            const period = periodTimes[periodIdx];

            try {
              const status = await attendanceService.checkSlotStatus(slotData.class_id, day, period);
              statuses[key] = status;
            } catch (err) {
              statuses[key] = {
                canRecord: false,
                canView: false,
                status: 'error',
                message: 'Unable to check status. Please refresh.',
                hasExistingRecord: false,
                category: 'ERROR'
              };
            }
          }
        }
      }

      setSlotStatuses(statuses);
    } catch (err) {
      console.error('Failed to load slot statuses:', err);
    }
  };

  const handleRecordAttendance = async (className: string, subject: string, period: string, day: string, classId?: string) => {
    if (!classId) {
      addToast({ message: 'Class ID is required to record attendance', type: 'error' });
      return;
    }

    try {
      const slotStatus = await attendanceService.checkSlotStatus(classId, day, period);

      if (slotStatus.canRecord) {
        setSelectedClassInfo({ className, subject, period, day, classId });
        setAttendanceViewOnly(false);
        setAttendanceModalOpen(true);
      } else if (slotStatus.canView && slotStatus.hasExistingRecord) {
        setSelectedClassInfo({ className, subject, period, day, classId });
        setAttendanceViewOnly(true);
        setAttendanceModalOpen(true);
      } else {
        addToast({ message: slotStatus.message, type: 'warning' });
      }
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to check attendance status', type: 'error' });
    }
  };

  const handleViewClassDetails = (className: string, subject: string, period: string, day: string) => {
    setSelectedClassDetails({ className, subject, period, day });
    setClassDetailsModalOpen(true);
  };

  const handleExportTeacherTimetable = () => {
    if (!isTeacher || !teacherTimetableData || !teacherTimetableData.found) return;

    try {
      const teacherName = user ? `${user.first_name} ${user.last_name}` : 'Teacher';
      const csvContent = generateTeacherTimetableCSV(teacherTimetableData, teacherName);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const filename = `my_timetable_${user?.first_name?.replace(/\s+/g, '_') || 'teacher'}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);

      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({ message: 'Your timetable exported successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: 'Failed to export timetable', type: 'error' });
    }
  };

  const generateTeacherTimetableCSV = (timetableData: any, teacherName: string) => {
    const headers = ['Period', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let csv = `Teacher Timetable Export\n`;
    csv += `Teacher: ${teacherName}\n`;
    csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;
    csv += headers.join(',') + '\n';

    periodTimes.forEach((period, periodIdx) => {
      const row = [period];
      days.forEach((_, dayIdx) => {
        const daySlots = timetableData.actions?.[dayIdx] || [];
        const slotData = daySlots[periodIdx];
        if (slotData && slotData.subject) {
          row.push(`"${slotData.subject} (${slotData.class_name || 'N/A'})"`);
        } else {
          row.push('Free Period');
        }
      });
      csv += row.join(',') + '\n';
    });

    return csv;
  };

  return (
    <div className="font-poppins">
      <SharedHeader />

      <div className="px-10">
        <ViewHeader title="Timetable" />

        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="w-full sm:w-auto" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => loadTeacherTimetable()}
                className="flex items-center gap-1 px-3 py-1.5 bg-main text-white rounded-lg text-[0.8rem] font-medium hover:bg-main/75 w-full sm:w-auto justify-center"
              >
                Refresh
              </button>
              <button
                onClick={() => loadSlotStatuses(teacherTimetableData)}
                disabled={!teacherTimetableData || !teacherTimetableData.found}
                className="flex items-center gap-1 px-3 py-1.5 bg-main text-white rounded-lg text-[0.8rem] font-medium hover:bg-main/75 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
              {teacherTimetableData && teacherTimetableData.found && (
                <button
                  onClick={handleExportTeacherTimetable}
                  className="flex items-center gap-1 px-3 py-1.5 bg-main text-white rounded-lg text-[0.8rem] font-medium hover:bg-main/75 w-full sm:w-auto justify-center"
                >
                  Export
                </button>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mb-4"></div>
                <p className="text-gray-500 text-[0.8rem]">Loading your timetable...</p>
              </div>
            ) : !teacherTimetableData || !teacherTimetableData.found ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No active assignments found</h3>
                <p className="text-gray-500 text-center mb-4 text-[0.8rem]">
                  You don't have any course assignments in active timetables at the moment.
                </p>
                <div className="text-[0.7rem] text-gray-400 bg-gray-50 p-3 rounded-lg max-w-md">
                  <p>This could mean:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>No timetables are currently active</li>
                    <li>You haven't been assigned to any courses</li>
                    <li>Your course assignments are not in active timetables</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-6 bg-gray-50 border-b">
                  <div className="p-2 font-semibold text-gray-700 border-r text-[0.7rem] sticky left-0 bg-gray-50 z-10">Period / Day</div>
                  {days.map((day) => (
                    <div key={day} className="p-2 text-center font-semibold text-gray-700 border-r">
                      <div className="text-[0.7rem]">{day}</div>
                    </div>
                  ))}
                </div>
                <div className="w-full">
                  {periodTimes.map((period, periodIdx) => {
                    const isBreakOrLunch = period.includes("10:10-10:30") || period.includes("12:10-13:10") || period.includes("15:10-15:20");
                    const isLastPeriod = periodIdx === periodTimes.length - 1;
                    return (
                      <div key={periodIdx} className={`grid grid-cols-6 ${!isLastPeriod ? 'border-b' : ''}`}>
                        <div className="p-2 font-semibold text-gray-800 bg-gray-50 border-r flex items-center text-[0.7rem] sticky left-0 z-10">
                          <div className="text-[0.65rem] leading-tight">{period}</div>
                        </div>
                        {days.map((day, dayIdx) => {
                          const daySlots = teacherTimetableData?.actions?.[dayIdx] || [];
                          const slotData = daySlots[periodIdx];
                          return (
                            <div key={dayIdx} className={`p-1 ${dayIdx < days.length - 1 ? 'border-r' : ''}`}>
                              {isBreakOrLunch ? (
                                period.includes("12:10-13:10") ? (
                                  <div className="flex items-center justify-center h-10 text-gray-600 font-semibold text-[0.65rem]">
                                    <span className="text-center">Lunch Break</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-10 text-gray-600 font-semibold text-[0.65rem]">
                                    <span className="text-center">Break time</span>
                                  </div>
                                )
                              ) : slotData && slotData.subject ? (
                                <div className="bg-gray-200 rounded p-1 min-h-[50px] flex flex-col justify-between">
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[0.65rem] font-semibold text-main leading-tight truncate">{slotData.subject}</div>
                                      <div className="text-[0.6rem] text-main leading-tight truncate">{slotData.class_name || 'N/A'}</div>
                                    </div>
                                    <button
                                      onClick={() => handleViewClassDetails(slotData.class_name || 'N/A', slotData.subject, period, day)}
                                      className="text-main hover:text-main-hover p-0.5 rounded flex-shrink-0"
                                      title="View details"
                                    >
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                  {(() => {
                                    const slotKey = `${dayIdx}-${periodIdx}`;
                                    const slotStatus = slotStatuses[slotKey];
                                    if (!slotStatus) {
                                      return (
                                        <button disabled className="w-full bg-gray-400 text-white py-0.5 rounded text-[0.65rem] font-medium cursor-not-allowed">Checking...</button>
                                      );
                                    }
                                    if (slotStatus.canRecord) {
                                      return (
                                        <button
                                          onClick={() => handleRecordAttendance(slotData.class_name || 'N/A', slotData.subject, period, day, slotData.class_id)}
                                          className="w-full bg-main text-white py-0.5 rounded text-[0.65rem] font-medium hover:bg-main/75 transition"
                                          title={slotStatus.message}
                                        >
                                          Record Now
                                        </button>
                                      );
                                    }
                                    if (slotStatus.canView && slotStatus.hasExistingRecord) {
                                      return (
                                        <button
                                          onClick={() => handleRecordAttendance(slotData.class_name || 'N/A', slotData.subject, period, day, slotData.class_id)}
                                          className="w-full bg-main text-white py-0.5 rounded text-[0.65rem] font-medium hover:bg-main/75 transition"
                                          title={slotStatus.message}
                                        >
                                          View Record
                                        </button>
                                      );
                                    }
                                    const category = slotStatus.category || 'UNKNOWN';
                                    const buttonColors: { [key: string]: string } = {
                                      'YET_TO_START': 'bg-gray-500 text-white',
                                      'FUTURE': 'bg-gray-500 text-white',
                                      'PAST_DAY': 'bg-gray-500 text-white',
                                      'MISSED': 'bg-gray-500 text-white',
                                      'ERROR': 'bg-gray-400 text-gray-600',
                                      'UNKNOWN': 'bg-gray-400 text-gray-600'
                                    };
                                    const buttonTexts: { [key: string]: string } = {
                                      'YET_TO_START': 'Upcoming',
                                      'FUTURE': 'Future',
                                      'PAST_DAY': 'Past Day',
                                      'MISSED': 'Missed',
                                      'ERROR': 'Try Again',
                                      'UNKNOWN': 'Check Status'
                                    };
                                    return (
                                      <button
                                        disabled
                                        className={`w-full py-0.5 rounded text-[0.65rem] font-medium cursor-not-allowed ${buttonColors[category] || buttonColors['UNKNOWN']}`}
                                        title={slotStatus.message}
                                      >
                                        {buttonTexts[category] || buttonTexts['UNKNOWN']}
                                      </button>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-10 text-gray-400 font-semibold text-[0.65rem]">
                                  <span className="text-center">Free Period</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <RecordAttendanceModal
          open={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          onRefresh={() => {
            if (teacherTimetableData) {
              loadSlotStatuses(teacherTimetableData);
            }
          }}
          classInfo={selectedClassInfo || undefined}
          viewOnly={attendanceViewOnly}
        />
        <ClassDetailsModal
          open={classDetailsModalOpen}
          onClose={() => setClassDetailsModalOpen(false)}
          classInfo={selectedClassDetails || undefined}
        />
      </div>
    </div>
  );
}

export default TimetableTeacherWidget;