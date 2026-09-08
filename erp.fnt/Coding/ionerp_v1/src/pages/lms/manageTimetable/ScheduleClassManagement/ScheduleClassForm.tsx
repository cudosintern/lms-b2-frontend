import React, { useState, useEffect } from 'react';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { courses, sections, topicsByCourse, getCourseNameById } from '../scheduleConstants';
import { validateScheduleClass, hasValidationErrors } from '../scheduleClassSchema';
import { toast } from 'react-toastify';
import { scheduleClassApi } from '../scheduleClassApi';

interface ScheduleClassFormProps {
  onClose: () => void;
  onSave: (classData: any) => void;
  initialData?: any; // Support for editing if needed in future
}

const ScheduleClassForm: React.FC<ScheduleClassFormProps> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    courseTypeId: '1', // Theory
    courseId: '101', // Data Structures
    sectionId: '201', // CSE-A 
    topicId: '301', // Arrays
    classDate: '',
    startTime: '',
    endTime: '',
    location: '',
    course: '',
    section: '',
    topic: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTopics, setAvailableTopics] = useState(topicsByCourse[101] || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update course name when courseId changes
    const courseName = getCourseNameById(Number(formData.courseId));
    setFormData(prev => ({ ...prev, course: courseName }));

    // Update available topics when courseId changes
    const topics = topicsByCourse[Number(formData.courseId) as keyof typeof topicsByCourse] || [];
    setAvailableTopics(topics);

    // Reset topic to first available topic
    if (topics.length > 0) {
      setFormData(prev => ({
        ...prev,
        topicId: topics[0].id.toString(),
        topic: topics[0].name
      }));
    }
  }, [formData.courseId]);

  useEffect(() => {
    // Update section name when sectionId changes
    const section = sections.find(s => s.id === Number(formData.sectionId));
    if (section) {
      setFormData(prev => ({ ...prev, section: section.name }));
    }
  }, [formData.sectionId]);

  useEffect(() => {
    // Update topic name when topicId changes
    const topic = availableTopics.find(t => t.id === Number(formData.topicId));
    if (topic) {
      setFormData(prev => ({ ...prev, topic: topic.name }));
    }
  }, [formData.topicId, availableTopics]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    // Validate form data
    const validationErrors = validateScheduleClass(formData);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      toast.error('Please fix validation errors');
      return;
    }

    // Clear any existing errors
    setErrors({});
    setLoading(true);

    try {
      const time = `${formData.startTime} - ${formData.endTime}`;
      const classData = {
        id: initialData?.id || String(Date.now()),
        date: formData.classDate,
        time,
        courseTypeId: Number(formData.courseTypeId),
        courseId: Number(formData.courseId),
        sectionId: Number(formData.sectionId),
        topicId: Number(formData.topicId),
        courseType: formData.courseTypeId === '1' ? 'Theory' : 'Practical',
        course: formData.course,
        section: formData.section,
        topic: formData.topic,
        location: formData.location
      };

      // Integrated Backend API call
      const response = await scheduleClassApi.saveSchedule(classData);

      if (response) {
        // Parent callback to refresh UI list
        onSave(response);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to save class:', error);
      toast.error(error.message || 'Failed to schedule class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {initialData?.id ? 'Edit Class' : 'Schedule New Class'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="classDate"
              value={formData.classDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.classDate ? 'border-red-500' : 'border-gray-300'
                }`}
              required
            />
            {errors.classDate && (
              <p className="text-red-500 text-xs mt-1">{errors.classDate}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                required
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                required
              />
              {errors.endTime && (
                <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Type
            </label>
            <select
              name="courseTypeId"
              value={formData.courseTypeId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.courseTypeId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="1">Theory</option>
              <option value="2">Practical</option>
            </select>
            {errors.courseTypeId && (
              <p className="text-red-500 text-xs mt-1">{errors.courseTypeId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.courseId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              name="sectionId"
              value={formData.sectionId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sectionId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {errors.sectionId && (
              <p className="text-red-500 text-xs mt-1">{errors.sectionId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.topicId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              {availableTopics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            {errors.topicId && (
              <p className="text-red-500 text-xs mt-1">{errors.topicId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classroom / Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Room 201, Online"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <UIButton
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </UIButton>
            <UIButton
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Processing...' : (initialData?.id ? 'Update Class' : 'Schedule Class')}
            </UIButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleClassForm;
