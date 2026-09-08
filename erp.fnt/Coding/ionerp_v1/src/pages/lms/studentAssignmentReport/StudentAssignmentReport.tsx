import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import { DropdownOption, StudentReportRow, useStudentAssignmentReportService } from "./studentAssignmentReportService";
import DataTable from "../../../components/Table/DataTable";
import { toast } from "react-toastify";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./studentAssignmentReport.css";

const fields = ["curriculum", "semester", "course", "section", "assignment"] as const;
type Field = typeof fields[number];
const emptyFilters: Record<Field, string> = { curriculum: "", semester: "", course: "", section: "", assignment: "" };
const emptyOptions: Record<Field, DropdownOption[]> = { curriculum: [], semester: [], course: [], section: [], assignment: [] };

const StudentAssignmentReport = () => {
  const service = useStudentAssignmentReportService();
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState(emptyOptions);
  const [tableData, setTableData] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // Only load the next level. Cleanup prevents old responses from replacing a new selection.
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const context = {
      academic_batch_id: Number(filters.curriculum), semester_id: Number(filters.semester),
      course_id: Number(filters.course), section_id: Number(filters.section),
    };
    const next = fields.find(field => !filters[field]);
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        if (!next) {
          const rows = await service.getStudentReport({ ...context, assignment_id: Number(filters.assignment) }, signal);
          if (!signal.aborted) setTableData(rows);
        } else {
          const rows = next === "curriculum" ? await service.getCurriculumList(signal)
            : next === "semester" ? await service.getSemesterList(context.academic_batch_id, signal)
            : next === "course" ? await service.getCourseList(context.academic_batch_id, context.semester_id, signal)
            : next === "section" ? await service.getSectionList(context, signal)
            : await service.getAssignments(context, signal);
          if (!signal.aborted) setOptions(prev => ({ ...prev, [next]: rows }));
        }
      } catch (err) {
        if (!signal.aborted) setError(err instanceof Error ? err.message : "Unable to load report. Please try again.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [filters, service, retry]);

  const handleFilterChange = (field: Field, value: string) => {
    const index = fields.indexOf(field);
    const updated = { ...filters, [field]: value };
    const updatedOptions = { ...options };
    fields.slice(index + 1).forEach(key => { updated[key] = ""; updatedOptions[key] = []; });
    setTableData([]);
    setError("");
    setOptions(updatedOptions);
    setFilters(updated);
  };

  const selectedAssignmentLabel = options.assignment.find(o => String(o.value) === filters.assignment)?.label || "";
  const canExport = !loading && !error && fields.every(field => filters[field]) && tableData.length > 0;
  const exportXLS = () => {
    if (!canExport) { toast.warning("Select an assignment with report data before exporting."); return; }
    const date = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }).replace(/\//g, "-");
    const ws = XLSX.utils.aoa_to_sheet([
      ["Date of Export Report", date],
      ["Assignment Name", selectedAssignmentLabel],
      ["USNO", "Student Name", "Marks"],
      ...tableData.map(row => [row.student_usn, row.student_name,
        row.secured_marks === null || row.secured_marks === "" ? "" :
          Number.isFinite(Number(row.secured_marks)) ? Number(row.secured_marks) : row.secured_marks]),
    ]);
    ws["!cols"] = [{ wch: 24 }, { wch: 40 }, { wch: 12 }];
    ["A1", "A2", "A3", "B3", "C3"].forEach(cell => { ws[cell].s = { font: { bold: true } }; });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assignment Report");
    const filename = selectedAssignmentLabel.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 100);
    XLSX.writeFile(wb, `Student_Assignment_Report_${filename || "export"}.xlsx`);
  };

  const columnDefs = [
    { headerName: "Sl No", valueGetter: (params: any) => params.node.rowIndex + 1, width: 80, sortable: false, filter: false },
    { headerName: "Student USN", field: "student_usn", flex: 1, minWidth: 150 },
    { headerName: "Student Name", field: "student_name", flex: 2, minWidth: 200 },
    { headerName: "Marks", field: "secured_marks", width: 120, valueFormatter: (params: any) => params.value ?? "—" },
  ];

  return (
    <div className="student-assignment-report p-6">
      <div className="text-white px-4 py-2 rounded-t-md font-semibold" style={{ backgroundColor: "#1f4e5f" }}>Student Assignment Report</div>
      <div className="border p-4 bg-white rounded-b-md">
        <div className="assignment-report-filters">
          {fields.map((field, index) => (
            <div key={field} className="assignment-report-field">
              <label htmlFor={`report-${field}`} className="block text-sm font-medium mb-1 capitalize">{field} <span className="text-red-600">*</span></label>
              <select id={`report-${field}`} className="w-full border rounded px-2 py-2 text-sm"
                value={filters[field]} disabled={fields.slice(0, index).some(key => !filters[key]) || options[field].length === 0}
                onChange={e => handleFilterChange(field, e.target.value)}>
                <option value="">Select {field}</option>
                {options[field].map(option => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
              </select>
            </div>
          ))}
          <button onClick={exportXLS} disabled={!canExport} className="rounded px-4 py-2 text-white font-semibold disabled:opacity-50" style={{ backgroundColor: "green" }}>Export XLS</button>
        </div>
        {error && <div role="alert" className="text-red-600 mb-4">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
        <div className="assignment-report-table">
          {loading ? <p role="status" className="text-center py-8">Loading...</p> : <DataTable columnDefs={columnDefs} rowData={tableData} pagination pageSize={10} />}
        </div>
        {!loading && !error && filters.assignment && tableData.length === 0 && <p role="status">No students found for this assignment and section.</p>}
      </div>
    </div>
  );
};

export default StudentAssignmentReport;
