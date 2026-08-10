import React, { useState, useEffect } from 'react';
import ModalContainer from '../Modal/ModalContainer';
import UIButton from '../FormBuilder/fields/Button';
import { Calendar as CalendarIcon, Clock, Users, BookOpen, CheckSquare } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  selected: boolean;
}

interface CurriculumManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CURRICULUM_STORAGE_KEY = 'curriculum_data';

const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  // Form state
  const [curriculum, setCurriculum] = useState('');
  const [term, setTerm] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classTimings, setClassTimings] = useState({
    startTime: '',
    endTime: '',
    daysOfWeek: [] as string[]
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedCurriculums, setSavedCurriculums] = useState<any[]>([]);

  // Sample data
  const curriculums = [
    { id: '1', name: 'Computer Science Engineering' },
    { id: '2', name: 'Electronics Engineering' },
    { id: '3', name: 'Mechanical Engineering' },
    { id: '4', name: 'Civil Engineering' }
  ];

  const terms = [
    { id: '1', name: 'Fall 2024' },
    { id: '2', name: 'Spring 2025' },
    { id: '3', name: 'Summer 2025' }
  ];

  const courses = [
    { id: '1', name: 'Data Structures', code: 'CS201' },
    { id: '2', name: 'Algorithms', code: 'CS202' },
    { id: '3', name: 'Database Systems', code: 'CS301' },
    { id: '4', name: 'Web Development', code: 'CS302' }
  ];

  const sections = ['A', 'B', 'C', 'D'];

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Sample students data
  const sampleStudents: Student[] = [
    { id: '1', name: 'John Doe', rollNumber: 'CS2021001', email: 'john@university.edu', selected: false },
    { id: '2', name: 'Jane Smith', rollNumber: 'CS2021002', email: 'jane@university.edu', selected: false },
    { id: '3', name: 'Mike Johnson', rollNumber: 'CS2021003', email: 'mike@university.edu', selected: false },
    { id: '4', name: 'Sarah Williams', rollNumber: 'CS2021004', email: 'sarah@university.edu', selected: false },
    { id: '5', name: 'David Brown', rollNumber: 'CS2021005', email: 'david@university.edu', selected: false },
    { id: '6', name: 'Emily Davis', rollNumber: 'CS2021006', email: 'emily@university.edu', selected: false },
    { id: '7', name: 'Robert Miller', rollNumber: 'CS2021007', email: 'robert@university.edu', selected: false },
    { id: '8', name: 'Lisa Wilson', rollNumber: 'CS2021008', email: 'lisa@university.edu', selected: false }
  ];

  useEffect(() => {
    if (isOpen) {
      setStudents(sampleStudents);
      loadSavedCurriculums();
    }
  }, [isOpen]);

  const loadSavedCurriculums = () => {
    try {
      const savedData = localStorage.getItem(CURRICULUM_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSavedCurriculums(parsedData);
      }
    } catch (error) {
      console.error('Error loading saved curriculums:', error);
    }
  };

  const saveCurriculumToStorage = (curriculumData: any) => {
    try {
      const updatedCurriculums = [...savedCurriculums, { ...curriculumData, id: Date.now() }];
      localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(updatedCurriculums));
      setSavedCurriculums(updatedCurriculums);
    } catch (error) {
      console.error('Error saving curriculum:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!curriculum) newErrors.curriculum = 'Curriculum is required';
    if (!term) newErrors.term = 'Term is required';
    if (!course) newErrors.course = 'Course is required';
    if (!section) newErrors.section = 'Section is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (!classTimings.startTime) newErrors.startTime = 'Start time is required';
    if (!classTimings.endTime) newErrors.endTime = 'End time is required';
    if (classTimings.daysOfWeek.length === 0) newErrors.daysOfWeek = 'At least one day must be selected';
    
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (classTimings.startTime && classTimings.endTime && classTimings.startTime >= classTimings.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    const selectedStudents = students.filter(s => s.selected);
    if (selectedStudents.length === 0) {
      newErrors.students = 'At least one student must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const selectedStudents = students.filter(s => s.selected);
      const formData = {
        curriculum,
        term,
        course,
        section,
        startDate,
        endDate,
        classTimings,
        students: selectedStudents,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      saveCurriculumToStorage(formData);
      
      // Also save to parent component if provided
      if (onSave) {
        onSave(formData);
      }
      
      handleClose();
    }
  };

  const handleClose = () => {
    setCurriculum('');
    setTerm('');
    setCourse('');
    setSection('');
    setStartDate('');
    setEndDate('');
    setClassTimings({ startTime: '', endTime: '', daysOfWeek: [] });
    setStudents(sampleStudents.map(s => ({ ...s, selected: false })));
    setErrors({});
    onClose();
  };

  const handleStudentSelection = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, selected: !student.selected } : student
    ));
  };

  const handleSelectAllStudents = () => {
    const allSelected = students.every(s => s.selected);
    setStudents(prev => prev.map(student => ({ ...student, selected: !allSelected })));
  };

  const handleDayToggle = (day: string) => {
    setClassTimings(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={handleClose} title="Curriculum Manager" size="full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Basic Information
            </h3>
            
            {/* Curriculum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curriculum *
              </label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.curriculum ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Curriculum</option>
                {curriculums.map(curr => (
                  <option key={curr.id} value={curr.id}>{curr.name}</option>
                ))}
              </select>
              {errors.curriculum && (
                <p className="mt-1 text-sm text-red-600">{errors.curriculum}</p>
              )}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term *
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.term ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Term</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.term && (
                <p className="mt-1 text-sm text-red-600">{errors.term}</p>
              )}
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.course ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
              {errors.course && (
                <p className="mt-1 text-sm text-red-600">{errors.course}</p>
              )}
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section *
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.section ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Section</option>
                {sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.section && (
                <p className="mt-1 text-sm text-red-600">{errors.section}</p>
              )}
            </div>
          </div>

          {/* Right Column - Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule Information
            </h3>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Class Timings */}
            <div>
              <h4 className="text-md font-medium text-gray-800 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" />
                Class Timings *
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <select
                    value={classTimings.startTime}
                    onChange={(e) => setClassTimings(prev => ({ ...prev, startTime: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.startTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <select
                    value={classTimings.endTime}
                    onChange={(e) => setClassTimings(prev => ({ ...prev, endTime: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.endTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Days of Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={classTimings.daysOfWeek.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
              {errors.daysOfWeek && (
                <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek}</p>
              )}
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Selection *
          </h3>

          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Select Students ({students.filter(s => s.selected).length} selected)
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {students.every(s => s.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {students.map(student => (
                <div key={student.id} className="px-4 py-3 border-b hover:bg-gray-50 flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={student.selected}
                    onChange={() => handleStudentSelection(student.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      Roll: {student.rollNumber} | {student.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errors.students && (
            <p className="mt-1 text-sm text-red-600">{errors.students}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <UIButton
            type="button"
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cancel
          </UIButton>
          <UIButton
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Curriculum
          </UIButton>
        </div>
      </form>
    </ModalContainer>
  );
};

export default CurriculumManager;
