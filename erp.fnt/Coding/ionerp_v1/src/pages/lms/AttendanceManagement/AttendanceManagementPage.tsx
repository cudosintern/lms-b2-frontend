import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, 
  Search, Filter, Upload, Save, RefreshCw, 
  BookOpen, Layers, Edit3, ClipboardList, TrendingUp, Info,
  ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModalContainer from '../../../components/Modal/ModalContainer';
import Tabs from '../../../components/Tabs/Tabs';
import DataTable from '../../../components/Table/DataTable';

import {
    Student,
    AttendanceRecord,
    Course,
} from "./attendanceInterface";

import {
    initialStudents,
} from "./attendanceConstants";

import { attendanceApi } from "./attendanceApi";

import { timetableApi } from "./timetableApi";
import './attendanceManagement.css';




// ─── Component ────────────────────────────────────────────────────────────────
const AttendanceManagementPage: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Parse URL parameters for deep-linking from Timetable
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  // Filters
  const [filters, setFilters] = useState({
    batch: queryParams.get('curriculum') || '',
    semester: queryParams.get('term') || '',
    course: queryParams.get('courseId') || '',
    section: queryParams.get('section') || '',
    date: queryParams.get('date') || '',
    session: queryParams.get('session') || '',
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [isClassScheduled, setIsClassScheduled] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [selectedTimetableSession, setSelectedTimetableSession] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [sectionClasses, setSectionClasses] = useState<any[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState('');
  const [datesRetry, setDatesRetry] = useState(0);
  const studentRequest = React.useRef(0);
  const [classAttendanceState, setClassAttendanceState] = useState('');
  const [classAttendanceMessage, setClassAttendanceMessage] = useState('');
  const classLocked = classAttendanceState === 'finalized';
  const [showEnableConfirmation, setShowEnableConfirmation] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Dynamic Metadata State
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const res: any = await timetableApi.getCurriculums();
        console.log("Attendance: Curriculums fetched:", res);
        
        // Handle both {data: []} and [] formats
        const data = Array.isArray(res) ? res : (res.data || []);
        
        if (data.length > 0) {
          setCurriculums(data.map((curriculum: any) => ({
            ...curriculum,
            curriculum_id: curriculum.academic_batch_id ?? curriculum.curriculum_id,
            curriculum_name: curriculum.curriculum_name ?? curriculum.academic_batch_desc,
          })));
        } else {
          setCurriculums([]);
        }
      } catch (e) {
        console.error("Failed to fetch curriculums", e);
        setCurriculums([]);
      }
    };
    fetchCurriculums();

  }, []);

  // Fetch Terms when curriculum changes
  useEffect(() => {
    let cancelled = false;
    setTerms([]);
    if (filters.batch) {
      const fetchTerms = async () => {
        try {
          const curr = curriculums.find(c => c.curriculum_name === filters.batch);
          if (curr) {
            const res: any = await timetableApi.getTermsByCurriculum(curr.curriculum_id);
            console.log("Attendance: Terms fetched:", res);
            const data = Array.isArray(res) ? res : (res.data || []);
            
            if (!cancelled) setTerms(data);
          }
        } catch (e) {
          if (!cancelled) setTerms([]);
        }
      };
      fetchTerms();
    } else {
      setTerms([]);
    }
    return () => { cancelled = true; };
  }, [filters.batch, curriculums]);

  // Fetch courses for the selected curriculum and term.
  useEffect(() => {
    let cancelled = false;
    setAvailableCourses([]);
    setCoursesLoading(false);
    const curriculum = curriculums.find(c => c.curriculum_name === filters.batch);
    const selectedTerm = terms.find(t => t.term_name === filters.semester || String(t.term_id) === filters.semester);
    if (curriculum && selectedTerm) {
      setCoursesLoading(true);
      attendanceApi.getAttendanceCourses({
        academic_batch_id: Number(curriculum.curriculum_id),
        semester_id: Number(selectedTerm.semester_id ?? selectedTerm.term_id),
      }).then(response => {
        if (cancelled) return;
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('Unable to load courses for the selected term');
        }
        const courses: Course[] = response.data.map((course: any): Course => ({
          id: String(course.crs_id ?? course.course_id ?? course.id ?? ''),
          code: String(course.crs_code ?? course.course_code ?? course.code ?? ''),
          name: String(course.crs_title ?? course.crs_name ?? course.course_name ?? course.name ?? ''),
          type: course.type === 'Lab' ? 'Lab' : 'Theory',
        })).filter((course: Course) => course.id && course.name);
        setAvailableCourses(courses);
        setFilters(previous => previous.course && !courses.some(course => course.id === previous.course)
          ? { ...previous, course: '', session: '' } : previous);
      }).catch(error => {
        if (!cancelled) toast.error(error.message || 'Failed to load courses');
      }).finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    }
    return () => { cancelled = true; };
  }, [filters.batch, filters.semester, curriculums, terms]);

  // Fetch Sections when term changes
  useEffect(() => {
    let cancelled = false;
    setSections([]);
    if (filters.batch && filters.semester) {
      const fetchSections = async () => {
        try {
          const curr = curriculums.find(c => c.curriculum_name === filters.batch);
          const selectedTerm = terms.find(t => t.term_name === filters.semester || String(t.term_id) === filters.semester);
          if (curr && selectedTerm) {
            const academicBatchId = Number(curr.curriculum_id);
            const semesterId = Number(selectedTerm.term_id);
            const res: any = await timetableApi.getSectionsByCurriculumTerm(academicBatchId, semesterId);
            console.log("Attendance: Sections fetched:", res);
            const data = Array.isArray(res) ? res : (res.data || []);
            if (!cancelled) setSections(data);
          }
        } catch (e) {
          console.error("Failed to fetch sections", e);
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
    return () => { cancelled = true; };
  }, [filters.batch, filters.semester, curriculums, terms]);

  useEffect(() => {
    let cancelled = false;
    setScheduledDates([]);
    setSectionClasses([]);
    setDatesError('');
    setShowCalendar(false);
    setDatesLoading(false);
    const curriculum = curriculums.find(c => c.curriculum_name === filters.batch);
    const term = terms.find(t => t.term_name === filters.semester || String(t.term_id) === filters.semester);
    const section = sections.find(s => s.section_name === filters.section || String(s.section_id) === filters.section);
    if (curriculum && term && section && filters.course) {
      setDatesLoading(true);
      attendanceApi.getScheduledDates({
        academic_batch_id: Number(curriculum.curriculum_id),
        semester_id: Number(term.term_id),
        crs_id: Number(filters.course),
        section_id: Number(section.section_id),
      }).then(result => {
        if (cancelled) return;
        setScheduledDates(result.dates);
        setSectionClasses(result.classes);
        setFilters(previous => result.dates.includes(previous.date) ? previous : { ...previous, date: '', session: '' });
        if (result.dates.length) {
          const [year, month, day] = result.dates[0].split('-').map(Number);
          setViewDate(new Date(year, month - 1, day));
        }
      }).catch(error => {
        if (!cancelled) setDatesError(error.response?.data?.detail || error.message || 'Failed to load scheduled dates');
      }).finally(() => { if (!cancelled) setDatesLoading(false); });
    }
    return () => { cancelled = true; };
  }, [filters.batch, filters.semester, filters.course, filters.section, curriculums, terms, sections, datesRetry]);

  // Timezone-safe date string formatter (YYYY-MM-DD)
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hasSessionOnDate = (date: Date) => {
    return scheduledDates.includes(formatDateISO(date));
  };

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }, [students]);

  // A date populates classes; students load only after an explicit class selection.
  useEffect(() => {
    const sessions = !datesLoading && scheduledDates.includes(filters.date)
      ? sectionClasses.filter(sc => sc.class_date === filters.date).map(sc => ({
          ...sc, startTime: sc.start_time, endTime: sc.end_time,
          sessionId: String(sc.lls_id ? `lesson:${sc.lls_id}` : sc.tt_day_map_id ? `slot:${sc.tt_day_map_id}` : `${sc.class_date}:${sc.start_time}:${sc.end_time}`),
          sessionName: sc.batch_name || 'Regular Session',
        })) : [];
    setAvailableSessions(sessions);
    setIsClassScheduled(sessions.length > 0);
  }, [filters.course, filters.section, filters.batch, filters.semester, filters.date, sectionClasses, scheduledDates, datesLoading]);

  // When session selection changes
  useEffect(() => {
    const selected = availableSessions.find(s => s.sessionId === filters.session);
    setSelectedTimetableSession(selected || null);
    setStudents([]);
    setClassAttendanceState('');
    setClassAttendanceMessage('');
    setIsLoading(false);
    if (selected && filters.date) handleFetchStudents(selected);
    return () => { studentRequest.current++; };
  }, [filters.session, filters.date, availableSessions]);

  const handleFetchStudents = async (selected = selectedTimetableSession) => {
    if (!selected || !filters.session || !filters.course || !filters.section || !scheduledDates.includes(filters.date)) return;
    const curriculum = curriculums.find(c => c.curriculum_name === filters.batch);
    const term = terms.find(t => t.term_name === filters.semester || String(t.term_id) === filters.semester);
    const section = sections.find(s => s.section_name === filters.section || String(s.section_id) === filters.section);
    if (!curriculum || !term || !section) return;
    const requestId = ++studentRequest.current;
    setStudents([]);
    
    setIsLoading(true);
    try {
      const response = await attendanceApi.getClassStudents({
        academic_batch_id: Number(curriculum.curriculum_id), semester_id: Number(term.term_id),
        crs_id: Number(filters.course), section_id: Number(section.section_id), class_date: filters.date,
        start_time: selected.startTime, end_time: selected.endTime,
        lls_id: selected.lls_id ? Number(selected.lls_id) : undefined,
        tt_day_map_id: selected.tt_day_map_id ? Number(selected.tt_day_map_id) : undefined,
        tt_detail_id: selected.tt_detail_id ? Number(selected.tt_detail_id) : undefined,
        time_table_id: selected.time_table_id ? Number(selected.time_table_id) : undefined,
      });
      if (requestId !== studentRequest.current) return;
      setClassAttendanceState(response.state);
      setClassAttendanceMessage(response.message || '');
      {
        // Map backend student format to UI format
        const studentList = response.students.map((s: any) => ({
          id: s.student_id?.toString() || s.id?.toString() || '1',
          rollNumber: s.roll_number || s.usno || s.rollNumber || `STU${s.student_id || s.id}`,
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown Student',
          email: s.email || `student${s.student_id || s.id}@example.com`,
          section: s.section || filters.section,
          status: s.status as Student['status'],
          absentReason: s.remarks || '',
        }));

        setStudents(studentList);
        
      }
    } catch (error) {
      console.error("Fetch students error:", error);
      if (requestId === studentRequest.current) {
        setClassAttendanceMessage((error as any).response?.data?.detail || (error as any).message || 'Failed to load class attendance');
        toast.error('Failed to load class attendance');
      }
    } finally {
      if (requestId === studentRequest.current) setIsLoading(false);
    }
  };

  const handleMarkStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (classLocked || isLoading) return;
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status, absentReason: status !== 'absent' ? '' : s.absentReason } : s
    ));
  };

  const handleMarkAllPresent = () => {
    if (classLocked || isLoading) return;
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    toast.info("All students marked as present");
  };

  const handleSaveDraft = () => handleSaveAttendance('draft');

  const getSelectedClassPayload = () => {
    const curriculum = curriculums.find(c => c.curriculum_name === filters.batch);
    const term = terms.find(t => t.term_name === filters.semester || String(t.term_id) === filters.semester);
    const section = sections.find(s => s.section_name === filters.section || String(s.section_id) === filters.section);
    const selected = selectedTimetableSession;
    if (!curriculum || !term || !section || !selected) throw new Error("Select a scheduled class");
    return {
      academic_batch_id: Number(curriculum.curriculum_id), semester_id: Number(term.term_id),
      crs_id: Number(filters.course), section_id: Number(section.section_id), class_date: filters.date,
      start_time: selected.startTime, end_time: selected.endTime,
      lls_id: selected.lls_id ? Number(selected.lls_id) : undefined,
      tt_day_map_id: selected.tt_day_map_id ? Number(selected.tt_day_map_id) : undefined,
      tt_detail_id: selected.tt_detail_id ? Number(selected.tt_detail_id) : undefined,
      time_table_id: selected.time_table_id ? Number(selected.time_table_id) : undefined,
    };
  };

  const handleEnableAttendance = async () => {
    if (!showEnableConfirmation || !classLocked || isLoading) return;
    setIsLoading(true);
    try {
      await attendanceApi.enableClassAttendance(getSelectedClassPayload());
      setShowEnableConfirmation(false);
      setClassAttendanceState('draft');
      setClassAttendanceMessage('');
      toast.success('Attendance enabled for editing');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Unable to enable attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAttendance = async (state: 'draft' | 'finalized' = 'finalized') => {
    if (!selectedTimetableSession || !students.length || classLocked || isLoading) return;
    if (!filters.course || !filters.date) {
      toast.error("Please select a course and date");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await attendanceApi.markClassAttendance({
        ...getSelectedClassPayload(), state,
        students: students.map(s => ({ student_id: Number(s.id), status: s.status, remarks: s.absentReason || '' })),
      });
      if (response.success) {
        setClassAttendanceState(state);
        setClassAttendanceMessage('');
        if (state === 'draft') {
          toast.success('Attendance draft saved');
          return;
        }
        // Create frozen copy of attendance data for local storage
        const finalizedData = {
          courseId: filters.course,
          date: filters.date,
          section: filters.section,
          session: filters.session,
          curriculum: filters.batch,
          term: filters.semester,
          sessionStartTime: selectedTimetableSession?.startTime || '',
          sessionEndTime: selectedTimetableSession?.endTime || '',
          sessionName: selectedTimetableSession?.sessionName || '',
          students: students.map(s => ({
            studentId: s.id,
            rollNumber: s.rollNumber,
            usn: s.rollNumber,
            name: s.name,
            email: s.email,
            section: s.section,
            status: s.status,
            absentReason: s.absentReason || ''
          })),
          isClassScheduled: isClassScheduled,
          availableSessions: availableSessions,
          stats: {
            total: students.length,
            present: students.filter(s => s.status === 'present').length,
            absent: students.filter(s => s.status === 'absent').length
          },
          finalizedAt: new Date().toISOString(),
          type: 'finalized',
          attendance_status: 2 // 2 = Finalize
        };

        // Save to finalized attendance storage
        const existingFinalized = JSON.parse(localStorage.getItem('finalizedAttendance') || '[]');
        existingFinalized.push({
          ...finalizedData,
          id: Date.now().toString()
        });
        localStorage.setItem('finalizedAttendance', JSON.stringify(existingFinalized));
        
        console.log("✅ Attendance saved to database and frozen locally:", existingFinalized.length, "records");
        
        toast.success(`Attendance finalized ${finalizedData.stats.present} present, ${finalizedData.stats.absent} absent`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsLoading(false);
    }
  };



  const handleImportAttendance = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await attendanceApi.importAttendance(file);
      if (response.success) {
        handleFetchStudents(); // Refresh student list 
      }
    } catch (error) {
      toast.error("Failed to import attendance");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMarkAttendance = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#2c3e50] text-white px-4 py-2 rounded-t-lg shadow-sm">
        <h2 className="text-lg font-medium">Manage Student Attendance</h2>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6">
        <div className="attendance-filter-grid mb-6">
          {/* Curriculum */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Curriculum: <span className="text-red-600">*</span></label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.batch} 
              onChange={(e) => setFilters(f => ({ ...f, batch: e.target.value, semester: '', section: '', course: '', date: '', session: '' }))}>
              <option value="">Select Curriculum</option>
              {curriculums.map(c => <option key={c.curriculum_id} value={c.curriculum_name}>{c.curriculum_name}</option>)}
            </select>
          </div>
          
          {/* Term */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Term: <span className="text-red-600">*</span></label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.semester} 
              onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value, section: '', course: '', date: '', session: '' }))}
              disabled={!filters.batch}>
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.term_id} value={t.term_name}>{t.term_name}</option>)}
            </select>
          </div>
          
          {/* Course */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Course: <span className="text-red-600">*</span></label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.course} 
              onChange={(e) => setFilters(f => ({ ...f, course: e.target.value, date: '', session: '' }))}
              disabled={!filters.semester || coursesLoading || !availableCourses.length}>
              <option value="">{coursesLoading ? 'Loading courses...' : filters.semester && !availableCourses.length ? 'No courses available' : 'Select Course'}</option>
              {availableCourses.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>)}
            </select>
          </div>
          
          {/* Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Section: <span className="text-red-600">*</span></label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.section} 
              onChange={(e) => setFilters(f => ({ ...f, section: e.target.value, date: '', session: '' }))}
              disabled={!filters.semester}>
              <option value="">Select Section</option>
              {sections.length > 0 ? (
                sections.map(s => <option key={s.section_id} value={s.section_name}>{s.section_name}</option>)
              ) : (
                ['A'].map(s => <option key={s} value={s}>{s}</option>)
              )}
            </select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">Date: <span className="text-red-600">*</span></label>
            <div className="flex flex-col gap-2">
              {datesError && <p role="alert" className="text-sm text-red-700">{datesError} <button type="button" className="underline" onClick={() => setDatesRetry(value => value + 1)}>Retry</button></p>}
              <div className="relative">
                <button type="button" aria-label="Scheduled class date" aria-expanded={showCalendar}
                  disabled={!filters.section || datesLoading || !scheduledDates.length}
                  className="w-full flex items-center justify-between border border-slate-300 rounded px-3 py-2 text-sm bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => { if (!datesLoading && scheduledDates.length) { const day = filters.date || scheduledDates[0]; setViewDate(new Date(day + "T00:00:00")); setShowCalendar(!showCalendar); } }}
                >
                  <span className={filters.date ? "text-slate-900" : "text-slate-400"}>
                    {filters.date ? new Date(filters.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'DD-MM-YYYY'}
                  </span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </button>

                {showCalendar && (
                  <div className="absolute left-0 top-full mt-1 z-[90]" onKeyDown={e => { if (e.key === "Escape") setShowCalendar(false); }}>
                    <div className="bg-white shadow-2xl border border-slate-200 rounded-xl p-4 w-72 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <button aria-label="Previous month" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 hover:bg-slate-100 rounded">
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <h3 className="font-bold text-slate-800">
                          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button aria-label="Next month" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 hover:bg-slate-100 rounded">
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate-400 uppercase mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center">{d}</div>)}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 42 }).map((_, i) => {
                          const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i - firstDay + 1);
                          const dateStr = formatDateISO(date);
                          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                          const isSelected = filters.date === dateStr;
                          const hasSession = hasSessionOnDate(date);
                          
                          return (
                            <button
                              key={i}
                              aria-label={dateStr}
                              aria-pressed={isSelected}
                              disabled={Boolean(!filters.course || !hasSession)}
                              onClick={() => {
                                setFilters(f => ({ ...f, date: dateStr, session: '' }));
                                setShowCalendar(false);
                              }}
                              className={`
                                h-8 w-8 flex items-center justify-center rounded-lg text-xs transition-all
                                
                                ${isSelected ? 'underline underline-offset-4' : ''}
                                ${hasSession && filters.course ? 'text-green-700 font-bold' : ''}
                                ${Boolean(!filters.course || !hasSession) ? 'text-slate-300' : ''}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Class: <span className="text-red-600">*</span></label>
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <select aria-label="Class" disabled={!filters.date || !availableSessions.length || datesLoading}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={filters.session}
                    onChange={(e) => setFilters(f => ({ ...f, session: e.target.value }))}
                  >
                    <option value="">Select Class</option>
                    {availableSessions.map((s, idx) => (
                      <option key={s.sessionId || idx} value={s.sessionId}>
                        {s.startTime} - {s.endTime} ({s.sessionName})
                      </option>
                    ))}
                  </select>
                </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center justify-between mt-2">
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleImportAttendance} 
            />
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-[#337ab7] text-white rounded text-sm font-medium hover:bg-[#286090] transition-colors shadow-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import Attendance
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={!selectedTimetableSession || !students.length || classLocked || isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            {classLocked && <button onClick={() => setShowEnableConfirmation(true)} disabled={isLoading} className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded disabled:opacity-50">Enable Attendance</button>}
            <button onClick={() => handleSaveAttendance('finalized')} disabled={isLoading || classLocked || !students.length || !selectedTimetableSession} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:bg-slate-300 transition-all flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Finalize Attendance
            </button>

          </div>

          {isClassScheduled && selectedTimetableSession && (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase">
                Verified: {selectedTimetableSession.sessionName} ({selectedTimetableSession.startTime} - {selectedTimetableSession.endTime})
              </span>
            </div>
          )}
        </div>
      </div>

      {filters.date && filters.session && selectedTimetableSession && <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        <p role="status" className="p-4">{classAttendanceMessage || (classAttendanceState === 'finalized' ? 'Attendance finalized' : classAttendanceState === 'draft' ? 'Draft saved / In progress' : classAttendanceState === 'not_taken' ? 'Attendance not yet taken — students default to present' : '')}</p>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleMarkAllPresent} disabled={classLocked || isLoading || !students.length} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Mark All Present
            </button>

          </div>
          <div className="relative flex-grow max-w-sm flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Search:</span>
            <input type="text" className="w-full px-4 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-12 px-6 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          <div className="col-span-2">USN No.</div>
          <div className="col-span-3">Student Name</div>
          <div className="col-span-4 text-center">Attendance Status</div>
          <div className="col-span-2">Remark</div>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[600px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Fetching students list...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="grid grid-cols-12 px-6 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center text-sm">
                <div className="col-span-2 text-slate-600 font-medium">{student.rollNumber}</div>
                <div className="col-span-3 text-slate-800">{student.name}</div>
                <div className="col-span-4 flex items-center justify-center gap-1">
                  <span className="text-xs mr-2" aria-label={`Attendance for ${student.name}`}>{student.status === 'late' ? 'Late' : student.status === 'absent' ? 'Absent' : 'Present'}</span>
                  <button disabled={classLocked || isLoading} onClick={() => handleMarkStatus(student.id, 'present')} className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${student.status === 'present' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>Present</button>
                  <button disabled={classLocked || isLoading} onClick={() => handleMarkStatus(student.id, 'absent')} className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${student.status === 'absent' ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'}`}>Absent</button>
                </div>
                <div className="col-span-2 px-2">
                  <input type="text" disabled={classLocked || isLoading} placeholder="Add remark..." className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-300" value={student.absentReason || ''} onChange={(e) => {
                    const val = e.target.value;
                    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, absentReason: val } : s));
                  }} />
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
              {!filters.course || !filters.date ? (
                <p className="text-sm">Please select a course and date to load students.</p>
              ) : !isClassScheduled ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">No scheduled class found!</p>
                  <p className="text-xs text-slate-400 mt-1">Attendance data is only available for classes scheduled in the timetable.</p>
                </div>
              ) : (
                <p className="text-sm">No students found matching your criteria</p>
              )}
            </div>
          )}
        </div>
      </div>

      }
      {filters.date && filters.session && selectedTimetableSession && !isLoading && students.length > 0 && (
        <section className="attendance-summary" aria-labelledby="attendance-summary-title">
          <h3 id="attendance-summary-title">Attendance Summary</h3>
          <dl>
            <div><dt>Total Students:</dt><dd>{stats.total}</dd></div>
            <div><dt>Overall Present:</dt><dd>{stats.present + stats.late}</dd></div>
            <div><dt>Overall Absent:</dt><dd>{stats.absent}</dd></div>
          </dl>
        </section>
      )}

    </div>
  );

  return (
    <div className="attendance-management min-h-screen bg-slate-50/50 p-6 space-y-6 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase tracking-tighter">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span> Attendance Management
            <Link to="/attendance-reports" className="ml-4 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-100 transition-all">
              <BarChart3 className="w-3 h-3" /> View Reports
            </Link>
            <Link to="/timetable-calendar" className="ml-4 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-all">
              <Calendar className="w-3 h-3" /> View Timetable
            </Link>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage student presence, session topics, and academic progress.</p>
        </div>
      </div>

      <div className="mt-8">
        {renderMarkAttendance()}
      </div>

      <ModalContainer
        isOpen={showEnableConfirmation}
        onClose={() => { if (!isLoading) setShowEnableConfirmation(false); }}
        title="Enable Attendance"
        size="md"
      >
        <p className="text-sm text-slate-700">Are you sure you want to enable attendance?</p>
        <p className="mt-2 text-sm text-slate-600">Enabling attendance will allow you to modify attendance.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowEnableConfirmation(false)} disabled={isLoading} className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50">Cancel</button>
          <button onClick={handleEnableAttendance} disabled={isLoading} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-50">{isLoading ? 'Enabling...' : 'Yes, Enable Attendance'}</button>
        </div>
      </ModalContainer>

      {/* Import Attendance Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#2c3e50] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import Attendance</h2>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Curriculum</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.batch}
                    disabled
                  >
                    <option value="">{filters.batch || "Select Curriculum"}</option>
                    {curriculums.map(c => <option key={c.curriculum_id} value={c.curriculum_name}>{c.curriculum_name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Term</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.semester}
                    disabled
                  >
                    <option value="">{filters.semester || "Select Term"}</option>
                    {terms.map(t => <option key={t.term_id} value={t.term_name}>{t.term_name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Section</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.section}
                    disabled
                  >
                    <option value="">{filters.section || "Select Section"}</option>
                    {sections.length > 0 ? (
                      sections.map(s => <option key={s.section_id} value={s.section_name}>{s.section_name}</option>)
                    ) : (
                      ['A'].map(s => <option key={s} value={s}>{s}</option>)
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Course</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.course}
                    disabled
                  >
                    <option value="">{filters.course || "Select Course"}</option>
                    {availableCourses.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">From Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.date}
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">To Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50"
                    value={filters.date}
                    readOnly
                  />
                </div>
              </div>

              {/* Steps Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Steps to upload attendance</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Download the template and fill it with proper data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Upload the filled template in .xls format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Accept the uploaded data to import attendance</span>
                  </li>
                </ol>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-2">Drop your .xls file here or click to browse</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xls,.xlsx" 
                  onChange={handleImportAttendance} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t border-slate-200">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Accept .xls
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementPage;
