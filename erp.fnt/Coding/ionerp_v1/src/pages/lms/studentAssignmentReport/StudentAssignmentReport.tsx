import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { useTopicService } from "./topicService";
import { useStudentAssignmentReportService } from "./studentAssignmentReportService";
import DataTable from "../../../components/Table/DataTable";
import { toast } from "react-toastify";

interface StudentReportRow {
  id: number;
  student_usn: string;
  student_name: string;
  secured_marks: number;
}

const StudentAssignmentReport = () => {
  const topicService = useTopicService();
  const studentService = useStudentAssignmentReportService();
  
  const [filters, setFilters] = useState({
    curriculum: "",
    semester: "",
    course: "",
    section: "",
    assignment: ""
  });

  const [dropdownOptions, setDropdownOptions] = useState({
    curriculumOptions: [] as any[],
    semesterOptions: [] as any[],
    courseOptions: [] as any[],
    sectionOptions: [] as any[],
    assignmentOptions: [] as any[]
  });

  const [tableData, setTableData] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignmentLabel, setSelectedAssignmentLabel] = useState("");

  // 1. Load Curriculum & Semester (no dependencies)
  useEffect(() => {
    topicService.getCurriculumList().then((res: any) => {
      const dataArray = Array.isArray(res) ? res : res?.data || [];
      const options = dataArray.map((item: any) => ({
        value: item.value || item.id || item.academic_batch_id || "",
        label: item.label || item.name || item.academic_batch_name || `Batch ${item.id}`,
      }));
      setDropdownOptions((prev: any) => ({ ...prev, curriculumOptions: options }));
    }).catch(console.error);

    topicService.getSemesterList().then((res: any) => {
      const dataArray = Array.isArray(res) ? res : res?.data || [];
      const options = dataArray.map((item: any) => ({
        value: item.value || item.id || item.semester_id || "",
        label: item.label || item.name || item.semester_name || `Semester ${item.id}`,
      }));
      setDropdownOptions((prev: any) => ({ ...prev, semesterOptions: options }));
    }).catch(console.error);
  }, []);

  // 2. Load Courses (curriculum + semester)
  useEffect(() => {
    if (filters.curriculum && filters.semester) {
      topicService.getCourseList({
        curriculum_id: Number(filters.curriculum),
        semester_id: Number(filters.semester)
      }).then((res: any) => {
        const dataArray = Array.isArray(res) ? res : (res?.data || res?.courses || []);
        const options = dataArray.map((item: any) => ({
          value: item.value || item.course_id || item.crs_id || "",
          label: item.label || item.course_name || item.crs_title || `Course ${item.id}`,
        }));
        setDropdownOptions((prev: any) => ({ ...prev, courseOptions: options }));
      }).catch(console.error);
    } else {
      setDropdownOptions((prev: any) => ({ ...prev, courseOptions: [] }));
    }
  }, [filters.curriculum, filters.semester]);

  // 3. Load Sections (semester + optional curriculum/course)
  useEffect(() => {
    if (filters.semester) {
      const payload: any = { semester_id: Number(filters.semester) };
      if (filters.curriculum) payload.academic_batch_id = Number(filters.curriculum);
      if (filters.course) payload.course_id = Number(filters.course);

      topicService.getSectionList(payload).then((res: any) => {
        const dataArray = Array.isArray(res) ? res : (res?.data || res?.sections || []);
        const options = dataArray.map((item: any) => ({
          value: item.value || item.id || item.section_id || "",
          label: item.label || item.section || item.section_name || `Section ${item.id}`,
        }));
        setDropdownOptions((prev: any) => ({ ...prev, sectionOptions: options }));
      }).catch(console.error);
    } else {
      setDropdownOptions((prev: any) => ({ ...prev, sectionOptions: [] }));
    }
  }, [filters.semester, filters.curriculum, filters.course]);

  // 4. Load Assignments
  useEffect(() => {
    if (filters.course && filters.semester && filters.curriculum) {
      studentService.getAssignments(
        Number(filters.course),
        Number(filters.semester),
        Number(filters.curriculum)
      ).then((serviceResponse: any) => {
        const options = (serviceResponse || []).map((item: any) => ({
  value: Number(item.value),   // ✅ FORCE NUMBER
  label: item.label
}));
        setDropdownOptions((prev: any) => ({ ...prev, assignmentOptions: options }));
      }).catch((error: any) => {
        console.error("Assignment service error:", error);
        setDropdownOptions((prev: any) => ({ ...prev, assignmentOptions: [] }));
      });
    } else {
      setDropdownOptions((prev: any) => ({ ...prev, assignmentOptions: [] }));
    }
  }, [filters.course, filters.semester, filters.curriculum, filters.section]);

  // 5. Load Report when assignment is selected
  useEffect(() => {
  if (filters.assignment) {
    setLoading(true);

    studentService.getStudentReport(Number(filters.assignment))
      .then((data: any[]) => {
        console.log("FINAL TABLE DATA:", data);
        setTableData(data || []);
        setLoading(false);
      })
      .catch((error: any) => {
        console.error("Report error:", error);
        setTableData([]);
        setLoading(false);
      });

  } else {
    setTableData([]);
  }
}, [filters.assignment]);

  // Track selected assignment label for export
  useEffect(() => {
    if (filters.assignment) {
      const found = dropdownOptions.assignmentOptions.find(
        (o: any) => String(o.value) === String(filters.assignment)
      );
      setSelectedAssignmentLabel(found ? found.label : `Assignment ${filters.assignment}`);
    } else {
      setSelectedAssignmentLabel("");
    }
    console.log("TABLE DATA:", tableData);
  }, [filters.assignment, dropdownOptions.assignmentOptions]);

  // Export function - matches Image 3 format exactly
  const exportXLS = async () => {
    if (tableData.length === 0) {
      toast.warning("No data available for export. Please select an assignment first.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    // Row 1: Date of Export Report
    ws["A1"] = { v: "Date of Export Report", t: "s", s: { font: { bold: true } } };
    ws["B1"] = { v: new Date().toLocaleDateString("en-IN"), t: "s" };

    // Row 2: Assignment Name
    ws["A2"] = { v: "Assignment Name", t: "s", s: { font: { bold: true } } };
    ws["B2"] = { v: selectedAssignmentLabel, t: "s" };

    // Row 3: Headers
    ws["A3"] = { v: "USNO", t: "s", s: { font: { bold: true } } };
    ws["B3"] = { v: "Student Name", t: "s", s: { font: { bold: true } } };
    ws["C3"] = { v: "Marks", t: "s", s: { font: { bold: true } } };

    // Data rows starting from row 4
    tableData.forEach((row, index) => {
      const r = index + 4;
      ws[`A${r}`] = { v: row.student_usn, t: "s" };
      ws[`B${r}`] = { v: row.student_name, t: "s" };
      ws[`C${r}`] = { v: row.secured_marks, t: "n" };
    });

    // Set sheet range
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: tableData.length + 3, c: 2 }
    });

    // Column widths
    ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, "Assignment Report");
    XLSX.writeFile(wb, `Student_Assignment_Report_${selectedAssignmentLabel || "export"}.xlsx`);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, [field]: value };
      if (field === "curriculum" || field === "semester") {
        updatedFilters.course = "";
        updatedFilters.section = "";
        updatedFilters.assignment = "";
      } else if (field === "course") {
        updatedFilters.section = "";
        updatedFilters.assignment = "";
      } else if (field === "section") {
        updatedFilters.assignment = "";
      }
      return updatedFilters;
    });
  };

  const columnDefs = [
    {
      headerName: "Sl No",
      valueGetter: (params: any) => params.node.rowIndex + 1,
      width: 80,
      sortable: false,
      filter: false
    },
    {
      headerName: "Student USN",
      field: "student_usn",
      flex: 1,
      minWidth: 150
    },
    {
      headerName: "Student Name",
      field: "student_name",
      flex: 2,
      minWidth: 200
    },
    {
      headerName: "Marks",
      field: "secured_marks",
      width: 120
    }
  ];

  const allFiltersSelected =
    filters.curriculum &&
    filters.semester &&
    filters.course &&
    filters.section &&
    filters.assignment;

  return (
    <div className="p-6">
      <div
        className="text-white px-4 py-2 rounded-t-md font-semibold"
        style={{ backgroundColor: "#1f4e5f" }}
      >
        Student Assignment Report
      </div>

      <div className="border p-4 bg-white rounded-b-md">
        {/* Filter Row */}
        <div className="grid grid-cols-6 gap-3 items-end mb-6">
          {["curriculum", "semester", "course", "section", "assignment"].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field} <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                style={{ borderColor: "#ccc" }}
                value={filters[field as keyof typeof filters]}
                onChange={(e) => handleFilterChange(field as keyof typeof filters, e.target.value)}
              >
                <option value="">Select {field}</option>
                {(dropdownOptions[`${field}Options` as keyof typeof dropdownOptions] || []).map(
                  (option: any, idx: number) => (
                    <option key={idx} value={String(option.value)}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          ))}

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportXLS}
              disabled={!allFiltersSelected || tableData.length === 0}
              style={{
                backgroundColor: tableData.length > 0 && allFiltersSelected ? "green" : "#aaa",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                cursor: tableData.length > 0 && allFiltersSelected ? "pointer" : "not-allowed",
                fontWeight: 600,
                width: "100%"
              }}
            >
              Export XLS
            </button>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="text-center py-8">
            <div
              className="inline-block rounded-full border-b-2 border-blue-500 mx-auto"
              style={{
                width: 32,
                height: 32,
                borderWidth: 3,
                borderStyle: "solid",
                borderColor: "#e5e7eb",
                borderBottomColor: "#3b82f6",
                animation: "spin 0.8s linear infinite"
              }}
            />
            <p className="mt-2 text-gray-500">Loading report...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Always show DataTable with column headers */}
            <DataTable
              columnDefs={columnDefs}
              rowData={tableData}
              pagination
              pageSize={10}
            />

            
          </>
        )}
      </div>
    </div>
  );
};


export default StudentAssignmentReport;