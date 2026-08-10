import React, { useEffect, useMemo, useState } from "react";
import {
  AttendanceOption,
  AttendanceSummaryRow,
  fetchAttendanceCourses,
  fetchAttendanceCurriculums,
  fetchAttendanceLessonDates,
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
  lessonDates: boolean;
  summary: boolean;
}

const initialFilters: FiltersState = {
  curriculum: "",
  term: "",
  course: "",
  section: "",
  fromDate: "",
  toDate: "",
  onlyPresent: false,
};

const StudentAttendanceReport: React.FC = () => {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [curriculumOptions, setCurriculumOptions] = useState<AttendanceOption[]>([]);
  const [termOptions, setTermOptions] = useState<AttendanceOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<AttendanceOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<AttendanceOption[]>([]);
  const [lessonDates, setLessonDates] = useState<string[]>([]);
  const [rows, setRows] = useState<AttendanceSummaryRow[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    curriculums: false,
    terms: false,
    courses: false,
    sections: false,
    lessonDates: false,
    summary: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadCurriculums = async () => {
      setLoading((prev) => ({ ...prev, curriculums: true }));
      setErrorMessage("");

      try {
        const options = await fetchAttendanceCurriculums();
        setCurriculumOptions(options);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load curriculums";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, curriculums: false }));
      }
    };

    loadCurriculums();
  }, []);

  useEffect(() => {
    if (!filters.curriculum) {
      return;
    }

    const loadTerms = async () => {
      setLoading((prev) => ({ ...prev, terms: true }));
      setErrorMessage("");

      try {
        const options = await fetchAttendanceTerms(filters.curriculum);
        setTermOptions(options);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load terms";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, terms: false }));
      }
    };

    loadTerms();
  }, [filters.curriculum]);

  useEffect(() => {
    if (!filters.curriculum || !filters.term) {
      return;
    }

    const loadTermDependencies = async () => {
      setLoading((prev) => ({ ...prev, courses: true, sections: true }));
      setErrorMessage("");

      try {
        const [sections, courses] = await Promise.all([
          fetchAttendanceSections(filters.curriculum, filters.term),
          fetchAttendanceCourses(filters.curriculum, filters.term),
        ]);

        setSectionOptions(sections);
        setCourseOptions(courses);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load courses and sections";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, courses: false, sections: false }));
      }
    };

    loadTermDependencies();
  }, [filters.curriculum, filters.term]);

  useEffect(() => {
    if (!filters.curriculum || !filters.term || !filters.course || !filters.section) {
      return;
    }

    const lessonDatePayload = {
      academic_batch_id: filters.curriculum,
      semester_id: filters.term,
      course_id: filters.course,
      section_id: filters.section,
    };

    console.log("[StudentAttendanceReport] Selected IDs", lessonDatePayload);

    const loadLessonDates = async () => {
      setLoading((prev) => ({ ...prev, lessonDates: true }));
      setErrorMessage("");

      try {
        const dates = await fetchAttendanceLessonDates(lessonDatePayload);
        setLessonDates(dates);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load lesson dates";
        setErrorMessage(message);
        setLessonDates([]);
      } finally {
        setLoading((prev) => ({ ...prev, lessonDates: false }));
      }
    };

    loadLessonDates();
  }, [filters.curriculum, filters.term, filters.course, filters.section]);

  const lessonDateSet = useMemo(() => new Set(lessonDates), [lessonDates]);
  const canSearch = Boolean(
    filters.curriculum &&
      filters.term &&
      filters.course &&
      filters.section &&
      filters.fromDate &&
      filters.toDate
  );

  const lessonDateRangeText = useMemo(() => {
    if (!lessonDates.length) {
      return "";
    }

    return `Available lesson dates: ${lessonDates[0]} to ${lessonDates[lessonDates.length - 1]}`;
  }, [lessonDates]);

  const resetReportState = () => {
    setRows([]);
    setHasSearched(false);
    setErrorMessage("");
  };

  const handleCurriculumChange = (value: string) => {
    console.log("[StudentAttendanceReport] Curriculum changed", { curriculumId: value });
    setFilters({
      ...initialFilters,
      curriculum: value,
    });
    setTermOptions([]);
    setCourseOptions([]);
    setSectionOptions([]);
    setLessonDates([]);
    resetReportState();
  };

  const handleTermChange = (value: string) => {
    console.log("[StudentAttendanceReport] Term changed", {
      curriculumId: filters.curriculum,
      termId: value,
    });
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
    setLessonDates([]);
    resetReportState();
  };

  const handleCourseChange = (value: string) => {
    console.log("[StudentAttendanceReport] Course changed", { courseId: value });
    setFilters((prev) => ({
      ...prev,
      course: value,
      fromDate: "",
      toDate: "",
    }));
    setLessonDates([]);
    resetReportState();
  };

  const handleSectionChange = (value: string) => {
    console.log("[StudentAttendanceReport] Section changed", { sectionId: value });
    setFilters((prev) => ({
      ...prev,
      section: value,
      fromDate: "",
      toDate: "",
    }));
    setLessonDates([]);
    resetReportState();
  };

  const handleDateChange = (field: "fromDate" | "toDate", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetReportState();
  };

  const validateDates = () => {
    if (filters.fromDate > filters.toDate) {
      return "From Date cannot be later than To Date.";
    }

    if (lessonDates.length > 0) {
      if (!lessonDateSet.has(filters.fromDate)) {
        return "From Date must be one of the available lesson dates.";
      }

      if (!lessonDateSet.has(filters.toDate)) {
        return "To Date must be one of the available lesson dates.";
      }
    }

    return "";
  };

  const handleSearch = async () => {
    const validationMessage = validateDates();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setRows([]);
      setHasSearched(false);
      return;
    }

    const payload = {
      academic_batch_id: filters.curriculum,
      semester_id: filters.term,
      course_id: filters.course,
      section_id: filters.section,
      from_date: filters.fromDate,
      to_date: filters.toDate,
      only_present: filters.onlyPresent,
    };

    console.log("[StudentAttendanceReport] Search payload", payload);

    setLoading((prev) => ({ ...prev, summary: true }));
    setErrorMessage("");
    setHasSearched(true);

    try {
      const summaryRows = await fetchAttendanceSummary(payload);
      setRows(summaryRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load attendance summary";
      setErrorMessage(message);
      setRows([]);
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }));
    }
  };

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
              disabled={!filters.term || loading.sections}
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
              min={lessonDates[0]}
              max={lessonDates[lessonDates.length - 1]}
              onChange={(event) => handleDateChange("fromDate", event.target.value)}
              disabled={!filters.section || loading.lessonDates}
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
              min={lessonDates[0]}
              max={lessonDates[lessonDates.length - 1]}
              onChange={(event) => handleDateChange("toDate", event.target.value)}
              disabled={!filters.section || loading.lessonDates}
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
            onClick={handleSearch}
            disabled={!canSearch || loading.summary}
          >
            {loading.summary ? "Generating..." : "Search / Generate"}
          </button>
        </div>

        {loading.lessonDates ? (
          <div style={styles.helperText}>Loading available lesson dates...</div>
        ) : lessonDateRangeText ? (
          <div style={styles.helperText}>{lessonDateRangeText}</div>
        ) : null}

        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>Results</div>
        {loading.summary ? (
          <div style={styles.stateBox}>Loading attendance summary...</div>
        ) : rows.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeadCell}>USN</th>
                  <th style={styles.tableHeadCell}>Student Name</th>
                  <th style={styles.tableHeadCell}>Present</th>
                  <th style={styles.tableHeadCell}>Absent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.usn}-${row.name}`}>
                    <td style={styles.tableCell}>{row.usn}</td>
                    <td style={styles.tableCell}>{row.name}</td>
                    <td style={styles.tableCell}>{row.present}</td>
                    <td style={styles.tableCell}>{row.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div style={styles.stateBox}>No data found</div>
        ) : (
          <div style={styles.stateBox}>
            Select the required filters and click Search / Generate.
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
    borderBottom: "1px solid #dee2e6",
    color: "#1f2937",
    fontWeight: 700,
  },
  tableCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #e9ecef",
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
