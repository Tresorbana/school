import { useState, useEffect } from "react";
import SharedHeader from "../components/shared/SharedHeader";
import ViewHeader from "../components/shared/ViewHeader";
import { apiClient } from "../utils/apiClient";
import { useToast } from "../utils/context/ToastContext";
import { FiSave, FiList } from "react-icons/fi";

export default function MarksEntry() {
    const { addToast } = useToast();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [academicYear] = useState(new Date().getFullYear());
    const [term, setTerm] = useState(1);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadCourses();
            loadStudents();
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            const response = await apiClient.get("api/classes");
            if (response.success) setClasses(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadCourses = async () => {
        try {
            // For simplicity, loading all courses or we can filter by class
            const response = await apiClient.get("api/courses");
            if (response.success) setCourses(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadStudents = async () => {
        try {
            const response = await apiClient.get(`api/students?class_id=${selectedClass}`);
            if (response.success) {
                setStudents(response.data);
                // Load existing marks if any
                loadExistingMarks();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadExistingMarks = async () => {
        if (!selectedCourse || !selectedClass) return;
        try {
            const response = await apiClient.get(`api/marks/class?class_id=${selectedClass}&academic_year=${academicYear}&term=${term}`);
            if (response.success) {
                const markMap: Record<string, number> = {};
                const commentMap: Record<string, string> = {};
                response.data.forEach((m: any) => {
                    if (m.course_id === selectedCourse) {
                        markMap[m.student_id] = m.score;
                        commentMap[m.student_id] = m.comments || "";
                    }
                });
                setMarks(markMap);
                setComments(commentMap);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!selectedCourse) {
            addToast({ message: "Please select a course", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                academic_year: academicYear,
                term,
                course_id: selectedCourse,
                marks: students.map(s => ({
                    student_id: s.student_id,
                    score: marks[s.student_id] || 0,
                    comments: comments[s.student_id] || ""
                }))
            };

            const response = await apiClient.post("api/marks/bulk", payload);
            if (response.success) {
                addToast({ message: "Marks saved successfully", type: "success" });
            }
        } catch (e: any) {
            addToast({ message: e.message || "Failed to save marks", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-poppins">
            <SharedHeader placeholder="Search marks and students" />
            <div className="m-10">
                <ViewHeader title="Marks Entry" />

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-main focus:border-transparent"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-main focus:border-transparent"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-main focus:border-transparent"
                                value={term}
                                onChange={(e) => setTerm(Number(e.target.value))}
                            >
                                <option value={1}>Term 1</option>
                                <option value={2}>Term 2</option>
                                <option value={3}>Term 3</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleSave}
                                disabled={loading || !selectedClass || !selectedCourse}
                                className="w-full bg-main text-white rounded-lg py-2 px-4 hover:bg-main/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FiSave /> {loading ? "Saving..." : "Save Marks"}
                            </button>
                        </div>
                    </div>
                </div>

                {selectedClass && selectedCourse && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Student Name</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Score</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Comments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map(student => (
                                    <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {student.first_name} {student.last_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-20 border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-main focus:border-main"
                                                value={marks[student.student_id] || ""}
                                                onChange={(e) => setMarks({ ...marks, [student.student_id]: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-main focus:border-main"
                                                placeholder="Optional comment"
                                                value={comments[student.student_id] || ""}
                                                onChange={(e) => setComments({ ...comments, [student.student_id]: e.target.value })}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!selectedClass && (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FiList className="mx-auto text-4xl text-gray-300 mb-4" />
                        <p className="text-gray-500">Select a class and course to start entering marks</p>
                    </div>
                )}
            </div>
        </div>
    );
}
