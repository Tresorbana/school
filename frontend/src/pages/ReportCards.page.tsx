import { useState, useEffect } from "react";
import SharedHeader from "../components/shared/SharedHeader";
import ViewHeader from "../components/shared/ViewHeader";
import { apiClient } from "../utils/apiClient";
import { useToast } from "../utils/context/ToastContext";
import { FiDownload, FiUsers } from "react-icons/fi";
import { jsPDF } from "jspdf";

export default function ReportCards() {
    const { addToast } = useToast();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [academicYear] = useState(new Date().getFullYear());
    const [term, setTerm] = useState(1);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) loadStudents();
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            const response = await apiClient.get("api/classes");
            if (response.success) setClasses(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadStudents = async () => {
        try {
            const response = await apiClient.get(`api/students?class_id=${selectedClass}`);
            if (response.success) setStudents(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    const generatePDF = async (student: any) => {
        try {
            setLoading(true);
            // Fetch marks for this student
            const response = await apiClient.get(`api/marks/student?student_id=${student.student_id}&academic_year=${academicYear}`);

            if (!response.success) throw new Error("Failed to fetch marks");

            const studentMarks = response.data.filter((m: any) => m.term === term);

            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.text("BUILD SCHOOL REPORT CARD", 105, 20, { align: "center" });

            doc.setFontSize(14);
            doc.text(`Academic Year: ${academicYear} | Term: ${term}`, 105, 30, { align: "center" });

            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Student Info
            doc.setFontSize(12);
            doc.text(`Student Name: ${student.first_name} ${student.last_name}`, 20, 45);
            doc.text(`Student ID: ${student.student_id.substring(0, 8)}`, 20, 52);
            doc.text(`Class: ${classes.find(c => c.class_id === selectedClass)?.class_name || "N/A"}`, 20, 59);

            // Marks Table
            let yPos = 75;
            doc.setFont("helvetica", "bold");
            doc.text("Course", 20, yPos);
            doc.text("Score", 120, yPos);
            doc.text("Grade", 150, yPos);
            doc.setFont("helvetica", "normal");

            doc.line(20, yPos + 2, 190, yPos + 2);
            yPos += 10;

            if (studentMarks.length === 0) {
                doc.text("No marks record found for this term.", 20, yPos);
            } else {
                studentMarks.forEach((mark: any) => {
                    doc.text(mark.course?.course_name || "Unknown", 20, yPos);
                    doc.text(mark.score.toString(), 120, yPos);

                    // Basic grading logic
                    let grade = "F";
                    if (mark.score >= 90) grade = "A+";
                    else if (mark.score >= 80) grade = "A";
                    else if (mark.score >= 70) grade = "B";
                    else if (mark.score >= 60) grade = "C";
                    else if (mark.score >= 50) grade = "D";

                    doc.text(grade, 150, yPos);
                    yPos += 10;
                });
            }

            doc.setLineWidth(0.2);
            doc.line(20, yPos, 190, yPos);
            yPos += 15;

            // Footer
            doc.setFontSize(10);
            doc.text("Generated on: " + new Date().toLocaleDateString(), 20, 280);
            doc.text("This is a computer generated document.", 105, 280, { align: "center" });

            doc.save(`${student.first_name}_${student.last_name}_Report_T${term}.pdf`);
            addToast({ message: "PDF Generated Successfully", type: "success" });
        } catch (e: any) {
            addToast({ message: e.message || "Failed to generate PDF", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-poppins">
            <SharedHeader placeholder="Search report cards" />
            <div className="m-10">
                <ViewHeader title="Report Card Generation" />

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>
                </div>

                {selectedClass && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(student => (
                            <div key={student.student_id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-main/10 rounded-full flex items-center justify-center text-main text-2xl mb-4">
                                    <FiUsers />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-lg">{student.first_name} {student.last_name}</h3>
                                <p className="text-gray-500 text-sm mb-6">ID: {student.student_id.substring(0, 8)}</p>
                                <button
                                    onClick={() => generatePDF(student)}
                                    disabled={loading}
                                    className="w-full bg-main text-white py-2 rounded-lg hover:bg-main/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiDownload /> {loading ? "Processing..." : "Download Report"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!selectedClass && (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FiDownload className="mx-auto text-4xl text-gray-300 mb-4" />
                        <p className="text-gray-500">Select a class to generate report cards for students</p>
                    </div>
                )}
            </div>
        </div>
    );
}
