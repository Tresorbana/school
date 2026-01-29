import { useEffect, useRef, useState } from "react";
import { HiPlus } from "react-icons/hi";
import { FiDelete, FiEdit2 } from "react-icons/fi";

import ViewHeader from "../../shared/ViewHeader";
import CreateTimetableModal from "../../modals/timetable/CreateTimetable.modal";
import ConfirmDeleteTimetableModal from "../../modals/timetable/ConfirmDeleteTimetable.modal";

import EditSubjectModal from "../../modals/academic/EditSubject.modal";
import DeleteSubjectConfirmModal from "../../modals/timetable/DeleteSubjectConfirm.modal";
import Role from "../../../utils/constants";
import { useToast } from "../../../utils/context/ToastContext";
import { useAuth } from "../../../utils/context/AuthContext";
import { classService, type Class } from "../../../services/academicService";
import { timetableService } from "../../../services/timetableService";
import SharedHeader from "../../shared/SharedHeader";
import {
  buildDraftTimetable,
  days,
  generateTimetableCSV,
  getReservedLabel,
  isReservedPeriod,
  periodTimes
} from "../../../utils/timetable.helper";

type TimetableMode = 'single' | 'all_classes';

interface CreateTimetableDetails {
  mode: TimetableMode;
  classroom?: string;
  term: number;
  year: string;
}

function TimetableAdminWidget() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === Role.ADMIN;

  const [selectedTimetableData, setSelectedTimetableData] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTerm, setBulkTerm] = useState<number>(1);
  const [bulkYear, setBulkYear] = useState<string>("");
  const [bulkClasses, setBulkClasses] = useState<Class[]>([]);
  const [bulkActiveClassId, setBulkActiveClassId] = useState<string>("");
  const [bulkTimetables, setBulkTimetables] = useState<Record<string, any>>({});

  const [showActions, setShowActions] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const headerActionsPanelRef = useRef<HTMLDivElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null);
  const bulkActionsPanelRef = useRef<HTMLDivElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCell, setEditCell] = useState<{ periodIdx: number; dayIdx: number } | null>(null);
  const [initialSubject, setInitialSubject] = useState("");
  const [periodType, setPeriodType] = useState<'lesson' | 'break' | 'lunch'>('lesson');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCell, setDeleteCell] = useState<{ periodIdx: number; dayIdx: number } | null>(null);
  const [deleteTimetableOpen, setDeleteTimetableOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    loadClasses();
    loadRandomActiveTimetable();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !classes.length) return;

    if (bulkMode) return;
    if (selectedClass && selectedTerm) {
      loadAcademicYearsForSelection();
    } else {
      setAvailableYears([]);
      setSelectedYear("");
    }
  }, [isAdmin, selectedClass, selectedTerm]);

  useEffect(() => {
    if (isAdmin && selectedClass && selectedTerm && selectedYear) {
      loadTimetableForClass();
    } else if (isAdmin) {
      setSelectedTimetableData(null);
    }
  }, [isAdmin, selectedClass, selectedTerm, selectedYear]);

  useEffect(() => {
    if (!bulkMode || !bulkActiveClassId || !bulkYear || !bulkTerm) return;
    if (bulkTimetables[bulkActiveClassId]) return;
    loadBulkTimetable(bulkActiveClassId);
  }, [bulkMode, bulkActiveClassId, bulkYear, bulkTerm, bulkTimetables]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedHeader = headerActionsRef.current?.contains(target);
      const clickedHeaderPanel = headerActionsPanelRef.current?.contains(target);
      const clickedBulk = bulkActionsRef.current?.contains(target);
      const clickedBulkPanel = bulkActionsPanelRef.current?.contains(target);
      if (!clickedHeader && !clickedHeaderPanel && !clickedBulk && !clickedBulkPanel) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      if ('data' in response && response.success) {
        setClasses(response.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadRandomActiveTimetable = async () => {
    try {
      const response = await timetableService.getRandomActiveTimetable();
      if (response.success && response.data) {
        setSelectedClass(response.data.class_id || "");
        setSelectedTerm(response.data.term ? String(response.data.term) : "");
        setSelectedYear(response.data.academic_year || "");
      } else if (!response.success && response.message) {
        addToast({
          message: response.message,
          type: 'warning'
        });
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load random active timetable',
        type: 'warning'
      });
    }
  };

  const loadAcademicYearsForSelection = async () => {
    try {
      const response = await timetableService.getAcademicYearsForClassTerm(selectedClass, parseInt(selectedTerm));
      if (response.success) {
        setAvailableYears(response.data || []);
        if (selectedYear && !response.data.includes(selectedYear)) {
          setSelectedYear("");
        }
      }
    } catch (err) {
      setAvailableYears([]);
    }
  };

  const loadTimetableForClass = async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) return;
    try {
      setLoading(true);
      const response = await timetableService.getClassTimetableByYearAndTerm(
        selectedClass,
        selectedYear,
        parseInt(selectedTerm)
      );
      if (response.success) {
        setSelectedTimetableData(response.data);
      } else {
        setSelectedTimetableData(null);
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load timetable',
        type: 'error'
      });
      setSelectedTimetableData(null);
    } finally {
      setLoading(false);
      setDeleteTimetableOpen(false);
    }
  };

  const loadBulkTimetable = async (classId: string) => {
    if (!bulkYear || !bulkTerm) return;
    try {
      setLoading(true);
      const response = await timetableService.getClassTimetableByYearAndTerm(
        classId,
        bulkYear,
        bulkTerm
      );
      if (response.success) {
        setBulkTimetables((prev) => ({ ...prev, [classId]: response.data }));
      } else {
        setBulkTimetables((prev) => ({ ...prev, [classId]: null }));
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load timetable',
        type: 'error'
      });
      setBulkTimetables((prev) => ({ ...prev, [classId]: null }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateTimetableSave = async (details: CreateTimetableDetails) => {
    if (details.mode === 'all_classes') {
      if (!classes.length) {
        addToast({ message: 'No classes found in the system', type: 'warning' });
        return;
      }

      setBulkMode(true);
      setBulkTerm(details.term);
      setBulkYear(details.year);
      setBulkClasses(classes);
      setBulkActiveClassId(classes[0].class_id);
      setBulkTimetables({});
      setSelectedClass("");
      setSelectedTerm("");
      setSelectedYear("");
      setIsCreateModalOpen(false);
      return;
    }

    if (!details.classroom) return;

    try {
      setLoading(true);
      const response = await timetableService.createTimetable({
        academic_year: details.year,
        class_id: details.classroom,
        term: details.term
      });

      if (response.success) {
        setBulkMode(false);
        setSelectedClass(details.classroom);
        setSelectedTerm(details.term.toString());
        setSelectedYear(details.year);

        const timetableResponse = await timetableService.getClassTimetableByYearAndTerm(
          details.classroom,
          details.year,
          details.term
        );
        if (timetableResponse.success) {
          setSelectedTimetableData(timetableResponse.data);
        }

        setIsCreateModalOpen(false);
        addToast({ message: 'Timetable created successfully!', type: 'success' });
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to create timetable',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActiveTimetable = async () => {
    if (!bulkMode || !bulkYear || !bulkTerm || !bulkActiveClassId) return;

    try {
      setLoading(true);
      const existing = bulkTimetables[bulkActiveClassId];
      if (existing?.found) {
        addToast({ message: 'Timetable already exists for this class', type: 'info' });
        return;
      }

      await timetableService.createTimetable({
        academic_year: bulkYear,
        class_id: bulkActiveClassId,
        term: bulkTerm
      });

      const refreshed = await timetableService.getClassTimetableByYearAndTerm(
        bulkActiveClassId,
        bulkYear,
        bulkTerm
      );
      if (refreshed.success) {
        setBulkTimetables((prev) => ({ ...prev, [bulkActiveClassId]: refreshed.data }));
      }

      addToast({ message: 'Timetable saved successfully!', type: 'success' });
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to save timetable',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDraftTimetable = () => {
    if (!bulkMode || !bulkActiveClassId) return;
    setBulkTimetables((prev) => ({ ...prev, [bulkActiveClassId]: null }));
    addToast({ message: 'Draft timetable reset to blank.', type: 'success' });
  };

  const handleEditCell = (periodIdx: number, dayIdx: number, cell: any) => {
    if (isReservedPeriod(periodIdx)) return;
    if (!cell?.slot_id) {
      addToast({
        message: bulkMode ? 'Save bulk timetables first to generate slots.' : 'Unable to find slot information',
        type: 'warning'
      });

      return;
    }
    let nextPeriodType: 'lesson' | 'break' | 'lunch' = 'lesson';

    if (periodIdx === 2 || periodIdx === 8) {
      nextPeriodType = 'break';
    } else if (periodIdx === 5) {
      nextPeriodType = 'lunch';
    }

    setEditCell({ periodIdx, dayIdx });
    setInitialSubject(cell.subject || '');
    setPeriodType(nextPeriodType);
    setModalOpen(true);
  };

  const handleSave = async ({ assignment_id }: { assignment_id: string; course_name: string }) => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    const activeClassId = bulkMode ? bulkActiveClassId : selectedClass;

    if (editCell && activeTimetable && activeClassId) {
      try {
        if (!assignment_id || !/^[0-9a-fA-F-]{36}$/.test(assignment_id)) {
          addToast({
            message: 'Invalid course assignment selected. Please refresh and try again.',
            type: 'error'
          });
          return;
        }
        const daySlots = activeTimetable?.actions?.[editCell.dayIdx];
        const slot = daySlots?.[editCell.periodIdx];

        if (slot && slot.slot_id) {
          if (!/^[0-9a-fA-F-]{36}$/.test(slot.slot_id)) {
            addToast({
              message: 'Invalid slot ID. Please refresh and try again.',
              type: 'error'
            });
            return;
          }
          await timetableService.assignSlot({
            slot_id: slot.slot_id,
            assignment_id
          });

          if (bulkMode) {
            await loadBulkTimetable(activeClassId);
          } else {
            await loadTimetableForClass();
          }
          addToast({ message: 'Course assigned successfully!', type: 'success' });
        } else {
          addToast({
            message: bulkMode ? 'Save bulk timetables first to generate slots.' : 'Unable to find slot information',
            type: 'warning'
          });
        }
      } catch (err) {
        addToast({ message: err instanceof Error ? err.message : 'Failed to update slot', type: 'error' });
      }
    }

    setModalOpen(false);
    setEditCell(null);
  };

  const handleDeleteCell = (periodIdx: number, dayIdx: number) => {
    setDeleteCell({ periodIdx, dayIdx });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    const activeClassId = bulkMode ? bulkActiveClassId : selectedClass;

    if (deleteCell && activeTimetable && activeClassId) {
      try {
        const daySlots = activeTimetable?.actions?.[deleteCell.dayIdx];
        const slot = daySlots?.[deleteCell.periodIdx];

        if (slot && slot.slot_id && slot.assignment_id) {
          await timetableService.unassignSlot(slot.slot_id);
          if (bulkMode) {
            await loadBulkTimetable(activeClassId);
          } else {
            await loadTimetableForClass();
          }
          addToast({ message: 'Course removed successfully!', type: 'success' });
        } else {
          addToast({
            message: bulkMode ? 'Save bulk timetables first to generate slots.' : 'No assignment to remove or unable to find slot information',
            type: 'warning'
          });
        }
      } catch (err) {
        addToast({ message: err instanceof Error ? err.message : 'Failed to delete assignment', type: 'error', duration: 10000 });
      }
    }
    setDeleteModalOpen(false);
    setDeleteCell(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteCell(null);
  };

  const handleActivateTimetable = async () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    if (!activeTimetable?.details?.timetable_id) return;
    try {
      setLoading(true);
      await timetableService.activateTimetable(activeTimetable.details.timetable_id);
      if (bulkMode) {
        await loadBulkTimetable(bulkActiveClassId);
      } else {
        await loadTimetableForClass();
      }
      addToast({ message: 'Timetable activated successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to activate timetable', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTimetable = async () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    if (!activeTimetable?.details?.timetable_id) return;
    try {
      setLoading(true);
      await timetableService.deactivateTimetable(activeTimetable.details.timetable_id);
      if (bulkMode) {
        await loadBulkTimetable(bulkActiveClassId);
      } else {
        await loadTimetableForClass();
      }
      addToast({ message: 'Timetable deactivated successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to deactivate timetable', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetTimetable = async () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    if (!activeTimetable?.details?.timetable_id) return;
    if (!confirm('Are you sure you want to reset this timetable? This will remove all assigned subjects and cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await timetableService.resetTimetable(activeTimetable.details.timetable_id);
      if (bulkMode) {
        await loadBulkTimetable(bulkActiveClassId);
      } else {
        await loadTimetableForClass();
      }
      addToast({ message: 'Timetable reset successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to reset timetable', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    if (!activeTimetable?.details?.timetable_id) return;
    try {
      setLoading(true);
      await timetableService.deleteTimetable(activeTimetable.details.timetable_id);

      if (bulkMode) {
        setBulkTimetables((prev) => ({ ...prev, [bulkActiveClassId]: null }));
      } else {
        setSelectedTimetableData(null);
        setSelectedClass('');
        setSelectedTerm('');
        setSelectedYear('');
      }
      addToast({ message: 'Timetable deleted successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Failed to delete timetable', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = classes.map(c => ({ id: c.class_id, name: c.class_name }));
  const availableTerms = ['1', '2', '3'];

  const handleExportTimetable = () => {
    const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
    const activeClassId = bulkMode ? bulkActiveClassId : selectedClass;
    const termValue = bulkMode ? bulkTerm.toString() : selectedTerm;
    const yearValue = bulkMode ? bulkYear : selectedYear;

    if (!activeTimetable || !activeTimetable.found) return;
    try {
      const className = availableClasses.find(c => c.id === activeClassId)?.name || 'Unknown';
      const csvContent = generateTimetableCSV(activeTimetable, className, termValue, yearValue);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const filename = `timetable_${className}_Term${termValue}_${yearValue}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({ message: 'Timetable exported successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: 'Failed to export timetable', type: 'error' });
    }
  };

  const availableYearsSorted = [...availableYears].sort();
  const activeTimetable = bulkMode ? bulkTimetables[bulkActiveClassId] : selectedTimetableData;
  const activeClassId = bulkMode ? bulkActiveClassId : selectedClass;
  const activeTerm = bulkMode ? bulkTerm.toString() : selectedTerm;
  const activeYear = bulkMode ? bulkYear : selectedYear;
  const draftTimetable = bulkMode && !activeTimetable?.found
    ? buildDraftTimetable(activeClassId)
    : null;
  const displayTimetable = draftTimetable || activeTimetable;
  const isDraftTimetable = bulkMode && !activeTimetable?.details?.timetable_id;

  return (
    <div className="font-poppins">
      <SharedHeader/>

      <div className="px-10">
        <ViewHeader title="Timetable" />

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select
                    className="custom-select text-[0.8rem] px-3 py-1.5 w-full sm:w-auto"
                    value={selectedClass}
                    onChange={(e) => {
                      setBulkMode(false);
                      setSelectedClass(e.target.value);
                      setSelectedTerm("");
                      setSelectedYear("");
                    }}
                    disabled={bulkMode}
                  >
                    <option value="">Class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <select
                    className="custom-select text-[0.8rem] px-3 py-1.5 w-full sm:w-auto"
                    value={selectedTerm}
                    onChange={(e) => {
                      setBulkMode(false);
                      setSelectedTerm(e.target.value);
                      setSelectedYear("");
                    }}
                    disabled={bulkMode}
                  >
                    <option value="">Term</option>
                    {availableTerms.map((term) => (
                      <option key={term} value={term}>Term {term}</option>
                    ))}
                  </select>
                  <select
                    className="custom-select text-[0.8rem] px-3 py-1.5 w-full sm:w-auto"
                    value={selectedYear}
                    onChange={(e) => {
                      setBulkMode(false);
                      setSelectedYear(e.target.value);
                    }}
                    disabled={bulkMode}
                  >
                    <option value="">Year</option>
                    {availableYearsSorted.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto" ref={headerActionsRef}>
              {!bulkMode && (selectedTimetableData && selectedTimetableData.found) ? (
                <button
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                  onClick={() => setShowActions((prev) => !prev)}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <span className="text-[0.8rem]">Actions</span>
                  <svg className={`w-3 h-3 transition-transform ${showActions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : null}

              <button
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg shadow-md hover:bg-main/90 active:bg-main/80 transition text-[0.8rem] w-full sm:w-auto"
                onClick={handleCreateTimetable}
              >
                <HiPlus size={14} /> <span className="text-[0.8rem]">Add timetable</span>
              </button>
            </div>
          </div>
        </div>

        {displayTimetable && displayTimetable.found && (
          <div className="w-full mb-4">
            <div className="w-full p-3 bg-white border-t border-b">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${displayTimetable.details.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-[0.8rem] font-medium">
                      {displayTimetable.details.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {displayTimetable.details.is_active && (
                      <span className="text-[0.7rem] text-gray-500">
                        (Read-only)
                      </span>
                    )}
                  </div>
                  <span className="text-[0.7rem] text-gray-500">
                    {availableClasses.find(c => c.id === activeClassId)?.name} • Term {activeTerm} • {activeYear}
                  </span>
                </div>
              </div>
            </div>
            {showActions && !bulkMode && (
              <div className="w-full bg-gray-50 border-b" ref={headerActionsPanelRef}>
                <div className="max-w-7xl mx-auto px-6 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                      onClick={displayTimetable.details.is_active ? handleDeactivateTimetable : handleActivateTimetable}
                      disabled={loading}
                    >
                      {displayTimetable.details.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {!displayTimetable.details.is_active && (
                      <button
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                        onClick={handleResetTimetable}
                        disabled={loading}
                      >
                        Reset
                      </button>
                    )}
                    {!displayTimetable.details.is_active && (
                      <button
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                        onClick={() => setDeleteTimetableOpen(true)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                      onClick={handleExportTimetable}
                      disabled={loading}
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {bulkMode && bulkClasses.length > 0 && (
          <div className="mb-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b">
              <div className="flex flex-wrap gap-2">
                {bulkClasses.map((cls) => (
                  <button
                    key={cls.class_id}
                    onClick={() => {
                      setBulkActiveClassId(cls.class_id);
                      setShowActions(false);
                    }}
                    className={`px-3 py-1.5 rounded-t text-[0.75rem] border ${
                      bulkActiveClassId === cls.class_id
                        ? 'bg-main text-white border-main'
                        : 'bg-gray-50 text-gray-600 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {cls.class_name}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                  onClick={() => setShowActions((prev) => !prev)}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <span className="text-[0.8rem]">Actions</span>
                  <svg className={`w-3 h-3 transition-transform ${showActions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showActions && (
                  <div className="flex flex-wrap gap-2" ref={bulkActionsPanelRef}>
                    {isDraftTimetable ? (
                      <>
                        <button
                          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                          onClick={handleSaveActiveTimetable}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                          onClick={handleResetDraftTimetable}
                          disabled={loading}
                        >
                          Reset
                        </button>
                      </>
                    ) : (
                      displayTimetable?.found ? (
                        <>
                          <button
                            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                            onClick={displayTimetable.details.is_active ? handleDeactivateTimetable : handleActivateTimetable}
                            disabled={loading}
                          >
                            {displayTimetable.details.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          {!displayTimetable.details.is_active && (
                            <button
                              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                              onClick={handleResetTimetable}
                              disabled={loading}
                            >
                              Reset
                            </button>
                          )}
                          {!displayTimetable.details.is_active && (
                            <button
                              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                              onClick={() => setDeleteTimetableOpen(true)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          )}
                          <button
                            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-main text-white rounded-lg hover:bg-main/75 transition text-[0.8rem]"
                            onClick={handleExportTimetable}
                            disabled={loading}
                          >
                            Export
                          </button>
                        </>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="my-6 border border-gray-200 rounded-lg w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mb-4"></div>
              <p className="text-gray-700 text-[0.8rem]">Loading timetable...</p>
            </div>
          ) : !bulkMode && (!selectedClass || !selectedTerm || !selectedYear) ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select timetable to view</h3>
              <p className="text-gray-700 text-center text-[0.8rem]">Choose a class, term, and year from the filters above to view the timetable</p>
            </div>
          ) : bulkMode && (!bulkActiveClassId || !bulkYear || !bulkTerm) ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a class tab to view</h3>
              <p className="text-gray-700 text-center text-[0.8rem]">Choose a class tab above to view its timetable.</p>
            </div>
          ) : displayTimetable && !displayTimetable.found ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No timetable found</h3>
              <p className="text-gray-500 text-center mb-4 text-[0.8rem]">No timetable exists for the selected class, term, and academic year.</p>
              <p className="text-[0.7rem] text-gray-400 text-center">Selected: {availableClasses.find(c => c.id === activeClassId)?.name} - Term {activeTerm} ({activeYear})</p>
            </div>
          ) : !displayTimetable ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select timetable to view</h3>
              <p className="text-gray-500 text-center text-[0.8rem]">Choose a class tab or filter to view the timetable</p>
            </div>
          ) : (
            <div className="w-full">
              {draftTimetable && (
                <div className="mb-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded text-[0.75rem] text-main">
                  Draft timetable (not saved). Click “Save” to create the timetable in the database.
                </div>
              )}
              <table className="w-full border-collapse text-[0.8rem]">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-left">
                    <th className="px-1 py-2 font-medium text-center text-[0.7rem] w-[15%] sticky left-0 bg-gray-50 z-10">Day / Period</th>
                    {days.map((day, dayIdx) => (
                      <th key={dayIdx} className="px-1 py-2 font-medium text-center text-[0.7rem] w-[17%]">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodTimes.map((period, periodIdx) => (
                    <tr key={periodIdx} className="border-b last:border-b-0">
                      <td className="px-1 py-2 align-top font-medium text-center text-[0.7rem] bg-gray-50 sticky left-0 z-10 border-r w-[15%]">
                        <div className="text-[0.65rem] leading-tight">{period}</div>
                      </td>
                      {days.map((_, dayIdx) => {
                        const dayPeriods = displayTimetable?.actions?.[dayIdx] || [];
                        const subjectData = dayPeriods[periodIdx];
                        const reservedLabel = getReservedLabel(periodIdx);

                        return (
                          <td key={dayIdx} className="px-1 py-1 relative w-[17%]">
                            {reservedLabel ? (
                              <div className="flex justify-center items-center bg-gray-100 text-gray-500 font-semibold py-1 px-1 rounded text-[0.65rem] min-h-[40px]">
                                <span className="text-center leading-tight">{reservedLabel}</span>
                              </div>
                            ) : subjectData && subjectData.subject ? (
                              <div className="group flex flex-col justify-center items-center bg-gray-50 rounded p-1 hover:shadow-sm transition relative min-h-[45px]">
                                <div className="font-semibold text-[0.65rem] text-center mb-1 leading-tight">{subjectData.subject}</div>
                                <div className="text-[0.6rem] text-gray-500 text-center leading-tight">{subjectData.teacher}</div>
                                <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditCell(periodIdx, dayIdx, subjectData)}
                                    className="text-gray-400 hover:text-main transition p-0.5 rounded"
                                    title="Edit subject"
                                  >
                                    <FiEdit2 size={10} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCell(periodIdx, dayIdx)}
                                    className="text-red-400 hover:text-red-600 transition p-0.5 rounded"
                                    title="Delete subject"
                                  >
                                    <FiDelete size={10} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group flex flex-col justify-center items-center bg-gray-50 rounded p-1 hover:shadow-sm transition relative min-h-[45px]">
                                <div className="text-gray-700 font-semibold py-1 text-[0.65rem] text-center">No class</div>
                                <button
                                  onClick={() => handleEditCell(periodIdx, dayIdx, displayTimetable?.actions?.[dayIdx]?.[periodIdx] || {})}
                                  className="absolute top-0.5 right-0.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-main transition p-0.5 rounded"
                                  title="Add subject"
                                >
                                  <FiEdit2 size={10} />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <CreateTimetableModal
          isOpen={isCreateModalOpen}
          onClose={handleCreateModalClose}
          onSave={handleCreateTimetableSave}
        />
        <EditSubjectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          classId={activeClassId}
          timetableClassId={activeTimetable?.details?.class_id}
          initialSubject={initialSubject}
          periodType={periodType}
        />
        <DeleteSubjectConfirmModal
          isOpen={deleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
        <ConfirmDeleteTimetableModal
          open={deleteTimetableOpen}
          onClose={() => setDeleteTimetableOpen(false)}
          onConfirm={handleDeleteTimetable}
          timetableLabel={
            activeClassId
              ? `${availableClasses.find(c => c.id === activeClassId)?.name || 'Class'} • Term ${activeTerm} • ${activeYear}`
              : undefined
          }
        />
      </div>
    </div>
  );
}

export default TimetableAdminWidget;