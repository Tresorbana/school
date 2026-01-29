import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { intakeService, studentService, type Intake } from "../../../services/academicService";
import ModalWrapper from "../../shared/ModalWrapper";
import { useToast } from "../../../utils/context/ToastContext";

interface UpdateIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  intake: Intake | null;
  onSuccess?: () => void;
}

function UpdateIntakeModal({ isOpen, onClose, intake, onSuccess }: UpdateIntakeModalProps) {
  const [formData, setFormData] = useState({
    intake_name: "",
    current_year_level: 1,
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Array<{
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
  }>>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (intake) {
      setFormData({
        intake_name: intake.intake_name,
        current_year_level: intake.current_year_level,
      });
    }
  }, [intake]);

  if (!isOpen || !intake) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "current_year_level" ? parseInt(value) : value,
    }));
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setParsedStudents([]);
      setImportError(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setImportError('Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!rows.length) {
        setImportError("CSV file is empty.");
        setSelectedFile(null);
        return;
      }

      const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());
      const requiredHeaders = ["first_name", "last_name", "email", "gender"];
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

      if (missingHeaders.length) {
        setImportError(`Missing required columns: ${missingHeaders.join(", ")}`);
        setSelectedFile(null);
        setParsedStudents([]);
        return;
      }

      const dataRows = rows.slice(1);
      const students = dataRows.map((row, index) => {
        const values = row.split(",").map((value) => value.trim());
        return {
          first_name: values[headers.indexOf("first_name")] || "",
          last_name: values[headers.indexOf("last_name")] || "",
          email: values[headers.indexOf("email")] || "",
          gender: values[headers.indexOf("gender")] || "",
          row: index + 2
        };
      });

      const rowErrors: string[] = [];
      const emailSet = new Set<string>();

      students.forEach((student) => {
        if (!student.first_name || !student.last_name || !student.email || !student.gender) {
          rowErrors.push(`Row ${student.row}: missing required fields`);
        }

        const emailKey = student.email.toLowerCase();
        if (emailKey) {
          if (emailSet.has(emailKey)) {
            rowErrors.push(`Row ${student.row}: duplicate email ${student.email}`);
          }
          emailSet.add(emailKey);
        }
      });

      if (rowErrors.length) {
        setImportError(rowErrors.join(" | "));
        setSelectedFile(null);
        setParsedStudents([]);
        return;
      }

      setImportError(null);
      setSelectedFile(file);
      setParsedStudents(students.map(({ row, ...student }) => student));
    };

    reader.onerror = () => {
      setImportError("Failed to read CSV file.");
      setSelectedFile(null);
      setParsedStudents([]);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileSelection(e.dataTransfer.files?.[0] ?? null);
  };

  const handleExportTemplate = () => {
    const csvContent = "first_name,last_name,email,gender\nJane,Doe,jane.doe@example.com,female\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "intake_students_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.intake_name.trim()) {
      addToast({ message: "Please enter intake name", type: "error" });
      return;
    }

    const namePattern = /^(\d{4})-(\d{4})$/;
    const match = formData.intake_name.match(namePattern);
    if (!match) {
      addToast({ message: "Intake name must be in format YYYY-YYYY (e.g., 2024-2025)", type: "error" });
      return;
    }

    const firstYear = parseInt(match[1]);
    const secondYear = parseInt(match[2]);
    if (secondYear !== firstYear + 1) {
      addToast({ message: "Second year must be exactly one year after the first year", type: "error" });
      return;
    }

    setLoading(true);
    try {
      if (selectedFile && parsedStudents.length === 0) {
        addToast({ message: "Please fix the CSV import errors before submitting.", type: "error" });
        return;
      }

      let createdStudentIds: string[] = [];
      if (parsedStudents.length > 0) {
        const createStudentsResponse = await studentService.bulkCreate(parsedStudents);
        if (!createStudentsResponse.success) {
          setImportError(createStudentsResponse.message || 'Failed to create students');
          return;
        }
        createdStudentIds = createStudentsResponse.data?.student_ids || [];
      }

      const response = await intakeService.updateIntake(intake.intake_id, {
        intake_name: formData.intake_name.trim(),
        current_year_level: formData.current_year_level,
      });

      if (response.success) {
        if (createdStudentIds.length > 0) {
          const assignResponse = await studentService.bulkAssignToIntake(createdStudentIds, intake.intake_id);
          if (!assignResponse.success) {
            setImportError(assignResponse.message || 'Failed to assign students to intake');
            return;
          }
        }
        addToast({ message: response.message || "Intake updated successfully", type: "success" });
        setSelectedFile(null);
        setParsedStudents([]);
        setImportError(null);
        setIsImportOpen(false);
        onSuccess?.();
      } else {
        addToast({ message: response.message || "Failed to update intake", type: "error" });
      }
    } catch (error: any) {
      addToast({ message: "Failed to update intake: " + error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} className="w-full max-w-md max-h-[90vh]">
      <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-4 py-2 border-b sticky top-0 bg-white">
          <h2 className="text-xs font-semibold">Update intake</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-slate-400/30 rounded-full p-2">
            <IoClose size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-3">
            <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
              Intake name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="intake_name"
              value={formData.intake_name}
              onChange={handleInputChange}
              placeholder="e.g., 2024-2025"
              className="w-full px-2 py-1 text-[0.65rem] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (academic year, e.g., 2024-2025)</p>
          </div>

          <div className="mb-4">
            <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
              Current year level <span className="text-red-500">*</span>
            </label>
            <select
              name="current_year_level"
              value={formData.current_year_level}
              onChange={handleInputChange}
              className="w-full px-2 py-1 text-[0.65rem] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
            </select>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-main text-white px-5 py-1.5 rounded text-[0.65rem] font-medium hover:bg-main-hover disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update intake"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 px-5 py-1.5 rounded text-[0.65rem] font-medium hover:bg-gray-50"
            >
              cancel
            </button>
          </div>
        </form>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsImportOpen((prev) => !prev)}
              className="text-[0.65rem] font-medium text-main hover:text-main-hover"
            >
              {isImportOpen ? 'Hide import students' : 'Import students'}
            </button>
            <button
              type="button"
              onClick={handleExportTemplate}
              className="text-[0.65rem] font-medium text-gray-600 hover:text-gray-800"
            >
              Export CSV template
            </button>
          </div>

          {isImportOpen && (
            <div className="mt-3">
              <label className="block text-[0.65rem] font-medium text-gray-700 mb-2">
                Upload CSV (first_name, last_name, email, gender)
              </label>
              <div
                className={`border border-dashed rounded-lg p-4 text-center text-[0.65rem] transition-colors ${
                  isDragActive ? 'border-main bg-main/5' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('update-intake-csv-input')?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    document.getElementById('update-intake-csv-input')?.click();
                  }
                }}
              >
                <input
                  id="update-intake-csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-gray-600">
                  Drag & drop CSV here or click to browse
                </p>
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-gray-800">
                    <span>Selected: {selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setParsedStudents([]);
                        setImportError(null);
                      }}
                      className="text-[0.6rem] text-gray-600 hover:text-gray-800 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              {importError && <div className="mt-2 text-[0.65rem] text-red-600">{importError}</div>}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

export default UpdateIntakeModal;
