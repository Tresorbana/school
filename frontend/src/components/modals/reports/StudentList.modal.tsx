import React, { useState, useMemo } from "react";
import { IoClose, IoSearch, } from "react-icons/io5";
import { FiUsers } from "react-icons/fi";
import ModalWrapper from "../../shared/ModalWrapper";

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  gender?: string;
}

interface StudentListModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  students?: Student[];
}

const StudentListModal: React.FC<StudentListModalProps> = ({
  open,
  onClose,
  className,
  students = []
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    return students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.gender && student.gender.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, searchTerm]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!open) return null;

  return (
    <ModalWrapper isOpen={open} onClose={onClose} className="w-[50rem] max-w-[50rem] h-[38rem]">
      <div className="w-[50rem] h-[38rem] rounded-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-main">
              <FiUsers />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {className || "Class"} Students
              </h3>
              <p className="text-xs text-gray-600">
                {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
            <IoClose className="text-lg" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b flex-shrink-0">
          <div className="relative flex">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent border-r-0"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="px-3 py-2 bg-main text-white rounded-r-lg text-sm hover:bg-main/90 flex items-center gap-2 border border-main"
            >
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 p-4 min-h-0">
          {filteredStudents.length > 0 ? (
            <div className="h-full overflow-y-scroll border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.student_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-block w-20 text-center px-2 py-1 rounded text-xs font-medium ${
                          student.is_active 
                            ? 'bg-main text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full border rounded-lg">
              <div className="text-center py-8">
                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchTerm.trim() ? "No students found" : "No students available"}
                </p>
                <p className="text-gray-400 text-[.8rem] mt-1">
                  {searchTerm.trim() ? "Try adjusting your search terms" : "This class appears to be empty"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default StudentListModal;