import React, { useState, useEffect, useCallback } from "react";
import { attendanceStatusReportApi } from "./attendanceStatusReportApi";
import * as XLSX from "xlsx";

interface CurriculumItem {
  academic_batch_id: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  academic_year?: string;
}

const AttendanceStatusReportPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    (async () => {
      const res: any = await attendanceStatusReportApi.getCurriculums();
      if (res && res.items) {
        setCurriculums(res.items);
      } else if (res && res.data && res.data.items) {
        setCurriculums(res.data.items);
      }
    })();
  }, []);

  const fetchDetails = useCallback(async () => {
    if (!selectedCurriculum || !fromDate || !toDate) return;

    setLoading(true);
    setHasFetched(true);
    try {
      const res: any = await attendanceStatusReportApi.getDetails({
        academic_batch_id: Number(selectedCurriculum),
        from_date: fromDate,
        to_date: toDate,
      });

      if (res && res.items) {
        setRows(res.items);
      } else if (res && res.data && res.data.items) {
        setRows(res.data.items);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCurriculum, fromDate, toDate]);

  useEffect(() => {
    if (selectedCurriculum && fromDate && toDate) {
      if (fromDate <= toDate) {
        fetchDetails();
      }
    }
  }, [selectedCurriculum, fromDate, toDate, fetchDetails]);

  const exportToExcel = () => {
    if (!rows || rows.length === 0) return;

    const dataToExport = rows.map((row) => ({
      Course: `${row.crs_code} - ${row.crs_title}`,
      Section: row.section || "--",
      Faculty: row.faculty || "--",
      "Class Date": row.class_date,
      Status: row.attendance_status,
      Students: row.attendance_student_count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AttendanceStatus");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Attendance_Status_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "6px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#2c3e50",
            color: "#fff",
            padding: "10px 15px",
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Attendance Status Report
        </div>

        {/* Body */}
        <div style={{ padding: "15px" }}>
          {/* Filters Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
                <span style={{ color: "#333" }}>Curriculum:</span> *
              </label>
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "13px",
                  minWidth: "220px",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">-- Select Curriculum --</option>
                {curriculums.map((c) => (
                  <option key={c.academic_batch_id} value={c.academic_batch_id}>
                    {c.academic_batch_desc || c.academic_batch_code}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
                <span style={{ color: "#333" }}>From Date:</span> *
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "5px 8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "13px",
                  minWidth: "160px",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
                <span style={{ color: "#333" }}>To Date:</span> *
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "5px 8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "13px",
                  minWidth: "160px",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignSelf: "flex-end" }}>
              <button
                onClick={exportToExcel}
                disabled={loading || rows.length === 0}
                style={{
                  padding: "6px 16px",
                  backgroundColor: rows.length === 0 ? "#ccc" : "#4CAF50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: rows.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  height: "32px",
                }}
              >
                Export to XLS
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", border: "1px solid #eee" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #ddd" }}>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Section</th>
                  <th style={thStyle}>Faculty</th>
                  <th style={thStyle}>Date & Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "#666" }}>
                      Loading data...
                    </td>
                  </tr>
                ) : !hasFetched || rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "#666" }}>
                      No data found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}>{row.crs_code} - {row.crs_title}</td>
                      <td style={tdStyle}>{row.section || "--"}</td>
                      <td style={tdStyle}>{row.faculty || "--"}</td>
                      <td style={tdStyle}>
                        {row.class_date} <br/> 
                        <span style={{ color: row.attendance_status === "Attendance Marked" ? "green" : "orange" }}>
                          {row.attendance_status} ({row.attendance_student_count} students)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#333",
  borderRight: "1px solid #eee",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRight: "1px solid #eee",
};

export default AttendanceStatusReportPage;
