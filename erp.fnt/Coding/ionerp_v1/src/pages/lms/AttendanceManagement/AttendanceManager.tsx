import React, { useState, useEffect } from 'react';
import ModalContainer from '../../../components/Modal/ModalContainer';
import UIButton from '../../../components/FormBuilder/fields/Button';
import { attendanceApi, AttendanceRecord, AttendanceSummary } from './attendanceApi';
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
  Search
} from 'lucide-react';

const ATTENDANCE_MANAGER_STORAGE_KEY = 'attendance_manager_data';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
}

interface AttendanceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  students: Student[];
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  students
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'mark' | 'view' | 'report'>('mark');
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing attendance for the selected date
  useEffect(() => {
    if (isOpen && selectedDate && activeTab === 'view') {
      loadAttendance();
    }
  }, [isOpen, selectedDate, activeTab]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to load from localStorage for immediate display
      loadAttendanceFromLocalStorage();
      
      // Then try to load from API (which also has localStorage fallback)
      const response = await attendanceApi.getAttendanceByCourseDate(courseId, selectedDate);
      
      if (response.success) {
        const recordsMap = new Map<string, AttendanceRecord>();
        response.data.forEach((record: AttendanceRecord) => {
          recordsMap.set(record.studentId, record);
        });
        setAttendanceRecords(recordsMap);
        
        // Load summary
        const summaryResponse = await attendanceApi.getAttendanceSummary(
          courseId, 
          selectedDate, 
          selectedDate
        );
        if (summaryResponse.success) {
          setSummary(summaryResponse.data as AttendanceSummary);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load attendance data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: AttendanceRecord['status']) => {
    try {
      const existingRecord = attendanceRecords.get(studentId);
      
      const attendanceData: Omit<AttendanceRecord, 'id' | 'markedAt'> = {
        studentId,
        courseId,
        date: selectedDate,
        status,
        checkInTime: status === 'present' ? new Date().toTimeString().slice(0, 5) : undefined,
        markedBy: 'current_user', // This should come from auth context
        notes: existingRecord?.notes
      };

      let response;
      if (existingRecord) {
        response = await attendanceApi.updateAttendance(existingRecord.id, attendanceData);
      } else {
        response = await attendanceApi.markAttendance([attendanceData]);
      }

      if (response.success) {
        const updatedRecord = response.data;
        if (Array.isArray(updatedRecord)) {
          setAttendanceRecords(prev => new Map(prev.set(studentId, updatedRecord[0] as AttendanceRecord)));
        } else {
          setAttendanceRecords(prev => new Map(prev.set(studentId, updatedRecord as AttendanceRecord)));
        }
        
        // Save to localStorage for persistence
        saveAttendanceToLocalStorage();
        
        toast.success(`Attendance marked as ${status}`);
        loadAttendance(); // Refresh summary
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMsg);
      console.error('Attendance marking error:', err);
    }
  };

  const saveAttendanceToLocalStorage = () => {
    try {
      const attendanceArray = Array.from(attendanceRecords.entries()).map(([studentId, record]) => ({
        ...record
      }));
      localStorage.setItem(ATTENDANCE_MANAGER_STORAGE_KEY, JSON.stringify(attendanceArray));
    } catch (error) {
      console.error('Error saving attendance to localStorage:', error);
    }
  };

  const loadAttendanceFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(ATTENDANCE_MANAGER_STORAGE_KEY);
      if (savedData) {
        const attendanceArray = JSON.parse(savedData);
        const recordsMap = new Map<string, AttendanceRecord>();
        attendanceArray.forEach((item: any) => {
          recordsMap.set(item.studentId, item);
        });
        setAttendanceRecords(recordsMap);
      }
    } catch (error) {
      console.error('Error loading attendance from localStorage:', error);
    }
  };

  const handleBulkMark = async (status: AttendanceRecord['status']) => {
    try {
      setSaving(true);
      
      const attendanceData = students.map(student => ({
        studentId: student.id,
        courseId,
        date: selectedDate,
        status,
        checkInTime: status === 'present' ? new Date().toTimeString().slice(0, 5) : undefined,
        markedBy: 'current_user'
      }));

      const response = await attendanceApi.markAttendance(attendanceData);
      
      if (response.success) {
        toast.success(`All students marked as ${status}`);
        loadAttendance();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to mark bulk attendance';
      toast.error(errorMsg);
      console.error('Bulk attendance error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setLoading(true);
      
      const response = await attendanceApi.getAttendanceReport(
        courseId,
        selectedDate,
        selectedDate
      );
      
      if (response.success) {
        // Create CSV content
        const csvContent = generateCSV(response.data);
        downloadCSV(csvContent, `attendance-${courseId}-${selectedDate}.csv`);
        toast.success('Report exported successfully');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to export report';
      toast.error(errorMsg);
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: any) => {
    const headers = ['Student Name', 'Roll Number', 'Status', 'Check In Time', 'Date'];
    const rows = students.map(student => {
      const record = attendanceRecords.get(student.id);
      return [
        student.name,
        student.rollNumber,
        record?.status || 'Not marked',
        record?.checkInTime || 'N/A',
        selectedDate
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'excused': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendanceStats = {
    total: students.length,
    present: Array.from(attendanceRecords.values()).filter(r => r.status === 'present').length,
    absent: Array.from(attendanceRecords.values()).filter(r => r.status === 'absent').length,
    late: Array.from(attendanceRecords.values()).filter(r => r.status === 'late').length,
    excused: Array.from(attendanceRecords.values()).filter(r => r.status === 'excused').length,
    notMarked: students.length - attendanceRecords.size
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Attendance Management" size="full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{courseName}</h2>
            <p className="text-gray-600">Manage attendance for {students.length} students</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <UIButton
              onClick={loadAttendance}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </UIButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {(['mark', 'view', 'report'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-2xl font-bold text-blue-900">{attendanceStats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Present</p>
                <p className="text-2xl font-bold text-green-900">{attendanceStats.present}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Absent</p>
                <p className="text-2xl font-bold text-red-900">{attendanceStats.absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Late</p>
                <p className="text-2xl font-bold text-yellow-900">{attendanceStats.late}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Excused</p>
                <p className="text-2xl font-bold text-purple-900">{attendanceStats.excused}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Not Marked</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.notMarked}</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">?</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'mark' && (
              <>
                <UIButton
                  onClick={() => handleBulkMark('present')}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Mark All Present
                </UIButton>
                <UIButton
                  onClick={() => handleBulkMark('absent')}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Mark All Absent
                </UIButton>
              </>
            )}
            
            <UIButton
              onClick={handleExportReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </UIButton>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {filteredStudents.map(student => {
              const record = attendanceRecords.get(student.id);
              const status = record?.status;
              
              return (
                <div key={student.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.rollNumber} • {student.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status && (
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                      )}
                      
                      {activeTab === 'mark' && (
                        <div className="flex gap-1">
                          <UIButton
                            onClick={() => handleMarkAttendance(student.id, 'present')}
                            disabled={saving}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm"
                          >
                            P
                          </UIButton>
                          <UIButton
                            onClick={() => handleMarkAttendance(student.id, 'absent')}
                            disabled={saving}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                          >
                            A
                          </UIButton>
                          <UIButton
                            onClick={() => handleMarkAttendance(student.id, 'late')}
                            disabled={saving}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-sm"
                          >
                            L
                          </UIButton>
                          <UIButton
                            onClick={() => handleMarkAttendance(student.id, 'excused')}
                            disabled={saving}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                          >
                            E
                          </UIButton>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {record?.checkInTime && (
                    <div className="mt-2 text-sm text-gray-500">
                      Check-in: {record.checkInTime}
                      {record.notes && <span className="ml-2">• {record.notes}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <UIButton
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Close
          </UIButton>
        </div>
      </div>
    </ModalContainer>
  );
};

export default AttendanceManager;
