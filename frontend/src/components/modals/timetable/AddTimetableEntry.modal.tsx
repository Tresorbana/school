import React, { useState } from 'react';

interface TimetableEntry {
  period: string;
  subjects: Array<{
    subject: string;
    teacher: string;
  }>;
}

interface AddTimetableEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimetableEntry) => void;
}

const AddTimetableEntryModal: React.FC<AddTimetableEntryModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [period, setPeriod] = useState('');
  const [subjects, setSubjects] = useState([
    { subject: '', teacher: '' },
    { subject: '', teacher: '' },
    { subject: '', teacher: '' },
    { subject: '', teacher: '' },
    { subject: '', teacher: '' }
  ]);

  const handleSubjectChange = (index: number, field: 'subject' | 'teacher', value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    setSubjects(updatedSubjects);
  };

  const handleSave = () => {
    if (period.trim() === '') {
      alert('Please enter a period');
      return;
    }

    // Check if at least one subject is filled
    const hasValidSubject = subjects.some(subject =>
      subject.subject.trim() !== '' || subject.teacher.trim() !== ''
    );

    if (!hasValidSubject) {
      alert('Please enter at least one subject');
      return;
    }

    const newEntry: TimetableEntry = {
      period,
      subjects: subjects.map(subject => ({
        subject: subject.subject.trim() === '' ? '+ Add class' : subject.subject,
        teacher: subject.teacher
      }))
    };

    onSave(newEntry);
    handleClose();
  };

  const handleClose = () => {
    setPeriod('');
    setSubjects([
      { subject: '', teacher: '' },
      { subject: '', teacher: '' },
      { subject: '', teacher: '' },
      { subject: '', teacher: '' },
      { subject: '', teacher: '' }
    ]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-main">Add New Timetable Entry</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Period Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g., 08:30 - 10:10 am"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
            />
          </div>

          {/* Subjects for each day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects (Monday to Friday)
            </label>
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                <div key={day} className="flex gap-3 items-center">
                  <span className="w-20 text-sm font-medium text-gray-600">{day}:</span>
                  <input
                    type="text"
                    value={subjects[index].subject}
                    onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                    placeholder="Subject name"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
                  />
                  <input
                    type="text"
                    value={subjects[index].teacher}
                    onChange={(e) => handleSubjectChange(index, 'teacher', e.target.value)}
                    placeholder="Teacher"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90 transition"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTimetableEntryModal;
