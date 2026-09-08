import React, { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import ScheduleClassModal from "./ScheduleClassModal";
import { scheduleClassApi } from "./scheduleClassApi";
import CopyClassDayModal from "../timetableCalendar/components/CopyClassDayModal";
import DeleteTimetableModal from "../timetableCalendar/components/DeleteTimetableModal";
import { toast } from "react-toastify";
import { timetableApi } from "./timetableApi";

// Types for the fetched data
interface Curriculum {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

interface Term {
  id: number;
  name: string;
  semester?: string;
  code?: string;
}

interface Section {
  id: number;
  name: string;
  code?: string;
  displayName?: string;
}

interface Timetable {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  termId?: number;
  sectionId?: number;
}

interface FilterState {
  curriculumId: string;
  termId: string;
  sectionId: string;
  timetableId: string;
}

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

  // State for filter dropdown options
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState({
    curriculums: false,
    terms: false,
    sections: false,
    timetables: false,
  });

  // Selected filter values
  const [filters, setFilters] = useState<FilterState>({
    curriculumId: "",
    termId: "",
    sectionId: "",
    timetableId: "",
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("17:00");
  const [method, setMethod] = useState("Regular");

  // Fetch curriculums on component mount
  useEffect(() => {
    fetchCurriculums();
    fetchData();
  }, []);

  // Fetch terms when curriculum changes
  useEffect(() => {
    if (filters.curriculumId) {
      fetchTermsByCurriculum(Number(filters.curriculumId));
      // Reset dependent filters
      setFilters(prev => ({
        ...prev,
        termId: "",
        sectionId: "",
        timetableId: "",
      }));
      setSections([]);
      setTimetables([]);
    }
  }, [filters.curriculumId]);

  // Fetch sections when term changes
  useEffect(() => {
    if (filters.curriculumId && filters.termId) {
      fetchSectionsByCurriculumTerm(Number(filters.curriculumId), filters.termId);
      // Reset dependent filters
      setFilters(prev => ({
        ...prev,
        sectionId: "",
        timetableId: "",
      }));
      setTimetables([]);
    }
  }, [filters.termId]);

  // Fetch timetables when section changes
  useEffect(() => {
    if (filters.termId && filters.sectionId) {
      fetchTimetables(filters.termId, filters.sectionId);
      setFilters(prev => ({
        ...prev,
        timetableId: "",
      }));
    }
  }, [filters.sectionId]);

  const fetchCurriculums = async () => {
    setIsLoadingFilters(prev => ({ ...prev, curriculums: true }));
    try {
      const response = await timetableApi.getCurriculums();
      if (response?.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setCurriculums(data);
        
        // Optionally auto-select first curriculum if available
        // if (data.length > 0) {
        //   setFilters(prev => ({ ...prev, curriculumId: String(data[0].id) }));
        // }
      }
    } catch (error) {
      console.error("Error fetching curriculums:", error);
      toast.error("Failed to load curriculums");
      setCurriculums([]);
    } finally {
      setIsLoadingFilters(prev => ({ ...prev, curriculums: false }));
    }
  };

  

  const fetchTermsByCurriculum = async (curriculumId: number) => {
    setIsLoadingFilters(prev => ({ ...prev, terms: true }));
    try {
      const response = await timetableApi.getTermsByCurriculum(curriculumId);
      if (response?.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setTerms(data);
        
        // Optionally auto-select first term if available
        // if (data.length > 0) {
        //   setFilters(prev => ({ ...prev, termId: String(data[0].id) }));
        // }
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to load terms");
      setTerms([]);
    } finally {
      setIsLoadingFilters(prev => ({ ...prev, terms: false }));
    }
  };

  const fetchSectionsByCurriculumTerm = async (curriculumId: number, termName: string) => {
    setIsLoadingFilters(prev => ({ ...prev, sections: true }));
    try {
      const response = await timetableApi.getSectionsByCurriculumTerm(curriculumId, termName);
      if (response?.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setSections(data);
        
        // Optionally auto-select first section if available
        // if (data.length > 0) {
        //   setFilters(prev => ({ ...prev, sectionId: String(data[0].id) }));
        // }
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load sections");
      setSections([]);
    } finally {
      setIsLoadingFilters(prev => ({ ...prev, sections: false }));
    }
  };

  const fetchTimetables = async (term?: string, section?: string) => {
    setIsLoadingFilters(prev => ({ ...prev, timetables: true }));
    try {
      const response = await timetableApi.getTimetables(term, section);
      if (response?.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setTimetables(data);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
      toast.error("Failed to load timetables");
      setTimetables([]);
    } finally {
      setIsLoadingFilters(prev => ({ ...prev, timetables: false }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await scheduleClassApi.getAll();
      if (res.success && res.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        setTimetableData(data);
      } else {
        setTimetableData([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load timetable data");
      toast.error("Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (window.confirm("Are you sure you want to delete this scheduled class?")) {
      try {
        await scheduleClassApi.delete(id);
        toast.success("Class deleted successfully!");
        fetchData();
      } catch (err) {
        console.error("Delete failed", err);
        toast.error("Failed to delete class");
      }
    }
  };

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Build params object with only valid filters
      const params: any = {};
      if (filters.termId) params.term = filters.termId;
      if (filters.sectionId) params.section = filters.sectionId;
      if (filters.timetableId) params.timetableId = filters.timetableId;

      const response = await api.get("/api/v1/lms_module/timetable/timetables", { params });
      
      const data = Array.isArray(response.data) ? response.data : [];
      setTimetableData(data);
      
      if (data.length === 0) {
        toast.info("No timetable data found for the selected filters");
      } else {
        toast.success(`Loaded ${data.length} timetable entries`);
      }
    } catch (error: any) {
      console.error("Error fetching timetable:", error);
      const errorMsg = error?.response?.data?.message || "Failed to fetch timetable";
      setError(errorMsg);
      toast.error(errorMsg);
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.termId, filters.sectionId, filters.timetableId]);

  const handleCopyClassDay = async (sourceDate: string, targetDate: string) => {
    try {
      const sourceClasses = timetableData.filter(
        (cls) => cls.date === sourceDate || cls.classDate === sourceDate,
      );

      if (sourceClasses.length === 0) {
        toast.info("No classes found on the source date");
        return;
      }

      const copiedClasses = sourceClasses.map((cls) => ({
        ...cls,
        id: undefined,
        date: targetDate,
        classDate: targetDate,
        createdAt: new Date().toISOString(),
      }));

      for (const classData of copiedClasses) {
        await scheduleClassApi.saveSchedule(classData);
      }

      toast.success(
        `Copied ${sourceClasses.length} classes from ${sourceDate} to ${targetDate}`,
      );
      fetchData();
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy classes");
    }
  };

  const handleResetTimetable = async (resetDate: string) => {
    try {
      const classesToDelete = timetableData.filter(
        (cls) => cls.date === resetDate || cls.classDate === resetDate,
      );

      if (classesToDelete.length === 0) {
        toast.info("No classes found on the specified date");
        return;
      }

      for (const classData of classesToDelete) {
        await scheduleClassApi.delete(classData.id);
      }

      toast.success(
        `Reset timetable for ${resetDate}. Deleted ${classesToDelete.length} classes.`,
      );
      fetchData();
    } catch (error) {
      console.error("Reset failed:", error);
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
            (cls.date || cls.classDate) >= dateRange.startDate &&
            (cls.date || cls.classDate) <= dateRange.endDate,
        );
      }

      if (classesToDelete.length === 0) {
        toast.info("No classes found to delete");
        return;
      }

      for (const classData of classesToDelete) {
        await scheduleClassApi.delete(classData.id);
      }

      toast.success(`Deleted ${classesToDelete.length} classes`);
      fetchData();
    } catch (error) {
      console.error("Delete timetable failed:", error);
      toast.error("Failed to delete timetable");
    }
  };

  const handleApply = () => {
    fetchTimetable();
  };

  const handleExportPDF = async () => {
    try {
      const academic_batch_id = Number(filters.curriculumId) || 1;
      const semester_id = filters.termId || "1";

      const url = `http://127.0.0.1:8000/api/v1/comman_function/timetable/export-pdf?academic_batch_id=${academic_batch_id}&semester_id=${semester_id}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `timetable_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Timetable exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export timetable");
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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

  // Helper to get display name for selected items
  const getSelectedName = (type: 'curriculum' | 'term' | 'section' | 'timetable', id: string) => {
    if (!id) return "Not Selected";
    
    const map: Record<string, any[]> = {
      curriculum: curriculums,
      term: terms,
      section: sections,
      timetable: timetables
    };
    
    const item = map[type].find(item => String(item.id) === id);
    return item?.name || item?.displayName || id;
  };

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
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: "10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#991b1b",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div>Loading...</div>
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
            toast.success("Schedule saved successfully!");
            fetchData();
          } catch (error) {
            console.error("Failed to save schedule:", error);
            toast.error("Failed to save schedule");
          }
        }}
      />

      {/* Options Modals */}
      <CopyClassDayModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopyComplete={(success, message) => {
          if (success) {
            toast.success(message || "Copy completed successfully");
            fetchData();
          } else {
            toast.error(message || "Copy failed");
          }
        }}
      />

      <DeleteTimetableModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteComplete={(success, message) => {
          if (success) {
            toast.success(message || "Delete completed successfully");
            fetchData();
          } else {
            toast.error(message || "Delete failed");
          }
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
            Curriculum {isLoadingFilters.curriculums && "⏳"}
          </label>
          <select
            style={selectStyle}
            value={filters.curriculumId}
            onChange={(e) => handleFilterChange("curriculumId", e.target.value)}
            disabled={isLoadingFilters.curriculums}
          >
            <option value="">Select Curriculum</option>
            {curriculums.map((curriculum) => (
              <option key={curriculum.id} value={curriculum.id}>
                {curriculum.name} {curriculum.code ? `(${curriculum.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Term */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Term {isLoadingFilters.terms && "⏳"}
          </label>
          <select
            style={selectStyle}
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
            disabled={!filters.curriculumId || isLoadingFilters.terms}
          >
            <option value="">Select Term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Section {isLoadingFilters.sections && "⏳"}
          </label>
          <select
            style={selectStyle}
            value={filters.sectionId}
            onChange={(e) => handleFilterChange("sectionId", e.target.value)}
            disabled={!filters.termId || isLoadingFilters.sections}
          >
            <option value="">Select Section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name || section.displayName || section.code}
              </option>
            ))}
          </select>
        </div>

        {/* Timetable */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Timetable {isLoadingFilters.timetables && "⏳"}
          </label>
          <select
            style={selectStyle}
            value={filters.timetableId}
            onChange={(e) => handleFilterChange("timetableId", e.target.value)}
            disabled={!filters.sectionId || isLoadingFilters.timetables}
          >
            <option value="">Select Timetable</option>
            {timetables.map((timetable) => (
              <option key={timetable.id} value={timetable.id}>
                {timetable.name ||
                  `${timetable.startDate || ""} to ${timetable.endDate || ""}` ||
                  `Timetable ${timetable.id}`}
              </option>
            ))}
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

        <button style={applyBtn} onClick={handleApply} disabled={loading}>
          {loading ? "Loading..." : "Apply"}
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
        {timetableData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            No timetable data available. Please select filters and click "Apply".
          </div>
        ) : (
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
                            <div style={{ fontWeight: 600 }}>
                              {cls.subject || cls.course || cls.topic}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              {cls.faculty || cls.teacher || cls.instructor}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {cls.room || cls.location || cls.venue}
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
        )}
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
              placeholder="Subject"
            />

            <input
              style={inputStyle}
              value={editingRow?.faculty || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, faculty: e.target.value })
              }
              placeholder="Faculty"
            />

            <input
              style={inputStyle}
              value={editingRow?.time || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, time: e.target.value })
              }
              placeholder="Time"
            />

            <input
              style={inputStyle}
              value={editingRow?.room || ""}
              onChange={(e) =>
                setEditingRow({ ...editingRow, room: e.target.value })
              }
              placeholder="Room"
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
                  toast.success("Timetable updated successfully!");
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
          <div style={{ ...popupBox, width: "700px", maxWidth: "90vw" }}>
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
              {getSelectedName('curriculum', filters.curriculumId)} &nbsp; | &nbsp;
              <strong>Term:</strong> {getSelectedName('term', filters.termId)} &nbsp; | &nbsp;
              <strong>Section:</strong> {getSelectedName('section', filters.sectionId)} &nbsp; | &nbsp;
              <strong>Timetable:</strong> {getSelectedName('timetable', filters.timetableId)}
            </div>

            <div style={{ maxHeight: "400px", overflow: "auto" }}>
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
                      <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                        No timetable available
                      </td>
                    </tr>
                  ) : (
                    timetableData.map((row, index) => (
                      <tr key={row.id || index}>
                        <td style={tdStyle}>{row.day}</td>
                        <td style={tdStyle}>{row.time || row.startTime}</td>
                        <td style={tdStyle}>{row.subject || row.course || row.topic}</td>
                        <td style={tdStyle}>{row.faculty || row.teacher}</td>
                        <td style={tdStyle}>{row.room || row.location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
                    toast.warning("No timetable data to export");
                    return;
                  }
                  handleExportPDF();
                }}
              >
                Export PDF
              </button>

              <button
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#6b7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
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
  borderRadius: "4px",
  border: "1px solid #d1d5db",
};

const applyBtn: React.CSSProperties = {
  padding: "8px 24px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "500",
};

const tableWrapper: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  overflow: "auto",
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
  textAlign: "center",
  verticalAlign: "middle",
  minWidth: "100px",
};

const popupOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const popupBox: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  marginTop: "10px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
};

const cancelBtn: React.CSSProperties = {
  padding: "6px 16px",
  marginRight: "10px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  cursor: "pointer",
};

const saveBtn: React.CSSProperties = {
  padding: "6px 16px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default TimetableListPage;