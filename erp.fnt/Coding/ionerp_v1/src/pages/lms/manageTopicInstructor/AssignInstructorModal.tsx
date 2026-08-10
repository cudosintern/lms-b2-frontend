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
  filters, close, refresh, topics: _allTopics,
  updateTopicInTable, addTopicToTable
}: AssignInstructorModalProps) {
  const topicService = useTopicService();
  const [topics,       setTopics]       = useState<TopicWithStatus[]>([]);
  const [instructors,  setInstructors]  = useState<Instructor[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [importing,    setImporting]    = useState(false);

  const isValid = filters.course && filters.semester && filters.section && filters.curriculum;

  useEffect(() => {
    if (isValid) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  

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

      console.log("🔍 DEBUG loadData - raw instrRes:", instrRes);
      console.log("🔍 DEBUG filters.course:", filters.course);
      
      const topicArr: any[] = Array.isArray(topicRes) ? topicRes : ((topicRes as any)?.data || []);
      const instrArr: Instructor[] = Array.isArray(instrRes?.data) ? instrRes.data : (instrRes || []);

      console.log("🔍 DEBUG parsed instrArr:", instrArr);
      console.log("🔍 DEBUG instructors count:", instrArr.length);

      setInstructors(instrArr);
      setTopics(topicArr.map((t: any) => ({
        topic_id:           t.topic_id,
        topic_title:        t.topic_title,
        topic_code:         t.topic_code,
        topic_hrs:          t.topic_hrs || t.num_of_sessions || "—",
        num_of_sessions:    t.num_of_sessions,
        is_imported:        !!t.is_imported,
        instructor_id:      t.instructor_id   ?? null,
        instructor_name:    t.instructor_name ?? null,
        selectedInstructor: t.instructor_id   ?? "",
      })));
    } catch (err) {
      console.error("Error loading data", err);
      toast("Error loading topics");
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
    // Import topics that are NOT yet imported AND have an instructor selected
    // OR topics that are already imported but the instructor was changed
    const toImport = topics.filter(t => 
      (!t.is_imported && t.selectedInstructor !== "") ||
      (t.is_imported && t.selectedInstructor !== "" && Number(t.selectedInstructor) !== Number(t.instructor_id))
    );

    // Check if any non-imported topics are missing an instructor
    const missingInstructor = topics.filter(t => !t.is_imported && t.selectedInstructor === "");

    if (toImport.length === 0) {
      if (topics.every(t => t.is_imported)) {
        toast("ℹ️ Topics imported already. No more topics to import.");
      } else {
        toast("Please select instructors for at least one topic to import.");
      }
      return;
    }

    setImporting(true);
    try {
      // Import topic-by-topic so each gets the right instructor
      for (const t of toImport) {
        await topicService.importCudosTopics({
          course_id: filters.course,
          semester_id: filters.semester,
          section_id: filters.section,
          topic_ids: [t.topic_id],
          instructor_id: Number(t.selectedInstructor),
          academic_batch_id: filters.curriculum,
        });

        // Find instructor name for UI update
        const instr = instructors.find(i => i.value === Number(t.selectedInstructor));
        if (updateTopicInTable) {
          updateTopicInTable(t.topic_id, {
            instructor_id:   Number(t.selectedInstructor),
            instructor_name: instr?.label ?? "Assigned",
            is_imported:     true,
          });
        }
      }

      toast(`✅ Successfully imported ${toImport.length} topic(s).`);
      await refresh();
      close();
    } catch (err) {
      console.error("Import error", err);
      toast("❌ Error importing topics");
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
    <div className="modal show d-block" style={{ position: "fixed", inset: 0, zIndex: 1050, backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header" style={{ background: "#1a73e8", color: "#fff" }}>
            <h5 className="modal-title" style={{ color: "#fff" }}>
              Import Topics &amp; Assign Instructors
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={close} />
          </div>

          <div className="modal-body">
            {!isValid && (
              <div className="alert alert-warning">
                Please select all required filters (Curriculum, Semester, Course, Section).
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
                <div className="alert alert-info mb-3">
                  <strong>Instructions:</strong> Select instructors for topics you want to import, then click "Import Topics". Only new topics will be imported — already imported topics will be skipped.
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
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
                      {topics.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No topics found for this combination.
                          </td>
                        </tr>
                      ) : (
                        topics.map((t, idx) => (
                          <tr key={t.topic_id}>
                            <td>{idx + 1}</td>
                            <td>{t.topic_title}</td>
                            <td>{t.topic_code}</td>
                            <td>{formatHrs(t.topic_hrs)}</td>
                            <td>
                              <select
                                className="form-select"
                                value={t.selectedInstructor || ""}
                                onChange={(e) =>
                                  handleInstructorChange(t.topic_id, Number(e.target.value))
                                }
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
                                <span className="badge bg-success">Already Imported</span>
                              ) : (
                                <span className="badge bg-warning text-dark">Ready to Import</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || loading || !isValid}
            >
              {importing ? "Importing..." : "Import Topics"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}