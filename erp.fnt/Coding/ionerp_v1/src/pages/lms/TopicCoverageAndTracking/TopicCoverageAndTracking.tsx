import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCurriculumList,
  getTerms,
  getCourses,
  getCourseTopics,
  exportPdf,
} from "./topicCoverageApi";

import {
  CurriculumOption,
  TermOption,
  SectionGroup,
  CourseItem,
  TopicItem,
  CourseTopicsResponse,
} from "./topicCoverageInterface";

// ─── Status color map ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  "LS not added": { bg: "#cce5ff", text: "#004085", badge: "#0056b3" },
  "Not started":  { bg: "#f8d7da", text: "#721c24", badge: "#c82333" },
  "In-progress":  { bg: "#fff3cd", text: "#856404", badge: "#e0a800" },
  "Completed":    { bg: "#d4edda", text: "#155724", badge: "#28a745" },
};

const getStatusBadgeColor = (status: string) =>
  STATUS_STYLES[status]?.badge ?? "#0056b3";

// ─── Course Topics Modal ──────────────────────────────────────────────────────
interface TopicModalProps {
  courseId: number;
  sectionId: number;
  academicBatchId: number;
  semesterId: number;
  courseCode: string;
  courseTitle: string;
  section: string;
  onClose: () => void;
}

const TopicModal: React.FC<TopicModalProps> = ({
  courseId, sectionId, academicBatchId, semesterId,
  courseCode, courseTitle, section, onClose,
}) => {
  const [topics, setTopics]   = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadTopics = async () => {
  try {
    setLoading(true);

    const data = await getCourseTopics(
      courseId,
      sectionId,
      academicBatchId,
      semesterId
    );

    console.log("🔥 Topics API:", data);

    if (Array.isArray(data)) {
      setTopics(data);
    } else if (Array.isArray(data?.topics)) {
      setTopics(data.topics);
    } else {
      setTopics([]);
    }

  } catch (err) {
    console.error(err);
    setTopics([]);
  } finally {
    setLoading(false);
  }
};

  loadTopics();
}, [courseId, sectionId, academicBatchId, semesterId]);

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={M.header}>
          <div>
            <div style={M.headerTitle}>
              {courseCode} — {courseTitle}
            </div>
            <div style={M.headerSub}>Section: {section}</div>
          </div>
          <button style={M.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Legend */}
        <div style={M.legend}>
          {Object.entries(STATUS_STYLES).map(([label, style]) => (
            <span key={label} style={{ ...M.legendBadge, background: style.badge }}>
              {label}
            </span>
          ))}
        </div>

        {/* Content */}
        <div style={M.body}>
          {loading ? (
            <div style={M.centered}>Loading topics...</div>
          ) : topics.length === 0 ? (
            <div style={M.centered}>No topics found for this course.</div>
          ) : (
            <table style={M.table}>
              <thead>
                <tr style={M.theadRow}>
                  <th style={M.th}>Sl No</th>
                  <th style={M.th}>Topic Code</th>
                  <th style={M.th}>Topic Title</th>
                  <th style={M.th}>Status</th>
                  <th style={M.th}>Conducted Dates</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t, idx) => {
                  const ss = STATUS_STYLES[t.status] ?? STATUS_STYLES["LS not added"];
                  return (
                    <tr key={t.topic_id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                      <td style={M.td}>{idx + 1}</td>
                      <td style={M.td}>{t.topic_code}</td>
                      <td style={{ ...M.td, textAlign: "left", maxWidth: 300 }}>{t.topic_title}</td>
                      <td style={M.td}>
                        <span style={{
                          background: ss.badge, color: "#fff",
                          padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={M.td}>
                        {t.class_dates.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                            {t.class_dates.map((d, di) => (
                              <span key={di} style={M.dateBadge}>{d}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#aaa", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────
interface CourseCardProps {
  course: CourseItem;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const ss = STATUS_STYLES[course.status] ?? STATUS_STYLES["Not started"];
  return (
    <div style={{ ...C.card, background: ss.bg, borderLeft: `4px solid ${ss.badge}` }}
      onClick={onClick}
    >
      <div style={C.cardTop}>
        <span style={{ ...C.courseCode, color: ss.text }}>{course.course_code}</span>
        <span style={C.arrow}>›</span>
      </div>
      <div style={C.courseTitle}>{course.course_title}</div>
      {course.instructor && (
        <div style={C.instructor}>{course.instructor}</div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const TopicCoverageAndTracking: React.FC = () => {
  const [curriculumList, setCurriculumList] = useState<CurriculumOption[]>([]);
  const [termList,       setTermList]       = useState<TermOption[]>([]);
  const [sections,       setSections]       = useState<SectionGroup[]>([]);

  const [selCurriculum, setSelCurriculum] = useState<number | "">("");
  const [selTerm,       setSelTerm]       = useState<number | "">("");

  const [loading,        setLoading]        = useState(false);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Collapsed sections — tracks which section names are collapsed
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Active modal
  const [activeModal, setActiveModal] = useState<{
    course: CourseItem;
    academicBatchId: number;
    semesterId: number;
  } | null>(null);


  // ── close export menu on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── 1. Load curriculum on mount ────────────────────────────────────
  useEffect(() => {
    getCurriculumList()
      .then((list) => {
        console.log("🔥 Curriculum List:", list);
        setCurriculumList(list);
        if (list.length > 0) setSelCurriculum(list[0].id);
      })
      .catch(console.error);
  }, []);

  // ── 2. Load terms when curriculum changes ─────────────────────────
  useEffect(() => {
    setTermList([]);
    setSelTerm("");
    setSections([]);
    if (!selCurriculum) return;

    getTerms(Number(selCurriculum))
      .then((list) => {
        setTermList(list);
        if (list.length > 0) setSelTerm(list[0].id);
      })
      .catch(console.error);
  }, [selCurriculum]);

  // ── 3. Load courses when term changes ─────────────────────────────
  const loadCourses = useCallback(async () => {
    if (!selCurriculum || !selTerm) return;
    setLoading(true);
    setSections([]);
    try {
      const data = await getCourses(Number(selCurriculum), Number(selTerm));
      setSections(data);
      // All sections expanded by default
      setCollapsedSections(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selCurriculum, selTerm]);

  useEffect(() => {
    if (selCurriculum && selTerm) loadCourses();
  }, [selTerm]);



  // ── Toggle section collapse ────────────────────────────────────────
  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) next.delete(sectionName);
      else next.add(sectionName);
      return next;
    });
  };
  

  // ── Export PDF ─────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setShowExportMenu(false);
    if (!selCurriculum || !selTerm) { toast("Please select Curriculum and Term first."); return; }
    setExportLoading(true);
    try {
      await exportPdf(Number(selCurriculum), Number(selTerm));
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={P.page}>
      {/* Title bar */}
      <div style={P.titleBar}>
        <span style={P.titleText}>Topic Coverage and Tracking</span>
      </div>

      {/* Controls row */}
      <div style={P.controlsRow}>
        {/* Dropdowns */}
        <div style={P.dropdownsLeft}>
          <div style={P.dropdownItem}>
            <label style={P.label}>
              Curriculum: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              style={P.select}
              value={selCurriculum}
              onChange={(e) => setSelCurriculum(Number(e.target.value))}
            >
              <option value="">Select Curriculum</option>
              {curriculumList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={P.dropdownItem}>
            <label style={P.label}>
              Term: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              style={{ ...P.select, background: !termList.length ? "#f5f5f5" : "#fff" }}
              value={selTerm}
              disabled={!termList.length}
              onChange={(e) => setSelTerm(Number(e.target.value))}
            >
              <option value="">Select Term</option>
              {termList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Export + Refresh */}
        <div style={P.rightBtns}>
          {/* Export dropdown */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button
              style={{ ...P.exportBtn, opacity: exportLoading ? 0.7 : 1 }}
              onClick={() => setShowExportMenu((p) => !p)}
              disabled={exportLoading || !sections.length}
            >
              {exportLoading ? "Exporting..." : "⬇ Export"} ▾
            </button>
            {showExportMenu && (
              <div style={P.exportMenu}>
                <div style={P.exportItem} onClick={handleExportPdf}>
                  <span style={{ marginRight: 6 }}>📄</span> pdf
                </div>
              </div>
            )}
          </div>

          {/* Refresh icon — refreshes course data only (not dropdowns) */}
          <button
            style={P.refreshBtn}
            title="Refresh data"
            onClick={loadCourses}
            disabled={loading}
          >
            {/* ↻ unicode refresh icon */}
            <span style={{ fontSize: 16, display: "block", lineHeight: 1 }}>↻</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      {sections.length > 0 && (
        <div style={P.legendRow}>
          {Object.entries(STATUS_STYLES).map(([label, style]) => (
            <span key={label} style={{ ...P.legendBadge, background: style.badge }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={P.loadingBox}>
          <div style={P.spinner} />
          <span style={{ color: "#555", fontSize: 14 }}>Loading courses...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && sections.length === 0 && selCurriculum && selTerm && (
        <div style={P.emptyBox}>
          No courses found for the selected Curriculum and Term.
        </div>
      )}

      {/* Sections */}
      {!loading && sections.map((sec) => {
        const isCollapsed = collapsedSections.has(sec.section);
        return (
          <div key={sec.section_id} style={P.sectionWrap}>
            {/* Section header — clickable to collapse/expand */}
            <div
              style={P.sectionHeader}
              onClick={() => toggleSection(sec.section)}
            >
              <span style={P.sectionTitle}>Section {sec.section}</span>
              <span style={{ ...P.sectionArrow, transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}>
                ›
              </span>
            </div>

            {/* Course cards grid */}
            {!isCollapsed && (
              <div style={P.cardsGrid}>
                {sec.courses.map((course) => (
                  <CourseCard
                    key={`${course.course_id}-${sec.section_id}`}
                    course={course}
                    onClick={() =>
                      setActiveModal({
                        course,
                        academicBatchId: Number(selCurriculum),
                        semesterId:      Number(selTerm),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Topic Detail Modal */}
      {activeModal && (
        <TopicModal
          courseId={activeModal.course.course_id}
          sectionId={activeModal.course.section_id}
          academicBatchId={activeModal.academicBatchId}
          semesterId={activeModal.semesterId}
          courseCode={activeModal.course.course_code}
          courseTitle={activeModal.course.course_title}
          section={activeModal.course.section}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

// Page
const P: Record<string, React.CSSProperties> = {
  page:         { padding: "20px", fontFamily: "Segoe UI, sans-serif", background: "#f4f6f9", minHeight: "100vh" },
  titleBar:     { background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)", borderRadius: "6px 6px 0 0", padding: "14px 20px", marginBottom: 0 },
  titleText:    { color: "#fff", fontSize: 18, fontWeight: 600 },
  controlsRow:  { background: "#fff", padding: "16px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #eee", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  dropdownsLeft:{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" },
  dropdownItem: { display: "flex", flexDirection: "column", gap: 4 },
  label:        { fontSize: 12, fontWeight: 600, color: "#444" },
  select:       { border: "1px solid #ccc", borderRadius: 4, padding: "7px 32px 7px 10px", fontSize: 13, minWidth: 220, outline: "none", cursor: "pointer" },
  rightBtns:    { display: "flex", gap: 8, alignItems: "center" },
  exportBtn:    { background: "#28a745", color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 },
  exportMenu:   { position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #ddd", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 500, minWidth: 110 },
  exportItem:   { padding: "10px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center" },
  refreshBtn:   { background: "#fff", border: "1px solid #ccc", borderRadius: 4, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" },
  legendRow:    { display: "flex", gap: 8, padding: "10px 20px", background: "#fff", borderBottom: "1px solid #eee", justifyContent: "flex-end" },
  legendBadge:  { color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 },
  loadingBox:   { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 40 },
  spinner:      { width: 24, height: 24, border: "3px solid #ddd", borderTopColor: "#1a2e4a", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  emptyBox:     { textAlign: "center" as const, padding: "40px 20px", color: "#888", fontSize: 14, background: "#fff", margin: "16px 0", borderRadius: 6, border: "2px dashed #ddd" },
  sectionWrap:  { background: "#fff", borderRadius: 6, marginTop: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  sectionHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", cursor: "pointer", userSelect: "none" as const, borderBottom: "1px solid #eee" },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#c17a00" },
  sectionArrow: { fontSize: 20, color: "#888", transition: "transform 0.2s ease", display: "inline-block" },
  cardsGrid:    { display: "flex", flexWrap: "wrap" as const, gap: 16, padding: "16px 20px" },
};

// Course Card
const C: Record<string, React.CSSProperties> = {
  card:       { width: 200, minHeight: 120, borderRadius: 6, padding: "12px 14px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", transition: "box-shadow 0.15s", userSelect: "none" as const },
  cardTop:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  courseCode: { fontWeight: 700, fontSize: 13 },
  arrow:      { fontSize: 18, color: "#888" },
  courseTitle:{ fontSize: 12, color: "#333", lineHeight: 1.4, marginBottom: 8, textAlign: "center" as const },
  instructor: { fontSize: 11, color: "#666", textAlign: "center" as const },
};

// Modal
const M: Record<string, React.CSSProperties> = {
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal:       { background: "#fff", borderRadius: 8, width: "90vw", maxWidth: 1000, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  header:      { background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: 700 },
  headerSub:   { color: "#ccc", fontSize: 12, marginTop: 2 },
  closeBtn:    { background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 0 },
  legend:      { display: "flex", gap: 8, padding: "10px 20px", borderBottom: "1px solid #eee", background: "#f8f9fa" },
  legendBadge: { color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 },
  body:        { overflowY: "auto" as const, flex: 1, padding: "16px 20px" },
  centered:    { textAlign: "center" as const, padding: "40px", color: "#888" },
  table:       { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  theadRow:    { background: "#f1f3f5" },
  th:          { padding: "10px 12px", borderBottom: "2px solid #dee2e6", fontWeight: 700, textAlign: "center" as const, whiteSpace: "nowrap" as const },
  td:          { padding: "10px 12px", borderBottom: "1px solid #dee2e6", textAlign: "center" as const, verticalAlign: "middle" as const },
  dateBadge:   { background: "#e2e8f0", color: "#444", fontSize: 11, padding: "2px 8px", borderRadius: 10 },
};

export default TopicCoverageAndTracking;
