import React, { useState, useEffect } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { attendanceApi, AttendanceRecord, AttendanceSummary } from "../../AttendanceManagement/attendanceApi";
import { toast } from 'react-toastify';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Save,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  enrollmentId?: string;
}

interface AttendanceStatus {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkedIn?: string;
  notes?: string;
}

interface EnhancedAttendanceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  sectionId?: string;
  onAttendanceComplete?: (success: boolean, message?: string) => void;
}

type AttendanceMode = 'mark' | 'view' | 'report';
type AttendanceState = 'draft' | 'enabled' | 'finalized';

const EnhancedAttendanceManager: React.FC<EnhancedAttendanceManagerProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  sectionId,
  onAttendanceComplete
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AttendanceMode>('mark');
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attendanceState, setAttendanceState] = useState<AttendanceState>('draft');
  const [selectAll, setSelectAll] = useState(false);

  // Load students when modal opens
  useEffect(() => {
    if (isOpen && courseId) {
      loadStudents();
    }
  }, [isOpen, courseId, sectionId]);

  // Update select all when attendance records change
  useEffect(() => {
    const allPresent = Array.from(attendanceRecords.values()).every(
      record => record.status === 'present' || record.status === 'late'
    );
    setSelectAll(allPresent);
  }, [attendanceRecords]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const mockStudents: Student[] = [
        { id: '1', name: 'John Doe', rollNumber: 'CS001', email: 'john@example.com', enrollmentId: 'ENR001' },
        { id: '2', name: 'Jane Smith', rollNumber: 'CS002', email: 'jane@example.com', enrollmentId: 'ENR002' },
        { id: '3', name: 'Bob Johnson', rollNumber: 'CS003', email: 'bob@example.com', enrollmentId: 'ENR003' },
        { id: '4', name: 'Alice Brown', rollNumber: 'CS004', email: 'alice@example.com', enrollmentId: 'ENR004' },
        { id: '5', name: 'Charlie Wilson', rollNumber: 'CS005', email: 'charlie@example.com', enrollmentId: 'ENR005' }
      ];
      setStudents(mockStudents);
      
      // Load existing attendance for the date
      await loadAttendanceForDate(selectedDate);
    } catch (error) {
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date: string) => {
    try {
      // Replace with actual API call
      const mockAttendance = new Map<string, AttendanceStatus>();
      // Simulate some existing attendance records
      mockAttendance.set('1', { studentId: '1', status: 'present', checkedIn: '09:00' });
      mockAttendance.set('2', { studentId: '2', status: 'late', checkedIn: '09:15' });
      mockAttendance.set('3', { studentId: '3', status: 'absent' });
      
      setAttendanceRecords(mockAttendance);
      
      // Determine attendance state
      setAttendanceState('draft'); // Would be determined from API
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadAttendanceForDate(date);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus['status'], notes?: string) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const existing = newRecords.get(studentId) || { studentId, status: 'present' as const };
      newRecords.set(studentId, {
        ...existing,
        status,
        checkedIn: status === 'present' || status === 'late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        notes: notes || existing.notes || ''
      });
      return newRecords;
    });
  };

  const handleSelectAll = (status: AttendanceStatus['status']) => {
    const newRecords = new Map<string, AttendanceStatus>();
    students.forEach(student => {
      newRecords.set(student.id, {
        studentId: student.id,
        status,
        checkedIn: status === 'present' || status === 'late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
      });
    });
    setAttendanceRecords(newRecords);
    setSelectAll(true);
  };

  const handleClearAll = () => {
    setAttendanceRecords(new Map());
    setSelectAll(false);
  };

  const saveAsDraft = async () => {
    setSaving(true);
    try {
      const attendanceData = Array.from(attendanceRecords.values());
      // Replace with actual API call
      const response = await attendanceApi.saveAttendance({
        courseId,
        date: selectedDate,
        records: attendanceData,
        state: 'draft'
      });
      
      if (response.success) {
        toast.success('Attendance saved as draft');
        setAttendanceState('draft');
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const enableAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = Array.from(attendanceRecords.values());
      // Replace with actual API call
      const response = await attendanceApi.saveAttendance({
        courseId,
        date: selectedDate,
        records: attendanceData,
        state: 'enabled'
      });
      
      if (response.success) {
        toast.success('Attendance enabled for students');
        setAttendanceState('enabled');
        onAttendanceComplete?.(true, 'Attendance enabled successfully');
      } else {
        toast.error('Failed to enable attendance');
      }
    } catch (error) {
      toast.error('Failed to enable attendance');
    } finally {
      setSaving(false);
    }
  };

  const finalizeAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = Array.from(attendanceRecords.values());
      // Replace with actual API call
      const response = await attendanceApi.saveAttendance({
        courseId,
        date: selectedDate,
        records: attendanceData,
        state: 'finalized'
      });
      
      if (response.success) {
        toast.success('Attendance finalized successfully');
        setAttendanceState('finalized');
        onAttendanceComplete?.(true, 'Attendance finalized successfully');
      } else {
        toast.error('Failed to finalize attendance');
      }
    } catch (error) {
      toast.error('Failed to finalize attendance');
    } finally {
      setSaving(false);
    }
  };

  const exportAttendance = async () => {
    try {
      // Replace with actual API call
      const response = await attendanceApi.exportAttendance({
        courseId,
        date: selectedDate,
        format: 'excel'
      });
      
      if (response.success) {
        toast.success('Attendance exported successfully');
      } else {
        toast.error('Failed to export attendance');
      }
    } catch (error) {
      toast.error('Failed to export attendance');
    }
  };

  const loadSummary = async () => {
    try {
      // Replace with actual API call
      const mockSummary: AttendanceSummary = {
        totalStudents: students.length,
        present: Array.from(attendanceRecords.values()).filter(r => r.status === 'present').length,
        absent: Array.from(attendanceRecords.values()).filter(r => r.status === 'absent').length,
        late: Array.from(attendanceRecords.values()).filter(r => r.status === 'late').length,
        excused: Array.from(attendanceRecords.values()).filter(r => r.status === 'excused').length,
        date: selectedDate
      };
      setSummary(mockSummary);
    } catch (error) {
      toast.error('Failed to load attendance summary');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: AttendanceStatus['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Square className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStateColor = (state: AttendanceState) => {
    switch (state) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'enabled':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalized':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Attendance Management" size="xl">
      <div className="space-y-6">
        {/* Header with Date and State */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(attendanceState)}`}>
              {attendanceState.toUpperCase()}
            </div>
          </div>
          <div className="flex space-x-2">
            <UIButton
              onClick={loadStudents}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </UIButton>
            <UIButton
              onClick={exportAttendance}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </UIButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {(['mark', 'view', 'report'] as AttendanceMode[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'mark' && 'Mark Attendance'}
                {tab === 'view' && 'View Attendance'}
                {tab === 'report' && 'Reports'}
              </button>
            ))}
          </nav>
        </div>

        {/* Mark Attendance Tab */}
        {activeTab === 'mark' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <UIButton
                  onClick={() => handleSelectAll('present')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={attendanceState === 'finalized'}
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Mark All Present
                </UIButton>
                <UIButton
                  onClick={handleClearAll}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  disabled={attendanceState === 'finalized'}
                >
                  <Square className="w-4 h-4 mr-1" />
                  Clear All
                </UIButton>
              </div>
              
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Students List */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600">No students found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const record = attendanceRecords.get(student.id);
                      return (
                        <div key={student.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-800">
                                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-600">
                                  {student.rollNumber} • {student.email}
                                </p>
                                {record?.checkedIn && (
                                  <p className="text-xs text-green-600">
                                    Checked in: {record.checkedIn}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {(['present', 'absent', 'late', 'excused'] as AttendanceStatus['status'][]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleAttendanceChange(student.id, status)}
                                  disabled={attendanceState === 'finalized'}
                                  className={`p-2 rounded-full border-2 transition-colors ${
                                    record?.status === status
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 hover:border-gray-400'
                                  } ${attendanceState === 'finalized' ? 'cursor-not-allowed opacity-50' : ''}`}
                                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                                >
                                  {getStatusIcon(status)}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {record?.notes && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              Notes: {record.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Attendance Tab */}
        {activeTab === 'view' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <UIButton onClick={loadSummary} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Eye className="w-4 h-4 mr-1" />
                Load Summary
              </UIButton>
            </div>
            
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{summary.totalStudents}</p>
                  <p className="text-sm text-blue-800">Total Students</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                  <p className="text-sm text-green-800">Present</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                  <p className="text-sm text-red-800">Absent</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
                  <p className="text-sm text-yellow-800">Late</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{summary.excused}</p>
                  <p className="text-sm text-blue-800">Excused</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-gray-600">Attendance reports and analytics coming soon...</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {attendanceRecords.size > 0 && `${attendanceRecords.size} students selected`}
          </div>
          
          <div className="flex space-x-3">
            <UIButton
              onClick={saveAsDraft}
              disabled={saving || attendanceState === 'finalized'}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </UIButton>
            
            <UIButton
              onClick={enableAttendance}
              disabled={saving || attendanceState === 'finalized' || attendanceState === 'enabled'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {saving ? 'Enabling...' : 'Enable'}
            </UIButton>
            
            <UIButton
              onClick={finalizeAttendance}
              disabled={saving || attendanceState === 'finalized' || attendanceRecords.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {saving ? 'Finalizing...' : 'Finalize'}
            </UIButton>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};

export default EnhancedAttendanceManager;
