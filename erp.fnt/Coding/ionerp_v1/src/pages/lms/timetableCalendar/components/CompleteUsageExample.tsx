import React, { useState } from 'react';
import { CompleteTimetableManager } from './index';

/**
 * Complete usage example showing all implemented features
 */
interface UsageContext {
  semTimeTableId?: number;
  curriculumId?: number;
  termId?: number;
  sectionId?: number;
  courseId: string;
  courseName: string;
}

const CompleteUsageExample: React.FC = () => {
  const [context, setContext] = useState<UsageContext>({
    semTimeTableId: 123,
    curriculumId: 456,
    termId: 789,
    sectionId: 101,
    courseId: 'CS201',
    courseName: 'Data Structures'
  });

  const handleOperationComplete = (operation: string, success: boolean, message?: string) => {
    console.log('=== OPERATION COMPLETED ===');
    console.log('Operation:', operation);
    console.log('Success:', success);
    console.log('Message:', message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Timetable Management System
          </h1>
          <p className="text-lg text-gray-600">
            Fully integrated schedule class UI with backend APIs, error handling, and verification
          </p>
        </div>

        {/* Context Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timetable ID
              </label>
              <input
                type="number"
                value={context.semTimeTableId || ''}
                onChange={(e) => setContext(prev => ({ ...prev, semTimeTableId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter timetable ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curriculum ID
              </label>
              <input
                type="number"
                value={context.curriculumId || ''}
                onChange={(e) => setContext(prev => ({ ...prev, curriculumId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter curriculum ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term ID
              </label>
              <input
                type="number"
                value={context.termId || ''}
                onChange={(e) => setContext(prev => ({ ...prev, termId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter term ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section ID
              </label>
              <input
                type="number"
                value={context.sectionId || ''}
                onChange={(e) => setContext(prev => ({ ...prev, sectionId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter section ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course ID
              </label>
              <input
                type="text"
                value={context.courseId}
                onChange={(e) => setContext(prev => ({ ...prev, courseId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter course ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name
              </label>
              <input
                type="text"
                value={context.courseName}
                onChange={(e) => setContext(prev => ({ ...prev, courseName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter course name"
              />
            </div>
          </div>
        </div>

        {/* Main Manager */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <CompleteTimetableManager />
        </div>

        {/* Feature Checklist */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Completed Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schedule Class Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-green-800 flex items-center">
                <span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                Schedule Class UI
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Curriculum dropdown with API integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Term dropdown with cascade loading</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Course dropdown with dynamic population</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Section dropdown with course filtering</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Calendar date picker</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Class timing with validation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Student list with checkboxes</span>
                </li>
              </ul>
            </div>

            {/* Copy Day Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-800 flex items-center">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                Copy Class Day
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Source and target date selection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Form validation and error handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Backend API integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Loading states and feedback</span>
                </li>
              </ul>
            </div>

            {/* Delete Timetable Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-red-800 flex items-center">
                <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                Delete Timetable
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Simple delete with confirmation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Advanced delete with date range</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Backend API integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Comprehensive error handling</span>
                </li>
              </ul>
            </div>

            {/* Reset Timetable Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-yellow-800 flex items-center">
                <span className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></span>
                Reset Timetable Date
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Confirmation dialog with warnings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Backend API integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Operation verification</span>
                </li>
              </ul>
            </div>

            {/* Attendance Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-800 flex items-center">
                <span className="w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                Attendance Management
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Student list with checkboxes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Mark attendance (Present/Absent/Late/Excused)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Save as Draft functionality</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Enable attendance state</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Finalize attendance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Backend API integration</span>
                </li>
              </ul>
            </div>

            {/* Verification Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-indigo-800 flex items-center">
                <span className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></span>
                Verification System
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Copy day verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Delete timetable verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Reset dates verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Schedule class verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Data integrity checks</span>
                </li>
              </ul>
            </div>

            {/* API Integration */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <span className="w-3 h-3 bg-gray-600 rounded-full mr-2"></span>
                API Integration
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>FastAPI endpoint integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Comprehensive error handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>HTTP status code handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Loading states and feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Toast notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Endpoints Reference */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 API Endpoints Used</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <h3 className="font-semibold mb-2">Curriculum & Scheduling</h3>
              <ul className="space-y-1 text-xs">
                <li>GET /api/v1/timetable/curriculums</li>
                <li>GET /api/v1/timetable/curriculums/{`{crclm_id}`}/terms</li>
                <li>GET /api/v1/timetable/curriculums/{`{crclm_id}`}/terms/{`{term_name}`}/sections</li>
                <li>GET /api/v1/timetable/timetables</li>
                <li>GET /api/v1/timetable/scheduled-classes</li>
                <li>PUT /api/v1/timetable/scheduled-classes/{`{class_id}`}</li>
                <li>DELETE /api/v1/timetable/scheduled-classes/{`{class_id}`}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Operations</h3>
              <ul className="space-y-1 text-xs">
                <li>POST /api/v1/timetable/copy-day</li>
                <li>DELETE /api/v1/timetable/{`{sem_time_table_id}`}</li>
                <li>PATCH /api/v1/timetable/{`{sem_time_table_id}`}/reset-dates</li>
                <li>PATCH /api/v1/timetable/{`{sem_time_table_id}`}/sync-range</li>
                <li>GET /api/v1/comman_function/timetable/export-pdf</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteUsageExample;
