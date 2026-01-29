import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useToast } from "../../../utils/context/ToastContext";
import { getAuthHeaders } from "../../../utils/auth";
import ModalWrapper from "../../shared/ModalWrapper";
import SearchableSelect from "../../shared/SearchableSelect";
import { API_BASE_URL } from "../../../utils/apiClient";

interface RecordHealthStatusModalProps {
  open: boolean;
  onClose: () => void;
  onHealthRecorded: () => void;
}

interface HealthData {
  studentId: string;
  illness: string;
  notes: string;
  isSick: boolean;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name?: string;
}

interface StudentOption {
  value: string;
  label: string;
  subtitle?: string;
}

const RecordHealthStatusModal: React.FC<RecordHealthStatusModalProps> = ({
  open,
  onClose,
  onHealthRecorded
}) => {
  const [formData, setFormData] = useState<HealthData>({
    studentId: "",
    illness: "",
    notes: "",
    isSick: true // Always true since this modal is for recording sick students
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { addToast } = useToast();

  // Load students when modal opens
  useEffect(() => {
    if (open) {
      loadStudents();
    }
  }, [open]);

  // Convert students to options for SearchableSelect
  useEffect(() => {
    const options = students.map(student => ({
      value: student.student_id,
      label: `${student.first_name} ${student.last_name}`,
      subtitle: student.class_name ? `${student.email} • ${student.class_name}` : student.email
    }));
    setStudentOptions(options);
  }, [students]);

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/students?limit=100`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Only show students who are assigned to classes
          const studentsWithClasses = (data.data || []).filter((student: Student) => student.class_name);
          setStudents(studentsWithClasses);
        }
      } else {
        throw new Error(`Failed to load students: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      addToast({
        message: 'Failed to load students. Please try again.',
        type: 'error'
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleInputChange = (field: keyof HealthData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentSelect = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentId: studentId
    }));
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.illness.trim()) {
      addToast({
        message: 'Please select a student and specify the illness',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/record-sick`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: formData.studentId,
          illness: formData.illness,
          notes: formData.notes,
          is_sick: formData.isSick
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status} ${response.statusText}`);
      }
      
      if (data.success) {
        const selectedStudent = students.find(s => s.student_id === formData.studentId);
        const studentName = selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Student';
        
        addToast({
          message: `Health status recorded successfully for ${studentName}`,
          type: 'success'
        });
        onHealthRecorded();
        handleCancel();
      } else {
        throw new Error(data.message || 'Failed to record health status');
      }
    } catch (error) {
      console.error('Error recording health status:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to record health status',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      studentId: "",
      illness: "",
      notes: "",
      isSick: true // Always true for this modal
    });
    onClose();
  };

  if (!open) return null;

  return (
    <ModalWrapper isOpen={open} onClose={onClose} className="w-full max-w-3xl min-w-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-md font-semibold text-gray-800">
          Record Health Status
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded hover:bg-gray-100"
        >
          <IoClose className="text-lg text-gray-500" />
        </button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        {/* Student Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Student
          </label>
          <SearchableSelect
            options={studentOptions}
            placeholder="Select a student"
            onSelect={handleStudentSelect}
            loading={studentsLoading}
            className="w-full"
          />
        </div>

        {/* Illness/Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Illness/Condition
          </label>
          <input
            type="text"
            value={formData.illness}
            onChange={(e) => handleInputChange("illness", e.target.value)}
            placeholder="e.g., Fever, Headache, Stomach ache..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div className="pt-5 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Additional notes about the student's condition..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.studentId || !formData.illness.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-main rounded-md hover:bg-main/90 focus:outline-none focus:ring-1 focus:ring-main focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recording...' : 'Record Health Status'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default RecordHealthStatusModal;