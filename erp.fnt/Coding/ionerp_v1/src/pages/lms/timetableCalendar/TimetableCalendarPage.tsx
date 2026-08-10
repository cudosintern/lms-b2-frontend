import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/api";
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";

interface Curriculum { academic_batch_id: number; academic_batch_desc: string; academic_batch_code: string; academic_year?: string; }
interface Term { semester_id: number; semester: number; semester_desc: string; }
interface Course { crs_id: number; crs_code: string; crs_title: string; }
interface Section { section_id: number; section: string; }
interface ScheduledClass {
  lls_id?: number; crs_id?: number; plan_date?: string; start_time?: string; end_time?: string;
  section_id?: number; academic_batch_id?: number; semester_id?: number;
  id?: number; crs_code?: string; date?: string; status?: string; batch_name?: string;
  is_announcement?: boolean; description?: string;
}

interface Announcement {
    id: number; description: string; delivery_date: string | null;
    delivery_time: string | null; created_at: string; seen_flag: number;
}

const QUIZ_META = "/api/v1/manage-quiz";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CLASS_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800",
  "bg-green-100 border-green-400 text-green-800",
  "bg-purple-100 border-purple-400 text-purple-800",
  "bg-orange-100 border-orange-400 text-orange-800",
  "bg-pink-100 border-pink-400 text-pink-800",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const TimetableCalendarPage: React.FC = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Dropdowns
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);

  // Data
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected day modal
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const authState = (window as any).__AUTH_STATE__ || JSON.parse(localStorage.getItem('auth_state') || '{}');
  const userId = authState?.user_id ?? authState?.id ?? 1;

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res: any = await axiosInstance.get(`/api/v1/announcements/announcements/received/${userId}`);
      setAnnouncements(res.data?.data || []);
    } catch { 
      // Silently fail if announcements don't load
    }
  }, [userId]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // Load curriculums
  useEffect(() => {
    setLoadingBatch(true);
    const done1 = () => setLoadingBatch(false);
    axiosInstance.get(`${QUIZ_META}/meta/curriculums`)
      .then((r: any) => { setCurriculums(Array.isArray(r.data?.data) ? r.data.data : []); done1(); }, done1);
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setTerms([]); setSelectedTerm(""); setCourses([]); setSelectedCourse(""); setSections([]); setSelectedSection(""); return; }
    setLoadingTerm(true);
    const done2 = () => setLoadingTerm(false);
    axiosInstance.get(`${QUIZ_META}/meta/terms`, { params: { academic_batch_id: selectedBatch } })
      .then((r: any) => { setTerms(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedTerm(""); setCourses([]); setSelectedCourse(""); setSections([]); setSelectedSection(""); done2(); }, done2);
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setCourses([]); setSelectedCourse(""); setSections([]); setSelectedSection(""); return; }
    setLoadingCourse(true);
    const done3 = () => setLoadingCourse(false);
    axiosInstance.get(`${QUIZ_META}/meta/courses`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setCourses(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedCourse(""); setSections([]); setSelectedSection(""); done3(); }, done3);
  }, [selectedBatch, selectedTerm]);

  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setSections([]); setSelectedSection(""); return; }
    setLoadingSection(true);
    const done4 = () => setLoadingSection(false);
    axiosInstance.get(`${QUIZ_META}/meta/sections`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setSections(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedSection(""); done4(); }, done4);
  }, [selectedBatch, selectedTerm]);

  const fetchClasses = useCallback(async () => {
    // Only fetch when all required filters are selected
    if (!selectedBatch || !selectedTerm || !selectedSection) {
      setClasses([]);
      setError(null);
      return;
    }
    setLoading(true); setError(null);
    try {
      const params: any = {
        academic_batch_id: Number(selectedBatch),
        semester_id: Number(selectedTerm),
        section_id: Number(selectedSection),
      };
      const r: any = await axiosInstance.get("/api/v1/comman_function/scheduled-classes", { params });
      const d = r.data?.data ?? r.data;
      setClasses(Array.isArray(d) ? d : []);
    } catch {
      setError("Failed to load scheduled classes. Is the backend running?");
    } finally { setLoading(false); }
  }, [selectedBatch, selectedTerm, selectedSection]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // Calendar helpers
  const navMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Map classes to date string
  const classesByDate: Record<string, ScheduledClass[]> = {};
  classes.forEach(c => {
    const dateKey = (c.plan_date || c.date || "").substring(0, 10);
    if (dateKey) {
      if (!classesByDate[dateKey]) classesByDate[dateKey] = [];
      classesByDate[dateKey].push(c);
    }
  });

  // Merge announcements into the date map
  announcements.forEach(a => {
    const dateKey = (a.delivery_date || a.created_at || "").substring(0, 10);
    if (dateKey) {
      if (!classesByDate[dateKey]) classesByDate[dateKey] = [];
      classesByDate[dateKey].push({
        is_announcement: true,
        description: a.description,
        plan_date: dateKey,
        start_time: a.delivery_time || "12:00:00",
        id: a.id
      });
    }
  });

  // Build calendar grid (weeks)
  const calendarDays: Array<{ day: number | null; dateStr: string }> = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push({ day: null, dateStr: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr });
  }
  // Pad end
  while (calendarDays.length % 7 !== 0) calendarDays.push({ day: null, dateStr: "" });
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) weeks.push(calendarDays.slice(i, i + 7));

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Classes on selected day for modal
  const selectedDayClasses = selectedDay ? (classesByDate[selectedDay] || []) : [];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5 flex justify-between items-center">
          <h1 className="text-sm font-semibold">Time Table Calendar</h1>
          <button onClick={fetchClasses} disabled={loading}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="p-4">
          {/* Filter Row */}
          <div className="grid grid-cols-4 gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Curriculum <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} disabled={loadingBatch}>
                <option value="">{loadingBatch ? "Loading..." : "Select Curriculum"}</option>
                {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_desc} {c.academic_year || `(${c.academic_batch_code})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} disabled={!selectedBatch || loadingTerm}>
                <option value="">{loadingTerm ? "Loading..." : "Select Term"}</option>
                {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.semester} - {t.semester_desc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} disabled={!selectedTerm || loadingCourse}>
                <option value="">{loadingCourse ? "Loading..." : "Select Course"}</option>
                {courses.map(c => <option key={c.crs_id} value={c.crs_id}>{c.crs_title} ({c.crs_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedTerm || loadingSection}>
                <option value="">{loadingSection ? "Loading..." : "Select Section"}</option>
                {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section}</option>)}
              </select>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navMonth(-1)} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => navMonth(1)} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={goToday} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">today</button>
              <h2 className="text-base font-semibold text-gray-800 ml-2">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            </div>
            <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
              <button onClick={() => setViewMode("month")} className={`px-3 py-1 ${viewMode === "month" ? "bg-[#1f3a4f] text-white" : "hover:bg-gray-50 text-gray-700"}`}>month</button>
              <button onClick={() => setViewMode("week")} className={`px-3 py-1 border-l border-gray-300 ${viewMode === "week" ? "bg-[#1f3a4f] text-white" : "hover:bg-gray-50 text-gray-700"}`}>week</button>
              <button onClick={() => setViewMode("day")} className={`px-3 py-1 border-l border-gray-300 ${viewMode === "day" ? "bg-[#1f3a4f] text-white" : "hover:bg-gray-50 text-gray-700"}`}>day</button>
            </div>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-8 text-red-500 text-sm">
              <p>{error}</p>
              <button onClick={fetchClasses} className="mt-2 text-xs px-3 py-1 border border-red-300 rounded">Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          )}

          {/* Calendar Grid (Month View) */}
          {!loading && !error && viewMode === "month" && (
            <div className="border border-gray-200 rounded overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-[#1f3a4f]">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-white text-xs font-semibold py-2">{d}</div>
                ))}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-t border-gray-200">
                  {week.map((cell, di) => {
                    const isToday = cell.dateStr === todayStr;
                    const dayClasses = cell.dateStr ? (classesByDate[cell.dateStr] || []) : [];
                    return (
                      <div
                        key={di}
                        className={`min-h-[80px] border-l border-gray-200 p-1 ${cell.day ? "cursor-pointer hover:bg-blue-50" : "bg-gray-50"} ${isToday ? "bg-blue-50" : ""}`}
                        onClick={() => cell.dateStr && setSelectedDay(cell.dateStr)}
                      >
                        {cell.day && (
                          <>
                            <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-[#1f3a4f] text-white" : "text-gray-700"}`}>
                              {cell.day}
                            </div>
                            {dayClasses.slice(0, 2).map((cls, ci) => {
                              if (cls.is_announcement) {
                                return (
                                  <div key={`ann-${cls.id || ci}`} className="text-[10px] px-1 py-0.5 rounded border mb-0.5 truncate bg-amber-50 border-amber-300 text-amber-900 font-medium">
                                    📢 {cls.description || "Announcement"}
                                  </div>
                                );
                              }
                              const timeStr = cls.start_time ? cls.start_time.substring(0, 5) : "";
                              const colorClass = CLASS_COLORS[ci % CLASS_COLORS.length];
                              return (
                                <div key={cls.lls_id || ci} className={`text-[10px] px-1 py-0.5 rounded border mb-0.5 truncate ${colorClass}`}>
                                  {timeStr} {cls.crs_code || `Course ${cls.crs_id || ""}`}
                                </div>
                              );
                            })}
                            {dayClasses.length > 2 && (
                              <div className="text-[10px] text-gray-400 px-1">+{dayClasses.length - 2} more</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Week View (simplified) */}
          {!loading && !error && viewMode === "week" && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Week view — select a day in month view to drill down</p>
            </div>
          )}

          {/* Day View (simplified) */}
          {!loading && !error && viewMode === "day" && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Day view — click a day cell in month view to see details</p>
            </div>
          )}

          {/* Stats */}
          {!loading && !error && classes.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3">
                <div className="text-xl font-bold">{classes.length}</div>
                <div className="text-xs mt-0.5 opacity-80">Total Scheduled Classes</div>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3">
                <div className="text-xl font-bold">{new Set(classes.map(c => c.plan_date || c.date)).size}</div>
                <div className="text-xs mt-0.5 opacity-80">Days With Classes</div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3">
                <div className="text-xl font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</div>
                <div className="text-xs mt-0.5 opacity-80">Current View</div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && classes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No scheduled classes found for the selected filters.</p>
              <p className="text-xs mt-1">Select Curriculum, Term, Course and Section to load the timetable.</p>
            </div>
          )}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Classes on {selectedDay}</span>
              <button onClick={() => setSelectedDay(null)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {selectedDayClasses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No classes scheduled on this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayClasses.map((cls, i) => {
                    if (cls.is_announcement) {
                      return (
                        <div key={i} className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 shadow-sm transition-all hover:shadow-md group">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 group-hover:bg-amber-500 transition-colors"></div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            </div>
                            <span className="font-bold text-amber-900 tracking-wide text-[11px] uppercase tracking-wider">Announcement</span>
                          </div>
                          {/* Render HTML content safely and prevent it from overflowing or breaking the layout */}
                          <div 
                            className="text-sm text-gray-800 break-words ml-1 leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&_font]:!text-base" 
                            dangerouslySetInnerHTML={{ __html: cls.description || '' }} 
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md group ${CLASS_COLORS[i % CLASS_COLORS.length]}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-current opacity-60"></span>
                              {cls.crs_code || `Course ${cls.crs_id}`}
                            </div>
                            <div className="text-xs font-medium opacity-80 mt-2 flex items-center gap-1.5 ml-0.5">
                              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {cls.start_time?.substring(0, 5)} – {cls.end_time?.substring(0, 5)}
                            </div>
                          </div>
                          <div className="bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/20">
                            Class
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={() => setSelectedDay(null)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableCalendarPage;
