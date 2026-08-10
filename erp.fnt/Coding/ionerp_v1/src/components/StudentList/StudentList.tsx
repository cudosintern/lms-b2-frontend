import React, { useState } from 'react';

interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
}

interface StudentListProps {
  students: Student[];
  selectedStudents: number[];
  onStudentSelectionChange: (selectedIds: number[]) => void;
  className?: string;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  selectedStudents, 
  onStudentSelectionChange, 
  className = '' 
}) => {
  const handleStudentToggle = (studentId: number) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    onStudentSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      onStudentSelectionChange([]);
    } else {
      onStudentSelectionChange(students.map(student => student.id));
    }
  };

  return (
    <div className={`student-list-container ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Students
        </label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        {students.map(student => (
          <div
            key={student.id}
            className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 last:border-b-0"
          >
            <input
              type="checkbox"
              id={`student-${student.id}`}
              checked={selectedStudents.includes(student.id)}
              onChange={() => handleStudentToggle(student.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`student-${student.id}`}
              className="ml-3 flex-1 cursor-pointer"
            >
              <div className="text-sm font-medium text-gray-900">
                {student.name}
              </div>
              <div className="text-xs text-gray-500">
                {student.rollNumber} • {student.email}
              </div>
            </label>
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        {selectedStudents.length} of {students.length} students selected
      </div>
    </div>
  );
};

export default StudentList;
