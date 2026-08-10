import React, { useState, useEffect } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { timetableApi } from "../../timetableCalendar/timetableApi";
import { toast } from 'react-toastify';
import { Calendar, Clock, Users, BookOpen, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  selected?: boolean;
}

interface Curriculum {
  id: number;
  name: string;
}

interface Term {
  id: number;
  name: string;
  curriculumId: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
  curriculumId: number;
  termId: number;
}

interface Section {
  id: number;
  name: string;
  courseId: number;
}

interface Topic {
  id: number;
  name: string;
  courseId: number;
}

interface EnhancedScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleComplete?: (success: boolean, message?: string) => void;
  initialData?: any;
}

const EnhancedScheduleClassModal: React.FC<EnhancedScheduleClassModalProps> = ({
  isOpen,
  onClose,
  onScheduleComplete,
  initialData
}) => {
  const [formData, setFormData] = useState({
    curriculumId: '',
    termId: '',
    courseId: '',
    sectionId: '',
    topicId: '',
    classDate: '',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    curriculums: false,
    terms: false,
    courses: false,
    sections: false,
    topics: false,
    students: false
  });

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    if (isOpen) {
      loadCurriculums();
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      }
    }
  }, [isOpen, initialData]);

  const loadCurriculums = async () => {
    setLoading(prev => ({ ...prev, curriculums: true }));
    try {
      // Replace with actual API call
      const mockCurriculums: Curriculum[] = [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Electrical Engineering' },
        { id: 3, name: 'Mechanical Engineering' }
      ];
      setCurriculums(mockCurriculums);
    } catch (error) {
      toast.error('Failed to load curriculums');
    } finally {
      setLoading(prev => ({ ...prev, curriculums: false }));
    }
  };

  const loadTerms = async (curriculumId: string) => {
    if (!curriculumId) return;
    
    setLoading(prev => ({ ...prev, terms: true }));
    try {
      // Replace with actual API call: GET /api/v1/timetable/curriculums/{crclm_id}/terms
      const mockTerms: Term[] = [
        { id: 1, name: 'Fall 2024', curriculumId: parseInt(curriculumId) },
        { id: 2, name: 'Spring 2024', curriculumId: parseInt(curriculumId) }
      ];
      setTerms(mockTerms);
    } catch (error) {
      toast.error('Failed to load terms');
    } finally {
      setLoading(prev => ({ ...prev, terms: false }));
    }
  };

  const loadCourses = async (curriculumId: string, termId: string) => {
    if (!curriculumId || !termId) return;
    
    setLoading(prev => ({ ...prev, courses: true }));
    try {
      // Replace with actual API call
      const mockCourses: Course[] = [
        { id: 1, name: 'Data Structures', code: 'CS201', curriculumId: parseInt(curriculumId), termId: parseInt(termId) },
        { id: 2, name: 'Algorithms', code: 'CS202', curriculumId: parseInt(curriculumId), termId: parseInt(termId) }
      ];
      setCourses(mockCourses);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const loadSections = async (courseId: string) => {
    if (!courseId) return;
    
    setLoading(prev => ({ ...prev, sections: true }));
    try {
      // Replace with actual API call
      const mockSections: Section[] = [
        { id: 1, name: 'Section A', courseId: parseInt(courseId) },
        { id: 2, name: 'Section B', courseId: parseInt(courseId) }
      ];
      setSections(mockSections);
    } catch (error) {
      toast.error('Failed to load sections');
    } finally {
      setLoading(prev => ({ ...prev, sections: false }));
    }
  };

  const loadTopics = async (courseId: string) => {
    if (!courseId) return;
    
    setLoading(prev => ({ ...prev, topics: true }));
    try {
      // Replace with actual API call
      const mockTopics: Topic[] = [
        { id: 1, name: 'Introduction to Arrays', courseId: parseInt(courseId) },
        { id: 2, name: 'Sorting Algorithms', courseId: parseInt(courseId) }
      ];
      setTopics(mockTopics);
    } catch (error) {
      toast.error('Failed to load topics');
    } finally {
      setLoading(prev => ({ ...prev, topics: false }));
    }
  };

  const loadStudents = async (sectionId: string) => {
    if (!sectionId) return;
    
    setLoading(prev => ({ ...prev, students: true }));
    try {
      // Replace with actual API call
      const mockStudents: Student[] = [
        { id: '1', name: 'John Doe', rollNumber: 'CS001', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', rollNumber: 'CS002', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', rollNumber: 'CS003', email: 'bob@example.com' }
      ];
      setStudents(mockStudents);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };

  // Handle dropdown changes with cascade loading
  const handleCurriculumChange = (value: string) => {
    setFormData(prev => ({ ...prev, curriculumId: value, termId: '', courseId: '', sectionId: '', topicId: '' }));
    setTerms([]);
    setCourses([]);
    setSections([]);
    setTopics([]);
    setStudents([]);
    setSelectedStudents(new Set());
    loadTerms(value);
  };

  const handleTermChange = (value: string) => {
    setFormData(prev => ({ ...prev, termId: value, courseId: '', sectionId: '', topicId: '' }));
    setCourses([]);
    setSections([]);
    setTopics([]);
    setStudents([]);
    setSelectedStudents(new Set());
    loadCourses(formData.curriculumId, value);
  };

  const handleCourseChange = (value: string) => {
    setFormData(prev => ({ ...prev, courseId: value, sectionId: '', topicId: '' }));
    setSections([]);
    setTopics([]);
    setStudents([]);
    setSelectedStudents(new Set());
    loadSections(value);
    loadTopics(value);
  };

  const handleSectionChange = (value: string) => {
    setFormData(prev => ({ ...prev, sectionId: value }));
    setStudents([]);
    setSelectedStudents(new Set());
    loadStudents(value);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAllStudents = () => {
    setSelectedStudents(new Set(students.map(s => s.id)));
  };

  const deselectAllStudents = () => {
    setSelectedStudents(new Set());
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.curriculumId) newErrors.curriculumId = 'Curriculum is required';
    if (!formData.termId) newErrors.termId = 'Term is required';
    if (!formData.courseId) newErrors.courseId = 'Course is required';
    if (!formData.sectionId) newErrors.sectionId = 'Section is required';
    if (!formData.topicId) newErrors.topicId = 'Topic is required';
    if (!formData.classDate) newErrors.classDate = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.location) newErrors.location = 'Location is required';
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (selectedStudents.size === 0) {
      newErrors.students = 'At least one student must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const scheduleData = {
        ...formData,
        studentIds: Array.from(selectedStudents),
        startTime: `${formData.classDate}T${formData.startTime}:00`,
        endTime: `${formData.classDate}T${formData.endTime}:00`
      };

      // Replace with actual API call
      const response = await timetableApi.updateScheduledClass(0, scheduleData); // Create new class
      
      if (response.success) {
        toast.success('Class scheduled successfully!');
        handleClose();
        onScheduleComplete?.(true, response.message);
      } else {
        onScheduleComplete?.(false, response.message);
      }
    } catch (error) {
      toast.error('Failed to schedule class');
      onScheduleComplete?.(false, 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      curriculumId: '',
      termId: '',
      courseId: '',
      sectionId: '',
      topicId: '',
      classDate: '',
      startTime: '',
      endTime: '',
      location: '',
      description: ''
    });
    setCurriculums([]);
    setTerms([]);
    setCourses([]);
    setSections([]);
    setTopics([]);
    setStudents([]);
    setSelectedStudents(new Set());
    setErrors({});
    onClose();
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={handleClose} title="Schedule Class" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Curriculum, Term, Course, Section Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="inline w-4 h-4 mr-1" />
              Curriculum
            </label>
            <select
              value={formData.curriculumId}
              onChange={(e) => handleCurriculumChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.curriculumId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading.curriculums}
            >
              <option value="">Select Curriculum</option>
              {curriculums.map(curriculum => (
                <option key={curriculum.id} value={curriculum.id}>
                  {curriculum.name}
                </option>
              ))}
            </select>
            {errors.curriculumId && (
              <p className="mt-1 text-sm text-red-600">{errors.curriculumId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select
              value={formData.termId}
              onChange={(e) => handleTermChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.termId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading.terms || !formData.curriculumId}
            >
              <option value="">Select Term</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            {errors.termId && (
              <p className="mt-1 text-sm text-red-600">{errors.termId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.courseId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading.courses || !formData.termId}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              value={formData.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sectionId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading.sections || !formData.courseId}
            >
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {errors.sectionId && (
              <p className="mt-1 text-sm text-red-600">{errors.sectionId}</p>
            )}
          </div>
        </div>

        {/* Topic and Date/Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <select
              value={formData.topicId}
              onChange={(e) => setFormData(prev => ({ ...prev, topicId: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.topicId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading.topics || !formData.courseId}
            >
              <option value="">Select Topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            {errors.topicId && (
              <p className="mt-1 text-sm text-red-600">{errors.topicId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Class Date
            </label>
            <input
              type="date"
              value={formData.classDate}
              onChange={(e) => setFormData(prev => ({ ...prev, classDate: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.classDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.classDate && (
              <p className="mt-1 text-sm text-red-600">{errors.classDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Room 101"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Additional notes about this class..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          />
        </div>

        {/* Student Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              <Users className="inline w-4 h-4 mr-1" />
              Select Students ({selectedStudents.size} selected)
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAllStudents}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading.students || students.length === 0}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAllStudents}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={loading.students || students.length === 0}
              >
                Deselect All
              </button>
            </div>
          </div>

          {errors.students && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.students}
              </p>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {loading.students ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No students found. Please select a section first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map(student => (
                  <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="mr-3 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-600">
                        Roll: {student.rollNumber} | {student.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <UIButton
            type="button"
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
            disabled={isSubmitting}
          >
            Cancel
          </UIButton>
          <UIButton
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
          </UIButton>
        </div>
      </form>
    </ModalContainer>
  );
};

export default EnhancedScheduleClassModal;
