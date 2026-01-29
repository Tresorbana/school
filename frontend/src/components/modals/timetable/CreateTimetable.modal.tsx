import React, { useState, useEffect } from 'react';
import { classService, type Class } from '../../../services/academicService';
import { useToast } from '../../../utils/context/ToastContext';
import { isValidAcademicYear } from '../../../utils/timetable.helper';

type TimetableMode = 'single' | 'all_classes';

interface TimetableDetails {
  mode: TimetableMode;
  classroom?: string;
  term: number;
  year: string;
}

interface CreateTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: TimetableDetails) => void;
}

const CreateTimetableModal: React.FC<CreateTimetableModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [mode, setMode] = useState<TimetableMode | null>(null);
  const [classroom, setClassroom] = useState('');
  const [term, setTerm] = useState<number>(1);
  const [year, setYear] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getClasses();
      if ('data' in response && response.success) {
        setClasses(response.data);
      }
    } catch (err) {
      addToast({
        message: 'Failed to load classes',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!mode) {
      addToast({
        message: 'Please select how to create the timetable',
        type: 'warning'
      });
      return;
    }

    if (mode === 'single' && classroom.trim() === '') {
      addToast({
        message: 'Please select a class',
        type: 'warning'
      });
      return;
    }

    if (year.trim() === '') {
      addToast({
        message: 'Please enter an academic year',
        type: 'warning'
      });
      return;
    }

    if (!isValidAcademicYear(year)) {
      addToast({
        message: 'Academic year must be in YYYY-YYYY format with consecutive years (e.g., 2025-2026)',
        type: 'warning'
      });
      return;
    }

    const newTimetable: TimetableDetails = {
      mode,
      classroom: mode === 'single' ? classroom.trim() : undefined,
      term,
      year: year.trim()
    };

    onSave(newTimetable);
    handleClose();
  };

  const handleClose = () => {
    setMode(null);
    setClassroom('');
    setTerm(1);
    setYear('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold text-main">Create New Timetable</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
              Create For
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[.8rem] text-gray-700">
                <input
                  type="radio"
                  name="timetable-mode"
                  value="single"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                />
                One class
              </label>
              <label className="flex items-center gap-2 text-[.8rem] text-gray-700">
                <input
                  type="radio"
                  name="timetable-mode"
                  value="all_classes"
                  checked={mode === 'all_classes'}
                  onChange={() => setMode('all_classes')}
                />
                All classes
              </label>
            </div>
          </div>

          {mode === 'single' ? (
            <div>
              <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
                Class
              </label>
              {loading ? (
                <div className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-[.8rem] text-gray-500">
                  Loading classes...
                </div>
              ) : (
                <select
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main text-[.8rem]"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id} className='text-[.8rem]'>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          {/* Term Selection */}
          <div>
            <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main text-[.8rem]"
            >
              <option value={1} className='text-[.8rem]'>Term 1</option>
              <option value={2} className='text-[.8rem]'>Term 2</option>
              <option value={3} className='text-[.8rem]'>Term 3</option>
            </select>
          </div>

          {/* Year Input */}
          <div>
            <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2025-2026"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main text-[.8rem]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-[.8rem]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/90 transition text-[.8rem]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTimetableModal;
