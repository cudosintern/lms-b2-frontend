import React, { useEffect, useState, useCallback } from "react";
import {
  getStudentDropdowns,
  getClassList,
  CurriculumOut,
  TermOut,
  CourseOut,
  SectionOut,
  ClassListItem,
} from "./myClassService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format "HH:MM:SS" → "HH:MM AM/PM" */
function formatTime(t: string | null): string {
  if (!t) return "—";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

/** Format "YYYY-MM-DD" → "DD-MM-YYYY" */
function fmtDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

/** Today as "YYYY-MM-DD" */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Stub: get logged-in student ID from localStorage / context ───────────────
// Replace this with however your app stores the current user.
function getStudentId(): number {
  //const raw = localStorage.getItem("student_id") || localStorage.getItem("user_id") || "0";
  return 1;
}

// ─── Component ────────────────────────────────────────────────────────────────
const MyClass: React.FC = () => {
  const studentId = getStudentId();

  // ── Dropdown options ─────────────────────────────────────────────────
  const [curriculumList, setCurriculumList] = useState<CurriculumOut[]>([]);
  const [termList,       setTermList]       = useState<TermOut[]>([]);
  const [courseList,     setCourseList]     = useState<CourseOut[]>([]);
  const [sectionList,    setSectionList]    = useState<SectionOut[]>([]);

  // ── Selected filter values ────────────────────────────────────────────
  const [selCurriculum, setSelCurriculum] = useState<number | "">("");
  const [selTerm,       setSelTerm]       = useState<number | "">("");
  const [selCourse,     setSelCourse]     = useState<number | "">("");
  const [selSection,    setSelSection]    = useState<number | "">("");
  const [selDate,       setSelDate]       = useState<string>(todayStr());

  // ── Table state ───────────────────────────────────────────────────────
  const [tableData,    setTableData]    = useState<ClassListItem[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [perPage,      setPerPage]      = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);

  // ── 1. Load curriculum on mount ───────────────────────────────────────
  useEffect(() => {
    console.log("Student ID:", studentId);
    if (!studentId) return;
    getStudentDropdowns(studentId)
      .then((res) => {
        console.log("Dropdown API:", res); // 👈 ADD THIS
        setCurriculumList(res.curriculum);
        // also seed terms with the unfiltered list
        setTermList(res.terms);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. When curriculum changes → reload terms ─────────────────────────
  useEffect(() => {
    setTermList([]);
    setSelTerm("");
    setCourseList([]);
    setSelCourse("");
    setSectionList([]);
    setSelSection("");
    setTableData([]);

    if (!selCurriculum || !studentId) return;

    getStudentDropdowns(studentId, Number(selCurriculum))
      .then((res) => setTermList(res.terms))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCurriculum]);

  // ── 3. When term changes → reload courses + sections ─────────────────
  useEffect(() => {
    setCourseList([]);
    setSelCourse("");
    setSectionList([]);
    setSelSection("");
    setTableData([]);

    if (!selTerm || !studentId) return;

    getStudentDropdowns(
      studentId,
      selCurriculum ? Number(selCurriculum) : undefined,
      Number(selTerm)
    )
      .then((res) => {
        setCourseList(res.courses);
        setSectionList(res.sections);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selTerm]);

  // ── 4. Load class list when all 5 filters are set ────────────────────
  const loadClassList = useCallback(async () => {
    if (!studentId || !selCourse || !selSection || !selTerm || !selDate) {
      setTableData([]);
      return;
    }
    setLoading(true);
    setCurrentPage(1);
    try {
      const res = await getClassList(
        studentId,
        Number(selCourse),
        Number(selSection),
        Number(selTerm),
        selDate
      );
      setTableData(res.classes);
    } catch (err) {
      console.error(err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, selCourse, selSection, selTerm, selDate]);

  // Auto-load whenever any filter changes (if all are filled)
  useEffect(() => {
    if (selCourse && selSection && selTerm && selDate) {
      loadClassList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCourse, selSection, selTerm, selDate]);

  // ── Filtered + paginated data ─────────────────────────────────────────
  const filtered = tableData.filter((row) => {
    const q = search.toLowerCase();
    return (
      (row.topic_title   ?? "").toLowerCase().includes(q) ||
      (row.course_name   ?? "").toLowerCase().includes(q) ||
      (row.section_name  ?? "").toLowerCase().includes(q) ||
      (row.portion_to_be_covered       ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const handlePageChange = (dir: "prev" | "next") => {
    setCurrentPage((p) => dir === "prev" ? Math.max(1, p - 1) : Math.min(totalPages, p + 1));
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Title bar */}
      <div style={S.titleBar}>
        <span style={S.titleText}>My Class List</span>
      </div>

      <div style={S.card}>
        {/* ── Filter row ── */}
        <div style={S.filterRow}>
          {/* Curriculum */}
          <div style={S.filterItem}>
            <label style={S.label}>
              Curriculum: <span style={S.req}>*</span>
            </label>
            <select
              style={S.select}
              value={selCurriculum}
              onChange={(e) => setSelCurriculum(Number(e.target.value) || "")}
            >
              <option value="">Select Curriculum</option>
              {curriculumList.map((c) => (
                <option key={c.academic_batch_id} value={c.academic_batch_id}>
                  {c.academic_batch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div style={S.filterItem}>
            <label style={S.label}>
              Term: <span style={S.req}>*</span>
            </label>
            <select
              style={{ ...S.select, background: !termList.length ? "#f5f5f5" : "#fff" }}
              value={selTerm}
              disabled={!termList.length}
              onChange={(e) => setSelTerm(Number(e.target.value) || "")}
            >
              <option value="">Select Term</option>
              {termList.map((t) => (
                <option key={t.semester_id} value={t.semester_id}>
                  {t.semester_name}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div style={{ ...S.filterItem, flex: "2 1 220px" }}>
            <label style={S.label}>
              Course: <span style={S.req}>*</span>
            </label>
            <select
              style={{ ...S.select, background: !courseList.length ? "#f5f5f5" : "#fff" }}
              value={selCourse}
              disabled={!courseList.length}
              onChange={(e) => setSelCourse(Number(e.target.value) || "")}
            >
              <option value="">Select Course</option>
              {courseList.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} — {c.course_title}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div style={{ ...S.filterItem, flex: "0 1 90px" }}>
            <label style={S.label}>
              Section: <span style={S.req}>*</span>
            </label>
            <select
              style={{ ...S.select, background: !sectionList.length ? "#f5f5f5" : "#fff" }}
              value={selSection}
              disabled={!sectionList.length}
              onChange={(e) => setSelSection(Number(e.target.value) || "")}
            >
              <option value="">Se</option>
              {sectionList.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={S.filterItem}>
            <label style={S.label}>
              Date: <span style={S.req}>*</span>
            </label>
            <div style={S.dateWrap}>
              <input
                type="date"
                style={S.dateInput}
                value={selDate}
                onChange={(e) => setSelDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Table toolbar ── */}
        <div style={S.tableToolbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>Show</span>
            <select
              style={S.perPageSelect}
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span style={{ fontSize: 13 }}>entries</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Search:</span>
            <input
              style={S.searchInput}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search..."
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr style={S.theadRow}>
                <th style={{ ...S.th, width: 60 }}>Sl No.</th>
                <th style={S.th}>Portion to be Covered</th>
                <th style={S.th}>Topic</th>
                <th style={S.th}>Class Time</th>
                <th style={S.th}>Video Link</th>
                <th style={{ ...S.th, width: 100 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={S.emptyCell}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                      <span style={S.spinner} />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={S.emptyCell}>
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const globalIdx = (safePage - 1) * perPage + idx + 1;
                  const timeStr =
                    row.start_time && row.end_time
                      ? `${formatTime(row.start_time)} – ${formatTime(row.end_time)}`
                      : row.start_time
                      ? formatTime(row.start_time)
                      : "—";

                  return (
                    <tr
                      key={idx}
                      style={{ background: idx % 2 === 0 ? "#fff" : "#f8f9fa" }}
                    >
                      <td style={S.td}>{globalIdx}</td>
                      {/* Portion to be Covered */}
                      <td style={{ ...S.td, textAlign: "left" }}>
                        {row.portion_to_be_covered ?? "—"}
                      </td>
                      {/* Topic */}
                      <td style={{ ...S.td, textAlign: "left" }}>
                        {row.topic_title ?? "—"}
                      </td>
                      {/* Class Time */}
                      <td style={S.td}>{timeStr}</td>
                      {/* Video Link */}
                      <td style={S.td}>
                        {row.video_link ? (
                          <a
                            href={row.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={S.link}
                          >
                            🔗 Open
                          </a>
                        ) : (
                          <span style={{ color: "#aaa" }}>—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td style={S.td}>
  <span
    style={{
      ...S.statusBadge,
      background:
        row.status === "Completed"
          ? "#28a745"   // GREEN
          : row.status === "Active"
          ? "#ffc107"   // YELLOW
          : "#dc3545",  // RED (Scheduled / Not started)
      color: row.status === "Active" ? "#000" : "#fff",
    }}
  >
    {row.status}
  </span>
</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        <div style={S.pagination}>
          <span style={{ fontSize: 13, color: "#555" }}>
            {filtered.length === 0
              ? "Showing 0 to 0 of 0 entries"
              : `Showing ${(safePage - 1) * perPage + 1} to ${Math.min(
                  safePage * perPage,
                  filtered.length
                )} of ${filtered.length} entries`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={{ ...S.pageBtn, opacity: safePage === 1 ? 0.5 : 1 }}
              disabled={safePage === 1}
              onClick={() => handlePageChange("prev")}
            >
              Previous
            </button>
            <button
              style={{ ...S.pageBtn, background: "#1a2e4a", color: "#fff" }}
              disabled
            >
              {safePage}
            </button>
            <button
              style={{ ...S.pageBtn, opacity: safePage === totalPages ? 0.5 : 1 }}
              disabled={safePage === totalPages}
              onClick={() => handlePageChange("next")}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:         { padding: "20px", fontFamily: "Segoe UI, sans-serif", background: "#f4f6f9", minHeight: "100vh" },
  titleBar:     { background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)", borderRadius: "6px 6px 0 0", padding: "14px 20px" },
  titleText:    { color: "#fff", fontSize: 17, fontWeight: 600 },
  card:         { background: "#fff", borderRadius: "0 0 6px 6px", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },

  // Filters
  filterRow:    { display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20, alignItems: "flex-end" },
  filterItem:   { display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" },
  label:        { fontSize: 12, fontWeight: 600, color: "#444" },
  req:          { color: "red" },
  select:       { border: "1px solid #ccc", borderRadius: 4, padding: "7px 28px 7px 10px", fontSize: 13, outline: "none", cursor: "pointer", width: "100%" },

  // Date
  dateWrap:     { display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" },
  dateInput:    { border: "none", padding: "7px 10px", fontSize: 13, outline: "none", flex: 1, background: "#fff" },

  // Table toolbar
  tableToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  perPageSelect:{ border: "1px solid #ccc", borderRadius: 4, padding: "3px 6px", fontSize: 13 },
  searchInput:  { border: "1px solid #ccc", borderRadius: 4, padding: "5px 10px", fontSize: 13, outline: "none" },

  // Table
  table:        { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  theadRow:     { background: "#e9ecef" },
  th:           { padding: "10px 12px", borderBottom: "2px solid #dee2e6", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap", color: "#333" },
  td:           { padding: "10px 12px", borderBottom: "1px solid #dee2e6", textAlign: "center", verticalAlign: "middle" },
  emptyCell:    { padding: "32px", textAlign: "center", color: "#888", fontSize: 14 },

  // Status badge
  statusBadge:  { background: "#28a745", color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 },

  // Link
  link:         { color: "#0056b3", textDecoration: "none", fontWeight: 500 },

  // Spinner
  spinner:      { display: "inline-block", width: 18, height: 18, border: "2px solid #ddd", borderTopColor: "#1a2e4a", borderRadius: "50%", animation: "spin 0.7s linear infinite" },

  // Pagination
  pagination:   { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, fontSize: 13 },
  pageBtn:      { padding: "4px 12px", border: "1px solid #dee2e6", borderRadius: 3, background: "#fff", cursor: "pointer", fontSize: 13 },
};

export default MyClass;
