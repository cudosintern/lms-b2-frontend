// import React, { useState, useEffect, useCallback } from "react";
// import { attendanceStatusReportApi } from "./attendanceStatusReportApi";
// import * as XLSX from "xlsx";

// interface CurriculumItem {
//   academic_batch_id: number;
//   academic_batch_code?: string;
//   academic_batch_desc?: string;
//   academic_year?: string;
// }

// const AttendanceStatusReportPage: React.FC = () => {
//   const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
//   const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
//   const [fromDate, setFromDate] = useState<string>("");
//   const [toDate, setToDate] = useState<string>("");

//   const [rows, setRows] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [hasFetched, setHasFetched] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const res: any = await attendanceStatusReportApi.getCurriculums();
//       if (res && res.items) {
//         setCurriculums(res.items);
//       } else if (res && res.data && res.data.items) {
//         setCurriculums(res.data.items);
//       }
//     })();
//   }, []);

//   const fetchDetails = useCallback(async () => {
//     if (!selectedCurriculum || !fromDate || !toDate) return;

//     setLoading(true);
//     setHasFetched(true);
//     try {
//       const res: any = await attendanceStatusReportApi.getDetails({
//         academic_batch_id: Number(selectedCurriculum),
//         from_date: fromDate,
//         to_date: toDate,
//       });

//       if (res && res.items) {
//         setRows(res.items);
//       } else if (res && res.data && res.data.items) {
//         setRows(res.data.items);
//       } else {
//         setRows([]);
//       }
//     } catch (err) {
//       console.error(err);
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedCurriculum, fromDate, toDate]);

//   useEffect(() => {
//     if (selectedCurriculum && fromDate && toDate) {
//       if (fromDate <= toDate) {
//         fetchDetails();
//       }
//     }
//   }, [selectedCurriculum, fromDate, toDate, fetchDetails]);

//   const exportToExcel = () => {
//     if (!rows || rows.length === 0) return;

//     const dataToExport = rows.map((row) => ({
//       Course: `${row.crs_code} - ${row.crs_title}`,
//       Section: row.section || "--",
//       Faculty: row.faculty || "--",
//       "Class Date": row.class_date,
//       Status: row.attendance_status,
//       Students: row.attendance_student_count,
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "AttendanceStatus");

//     // Generate Excel file and trigger download
//     XLSX.writeFile(workbook, `Attendance_Status_Report_${fromDate}_to_${toDate}.xlsx`);
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
//       <div
//         style={{
//           border: "1px solid #ccc",
//           borderRadius: "6px",
//           backgroundColor: "#fff",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             backgroundColor: "#2c3e50",
//             color: "#fff",
//             padding: "10px 15px",
//             borderTopLeftRadius: "5px",
//             borderTopRightRadius: "5px",
//             fontWeight: 600,
//             fontSize: "14px",
//           }}
//         >
//           Attendance Status Report
//         </div>

//         {/* Body */}
//         <div style={{ padding: "15px" }}>
//           {/* Filters Row */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "30px",
//               marginBottom: "20px",
//               flexWrap: "wrap",
//             }}
//           >
//             <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//               <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
//                 <span style={{ color: "#333" }}>Curriculum:</span> *
//               </label>
//               <select
//                 value={selectedCurriculum}
//                 onChange={(e) => setSelectedCurriculum(e.target.value)}
//                 style={{
//                   padding: "6px",
//                   border: "1px solid #ccc",
//                   borderRadius: "4px",
//                   fontSize: "13px",
//                   minWidth: "220px",
//                   backgroundColor: "#fff",
//                 }}
//               >
//                 <option value="">-- Select Curriculum --</option>
//                 {curriculums.map((c) => (
//                   <option key={c.academic_batch_id} value={c.academic_batch_id}>
//                     {c.academic_batch_desc || c.academic_batch_code}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//               <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
//                 <span style={{ color: "#333" }}>From Date:</span> *
//               </label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 style={{
//                   padding: "5px 8px",
//                   border: "1px solid #ccc",
//                   borderRadius: "4px",
//                   fontSize: "13px",
//                   minWidth: "160px",
//                 }}
//               />
//             </div>

//             <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//               <label style={{ fontSize: "12px", color: "#d32f2f", fontWeight: 600 }}>
//                 <span style={{ color: "#333" }}>To Date:</span> *
//               </label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 style={{
//                   padding: "5px 8px",
//                   border: "1px solid #ccc",
//                   borderRadius: "4px",
//                   fontSize: "13px",
//                   minWidth: "160px",
//                 }}
//               />
//             </div>

//             <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignSelf: "flex-end" }}>
//               <button
//                 onClick={exportToExcel}
//                 disabled={loading || rows.length === 0}
//                 style={{
//                   padding: "6px 16px",
//                   backgroundColor: rows.length === 0 ? "#ccc" : "#4CAF50",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: "4px",
//                   cursor: rows.length === 0 ? "not-allowed" : "pointer",
//                   fontSize: "13px",
//                   fontWeight: 600,
//                   height: "32px",
//                 }}
//               >
//                 Export to XLS
//               </button>
//             </div>
//           </div>

//           {/* Table */}
//           <div style={{ overflowX: "auto", border: "1px solid #eee" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
//               <thead>
//                 <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #ddd" }}>
//                   <th style={thStyle}>Course</th>
//                   <th style={thStyle}>Section</th>
//                   <th style={thStyle}>Faculty</th>
//                   <th style={thStyle}>Date & Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "#666" }}>
//                       Loading data...
//                     </td>
//                   </tr>
//                 ) : !hasFetched || rows.length === 0 ? (
//                   <tr>
//                     <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "#666" }}>
//                       No data found.
//                     </td>
//                   </tr>
//                 ) : (
//                   rows.map((row, idx) => (
//                     <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
//                       <td style={tdStyle}>{row.crs_code} - {row.crs_title}</td>
//                       <td style={tdStyle}>{row.section || "--"}</td>
//                       <td style={tdStyle}>{row.faculty || "--"}</td>
//                       <td style={tdStyle}>
//                         {row.class_date} <br/> 
//                         <span style={{ color: row.attendance_status === "Attendance Marked" ? "green" : "orange" }}>
//                           {row.attendance_status} ({row.attendance_student_count} students)
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const thStyle: React.CSSProperties = {
//   padding: "8px 12px",
//   textAlign: "left",
//   fontWeight: 600,
//   color: "#333",
//   borderRight: "1px solid #eee",
// };

// const tdStyle: React.CSSProperties = {
//   padding: "8px 12px",
//   borderRight: "1px solid #eee",
// };

// export default AttendanceStatusReportPage;



import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  attendanceStatusReportApi,
  AttendanceStatusRow,
  MonthStatus,
  StatusBucket,
} from "./attendanceStatusReportApi";

interface CurriculumItem {
  academic_batch_id: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  academic_year?: string;
}

const STATUS_ORDER: Array<keyof MonthStatus> = ["Complete", "In-progress", "Not Started"];

const statusColor: Record<keyof MonthStatus, string> = {
  Complete: "#198754",
  "In-progress": "#fd7e14",
  "Not Started": "#6c757d",
};

const unwrap = (res: any) => res?.data ?? res ?? {};

const tooltipText = (bucket?: StatusBucket) => {
  if (!bucket?.classes?.length) return "";
  return bucket.classes
    .map((item) => `${item.date} ${item.start_time || ""}${item.end_time ? ` - ${item.end_time}` : ""}`.trim())
    .join("\n");
};

const AttendanceStatusReportPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<AttendanceStatusRow[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const payload = unwrap(await attendanceStatusReportApi.getCurriculums());
        setCurriculums(payload.items ?? []);
      } catch (e) {
        console.error(e);
        setCurriculums([]);
      }
    })();
  }, []);

  const validationError = useMemo(() => {
    if (!selectedCurriculum || !fromDate || !toDate) return "";
    if (fromDate >= toDate) return "To Date must be greater than From Date (minimum one-day range).";
    return "";
  }, [selectedCurriculum, fromDate, toDate]);

  const fetchDetails = useCallback(async () => {
    if (!selectedCurriculum || !fromDate || !toDate || fromDate >= toDate) return;

    setLoading(true);
    setHasFetched(true);
    setError("");
    try {
      const payload = unwrap(
        await attendanceStatusReportApi.getDetails({
          academic_batch_id: Number(selectedCurriculum),
          from_date: fromDate,
          to_date: toDate,
        })
      );
      setRows(payload.items ?? []);
      setMonths(payload.months ?? []);
    } catch (e: any) {
      console.error(e);
      setRows([]);
      setMonths([]);
      setError(e?.response?.data?.message || "Unable to load attendance status report.");
    } finally {
      setLoading(false);
    }
  }, [selectedCurriculum, fromDate, toDate]);

  useEffect(() => {
    if (selectedCurriculum && fromDate && toDate && fromDate < toDate) fetchDetails();
  }, [selectedCurriculum, fromDate, toDate, fetchDetails]);

  const groupedByTerm = useMemo(() => {
    const groups = new Map<string, AttendanceStatusRow[]>();
    rows.forEach((row) => {
      const key = row.term_name || "--";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    return Array.from(groups.entries());
  }, [rows]);

  const exportToExcel = () => {
    if (!rows.length) return;

    const exportRows = rows.map((row) => {
      const item: Record<string, string> = {
        Term: row.term_name || "--",
        Course: `${row.crs_code || ""} - ${row.crs_title || ""}`,
        Section: row.section || "--",
        Faculty: row.faculty || "--",
      };

      months.forEach((month) => {
        const monthData = row.months?.[month];
        item[month] = STATUS_ORDER
          .map((status) => {
            const bucket = monthData?.[status];
            return bucket?.count ? `${status} (${bucket.count})` : "";
          })
          .filter(Boolean)
          .join("\n");
      });
      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 35 },
      { wch: 18 },
      { wch: 30 },
      ...months.map(() => ({ wch: 24 })),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Status");
    XLSX.writeFile(workbook, `Attendance_Status_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={cardStyle}>
        <div style={headerStyle}>Attendance Status Report</div>
        <div style={{ padding: 15 }}>
          <div style={filterRowStyle}>
            <Filter label="Curriculum">
              <select value={selectedCurriculum} onChange={(e) => setSelectedCurriculum(e.target.value)} style={inputStyle}>
                <option value="">-- Select Curriculum --</option>
                {curriculums.map((c) => (
                  <option key={c.academic_batch_id} value={c.academic_batch_id}>
                    {c.academic_batch_desc || c.academic_batch_code}
                  </option>
                ))}
              </select>
            </Filter>

            <Filter label="From Date">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
            </Filter>

            <Filter label="To Date">
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
            </Filter>

            <button onClick={exportToExcel} disabled={loading || !rows.length} style={buttonStyle(!!rows.length && !loading)}>
              Export to XLS
            </button>
          </div>

          {(validationError || error) && <div style={errorStyle}>{validationError || error}</div>}

          <div style={{ overflowX: "auto", border: "1px solid #e5e5e5" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f7f7f7" }}>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Section</th>
                  <th style={thStyle}>Faculty</th>
                  {months.map((month) => <th key={month} style={thStyle}>{month}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3 + Math.max(months.length, 1)} style={emptyStyle}>Loading data...</td></tr>
                ) : !hasFetched || !rows.length ? (
                  <tr><td colSpan={3 + Math.max(months.length, 1)} style={emptyStyle}>No data found.</td></tr>
                ) : (
                  groupedByTerm.map(([term, termRows]) => (
                    <React.Fragment key={term}>
                      <tr>
                        <td colSpan={3 + months.length} style={termStyle}>{term}</td>
                      </tr>
                      {termRows.map((row) => (
                        <tr key={`${row.semester_id}-${row.crs_id}-${row.section_id}-${row.batch_id ?? 0}-${row.faculty}`}>
                          <td style={tdStyle}>{row.crs_code} - {row.crs_title}</td>
                          <td style={tdStyle}>{row.section || "--"}</td>
                          <td style={tdStyle}>{row.faculty || "--"}</td>
                          {months.map((month) => (
                            <td key={month} style={tdStyle}>
                              {STATUS_ORDER.map((status) => {
                                const bucket = row.months?.[month]?.[status];
                                if (!bucket?.count) return null;
                                return (
                                  <div
                                    key={status}
                                    title={tooltipText(bucket)}
                                    style={{ color: statusColor[status], fontWeight: 600, marginBottom: 4, cursor: "help" }}
                                  >
                                    {status} ({bucket.count})
                                  </div>
                                );
                              })}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
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

const Filter: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600 }}>{label}: <span style={{ color: "#d32f2f" }}>*</span></label>
    {children}
  </div>
);

const cardStyle: React.CSSProperties = { border: "1px solid #ccc", borderRadius: 6, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.1)" };
const headerStyle: React.CSSProperties = { background: "#2c3e50", color: "#fff", padding: "10px 15px", borderRadius: "5px 5px 0 0", fontWeight: 600, fontSize: 14 };
const filterRowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: 30, marginBottom: 16, flexWrap: "wrap" };
const inputStyle: React.CSSProperties = { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13, minWidth: 180, background: "#fff" };
const buttonStyle = (enabled: boolean): React.CSSProperties => ({ padding: "7px 16px", height: 33, background: enabled ? "#198754" : "#ccc", color: "#fff", border: 0, borderRadius: 4, cursor: enabled ? "pointer" : "not-allowed", fontWeight: 600 });
const thStyle: React.CSSProperties = { padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#333", borderRight: "1px solid #e5e5e5", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "9px 12px", borderRight: "1px solid #eee", borderBottom: "1px solid #eee", verticalAlign: "top" };
const termStyle: React.CSSProperties = { padding: "8px 12px", background: "#eef2f5", fontWeight: 700, borderTop: "1px solid #d8dde2", borderBottom: "1px solid #d8dde2" };
const emptyStyle: React.CSSProperties = { textAlign: "center", padding: 18, color: "#666" };
const errorStyle: React.CSSProperties = { marginBottom: 12, padding: "8px 10px", border: "1px solid #f1b0b7", background: "#f8d7da", color: "#842029", borderRadius: 4, fontSize: 13 };

export default AttendanceStatusReportPage;
