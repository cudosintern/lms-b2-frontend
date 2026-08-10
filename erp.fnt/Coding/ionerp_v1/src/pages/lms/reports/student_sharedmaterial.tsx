import { useState, useEffect } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Material {
  id: number;
  documentName: string;
  description: string;
  topics: string;
  license: string;
  sharedDate: string;
  viewDownloadLink: string;
  fileName: string;
}

const curriculumOptions = [
  "B.E in CSE 2018-2022",
  "B.E in CSE 2022-2026",
  "M.Tech 2021-2023",
  "MCA 2023-2025",
];

const termOptions = ["1 - Semester", "2 - Semester", "3 - Semester", "4 - Semester", "5 - Semester", "6 - Semester"];

const courseOptions = [
  "15ECSC301 - Software Engineering",
  "15ECSC302 - Data Structures",
  "15ECSC303 - Operating Systems",
  "15ECSC304 - Computer Networks",
];

const mockData: Material[] = [
  {
    id: 1,
    documentName: "Material Name",
    description: "",
    topics: "1   Software Engineering process",
    license: "-",
    sharedDate: "11-12-2025",
    viewDownloadLink: "Master in MCA 2025-2027_3 - Semester_2.xlsx",
    fileName: "Master_in_MCA_2025-2027_3-Semester_2.xlsx",
  },
];

const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle", opacity: 0.55 }}>
    <path d="M7 2L4 6h6L7 2zM7 12l3-4H4l3 4z" fill="#5b7fa6" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}>
    <path d="M10 3v9m0 0l-3-3m3 3l3-3" stroke="#e6a817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#e6a817" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function MaterialsList() {
  const [curriculum, setCurriculum] = useState("");
  const [curriculumList, setCurriculumList] = useState<any[]>([]);

  const [term, setTerm] = useState("");
  const [termList, setTermList] = useState<any[]>([]);

  const [course, setCourse] = useState("");
  const [courseList, setCourseList] = useState<any[]>([]);

const [materials, setMaterials] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [showEntries, setShowEntries] = useState(10);

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/v1/hierarchy/curriculums")
    .then(res => res.json())
    .then(data => {
      console.log("Curriculum API:", data);

      const list = Array.isArray(data) ? data : data.data || [];

      setCurriculumList(list);
    })
    .catch(err => console.error("Error fetching curriculums:", err));
}, []);

  const hasSelections = curriculum && term && course;

  const filteredData = materials.filter((m: any) =>
  (m.title || "").toLowerCase().includes(search.toLowerCase()) ||
  (m.description || "").toLowerCase().includes(search.toLowerCase())
);

const deleteMaterial = async (id: number) => {
  try {
    await fetch(`http://127.0.0.1:8000/api/v1/materials/${id}`, {
      method: "DELETE",
    });

    toast.success("Material deleted successfully 🎉");

    setMaterials((prev) => prev.filter((m) => m.id !== id));
  } catch (err) {
    toast.error("Error deleting material ❌");
    console.error("Delete error:", err);
  }
};

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f4f6f9", minHeight: "100vh", padding: "0" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg, #1a2a3a 0%, #243447 100%)",
          borderRadius: "8px 8px 0 0",
          padding: "16px 24px",
          color: "#fff",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "0.3px",
        }}
      >
        Materials List
      </div>

      {/* Body */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #dee2e6",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "24px 24px 18px 24px",
        }}
      >
        {/* Filters Row */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Curriculum */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontWeight: 600, fontSize: "13px", color: "#222", display: "block", marginBottom: 4 }}>
              Curriculum: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={curriculum}
              onChange={async (e) => {
  const selectedId = e.target.value;

  setCurriculum(selectedId);
  setTerm("");
  setCourse("");
  setTermList([]);

  if (!selectedId) return;

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/hierarchy/terms?academic_batch_id=${selectedId}`);
    const data = await res.json();

    console.log("TERM API:", data);

    const list = Array.isArray(data) ? data : data.data || [];
    setTermList(list);
  } catch (err) {
    console.error("Error fetching terms:", err);
  }
}}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: curriculum ? "1.5px solid #4a90d9" : "1.5px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                color: curriculum ? "#222" : "#6c757d",
                background: "#fff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select Curriculum</option>
              {curriculumList.map((c: any) => (
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
))}
            </select>
          </div>

          {/* Term */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontWeight: 600, fontSize: "13px", color: "#222", display: "block", marginBottom: 4 }}>
              Term: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={term}
              onChange={async (e) => {
  const selectedTerm = e.target.value;

  setTerm(selectedTerm);
  setCourse("");
  setCourseList([]);

  if (!selectedTerm) return;

  try {
    const res = await fetch(
  `http://127.0.0.1:8000/api/v1/hierarchy/courses?semester_id=${selectedTerm}`
);
    const data = await res.json();

    console.log("COURSE API:", data);

    const list = Array.isArray(data) ? data : data.data || [];
    setCourseList(list);
  } catch (err) {
    console.error("Error fetching courses:", err);
  }
}}
              disabled={!curriculum}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: term ? "1.5px solid #4a90d9" : "1.5px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                color: term ? "#222" : "#6c757d",
                background: curriculum ? "#fff" : "#f8f9fa",
                outline: "none",
                cursor: curriculum ? "pointer" : "not-allowed",
              }}
            >
              <option value="">Select Term</option>
              {termList.map((t: any) => (
  <option key={t.id} value={t.id}>
  {t.name}
</option>
))}
            </select>
          </div>

          {/* Course */}
          <div style={{ flex: 1.5, minWidth: 240 }}>
            <label style={{ fontWeight: 600, fontSize: "13px", color: "#222", display: "block", marginBottom: 4 }}>
              Course: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={course}
              onChange={async (e) => {
  const selectedCourse = e.target.value;
  setCourse(selectedCourse);

  if (!curriculum || !term || !selectedCourse) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/v1/materials/filter?academic_batch_id=${curriculum}&semester_id=${term}&crs_id=${selectedCourse}`
    );

    const data = await res.json();
    console.log("MATERIAL API:", data);

    const list = Array.isArray(data) ? data : data.data || [];
    setMaterials(list);
  } catch (err) {
    console.error("Error fetching materials:", err);
  }
}}
              disabled={!term}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: course ? "1.5px solid #4a90d9" : "1.5px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                color: course ? "#222" : "#6c757d",
                background: term ? "#fff" : "#f8f9fa",
                outline: "none",
                cursor: term ? "pointer" : "not-allowed",
              }}
            >
              <option value="">Select Course</option>
              {courseList.map((c: any) => (
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
))}
       </select>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "14px", color: "#333" }}>
            Show&nbsp;
            <select
              value={showEntries}
              onChange={(e) => setShowEntries(Number(e.target.value))}
              style={{
                padding: "3px 8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                marginRight: 4,
              }}
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            &nbsp;entries
          </div>
          <div style={{ fontSize: "14px", color: "#333", display: "flex", alignItems: "center", gap: 8 }}>
            Search:&nbsp;
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "5px 10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                width: 180,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#d6e4f0", color: "#222" }}>
                {[
                  { label: "Sl No.", w: 70 },
                  { label: "Document/Link Name", w: 180 },
                  { label: "Description", w: 140 },
                  { label: "Topic(s)", w: 200 },
                  { label: "License", w: 110 },
                  { label: "Shared Date", w: 120 },
                  { label: "View/Download", w: 180 },
                ].map((col) => (
                  <th
                    key={col.label}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      borderBottom: "2px solid #b8cfe0",
                      width: col.w,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {col.label}
                    <SortIcon />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "28px 12px",
                      color: "#6c757d",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredData.slice(0, showEntries).map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{
                      background: idx % 2 === 0 ? "#fff" : "#f8f9fa",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eaf3fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f8f9fa")}
                  >
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333" }}>{row.id}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333" }}>{row.title}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333" }}>{row.description}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333" }}>-</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333", textAlign: "center" }}>-</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6", color: "#333" }}>{row.created_at}</td>

                    
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #dee2e6" }}>
  <a
    href={row.file_url}
    target="_blank"
    style={{ color: "#2563c7", textDecoration: "none", fontWeight: 500, fontSize: "13px", marginRight: "10px" }}
  >
    Download
  </a>

  <button
    onClick={() => deleteMaterial(row.id)}
    style={{
      padding: "4px 10px",
      border: "1px solid red",
      borderRadius: "4px",
      background: "#fff",
      color: "red",
      cursor: "pointer",
      fontSize: "12px"
    }}
  >
    Delete
  </button>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
          <div style={{ fontSize: "13px", color: "#555" }}>
            {filteredData.length === 0
              ? "Showing 0 to 0 of 0 entries"
              : `Showing 1 to ${Math.min(showEntries, filteredData.length)} of ${filteredData.length} entries`}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              style={{
                padding: "5px 14px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                background: "#fff",
                fontSize: "13px",
                color: "#333",
                cursor: "pointer",
              }}
            >
              Previous
            </button>
            {filteredData.length > 0 && (
              <button
                style={{
                  padding: "5px 12px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#2563c7",
                  fontSize: "13px",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  minWidth: 34,
                }}
              >
                1
              </button>
            )}
            <button
              style={{
                padding: "5px 14px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                background: "#fff",
                fontSize: "13px",
                color: "#333",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}
