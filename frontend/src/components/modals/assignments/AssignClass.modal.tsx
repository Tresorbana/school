import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

export type AssignClassForm = {
  course: string;
  classroom: string;
  period: string;
  term: string;
};

interface AssignClassModalProps {
  open: boolean;
  onClose: () => void;
  classrooms: string[];
  onSubmit?: (data: AssignClassForm) => void;
}

const AssignClassModal: React.FC<AssignClassModalProps> = ({ open, onClose, classrooms, onSubmit }) => {
  const [form, setForm] = useState<AssignClassForm>({ course: "", classroom: classrooms[0] ?? "", period: "1", term: "1" });

  useEffect(() => {
    if (open) {
      setForm({ course: "", classroom: classrooms[0] ?? "", period: "1", term: "1" });
    }
  }, [open, classrooms]);

  if (!open) return null;

  const handleChange = (
    key: keyof AssignClassForm
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    onSubmit?.(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Assign a class</h3>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100">
              <IoClose className="text-xl" />
            </button>
          </div>
          <div className="h-px bg-gray-200 my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Course name"
              value={form.course}
              onChange={handleChange("course")}
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={form.classroom}
              onChange={handleChange("classroom")}
            >
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={form.period}
              onChange={handleChange("period")}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Period {i + 1}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={form.term}
              onChange={handleChange("term")}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Term {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
              cancel
            </button>
            <button onClick={handleSubmit} className="px-5 py-2 rounded-md bg-main text-white hover:opacity-90">
              Assign class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignClassModal;
