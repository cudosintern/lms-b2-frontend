import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "react-toastify";
import {
  exportConsolidatedStudentMarks,
  fetchConsolidatedStudentMarksGraph,
  fetchConsolidatedStudentMarksReport,
  fetchMarksCourses,
  fetchMarksCurriculums,
  fetchMarksDepartments,
  fetchMarksSections,
  fetchMarksTerms,
} from "./consolidatedStudentMarksReportService";
import {
  ConsolidatedStudentMarksGraphData,
  ConsolidatedStudentMarksReportData,
  ConsolidatedStudentMarksRequest,
  MarksCourseOption,
  MarksCurriculumOption,
  MarksResolvedFilters,
  MarksSectionOption,
  MarksSelectOption,
  MarksTermOption,
} from "./consolidatedStudentMarksReport";
import { transformConsolidatedStudentMarks } from "./transformConsolidatedStudentMarks";

type ActiveTab = "report" | "graph";

interface FilterState {
  departmentId: number | null;
  academicBatchId: number | null;
  crclmTermId: number | null;
  sectionId: number | null;
  selectedCourseIds: number[];
  includeTotalMarks: boolean;
  useCustomRange: boolean;
  fromDate: string;
  toDate: string;
}

const initialFilters: FilterState = {
  departmentId: null,
  academicBatchId: null,
  crclmTermId: null,
  sectionId: null,
  selectedCourseIds: [],
  includeTotalMarks: true,
  useCustomRange: false,
  fromDate: "",
  toDate: "",
};

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: 38,
    fontSize: 13,
    borderColor: state.isFocused ? "#2563eb" : "#ced4da",
    boxShadow: "none",
    "&:hover": { borderColor: "#2563eb" },
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 9999,
    fontSize: 13,
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "#e8f0fe",
  }),
};

const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

const ConsolidatedStudentMarksReport: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [activeTab, setActiveTab] = useState<ActiveTab>("report");

  const [departmentOptions, setDepartmentOptions] = useState<MarksSelectOption[]>([]);
  const [curriculumOptions, setCurriculumOptions] = useState<MarksCurriculumOption[]>([]);
  const [termOptions, setTermOptions] = useState<MarksTermOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<MarksSectionOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<MarksCourseOption[]>([]);

  const [loading, setLoading] = useState({
    departments: false,
    curriculums: false,
    terms: false,
    sections: false,
    courses: false,
    report: false,
    graph: false,
    export: false,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [reportData, setReportData] = useState<ConsolidatedStudentMarksReportData | null>(null);
  const [graphData, setGraphData] = useState<ConsolidatedStudentMarksGraphData | null>(null);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<ConsolidatedStudentMarksRequest | null>(null);

  const selectedTerm = useMemo(
    () => termOptions.find((item) => item.crclm_term_id === filters.crclmTermId) ?? null,
    [filters.crclmTermId, termOptions],
  );

  const selectedCurriculum = useMemo(
    () => curriculumOptions.find((item) => item.academic_batch_id === filters.academicBatchId) ?? null,
    [curriculumOptions, filters.academicBatchId],
  );

  const selectedSection = useMemo(
    () => sectionOptions.find((item) => item.section_id === filters.sectionId) ?? null,
    [filters.sectionId, sectionOptions],
  );

  const selectedCourses = useMemo(
    () => courseOptions.filter((course) => filters.selectedCourseIds.includes(course.course_id)),
    [courseOptions, filters.selectedCourseIds],
  );

  const courseSelectOptions = useMemo<MarksSelectOption[]>(
    () =>
      courseOptions.map((course) => ({
        value: course.course_id,
        label: `${course.course_code} - ${course.course_title}`,
      })),
    [courseOptions],
  );

  const tableModel = useMemo(() => transformConsolidatedStudentMarks(reportData), [reportData]);

  const graphChartData = useMemo(
    () =>
      (graphData?.courses ?? []).map((course) => ({
        name: course.course_code,
        average: course.average_marks,
        highest: course.highest_marks,
        lowest: course.lowest_marks,
        pass: course.pass_count ?? 0,
        fail: course.fail_count ?? 0,
      })),
    [graphData],
  );

  useEffect(() => {
    const loadDepartments = async () => {
      setLoading((prev) => ({ ...prev, departments: true }));
      try {
        const departments = await fetchMarksDepartments();
        setDepartmentOptions(
          departments.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load departments";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, departments: false }));
      }
    };

    loadDepartments();
  }, []);

  useEffect(() => {
    setCurriculumOptions([]);
    setTermOptions([]);
    setSectionOptions([]);
    setCourseOptions([]);
    setReportData(null);
    setGraphData(null);
    setLastSubmittedPayload(null);
    setFilters((prev) => ({
      ...prev,
      academicBatchId: null,
      crclmTermId: null,
      sectionId: null,
      selectedCourseIds: [],
    }));

    const loadCurriculums = async () => {
      setLoading((prev) => ({ ...prev, curriculums: true }));
      try {
        const curriculums = await fetchMarksCurriculums(filters.departmentId);
        setCurriculumOptions(curriculums);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load curriculums";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, curriculums: false }));
      }
    };

    loadCurriculums();
  }, [filters.departmentId]);

  useEffect(() => {
    if (!filters.academicBatchId) {
      setTermOptions([]);
      setSectionOptions([]);
      setCourseOptions([]);
      return;
    }

    setTermOptions([]);
    setSectionOptions([]);
    setCourseOptions([]);
    setReportData(null);
    setGraphData(null);
    setLastSubmittedPayload(null);
    setFilters((prev) => ({
      ...prev,
      crclmTermId: null,
      sectionId: null,
      selectedCourseIds: [],
    }));

    const loadTerms = async () => {
      setLoading((prev) => ({ ...prev, terms: true }));
      try {
        const terms = await fetchMarksTerms(filters.academicBatchId!);
        setTermOptions(terms);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load terms";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, terms: false }));
      }
    };

    loadTerms();
  }, [filters.academicBatchId]);

  useEffect(() => {
    if (!filters.academicBatchId || !selectedTerm) {
      setSectionOptions([]);
      setCourseOptions([]);
      return;
    }

    setSectionOptions([]);
    setCourseOptions([]);
    setReportData(null);
    setGraphData(null);
    setLastSubmittedPayload(null);
    setFilters((prev) => ({
      ...prev,
      sectionId: null,
      selectedCourseIds: [],
    }));

    const requestParams = {
      academic_batch_id: filters.academicBatchId,
      semester_id: selectedTerm.semester_id ?? null,
      crclm_term_id: selectedTerm.crclm_term_id,
    };

    const loadDependencies = async () => {
      setLoading((prev) => ({ ...prev, sections: true, courses: true }));
      try {
        const [sections, courses] = await Promise.all([
          fetchMarksSections(requestParams),
          fetchMarksCourses(requestParams),
        ]);
        setSectionOptions(sections);
        setCourseOptions(courses);
        setFilters((prev) => ({
          ...prev,
          selectedCourseIds: courses.map((course) => course.course_id),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load sections and courses";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, sections: false, courses: false }));
      }
    };

    loadDependencies();
  }, [filters.academicBatchId, selectedTerm]);

  useEffect(() => {
    if (activeTab !== "graph" || !lastSubmittedPayload || graphData) {
      return;
    }

    const loadGraph = async () => {
      setLoading((prev) => ({ ...prev, graph: true }));
      try {
        const nextGraph = await fetchConsolidatedStudentMarksGraph(lastSubmittedPayload);
        setGraphData(nextGraph);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load graph";
        setErrorMessage(message);
      } finally {
        setLoading((prev) => ({ ...prev, graph: false }));
      }
    };

    loadGraph();
  }, [activeTab, graphData, lastSubmittedPayload]);

  const buildRequestPayload = (): ConsolidatedStudentMarksRequest | null => {
    if (!filters.academicBatchId || !selectedTerm || !filters.sectionId) {
      return null;
    }

    return {
      department_id: filters.departmentId,
      academic_batch_id: filters.academicBatchId,
      semester_id: selectedTerm.semester_id ?? null,
      crclm_term_id: selectedTerm.crclm_term_id,
      section_id: filters.sectionId,
      course_ids:
        filters.selectedCourseIds.length > 0 && filters.selectedCourseIds.length !== courseOptions.length
          ? filters.selectedCourseIds
          : null,
      include_total_marks: filters.includeTotalMarks,
      from_date: filters.useCustomRange && filters.fromDate ? filters.fromDate : null,
      to_date: filters.useCustomRange && filters.toDate ? filters.toDate : null,
    };
  };

  const validateBeforeGenerate = () => {
    if (!filters.departmentId) return "Department is required.";
    if (!filters.academicBatchId) return "Curriculum is required.";
    if (!selectedTerm) return "Term is required.";
    if (!filters.sectionId) return "Section is required.";
    if (filters.useCustomRange) {
      if (!filters.fromDate || !filters.toDate) return "Select both From Date and To Date for custom range.";
      if (filters.fromDate > filters.toDate) return "From Date cannot be later than To Date.";
    }
    return "";
  };

  const handleGenerate = async () => {
    const validationMessage = validateBeforeGenerate();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      toast.error(validationMessage);
      return;
    }

    const payload = buildRequestPayload();
    if (!payload) return;

    setLoading((prev) => ({ ...prev, report: true }));
    setErrorMessage("");

    try {
      const nextReport = await fetchConsolidatedStudentMarksReport(payload);
      setReportData(nextReport);
      setGraphData(null);
      setLastSubmittedPayload(payload);
      if (!nextReport.rows.length) {
        toast.info("No report rows were returned for the selected filters.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate report";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, report: false }));
    }
  };

  const handleExport = async () => {
    const payload = buildRequestPayload();
    if (!payload) {
      const message = "Select Department, Curriculum, Term, and Section before exporting.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setLoading((prev) => ({ ...prev, export: true }));
    try {
      const result = await exportConsolidatedStudentMarks({
        ...payload,
        format: "excel",
      });

      if (!result.export_ready) {
        toast.info(result.message || "Export is not ready yet.");
        return;
      }

      toast.success("Export is ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export report";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, export: false }));
    }
  };

  const resolveSummaryValue = (
    resolvedValue: string | number | null | undefined,
    fallbackValue: string | number | null | undefined,
  ) => resolvedValue ?? fallbackValue ?? "-";

  const renderEmptyCourseCell = (title?: string) => (
    <span style={styles.emptyCell} title={title}>
      {" "}
    </span>
  );

  const reportFiltersSummary = (resolved?: MarksResolvedFilters | null) => {
    if (!resolved) return null;

    const curriculumLabel = resolveSummaryValue(
      resolved.curriculum_name ?? resolved.academic_batch_name,
      selectedCurriculum?.name,
    );
    const termLabel = resolveSummaryValue(
      resolved.term_name,
      selectedTerm?.name ?? resolved.semester_number ?? resolved.semester_id,
    );
    const sectionLabel = resolveSummaryValue(resolved.section_name, selectedSection?.section_name);
    const selectedCourseCount =
      resolved.selected_course_ids.length > 0 ? resolved.selected_course_ids.length : filters.selectedCourseIds.length;

    return (
      <div style={styles.summaryStrip}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Curriculum</span>
          <span style={styles.summaryValue}>{curriculumLabel}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Term</span>
          <span style={styles.summaryValue}>{termLabel}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Section</span>
          <span style={styles.summaryValue}>{sectionLabel}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Selected Courses</span>
          <span style={styles.summaryValue}>{selectedCourseCount}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Include Total</span>
          <span style={styles.summaryValue}>{resolved.include_total_marks ? "Yes" : "No"}</span>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (loading.report) {
      return <div style={styles.stateBox}>Loading consolidated student marks...</div>;
    }

    if (!reportData || tableModel.rows.length === 0) {
      return (
        <div style={styles.stateBox}>
          Select the required filters and generate the report to view consolidated marks.
        </div>
      );
    }

    const includeTotal = reportData.filters.include_total_marks;

    return (
      <div style={styles.tableScroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.lockedHead }} rowSpan={2}>Sl. No</th>
              <th style={{ ...styles.th, ...styles.lockedHeadWide }} rowSpan={2}>USN</th>
              <th style={{ ...styles.th, ...styles.lockedHeadName }} rowSpan={2}>Student Name</th>
              {tableModel.headers.map((header) => (
                <th
                  key={`group-${header.courseId}`}
                  style={styles.courseGroupHead}
                  colSpan={Math.max(header.componentKeys.length, 1)}
                >
                  <div style={styles.courseCode}>{header.courseCode}</div>
                  <div style={styles.courseTitle}>{header.courseTitle}</div>
                </th>
              ))}
              {includeTotal && (
                <th style={styles.totalHead} rowSpan={2}>
                  Total
                </th>
              )}
            </tr>
            <tr>
              {tableModel.headers.map((header) => (
                <React.Fragment key={`sub-${header.courseId}`}>
                  {header.componentKeys.length > 0 ? (
                    header.componentKeys.map((componentKey) => (
                      <th key={componentKey} style={styles.subHead}>
                        {componentKey.split("::")[1]}
                      </th>
                    ))
                  ) : (
                    <th style={styles.subHead} title="No components configured for this course">
                      &nbsp;
                    </th>
                  )}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableModel.rows.map((row) => (
              <tr key={row.key}>
                <td style={styles.tdLocked}>{row.slNo}</td>
                <td style={styles.tdLockedWide}>{row.studentUsn}</td>
                <td style={styles.tdLockedName}>
                  <div style={styles.studentNameWrap}>
                    <span>{row.studentName}</span>
                    {row.studentIdentityStatus === "fallback" ? (
                      <span style={styles.identityFallbackBadge}>Identity fallback</span>
                    ) : null}
                  </div>
                </td>
                {tableModel.headers.map((header) => (
                  <React.Fragment key={`row-${row.key}-${header.courseId}`}>
                    {header.componentKeys.length > 0 ? (
                      header.componentKeys.map((componentKey) => (
                        <td key={`${row.key}-${componentKey}`} style={styles.td}>
                          {row.courseDataAvailability[header.courseId]
                            ? row.componentMarks[componentKey] ?? "-"
                            : renderEmptyCourseCell("Marks data is not available for this course")}
                        </td>
                      ))
                    ) : (
                      <td style={styles.td}>
                        {row.courseDataAvailability[header.courseId]
                          ? renderEmptyCourseCell("No components configured for this course")
                          : renderEmptyCourseCell("Marks data is not available for this course")}
                      </td>
                    )}
                  </React.Fragment>
                ))}
                {includeTotal && <td style={styles.tdGrandTotal}>{row.grandTotal}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGraph = () => {
    if (!lastSubmittedPayload) {
      return (
        <div style={styles.stateBox}>
          Generate the report first to load the consolidated marks graph.
        </div>
      );
    }

    if (loading.graph) {
      return <div style={styles.stateBox}>Loading graph...</div>;
    }

    if (!graphData || graphChartData.length === 0) {
      return <div style={styles.stateBox}>No graph data available for the selected filters.</div>;
    }

    return (
      <div style={styles.graphCard}>
        <div style={styles.graphSummaryGrid}>
          {graphData.courses.map((course) => (
            <div key={course.course_id} style={styles.metricTile}>
              <div style={styles.metricLabel}>{course.course_code}</div>
              <div style={styles.metricValue}>{course.average_marks.toFixed(2)}</div>
              <div style={styles.metricSubtext}>
                High {course.highest_marks} | Low {course.lowest_marks}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={graphChartData} margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" name="Average Marks" radius={[4, 4, 0, 0]}>
                {graphChartData.map((_, index) => (
                  <Cell key={`avg-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
              <Bar dataKey="highest" name="Highest Marks" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowest" name="Lowest Marks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.titleBar}>
        <span style={styles.titleText}>Consolidated Student Marks Report</span>
      </div>

      <div style={styles.card}>
        <div style={styles.filterGrid}>
          <div style={styles.filterItem}>
            <label style={styles.label}>
              Department <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.departmentId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  departmentId: event.target.value ? Number(event.target.value) : null,
                }))
              }
              disabled={loading.departments}
            >
              <option value="">{loading.departments ? "Loading departments..." : "Select department"}</option>
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Curriculum <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.academicBatchId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  academicBatchId: event.target.value ? Number(event.target.value) : null,
                }))
              }
              disabled={!filters.departmentId || loading.curriculums}
            >
              <option value="">{loading.curriculums ? "Loading curriculums..." : "Select curriculum"}</option>
              {curriculumOptions.map((option) => (
                <option key={option.academic_batch_id} value={option.academic_batch_id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Term <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.crclmTermId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  crclmTermId: event.target.value ? Number(event.target.value) : null,
                }))
              }
              disabled={!filters.academicBatchId || loading.terms}
            >
              <option value="">{loading.terms ? "Loading terms..." : "Select term"}</option>
              {termOptions.map((option) => (
                <option key={option.crclm_term_id} value={option.crclm_term_id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.label}>
              Section <span style={styles.required}>*</span>
            </label>
            <select
              style={styles.input}
              value={filters.sectionId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sectionId: event.target.value ? Number(event.target.value) : null,
                }))
              }
              disabled={!filters.crclmTermId || loading.sections}
            >
              <option value="">{loading.sections ? "Loading sections..." : "Select section"}</option>
              {sectionOptions.map((option) => (
                <option key={option.section_id} value={option.section_id}>
                  {option.section_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.filterItem, gridColumn: "span 2" }}>
            <label style={styles.label}>Course</label>
            <Select
              isMulti
              styles={selectStyles}
              options={courseSelectOptions}
              value={selectedCourses.map((course) => ({
                value: course.course_id,
                label: `${course.course_code} - ${course.course_title}`,
              }))}
              onChange={(values) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedCourseIds: values.map((item) => item.value),
                }))
              }
              isDisabled={!filters.crclmTermId || loading.courses}
              placeholder={loading.courses ? "Loading courses..." : "All selected"}
              closeMenuOnSelect={false}
            />
            <div style={styles.inlineHint}>
              {courseOptions.length > 0 && filters.selectedCourseIds.length === courseOptions.length
                ? "All courses selected"
                : `${filters.selectedCourseIds.length || 0} course(s) selected`}
            </div>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.includeTotalMarks}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  includeTotalMarks: event.target.checked,
                }))
              }
            />
            <span>Include Total Marks</span>
          </label>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                useCustomRange: !prev.useCustomRange,
                fromDate: !prev.useCustomRange ? prev.fromDate : "",
                toDate: !prev.useCustomRange ? prev.toDate : "",
              }))
            }
          >
            Custom Range
          </button>

          <button
            type="button"
            style={styles.exportButton}
            onClick={handleExport}
            disabled={loading.export || !filters.academicBatchId || !filters.crclmTermId || !filters.sectionId}
          >
            {loading.export ? "Exporting..." : "Export"}
          </button>

          <button
            type="button"
            style={styles.generateButton}
            onClick={handleGenerate}
            disabled={loading.report}
          >
            {loading.report ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {filters.useCustomRange && (
          <div style={styles.rangeRow}>
            <div style={styles.rangeField}>
              <label style={styles.label}>From Date</label>
              <input
                type="date"
                style={styles.input}
                value={filters.fromDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    fromDate: event.target.value,
                  }))
                }
              />
            </div>
            <div style={styles.rangeField}>
              <label style={styles.label}>To Date</label>
              <input
                type="date"
                style={styles.input}
                value={filters.toDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    toDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}

        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
      </div>

      <div style={styles.tabCard}>
        <div style={styles.tabRow}>
          <button
            type="button"
            style={activeTab === "report" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("report")}
          >
            Consolidated Student Marks Report
          </button>
          <button
            type="button"
            style={activeTab === "graph" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("graph")}
          >
            Consolidated Student Marks Graph
          </button>
        </div>

        {activeTab === "report"
          ? reportFiltersSummary(reportData?.filters)
          : reportFiltersSummary(graphData?.filters ?? reportData?.filters)}

        {activeTab === "report" ? renderTable() : renderGraph()}
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
    minWidth: 0,
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
    alignItems: "center",
    justifyContent: "flex-end",
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
    marginRight: "auto",
  },
  secondaryButton: {
    background: "#eef2ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: 4,
    padding: "9px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  exportButton: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  generateButton: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  rangeRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #edf2f7",
  },
  rangeField: {
    display: "flex",
    flexDirection: "column",
    minWidth: 180,
  },
  inlineHint: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
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
  tabCard: {
    background: "#fff",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  tabRow: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    flexWrap: "wrap",
  },
  tab: {
    border: "none",
    background: "transparent",
    padding: "14px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },
  activeTab: {
    border: "none",
    background: "#fff",
    padding: "14px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "#1d4ed8",
    borderBottom: "2px solid #1d4ed8",
  },
  summaryStrip: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    fontSize: 12,
    color: "#475569",
    background: "#f8fafc",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 130,
    padding: "8px 10px",
    borderRadius: 6,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1e293b",
  },
  stateBox: {
    padding: "32px 18px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "980px",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#edf2f7",
    color: "#1e293b",
    textAlign: "center",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  lockedHead: {
    minWidth: 80,
  },
  lockedHeadWide: {
    minWidth: 140,
  },
  lockedHeadName: {
    minWidth: 220,
  },
  courseGroupHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#dbeafe",
    color: "#1e3a8a",
    textAlign: "center",
    minWidth: 140,
  },
  courseCode: {
    fontWeight: 700,
    fontSize: 12,
  },
  courseTitle: {
    fontSize: 11,
    marginTop: 4,
    color: "#475569",
  },
  subHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#eff6ff",
    color: "#334155",
    textAlign: "center",
    minWidth: 110,
  },
  totalHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#dcfce7",
    color: "#166534",
    textAlign: "center",
    minWidth: 110,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#334155",
    verticalAlign: "middle",
  },
  tdLocked: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#0f172a",
    fontWeight: 600,
    background: "#fff",
    verticalAlign: "middle",
  },
  tdLockedWide: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "left",
    color: "#0f172a",
    fontWeight: 600,
    background: "#fff",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  tdLockedName: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "left",
    color: "#0f172a",
    background: "#fff",
    minWidth: 220,
    verticalAlign: "middle",
  },
  tdTotal: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#166534",
    background: "#f0fdf4",
    fontWeight: 600,
  },
  tdGrandTotal: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#166534",
    background: "#dcfce7",
    fontWeight: 700,
  },
  studentNameWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  identityFallbackBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  emptyCell: {
    display: "inline-block",
    minWidth: 12,
    minHeight: 18,
  },
  graphCard: {
    padding: 16,
  },
  graphSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  metricTile: {
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: 14,
    background: "#f8fafc",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1d4ed8",
    marginTop: 8,
  },
  metricSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  chartWrap: {
    width: "100%",
    height: 360,
  },
};

export default ConsolidatedStudentMarksReport;
