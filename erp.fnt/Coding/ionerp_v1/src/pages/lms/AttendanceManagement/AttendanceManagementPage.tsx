import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, 
  Search, Filter, Upload, Save, RefreshCw, 
  BookOpen, Layers, Edit3, ClipboardList, TrendingUp, Info,
  ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import Tabs from '../../../components/Tabs/Tabs';
import DataTable from '../../../components/Table/DataTable';

import {
    Student,
    AttendanceRecord,
    Course,
} from "./attendanceInterface";

import {
    mockBatches,
    mockSemesters,
    mockCourses,
    MOCK_TIMETABLE_SCHEDULE,
    initialStudents,
} from "./attendanceConstants";

import { attendanceApi } from "./attendanceApi";

import { timetableApi } from "./timetableApi";




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
  const [showImportModal, setShowImportModal] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const isDraftLoadingRef = React.useRef(false);

  // Dynamic Metadata State
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>(mockCourses); // Fallback to mockCourses initially

  // Initial Data Fetch
  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const res: any = await timetableApi.getCurriculums();
        console.log("Attendance: Curriculums fetched:", res);
        
        // Handle both {data: []} and [] formats
        const data = Array.isArray(res) ? res : (res.data || []);
        
        if (data.length > 0) {
          setCurriculums(data);
        } else {
          // Fallback to mock data if API is empty
          setCurriculums(mockBatches.map((name, i) => ({ curriculum_id: i + 1, curriculum_name: name })));
        }
      } catch (e) {
        console.error("Failed to fetch curriculums", e);
        setCurriculums(mockBatches.map((name, i) => ({ curriculum_id: i + 1, curriculum_name: name })));
      }
    };
    fetchCurriculums();

    // Load saved drafts from localStorage
    const drafts = JSON.parse(localStorage.getItem('attendanceDrafts') || '[]');
    setSavedDrafts(drafts);
  }, []);

  // Fetch Terms when curriculum changes
  useEffect(() => {
    if (filters.batch) {
      const fetchTerms = async () => {
        try {
          const curr = curriculums.find(c => c.curriculum_name === filters.batch);
          if (curr) {
            const res: any = await timetableApi.getTermsByCurriculum(curr.curriculum_id);
            console.log("Attendance: Terms fetched:", res);
            const data = Array.isArray(res) ? res : (res.data || []);
            
            if (data.length > 0) {
              setTerms(data);
            } else {
              setTerms(mockSemesters.map((name, i) => ({ term_id: i + 1, term_name: name })));
            }
          }
        } catch (e) {
          setTerms(mockSemesters.map((name, i) => ({ term_id: i + 1, term_name: name })));
        }
      };
      fetchTerms();
    } else {
      setTerms([]);
    }
  }, [filters.batch, curriculums]);

  // Fetch Sections when term changes
  useEffect(() => {
    if (filters.batch && filters.semester) {
      const fetchSections = async () => {
        try {
          const curr = curriculums.find(c => c.curriculum_name === filters.batch);
          if (curr) {
            const res: any = await timetableApi.getSectionsByCurriculumTerm(curr.curriculum_id, filters.semester);
            console.log("Attendance: Sections fetched:", res);
            const data = Array.isArray(res) ? res : (res.data || []);
            setSections(data);
          }
        } catch (e) {
          console.error("Failed to fetch sections", e);
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
  }, [filters.batch, filters.semester, curriculums]);

  // Timezone-safe date string formatter (YYYY-MM-DD)
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hasSessionOnDate = (date: Date) => {
    if (!filters.course) return false;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[date.getDay()];
    const daySchedule = MOCK_TIMETABLE_SCHEDULE[dayName as keyof typeof MOCK_TIMETABLE_SCHEDULE] || [];
    return daySchedule.some((s: any) => s.courseId === filters.course);
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

  // Load sessions and students based on filters
  useEffect(() => {
    if (filters.course && filters.date && !isDraftLoadingRef.current) {
      // Validate if current date actually has a session for this course
      const d = new Date(filters.date);
      if (!hasSessionOnDate(d) && filters.course) {
        // If date is invalid (no session), find next available date or clear it
        // For simplicity, we just clear date selection to guide the user
        // setFilters(f => ({ ...f, date: '' })); 
      }
      handleFetchStudents();
    } else if (!isDraftLoadingRef.current) {
      setStudents([]);
      setIsClassScheduled(false);
      setAvailableSessions([]);
      setSelectedTimetableSession(null);
    }
  }, [filters.course, filters.section, filters.batch, filters.semester, filters.date]);

  // When session selection changes
  useEffect(() => {
    if (availableSessions.length > 0 && filters.session) {
      const found = availableSessions.find(s => `${s.startTime} - ${s.endTime}` === filters.session);
      if (found) setSelectedTimetableSession(found);
    }
  }, [filters.session, availableSessions]);

  const handleFetchStudents = async () => {
    if (!filters.course || !filters.section || !filters.date) return;
    
    setIsLoading(true);
    try {
      const response = await attendanceApi.getStudentsForCourse(filters.course, filters.section);
      
      if (response.success && response.data) {
        // Map backend student format to UI format
        const studentList = (response.data as any[]).map((s: any) => ({
          id: s.student_id?.toString() || s.id?.toString() || '1',
          rollNumber: s.roll_number || s.usno || s.rollNumber || `STU${s.student_id || s.id}`,
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown Student',
          email: s.email || `student${s.student_id || s.id}@example.com`,
          section: s.section || filters.section,
          status: 'present' as const // Default to present for marking
        }));

        setStudents(studentList);
        
        // Handle session matching based on REAL timetable from backend
        const classDate = filters.date || new Date().toISOString().split('T')[0];
        const scResponse = await timetableApi.getScheduledClasses(filters.course, classDate, filters.section);
        const scheduledClasses: any[] = scResponse.data || [];

        if (scheduledClasses && scheduledClasses.length > 0) {
          // Map backend format (start_time, end_time) to session selector
          const sessions = scheduledClasses.map((sc: any) => ({
            ...sc,
            startTime: sc.start_time,
            endTime: sc.end_time,
            sessionName: sc.batch_name || "Regular Session"
          }));
          
          setAvailableSessions(sessions);
          setIsClassScheduled(true);
          
          const initialSession = queryParams.get('session') || `${sessions[0].startTime} - ${sessions[0].endTime}`;
          setFilters(f => ({ ...f, session: initialSession }));
        } else {
          setAvailableSessions([]);
          setIsClassScheduled(false);
          setSelectedTimetableSession(null);
        }
      }
    } catch (error) {
      console.error("Fetch students error:", error);
      toast.error("Failed to load students from server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status, absentReason: status !== 'absent' ? '' : s.absentReason } : s
    ));
  };

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    toast.info("All students marked as present");
  };

  const handleSaveDraft = () => {
    if (!filters.course || !filters.date) {
      toast.error("Please select a course and date");
      return;
    }

    const draftData = {
      courseId: filters.course,
      date: filters.date,
      section: filters.section,
      session: filters.session,
      curriculum: filters.batch,
      term: filters.semester,
      // Store complete session data for preservation
      sessionStartTime: selectedTimetableSession?.startTime || '',
      sessionEndTime: selectedTimetableSession?.endTime || '',
      sessionName: selectedTimetableSession?.sessionName || '',
      // Store complete student data for perfect preservation
      students: students.map(s => ({
        studentId: s.id,
        rollNumber: s.rollNumber,
        usn: s.rollNumber, // Alternative field
        name: s.name,
        email: s.email,
        section: s.section,
        status: s.status,
        absentReason: s.absentReason || ''
      })),
      // Store additional state for preservation
      isClassScheduled: isClassScheduled,
      availableSessions: availableSessions,
      // Store statistics for quick display
      stats: {
        total: students.length,
        present: students.filter(s => s.status === 'present').length,
        absent: students.filter(s => s.status === 'absent').length
      },
      attendance_status: 2 // 2 = Draft save
    };

    // Save to localStorage as draft
    const existingDrafts = JSON.parse(localStorage.getItem('attendanceDrafts') || '[]');
    existingDrafts.push({
      ...draftData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('attendanceDrafts', JSON.stringify(existingDrafts));
    setSavedDrafts(existingDrafts);

    toast.success(`Attendance saved as draft! ${students.length} students preserved exactly.`);
  };

  const handleLoadDraft = (draft: any) => {
    // Set flag to prevent API calls from overriding draft data
    isDraftLoadingRef.current = true;
    
    // Close drafts modal first
    setShowDrafts(false);
    
    // Set filters from draft - preserve exactly as saved
    const newFilters = {
      batch: draft.curriculum || '',
      semester: draft.term || '',
      course: draft.courseId || '',
      section: draft.section || '',
      date: draft.date || '',
      session: draft.session || ''
    };
    
    // Set students from draft - preserve ALL original data exactly
    const draftStudents = draft.students.map((s: any) => ({
      id: s.studentId || s.id,
      rollNumber: s.rollNumber || s.usn,
      name: s.name,
      email: s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      section: s.section || draft.section,
      status: s.status,
      absentReason: s.absentReason || ''
    }));

    // Update all state in a single batch to prevent API overrides
    setFilters(newFilters);
    setStudents(draftStudents);
    setIsClassScheduled(draft.isClassScheduled !== false);
    setAvailableSessions(draft.availableSessions || []);
    
    // Preserve session data if available
    if (draft.session && draft.session !== '') {
      setSelectedTimetableSession({
        sessionName: draft.sessionName || draft.session,
        startTime: draft.sessionStartTime || '',
        endTime: draft.sessionEndTime || ''
      });
    }
    
    // Reset flag after state updates
    setTimeout(() => {
      isDraftLoadingRef.current = false;
    }, 500);
    
    toast.success(`Draft loaded successfully! ${draft.stats?.present || 0} present, ${draft.stats?.absent || 0} absent - All data frozen and preserved.`);
  };

  const handleDeleteDraft = (draftId: string) => {
    const existingDrafts = JSON.parse(localStorage.getItem('attendanceDrafts') || '[]');
    const updatedDrafts = existingDrafts.filter((d: any) => d.id !== draftId);
    localStorage.setItem('attendanceDrafts', JSON.stringify(updatedDrafts));
    setSavedDrafts(updatedDrafts);
    toast.success("Draft deleted successfully!");
  };

  const handleSaveAttendance = async () => {
    if (!filters.course || !filters.date) {
      toast.error("Please select a course and date");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Saving attendance to database...");
      
      // Call the real API to save attendance
      // const response = await attendanceApi.markAttendance({
      //   courseId: filters.course,
      //   date: filters.date,
      //   section: filters.section,
      //   session: filters.session,
      //   curriculum: filters.batch,
      //   term: filters.semester,
      //   students: students.map(s => ({
      //     studentId: s.id,
      //     present: s.status === 'present',
      //     late: false, // No late option in current implementation
      //     absentReason: s.absentReason
      //   }))
      // });

      const attendanceData = students.map(s => ({
    studentId: s.id,
    courseId: filters.course,
    date: filters.date,
    status: s.status,
    checkInTime: s.status === "present"
        ? new Date().toTimeString().slice(0, 5)
        : undefined,
    markedBy: "current_user",
    notes: s.absentReason
}));
const response = await attendanceApi.markAttendance(attendanceData);
      
      if (response.success) {
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
          attendance_status: 1 // 1 = Finalize
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          {/* Curriculum */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Curriculum: *</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.batch} 
              onChange={(e) => setFilters(f => ({ ...f, batch: e.target.value, semester: '', section: '', course: '' }))}>
              <option value="">Select Curriculum</option>
              {curriculums.map(c => <option key={c.curriculum_id} value={c.curriculum_name}>{c.curriculum_name}</option>)}
            </select>
          </div>
          
          {/* Term */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Term: *</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.semester} 
              onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value, section: '', course: '' }))}
              disabled={!filters.batch}>
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.term_id} value={t.term_name}>{t.term_name}</option>)}
            </select>
          </div>
          
          {/* Course */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Course: *</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.course} 
              onChange={(e) => setFilters(f => ({ ...f, course: e.target.value }))}
              disabled={!filters.semester}>
              <option value="">Select Course</option>
              {availableCourses.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
            </select>
          </div>
          
          {/* Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Section: *</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={filters.section} 
              onChange={(e) => setFilters(f => ({ ...f, section: e.target.value }))}
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
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">Date & Session: *</label>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <div 
                  className="flex items-center justify-between border border-slate-300 rounded px-3 py-2 text-sm bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <span className={filters.date ? "text-slate-900" : "text-slate-400"}>
                    {filters.date ? new Date(filters.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'DD-MM-YYYY'}
                  </span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>

                {showCalendar && (
                  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setShowCalendar(false)}>
                    <div className="bg-white shadow-2xl border border-slate-200 rounded-xl p-4 w-72 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 hover:bg-slate-100 rounded">
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <h3 className="font-bold text-slate-800">
                          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 hover:bg-slate-100 rounded">
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
                              disabled={Boolean(!isCurrentMonth || !filters.course || !hasSession)}
                              onClick={() => {
                                setFilters(f => ({ ...f, date: dateStr }));
                                setShowCalendar(false);
                              }}
                              className={`
                                h-8 w-8 flex items-center justify-center rounded-lg text-xs transition-all
                                ${!isCurrentMonth ? 'text-transparent pointer-events-none' : ''}
                                ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400 ring-offset-1' : ''}
                                ${isCurrentMonth && !isSelected && hasSession && filters.course ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200 shadow-sm' : ''}
                                ${Boolean(isCurrentMonth && (!filters.course || !hasSession)) ? 'text-slate-200 blur-[0.5px] pointer-events-none opacity-30' : ''}
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

              {availableSessions.length > 0 && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <select 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={filters.session}
                    onChange={(e) => setFilters(f => ({ ...f, session: e.target.value }))}
                  >
                    {availableSessions.map((s, idx) => (
                      <option key={idx} value={`${s.startTime} - ${s.endTime}`}>
                        {s.startTime} - {s.endTime} ({s.sessionName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
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
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button 
              onClick={() => setShowDrafts(!showDrafts)}
              className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" /> View Drafts ({savedDrafts.length})
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleMarkAllPresent} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Mark All Present
            </button>
            <button onClick={handleSaveAttendance} disabled={isLoading || !filters.course} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:bg-slate-300 transition-all flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Finalize Attendance
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
                  <button onClick={() => handleMarkStatus(student.id, 'present')} className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${student.status === 'present' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>Present</button>
                  <button onClick={() => handleMarkStatus(student.id, 'absent')} className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${student.status === 'absent' ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'}`}>Absent</button>
                </div>
                <div className="col-span-2 px-2">
                  <input type="text" placeholder="Add remark..." className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-300" value={student.absentReason || ''} onChange={(e) => {
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

      {/* Drafts List */}
      {showDrafts && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Drafts Header */}
            <div className="bg-slate-800 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saved Attendance Drafts</h3>
              <button 
                onClick={() => setShowDrafts(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Drafts Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {savedDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No saved drafts found</p>
                  <p className="text-sm text-slate-400">Save attendance drafts to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedDrafts.slice().reverse().map((draft: any) => (
                    <div key={draft.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="font-semibold text-slate-900">
                              {draft.courseId} - {draft.section} - {draft.date}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {new Date(draft.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-700">Students:</span> {draft.students.length}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Present:</span> {draft.students.filter((s: any) => s.status === 'present').length}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Absent:</span> {draft.students.filter((s: any) => s.status === 'absent').length}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button 
                            onClick={() => handleLoadDraft(draft)}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Load
                          </button>
                          <button 
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 lg:p-10">
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
                    {availableCourses.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
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
