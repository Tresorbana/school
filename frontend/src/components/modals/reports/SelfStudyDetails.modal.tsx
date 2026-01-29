import { useEffect, useMemo, useState } from "react";
import { HiX, HiDownload } from "react-icons/hi";
import { attendanceService, type SelfStudyAttendanceSession, type SelfStudyStudent } from "../../../services/attendanceService";
import { exportToCSV, generateFilename } from "../../../utils/fileExportManager";

interface SelfStudyDetailsModalProps {
  open: boolean;
  onClose: () => void;
  studyData?: SelfStudyAttendanceSession;
}

function SelfStudyDetailsModal({ open, onClose, studyData }: SelfStudyDetailsModalProps) {
  const [students, setStudents] = useState<SelfStudyStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!open || !studyData?.class_id || !studyData?.self_study_attendance_id) return;

      setLoading(true);
      setError(null);
      try {
        const res = await attendanceService.getSelfStudyClassStudents(
          studyData.class_id,
          studyData.self_study_attendance_id
        );

        if (!res.success || !res.data) {
          throw new Error(res.message || "Failed to load students");
        }

        setStudents(res.data);
      } catch (e) {
        setStudents([]);
        setError(e instanceof Error ? e.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [open, studyData?.class_id, studyData?.self_study_attendance_id]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => (
      s.student_name.toLowerCase().includes(q) ||
      s.student_email.toLowerCase().includes(q) ||
      s.student_id.toString().includes(q)
    ));
  }, [students, search]);

  const handleExportToCSV = () => {
    if (!studyData) return;

    const exportData = filteredStudents.map((s) => ({
      "Period": studyData.period_display,
      "Class": studyData.class_name,
      "Created By": studyData.created_by_name,
      "Attendance Date": studyData.attendance_date,
      "Status": studyData.status,
      "Student Name": s.student_name,
      "Student Email": s.student_email,
      "Student ID": s.student_id,
      "Attendance": s.status,
      "Notes": s.notes ?? ""
    }));

    const filename = generateFilename(`self-study-attendance-${studyData.class_name}-${studyData.created_by_name}`, studyData.attendance_date);
    exportToCSV(exportData, filename);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {studyData?.period_display || "Self Study"} attendance
          </h2>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Search and Controls */}
          <div className="mb-4">
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="search users"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
                />
              </div>
              <button
                onClick={handleExportToCSV}
                disabled={!studyData || filteredStudents.length === 0}
                className="bg-main text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiDownload className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-gray-600">Loading...</div>
            ) : error ? (
              <div className="px-4 py-10 text-center text-sm text-red-600">{error}</div>
            ) : filteredStudents.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-600">No student records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-main text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Student</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Attendance</th>
                    <th className="px-4 py-3 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{s.student_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.student_email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            s.status === "present"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelfStudyDetailsModal;