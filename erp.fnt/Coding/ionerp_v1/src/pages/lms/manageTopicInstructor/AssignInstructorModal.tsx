import React, { useEffect, useState } from "react";
import { useTopicService } from "./topicService";
import { toast } from "react-toastify";

type TopicWithStatus = {
  topic_id: number;
  topic_title: string;
  topic_code: string;
  topic_hrs: string | number;
  num_of_sessions: number;
  is_imported: boolean;
  instructor_id: number | null;
  instructor_name: string | null;
  selectedInstructor: number | "";
};

type Instructor = { value: number; label: string };

interface AssignInstructorModalProps {
  filters: { curriculum: number; semester: number; course: number; section: number };
  close: () => void;
  refresh: () => void;
  topics: any[];
  updateTopicInTable?: (topicId: number, updates: any) => void;
  addTopicToTable?: (newTopic: any) => void;
}

export default function AssignInstructorModal({
  filters,
  close,
  refresh,
  topics: _allTopics,
  updateTopicInTable,
  addTopicToTable
}: AssignInstructorModalProps) {
  const topicService = useTopicService();
  const [topics, setTopics] = useState<TopicWithStatus[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const isValid = Boolean(
    filters.curriculum && 
    filters.semester && 
    filters.course && 
    filters.section
  );

  useEffect(() => {
    if (isValid) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.curriculum, filters.semester, filters.course, filters.section]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicRes, instrRes] = await Promise.all([
        topicService.getCudosTopics({
          academic_batch_id: filters.curriculum,
          course_id: filters.course,
          semester_id: filters.semester,
          section_id: filters.section,
        }),
        topicService.getInstructorList({
          course_id: filters.course
        }),
      ]);

      const topicArr: any[] = Array.isArray(topicRes) ? topicRes : ((topicRes as any)?.data || []);
      const instrArr: Instructor[] = Array.isArray(instrRes) ? instrRes : (instrRes?.data || []);

      setInstructors(instrArr);
      setTopics(topicArr.map((t: any) => ({
        topic_id: t.topic_id,
        topic_title: t.topic_title || t.topic_name || "Untitled",
        topic_code: t.topic_code || "",
        topic_hrs: t.topic_hrs || t.num_of_sessions || "—",
        num_of_sessions: t.num_of_sessions || 0,
        is_imported: !!t.is_imported,
        instructor_id: t.instructor_id ?? null,
        instructor_name: t.instructor_name ?? null,
        selectedInstructor: t.instructor_id ?? "",
      })));
    } catch (err) {
      console.error("Error loading data", err);
      toast.error("Error loading topics");
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorChange = (topicId: number, instructorId: number | "") => {
    setTopics(prev => prev.map(t =>
      t.topic_id === topicId ? { ...t, selectedInstructor: instructorId } : t
    ));
  };

  const handleImport = async () => {
    const toImport = topics.filter(t => 
      !t.is_imported && t.selectedInstructor !== ""
    );

    if (toImport.length === 0) {
      if (topics.every(t => t.is_imported)) {
        toast.info("ℹ️ Topics already imported. No more topics to import.");
      } else {
        toast.warning("Please select instructors for at least one topic to import.");
      }
      return;
    }

    setImporting(true);
    try {
      for (const t of toImport) {
        await topicService.importCudosTopics({
          course_id: filters.course,
          semester_id: filters.semester,
          section_id: filters.section,
          topic_ids: [t.topic_id],
          instructor_id: Number(t.selectedInstructor),
          academic_batch_id: filters.curriculum,
        });

        const instr = instructors.find(i => i.value === Number(t.selectedInstructor));
        if (updateTopicInTable) {
          updateTopicInTable(t.topic_id, {
            instructor_id: Number(t.selectedInstructor),
            instructor_name: instr?.label ?? "Assigned",
            is_imported: true,
          });
        }
      }

      toast.success(`✅ Successfully imported ${toImport.length} topic(s).`);
      await refresh();
      close();
    } catch (err) {
      console.error("Import error", err);
      toast.error("❌ Error importing topics");
    } finally {
      setImporting(false);
    }
  };

  const formatHrs = (hrs: string | number) => {
    if (!hrs) return "—";
    const n = parseFloat(String(hrs));
    if (isNaN(n)) return String(hrs);
    const h = Math.floor(n);
    const m = Math.round((n - h) * 60);
    return m > 0 ? `${h}:${String(m).padStart(2, "0")} hrs` : `${h}:00 hrs`;
  };

  return (
    <>
      {/* ✅ Enhanced Backdrop with better opacity */}
      <div 
        className="modal-backdrop fade show" 
        style={{ 
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker background
          zIndex: 1040,
          backdropFilter: "blur(4px)" // Adds blur effect for better contrast
        }}
        onClick={close}
      />
      
      {/* ✅ Enhanced Modal with better visibility */}
      <div 
        className="modal show d-block" 
        style={{ 
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflowX: "hidden",
          overflowY: "auto",
          outline: 0,
          zIndex: 1050,
          display: "block",
          padding: "20px"
        }}
      >
        <div 
          className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered" 
          style={{ 
            margin: "1.75rem auto",
            maxWidth: "90%",
            pointerEvents: "none" // Allows clicks to pass through to backdrop
          }}
        >
          {/* ✅ Enhanced Modal Content with shadow and border */}
          <div 
            className="modal-content" 
            style={{
              pointerEvents: "auto", // Re-enable clicks on modal content
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "#ffffff"
            }}
          >
            {/* Header with better contrast */}
            <div 
              className="modal-header" 
              style={{ 
                background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                color: "#fff",
                borderRadius: "12px 12px 0 0",
                borderBottom: "2px solid #0d47a1"
              }}
            >
              <h5 className="modal-title" style={{ color: "#fff", fontWeight: 600 }}>
                <span style={{ marginRight: "10px" }}>📚</span>
                Import Topics &amp; Assign Instructors
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={close}
                style={{ opacity: 0.8 }}
              />
            </div>

            <div className="modal-body" style={{ padding: "24px" }}>
              {!isValid && (
                <div className="alert alert-warning" style={{ borderRadius: "8px" }}>
                  <strong>⚠️ Please select all required filters:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Curriculum: {filters.curriculum || "Not selected"}</li>
                    <li>Semester: {filters.semester || "Not selected"}</li>
                    <li>Course: {filters.course || "Not selected"}</li>
                    <li>Section: {filters.section || "Not selected"}</li>
                  </ul>
                </div>
              )}

              {isValid && loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2">Loading topics...</p>
                </div>
              )}

              {isValid && !loading && (
                <>
                  <div className="alert alert-info mb-3" style={{ borderRadius: "8px" }}>
                    <strong>💡 Instructions:</strong> Select instructors for topics you want to import, then click "Import Topics". Only new topics will be imported — already imported topics will be skipped.
                  </div>

                  {topics.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p style={{ fontSize: "16px" }}>📭 No topics found for this combination.</p>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                      <table className="table table-bordered table-hover">
                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                          <tr>
                            <th style={{ width: 60 }}>Sl.No</th>
                            <th>Topic Title</th>
                            <th>Topic Code</th>
                            <th>Hours</th>
                            <th>Select Instructor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topics.map((t, idx) => (
                            <tr key={t.topic_id}>
                              <td>{idx + 1}</td>
                              <td>{t.topic_title}</td>
                              <td>{t.topic_code}</td>
                              <td>{formatHrs(t.topic_hrs)}</td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={t.selectedInstructor || ""}
                                  onChange={(e) =>
                                    handleInstructorChange(t.topic_id, e.target.value ? Number(e.target.value) : "")
                                  }
                                  style={{ minWidth: "150px" }}
                                >
                                  <option value="">Select Instructor</option>
                                  {instructors.length > 0 ? (
                                    instructors.map((i) => (
                                      <option key={i.value} value={i.value}>
                                        {i.label}
                                      </option>
                                    ))
                                  ) : (
                                    <option disabled>No instructors available</option>
                                  )}
                                </select>
                              </td>
                              <td>
                                {t.is_imported ? (
                                  <span className="badge bg-success">✅ Already Imported</span>
                                ) : (
                                  <span className="badge bg-warning text-dark">🔄 Ready to Import</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer" style={{ 
              borderTop: "1px solid #dee2e6",
              padding: "16px 24px",
              borderRadius: "0 0 12px 12px"
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={close}
                style={{ padding: "8px 20px" }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importing || loading || !isValid || topics.length === 0}
                style={{ padding: "8px 20px", fontWeight: 600 }}
              >
                {importing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Importing...
                  </>
                ) : (
                  "🚀 Import Topics"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}