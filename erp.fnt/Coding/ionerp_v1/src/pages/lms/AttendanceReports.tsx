import React, { useState, useEffect } from 'react';
import ModalContainer from '../../components/Modal/ModalContainer';
import UIButton from '../../components/FormBuilder/fields/Button';
import { attendanceApi, AttendanceStats } from './AttendanceManagement/attendanceApi';
import { toast } from 'react-toastify';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  Filter,
  AlertCircle
} from 'lucide-react';

interface AttendanceReportsProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

interface ReportData {
  period: { startDate: string; endDate: string };
  summary: {
    totalClasses: number;
    uniqueStudents: number;
    averageAttendance: number;
  };
  dailyBreakdown: Record<string, { present: number; absent: number; late: number; excused: number }>;
  studentStats: AttendanceStats[];
}

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6'
};

const AttendanceReports: React.FC<AttendanceReportsProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [viewMode, setViewMode] = useState<'overview' | 'students' | 'trends'>('overview');

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await attendanceApi.getAttendanceReport(
        courseId,
        dateRange.startDate,
        dateRange.endDate
      );
      
      if (response.success) {
        setReportData(response.data as ReportData);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load report data';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Report loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'pdf') => {
    if (!reportData) return;
    
    try {
      if (format === 'csv') {
        const csvContent = generateDetailedCSV(reportData);
        downloadFile(csvContent, `attendance-report-${courseId}-${dateRange.startDate}-${dateRange.endDate}.csv`, 'text/csv');
      } else {
        // For PDF, you would typically use a library like jsPDF
        toast.info('PDF export coming soon!');
        return;
      }
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
      console.error('Export error:', err);
    }
  };

  const generateDetailedCSV = (data: ReportData) => {
    const headers = [
      'Date',
      'Present',
      'Absent', 
      'Late',
      'Excused',
      'Total',
      'Attendance Rate'
    ];
    
    const rows = Object.entries(data.dailyBreakdown).map(([date, breakdown]) => {
      const total = breakdown.present + breakdown.absent + breakdown.late + breakdown.excused;
      const rate = total > 0 ? ((breakdown.present / total) * 100).toFixed(1) : '0';
      
      return [
        date,
        breakdown.present,
        breakdown.absent,
        breakdown.late,
        breakdown.excused,
        total,
        `${rate}%`
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const prepareChartData = () => {
    if (!reportData) return [];
    
    return Object.entries(reportData.dailyBreakdown).map(([date, breakdown]) => ({
      date: new Date(date).toLocaleDateString(),
      ...breakdown,
      total: breakdown.present + breakdown.absent + breakdown.late + breakdown.excused,
      attendanceRate: ((breakdown.present / (breakdown.present + breakdown.absent + breakdown.late + breakdown.excused)) * 100).toFixed(1)
    }));
  };

  const preparePieData = () => {
    if (!reportData) return [];
    
    const totals = Object.values(reportData.dailyBreakdown).reduce(
      (acc, day) => ({
        present: acc.present + day.present,
        absent: acc.absent + day.absent,
        late: acc.late + day.late,
        excused: acc.excused + day.excused
      }),
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
    
    return [
      { name: 'Present', value: totals.present, color: COLORS.present },
      { name: 'Absent', value: totals.absent, color: COLORS.absent },
      { name: 'Late', value: totals.late, color: COLORS.late },
      { name: 'Excused', value: totals.excused, color: COLORS.excused }
    ].filter(item => item.value > 0);
  };

  if (loading) {
    return (
      <ModalContainer isOpen={isOpen} onClose={onClose} title="Attendance Reports" size="full">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading report data...</div>
        </div>
      </ModalContainer>
    );
  }

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Attendance Reports" size="full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{courseName}</h2>
            <p className="text-gray-600">Attendance reports and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <UIButton
              onClick={loadReportData}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Filter className="w-4 h-4" />
            </UIButton>
          </div>
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

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalClasses}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Students</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.summary.uniqueStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.summary.averageAttendance.toFixed(1)}%
                    </p>
                  </div>
                  {reportData.summary.averageAttendance >= 75 ? (
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Period</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Object.keys(reportData.dailyBreakdown).length} days
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {(['overview', 'students', 'trends'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      viewMode === mode
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Charts Section */}
            {viewMode === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Attendance Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Attendance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="present" fill={COLORS.present} />
                      <Bar dataKey="absent" fill={COLORS.absent} />
                      <Bar dataKey="late" fill={COLORS.late} />
                      <Bar dataKey="excused" fill={COLORS.excused} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance Distribution Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={preparePieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Attendance Rate Trend */}
            {viewMode === 'trends' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Rate Trend</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="attendanceRate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Attendance Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Export Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <UIButton
                onClick={() => handleExportReport('csv')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </UIButton>
              <UIButton
                onClick={() => handleExportReport('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </UIButton>
              <UIButton
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Close
              </UIButton>
            </div>
          </>
        )}
      </div>
    </ModalContainer>
  );
};

export default AttendanceReports;
