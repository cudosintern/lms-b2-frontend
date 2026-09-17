import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getReportDates,
  AttendanceOption,
  AttendanceSummaryRow,
  fetchAttendanceCourses,
  fetchAttendanceCurriculums,
  fetchAttendanceSections,
  fetchAttendanceSummary,
  fetchAttendanceTerms,
} from "./studentAttendanceReportService";

interface FiltersState {
  curriculum: string;
  term: string;
  course: string;
  section: string;
  fromDate: string;
  toDate: string;
  onlyPresent: boolean;
}

interface LoadingState {
  curriculums: boolean;
  terms: boolean;
  courses: boolean;
  sections: boolean;
  summary: boolean;
}

const initialFilters: FiltersState = {
  curriculum: "",
  term: "",
  course: "",
  section: "",
  fromDate: "",
  toDate: "",
  onlyPresent: true,
};

const StudentAttendanceReport: React.FC = () => {
  const requestVersion = useRef(0);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [curriculumOptions, setCurriculumOptions] = useState<AttendanceOption[]>([]);
  const [termOptions, setTermOptions] = useState<AttendanceOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<AttendanceOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<AttendanceOption[]>([]);
  const [rows, setRows] = useState<AttendanceSummaryRow[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    curriculums: false,
    terms: false,
    courses: false,
    sections: false,
    summary: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [search, setSearch] = useState("");
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(row => `${row.usn} ${row.name}`.toLowerCase().includes(query));
  }, [rows, search]);

  useEffect(() => {
    let active = true;
    const loadCurriculums = async () => {
      setLoading((prev) => ({ ...prev, curriculums: true }));
      setErrorMessage("");

      try {
        const options = await fetchAttendanceCurriculums();
        if (active) setCurriculumOptions(options);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load curriculums";
        if (active) setErrorMessage(message);
      } finally {
        if (active) setLoading((prev) => ({ ...prev, curriculums: false }));
      }
    };

    loadCurriculums();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!filters.curriculum) {
      setLoading(prev => ({ ...prev, terms: false }));
      return;
    }

    const loadTerms = async () => {
      setLoading((prev) => ({ ...prev, terms: true }));
      setErrorMessage("");

      try {
        const options = await fetchAttendanceTerms(filters.curriculum);
        if (active) setTermOptions(options);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load terms";
        if (active) setErrorMessage(message);
      } finally {
        if (active) setLoading((prev) => ({ ...prev, terms: false }));
      }
    };

    loadTerms();
    return () => { active = false; };
  }, [filters.curriculum]);

  useEffect(() => {
    let active = true;
    setLoading(prev => ({ ...prev, courses: Boolean(filters.term) }));
    if (!filters.curriculum || !filters.term) return;
    fetchAttendanceCourses(filters.curriculum, filters.term)
      .then(options => { if (active) setCourseOptions(options); })
      .catch(error => { if (active) setErrorMessage(error.message); })
      .finally(() => { if (active) setLoading(prev => ({ ...prev, courses: false })); });
    return () => { active = false; };
  }, [filters.curriculum, filters.term]);

  useEffect(() => {
    let active = true;
    setLoading(prev => ({ ...prev, sections: Boolean(filters.course) }));
    if (!filters.curriculum || !filters.term || !filters.course) return;
    fetchAttendanceSections(filters.curriculum, filters.term, filters.course)
      .then(options => { if (active) setSectionOptions(options); })
      .catch(error => { if (active) setErrorMessage(error.message); })
      .finally(() => { if (active) setLoading(prev => ({ ...prev, sections: false })); });
    return () => { active = false; };
  }, [filters.curriculum, filters.term, filters.course]);

  const reportDates = useMemo(() => getReportDates(filters.fromDate, filters.toDate, filters.onlyPresent, rows), [filters.fromDate, filters.toDate, filters.onlyPresent, rows]);
  const canSearch = Boolean(
    filters.curriculum &&
      filters.term &&
      filters.course &&
      filters.section &&
      filters.fromDate &&
      filters.toDate
  );

  const resetReportState = () => {
    requestVersion.current++;
    setLoading(prev => ({ ...prev, summary: false }));
    setRows([]);
    setHasSearched(false);
    setSearch("");
    setErrorMessage("");
  };

  const handleCurriculumChange = (value: string) => {
    setFilters({
      ...initialFilters,
      curriculum: value,
    });
    setTermOptions([]);
    setCourseOptions([]);
    setSectionOptions([]);
    resetReportState();
  };

  const handleTermChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      term: value,
      course: "",
      section: "",
      fromDate: "",
      toDate: "",
    }));
    setCourseOptions([]);
    setSectionOptions([]);
    resetReportState();
  };

  const handleCourseChange = (value: string) => {
    setSectionOptions([]);
    setFilters((prev) => ({
      ...prev,
      course: value,
      section: "",
      fromDate: "",
      toDate: "",
    }));
    resetReportState();
  };

  const handleSectionChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      section: value,
      fromDate: "",
      toDate: "",
    }));
    resetReportState();
  };

  const handleDateChange = (field: "fromDate" | "toDate", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetReportState();
  };

  const [reload, setReload] = useState(0);
  useEffect(() => {
    const version = ++requestVersion.current;
    if (!canSearch) return;
    if (filters.fromDate > filters.toDate) {
      setErrorMessage("From Date cannot be later than To Date.");
      setRows([]);
      setHasSearched(false);
      return;
    }
    setLoading(prev => ({ ...prev, summary: true }));
    setErrorMessage("");
    setHasSearched(true);
    fetchAttendanceSummary({
      academic_batch_id: filters.curriculum, semester_id: filters.term,
      course_id: filters.course, section_id: filters.section,
      from_date: filters.fromDate, to_date: filters.toDate, only_present: false,
    }).then(result => {
      if (version === requestVersion.current) setRows(result);
    }).catch(error => {
      if (version === requestVersion.current) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load attendance");
        setRows([]);
      }
    }).finally(() => {
      if (version === requestVersion.current) setLoading(prev => ({ ...prev, summary: false }));
    });
    return () => { requestVersion.current++; };
  }, [canSearch, filters.curriculum, filters.term, filters.course, filters.section, filters.fromDate, filters.toDate, reload]);

  const renderOptions = (options: AttendanceOption[]) =>
    options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));

  return (
    <div style={styles.page}>
      <div style={styles.titleBar}>
        <span style={styles.titleText}>Student Attendance Report</span>
      </div>

      <div style={styles.card}>
        <div style={styles.filterGrid}>
          <div style={styles.filterItem}>
            <label style={styles.label}>
              Curriculum <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.curriculum}
              onChange={(event) => handleCurriculumChange(event.target.value)}
              disabled={loading.curriculums}
            >
              <option value="">
                {loading.curriculums ? "Loading curriculums..." : "Select curriculum"}
              </option>
              {renderOptions(curriculumOptions)}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Term <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.term}
              onChange={(event) => handleTermChange(event.target.value)}
              disabled={!filters.curriculum || loading.terms}
            >
              <option value="">{loading.terms ? "Loading terms..." : "Select term"}</option>
              {renderOptions(termOptions)}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Course <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.course}
              onChange={(event) => handleCourseChange(event.target.value)}
              disabled={!filters.term || loading.courses}
            >
              <option value="">{loading.courses ? "Loading courses..." : "Select course"}</option>
              {renderOptions(courseOptions)}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Section <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.section}
              onChange={(event) => handleSectionChange(event.target.value)}
              disabled={!filters.course || loading.sections}
            >
              <option value="">
                {loading.sections ? "Loading sections..." : "Select section"}
              </option>
              {renderOptions(sectionOptions)}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              From Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              style={styles.input}
              value={filters.fromDate}
              onChange={(event) => handleDateChange("fromDate", event.target.value)}
              disabled={!filters.section}
            />
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              To Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              style={styles.input}
              value={filters.toDate}
              onChange={(event) => handleDateChange("toDate", event.target.value)}
              disabled={!filters.section}
            />
          </div>
        </div>

        <div style={styles.actionsRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.onlyPresent}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  onlyPresent: event.target.checked,
                }))
              }
            />
            <span>Only Present Dates</span>
          </label>

          <button
            style={{
              ...styles.generateBtn,
              ...(canSearch && !loading.summary ? {} : styles.generateBtnDisabled),
            }}
            onClick={() => setReload(value => value + 1)}
            disabled={!canSearch || loading.summary}
          >
            {loading.summary ? "Generating..." : "Refresh"}
          </button>
        </div>

        {errorMessage ? <div role="alert" style={styles.errorBox}>{errorMessage}</div> : null}
      </div>

      <div style={styles.tableCard}>
        <div style={{ ...styles.tableHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Results</span>
          {rows.length > 0 && !loading.summary && <label style={styles.checkboxLabel}>
            Search:
            <input type="search" aria-label="Search students" style={styles.input} value={search} onChange={event => setSearch(event.target.value)} />
          </label>}
        </div>
        {loading.summary ? (
          <div style={styles.stateBox}>Loading attendance summary...</div>
        ) : rows.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeadCell}>USN</th>
                  <th style={styles.tableHeadCell}>Student Name</th>
                  <th style={styles.tableHeadCell}>Total Present (P)</th>
                  <th style={styles.tableHeadCell}>Total Absent (A)</th>
                  {reportDates.map(date => <th key={date} title={date} style={styles.tableHeadCell}>{date.slice(8)}/{date.slice(5, 7)}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td style={styles.tableCell}>{row.usn}</td>
                    <td style={styles.tableCell}>{row.name}</td>
                    <td style={{ ...styles.tableCell, textAlign: "center" }}>{row.present ? `${row.present}P` : "-"}</td>
                    <td style={{ ...styles.tableCell, textAlign: "center" }}>{row.absent ? `${row.absent}A` : "-"}</td>
                    {reportDates.map(date => <td key={date} style={{ ...styles.tableCell, whiteSpace: "nowrap" }}>{row.dates[date] || ""}</td>)}
                  </tr>
                ))}
                {visibleRows.length === 0 && <tr><td colSpan={4 + reportDates.length} style={styles.stateBox}>No matching students</td></tr>}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div style={styles.stateBox}>No data found</div>
        ) : (
          <div style={styles.stateBox}>
            Select the required filters and date range to load attendance.
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
    background: "#f4f6f9",
    minHeight: "100vh",
    fontFamily: "Segoe UI, sans-serif",
  },
  titleBar: {
    background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)",
    borderRadius: 6,
    padding: "14px 20px",
    marginBottom: 20,
  },
  titleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: 0.4,
  },
  card: {
    background: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    marginBottom: 4,
  },
  required: {
    color: "#d32f2f",
  },
  input: {
    border: "1px solid #ced4da",
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: 13,
    color: "#212529",
    background: "#fff",
    minHeight: 38,
  },
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#2f3b52",
    fontSize: 13,
    fontWeight: 500,
  },
  generateBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  generateBtnDisabled: {
    background: "#99c9a5",
    cursor: "not-allowed",
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: "#54627a",
  },
  errorBox: {
    marginTop: 12,
    background: "#fdecea",
    color: "#b42318",
    border: "1px solid #f5c2c0",
    borderRadius: 4,
    padding: "10px 12px",
    fontSize: 13,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  tableHeader: {
    background: "#f8fafc",
    color: "#1f2937",
    fontWeight: 600,
    fontSize: 14,
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  tableHeadCell: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f1f3f5",
    border: "1px solid #dee2e6",
    color: "#1f2937",
    fontWeight: 700,
  },
  tableCell: {
    padding: "12px 16px",
    border: "1px solid #dee2e6",
    color: "#374151",
  },
  stateBox: {
    padding: "28px 16px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },
};

export default StudentAttendanceReport;
