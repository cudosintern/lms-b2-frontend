import React, { useState, useEffect } from "react";
import api from "../../../utils/api";
import ScheduleClassModal from "./ScheduleClassModal";
import { scheduleClassApi } from "./scheduleClassApi";

// import {
//   CopyClassDayModal,
//   DeleteTimetableModal,
// } from "./components/TimetableOptions";

import CopyClassDayModal from "../timetableCalendar/components/CopyClassDayModal";
import DeleteTimetableModal from "../timetableCalendar/components/DeleteTimetableModal";
import { toast } from "react-toastify";

const TimetableListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScheduleClassModal, setShowScheduleClassModal] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("17:00");

  const [method, setMethod] = useState("Regular");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await scheduleClassApi.getAll();
      if (res.success && res.data) {
        setTimetableData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (
      window.confirm("Are you sure you want to delete this scheduled class?")
    ) {
      try {
        await scheduleClassApi.delete(id);
        fetchData();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/v1/timetable/timetables", {
        params: {
          term: selectedTerm || "1",
          section: selectedSection || "A",
        },
      });

      setTimetableData(response.data as any[]);
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClassDay = async (sourceDate: string, targetDate: string) => {
    try {
      // Get classes for source date
      const sourceClasses = timetableData.filter(
        (cls) => cls.date === sourceDate,
      );

      if (sourceClasses.length === 0) {
        toast.info("No classes found on the source date");
        return;
      }

      // Copy classes to target date
      const copiedClasses = sourceClasses.map((cls) => ({
        ...cls,
        id: undefined,
        date: targetDate,
        createdAt: new Date().toISOString(),
      }));

      // Save each copied class
      for (const classData of copiedClasses) {
        await scheduleClassApi.saveSchedule(classData);
      }

      toast.success(
        `Copied ${sourceClasses.length} classes from ${sourceDate} to ${targetDate}`,
      );
      fetchData();
    } catch (error) {
      toast.error("Failed to copy classes");
    }
  };

  const handleResetTimetable = async (resetDate: string) => {
    try {
      // Get classes for the specified date
      const classesToDelete = timetableData.filter(
        (cls) => cls.date === resetDate,
      );

      if (classesToDelete.length === 0) {
        toast.info("No classes found on the specified date");
        return;
      }

      // Delete each class
      for (const classData of classesToDelete) {
        await scheduleClassApi.delete(classData.id);
      }

      toast.success(
        `Reset timetable for ${resetDate}. Deleted ${classesToDelete.length} classes.`,
      );
      fetchData();
    } catch (error) {
      toast.error("Failed to reset timetable");
    }
  };

  const handleDeleteTimetable = async (
    deleteOption: string,
    dateRange?: { startDate: string; endDate: string },
  ) => {
    try {
      let classesToDelete: any[] = [];

      if (deleteOption === "all") {
        classesToDelete = timetableData;
      } else if (deleteOption === "range" && dateRange) {
        classesToDelete = timetableData.filter(
          (cls) =>
            cls.date >= dateRange.startDate && cls.date <= dateRange.endDate,
        );
      }

      if (classesToDelete.length === 0) {
        toast.info("No classes found to delete");
        return;
      }

      // Delete each class
      for (const classData of classesToDelete) {
        await scheduleClassApi.delete(classData.id);
      }

      toast.success(`Deleted ${classesToDelete.length} classes`);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete timetable");
    }
  };

  const handleApply = () => {
    fetchTimetable();
  };

  const handleExportPDF = async () => {
    try {
      const academic_batch_id = 1;
      const semester_id = selectedTerm || 1;

      const url = `http://127.0.0.1:8000/api/v1/comman_function/timetable/export-pdf?academic_batch_id=${academic_batch_id}&semester_id=${semester_id}`;

      const response = await fetch(url);

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "timetable.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeSlots = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  return (
    <div style={pageStyle}>
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}
      {/* Schedule Class Modal */}
      <ScheduleClassModal
        show={showScheduleClassModal}
        onClose={() => setShowScheduleClassModal(false)}
        onSave={async (data) => {
          console.log("Saving schedule data:", data);
          try {
            for (const d of data.days) {
              await scheduleClassApi.saveSchedule({
                courseType: data.courseType,
                course: data.course,
                section: data.batch,
                location: "TBD",
                day: d.name,
                startTime: d.startTime,
                endTime: d.endTime,
                time: `${d.startTime} - ${d.endTime}`,
              });
            }
            setShowScheduleClassModal(false);
            fetchData();
          } catch (error) {
            console.error("Failed to save schedule:", error);
          }
        }}
      />

      {/* Options Modals */}
      <CopyClassDayModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopyComplete={(success, message) => {
          console.log("Copy completed:", { success, message });
        }}
      />

      <DeleteTimetableModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteComplete={(success, message) => {
          console.log("Delete completed:", { success, message });
        }}
      />

      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
          📅 Timetable Management
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
          View and manage class schedules for each department and semester.
        </p>
      </div>

      {/* Filters */}
      <div style={filterCard}>
        {/* Curriculum */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Curriculum
          </label>
          <select
            style={selectStyle}
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
          >
            <option value="">Select Curriculum</option>
            <option value="1">BE in Civil Engg 2024-2028</option>
            <option value="2">BCA 2023-2026</option>
          </select>
        </div>

        {/* Term */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>Term</label>
          <select
            style={selectStyle}
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">Select Term</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="3">3rd Semester</option>
            <option value="4">4th Semester</option>
          </select>
        </div>

        {/* Section */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>Section</label>
          <select
            style={selectStyle}
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        {/* Timetable */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Timetable
          </label>
          <select
            style={selectStyle}
            value={selectedTimetable}
            onChange={(e) => setSelectedTimetable(e.target.value)}
          >
            <option value="">Select Timetable</option>
            <option value="1">01-07-2026 to 05-01-2027</option>
          </select>
        </div>

        {/* Start Date */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Start Date
          </label>
          <input
            type="date"
            style={selectStyle}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            End Date
          </label>
          <input
            type="date"
            style={selectStyle}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button style={applyBtn} onClick={handleApply}>
          Apply
        </button>
      </div>

      {/* Time Settings */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* Start Time */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={selectStyle}
          />
        </div>

        {/* End Time */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={selectStyle}
          />
        </div>

        {/* Regular / Bypass */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Regular/Bypass Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={selectStyle}
          >
            <option value="Regular">Regular</option>
            <option value="Bypass">Bypass</option>
          </select>
        </div>
      </div>

      {/* Table Actions */}
      <div style={{ marginBottom: "15px", textAlign: "right" }}>
        <button
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setShowScheduleClassModal(true)}
        >
          Schedule Class
        </button>

        <button
          style={{
            backgroundColor: "#4f46e5",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setShowTimetableModal(true)}
        >
          View Timetable
        </button>
      </div>
      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Time</th>
              {days.map((day) => (
                <th key={day} style={thStyle}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td style={tdStyle}>{formatTimeToAMPM(time)}</td>

                {days.map((day) => {
                  const cls = timetableData.find((c) => {
                    if (c.day !== day) return false;

                    const start =
                      c.startTime ||
                      (typeof c.time === "string"
                        ? c.time.split(" - ")[0]
                        : "");

                    if (!start) return false;

                    const normalizedStart = start.slice(0, 5);

                    return normalizedStart === time;
                  });
                  return (
                    <td key={day} style={tdStyle}>
                      {cls ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{cls.subject}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {cls.faculty}
                          </div>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Popup */}
      {showEditPopup && (
        <div style={popupOverlay}>
          <div style={popupBox}>
            <h3>Edit Timetable</h3>

            <input
              style={inputStyle}
              value={editingRow?.subject || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, subject: e.target.value })
              }
            />

            <input
              style={inputStyle}
              value={editingRow?.faculty || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, faculty: e.target.value })
              }
            />

            <input
              style={inputStyle}
              value={editingRow?.time || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, time: e.target.value })
              }
            />

            <input
              style={inputStyle}
              value={editingRow?.room || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, room: e.target.value })
              }
            />

            <div style={{ textAlign: "right", marginTop: "15px" }}>
              <button style={cancelBtn} onClick={() => setShowEditPopup(false)}>
                Cancel
              </button>
              <button
                style={saveBtn}
                onClick={() => {
                  const updated = timetableData.map((item) =>
                    item.id === editingRow.id ? editingRow : item,
                  );

                  setTimetableData(updated);
                  setShowEditPopup(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Timetable Modal */}
      {showTimetableModal && (
        <div style={popupOverlay}>
          <div style={{ ...popupBox, width: "600px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                📅 Timetable Preview
              </h3>

              <button
                onClick={() => setShowTimetableModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✖
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#f3f4f6",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              <strong>Curriculum:</strong>{" "}
              {selectedCurriculum || "Not Selected"} &nbsp; | &nbsp;
              <strong>Term:</strong> {selectedTerm || "Not Selected"} &nbsp; |
              &nbsp;
              <strong>Section:</strong> {selectedSection || "Not Selected"}{" "}
              &nbsp; | &nbsp;
              <strong>Timetable:</strong> {selectedTimetable || "Not Selected"}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Day</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Subject</th>
                  <th style={thStyle}>Faculty</th>
                  <th style={thStyle}>Room</th>
                </tr>
              </thead>

              <tbody>
                {timetableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No timetable available
                    </td>
                  </tr>
                ) : (
                  timetableData.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{row.day}</td>
                      <td style={tdStyle}>{row.time}</td>
                      <td style={tdStyle}>{row.subject}</td>
                      <td style={tdStyle}>{row.faculty}</td>
                      <td style={tdStyle}>{row.room}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (timetableData.length === 0) {
                    alert("No timetable data to export");
                    return;
                  }
                  handleExportPDF();
                }}
              >
                Export PDF
              </button>

              <button
                style={cancelBtn}
                onClick={() => setShowTimetableModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to convert "06:00" to "06:00 AM"
const formatTimeToAMPM = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const num = hour % 12 || 12;
  return `${num.toString().padStart(2, "0")}:${m || "00"} ${ampm}`;
};

const pageStyle: React.CSSProperties = {
  padding: "24px",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const filterCard: React.CSSProperties = {
  display: "flex",
  gap: "20px",
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "10px",
  marginBottom: "24px",
  alignItems: "flex-end",
  flexWrap: "wrap",
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
};

const selectStyle: React.CSSProperties = {
  padding: "8px",
  minWidth: "160px",
};

const applyBtn: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const tableWrapper: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f3f4f6",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  transition: "background-color 0.2s",
  textAlign: "center",
  verticalAlign: "middle",
  minWidth: "120px",
};

const editBtn: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const popupOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const popupBox: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "20px",
  width: "320px",
  borderRadius: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  marginTop: "10px",
};

const cancelBtn: React.CSSProperties = {
  padding: "6px 12px",
  marginRight: "10px",
};

const saveBtn: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
};

export default TimetableListPage;
