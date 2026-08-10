import React, { useEffect, useState } from "react";
import { useTopicService } from "./topicService";

import { toast } from "react-toastify";

type Schedule = {
  schedule_id: number;
  topic_id: number;
  session_number: number;
  portion_to_be_covered?: string | null;
  conduction_date: string | null;
  actual_delivery_date: string | null;
};

type Instructor = { value: number; label: string };

interface TopicRow {
  id: number;
  mapping_id?: number;
  topic_id: number;
  crs_id?: number;
  course_id?: number;
  topic_title: string;
  topic_code: string;
  topic_content?: string;
  topic_hrs: string;
  num_of_sessions: number;
  section_id?: number;
  instructor_id?: number;
  instructor_name?: string;
  lesson_schedule?: string;
  conduction_date?: string;
  actual_delivery_date?: string;
  marks_expt?: number;
  is_imported?: boolean;
}

interface EditTopicPageProps {
  topic: TopicRow & { [key: string]: any };
  academic_batch_id: number;
  semester_id: number;
  filters?: { course?: number; semester?: number; section?: number; academic_batch_id?: number };
  close: () => void;
  refresh: () => void;
  updateTopicInTable?: (topicId: number, updates: Partial<TopicRow>) => void;
  addTopicToTable?: (newTopic: TopicRow) => void;
  tableData?: TopicRow[];
}

export default function EditTopicPage({
  topic, academic_batch_id, semester_id, filters,
  close, refresh, updateTopicInTable, addTopicToTable, tableData
}: EditTopicPageProps) {
  const topicService = useTopicService();

  const [schedules,       setSchedules]       = useState<Schedule[]>([]);
  const [instructors,     setInstructors]     = useState<Instructor[]>([]);
  const [loading,         setLoading]         = useState(false);

  // ── Sub-modal visibility ──────────────────────────────────────────
  const [showExtraClass,   setShowExtraClass]  = useState(false);
  const [showAddNewTopic,  setShowAddNewTopic] = useState(false);
  const [showEditDetails,  setShowEditDetails] = useState(false);

  // ── Edit topic details form ──────────────────────────────────────
  const [editData, setEditData] = useState({
    topic_title:          topic.topic_title  || "",
    instructor_id:        topic.instructor_id ?? 0,
    actual_delivery_date: (topic.actual_delivery_date || "").split("T")[0] || "",
  });

  // ── Add new topic form ───────────────────────────────────────────
  const [newTopic, setNewTopic] = useState({
    topic_title: "", topic_code: "", topic_content: "",
    topic_hrs: "", num_of_sessions: 1, instructor_id: 0, delivery_date: ""
  });

  // ── Extra class form ─────────────────────────────────────────────
  const [extraClass, setExtraClass] = useState({
    date: "", startTime: "", endTime: "", notes: ""
  });

  // ── Load schedules + instructors on open ────────────────────────
  useEffect(() => {
    loadSchedules();
    loadInstructors();
    setEditData({
      topic_title:          topic.topic_title  || "",
      instructor_id:        topic.instructor_id ?? 0,
      actual_delivery_date: (topic.actual_delivery_date || "").split("T")[0] || "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.topic_id, topic.mapping_id]);

  useEffect(() => {
  if (filters?.course) {
    loadInstructors(filters.course);
  }
}, [filters?.course]);

  const loadSchedules = async () => {
    const mapId = topic.mapping_id ?? topic.inst_map_id;
    if (!mapId) { setSchedules([]); return; }
    try {
      const res: any = await topicService.getTopicSchedules({ mapping_id: mapId });
      setSchedules(Array.isArray(res) ? res : []);
    } catch { setSchedules([]); }
  };

  const loadInstructors = async (courseId?: number) => {
  try {
    const id = courseId || filters?.course;

    if (!id) {
      console.warn("⚠ No course_id provided");
      setInstructors([]);
      return;
    }

    const res = await topicService.getInstructorList({
      course_id: Number(id),
    });

    console.log("✅ Instructors loaded:", res);

    setInstructors(res || []);
  } catch (err) {
    console.error("❌ Load instructor failed:", err);
    setInstructors([]);
  }
};
  // ── Update a schedule row (planned / actual date) ────────────────
 const handleScheduleDateChange = async (
  schedule_id: number,
  field: "conduction_date" | "actual_delivery_date",
  value: string
) => {

  let updatedSchedules = [...schedules];

  let index = updatedSchedules.findIndex(s => s.schedule_id === schedule_id);

  if (index === -1) return;

  // ✅ Update UI immediately
  updatedSchedules[index] = {
    ...updatedSchedules[index],
    [field]: value || null
  };

  setSchedules(updatedSchedules);

  try {

    let current = updatedSchedules[index];

    // ✅ CASE 1: NEW ROW → CREATE FIRST
    if (!current.schedule_id || current.schedule_id === 0) {

      const mapId = topic.mapping_id ?? topic.inst_map_id;

      if (!mapId) {
        toast("Please import topic first");
        return;
      }

      const res: any = await topicService.addSchedule({
        mapping_id: mapId,
        session_number: current.session_number,
        portion_to_be_covered: current.portion_to_be_covered || "",
        conduction_date: field === "conduction_date" ? value : undefined,
        actual_delivery_date: field === "actual_delivery_date" ? value : undefined
      });

      const newId = res?.schedule_id || res?.id;

      // ✅ Replace temp id with real id
      updatedSchedules[index].schedule_id = newId;
      setSchedules([...updatedSchedules]);

    }

    // ✅ CASE 2: EXISTING → UPDATE
    else {
     await topicService.updateSchedule(current.schedule_id, {
  conduction_date: field === "conduction_date" ? value : undefined,
  actual_delivery_date: field === "actual_delivery_date" ? value : undefined,
  portion_to_be_covered: current.portion_to_be_covered || ""
});
    }

  } catch (err) {
    console.error(err);
    toast("Error updating schedule");
  }
};

  // ── Add More → new blank schedule row ────────────────────────────
const handleAddMore = () => {
  const newRow: Schedule = {
    schedule_id: 0, // ✅ FIXED
    topic_id: topic.topic_id,
    session_number: schedules.length + 1,
    portion_to_be_covered: "",
    conduction_date: null,
    actual_delivery_date: null
  };

  setSchedules(prev => [...prev, newRow]);
};

  // ── Save Edit Topic Details ───────────────────────────────────────
  const saveEditDetails = async () => {
    if (!editData.topic_title.trim()) { toast("Please enter topic title"); return; }
    setLoading(true);
    try {
      const courseId   = topic.course_id  || filters?.course;
      const semId      = filters?.semester || semester_id;
      const batchId    = filters?.academic_batch_id || academic_batch_id;
      const mapId      = topic.mapping_id ?? topic.inst_map_id;

      // 1. Update topic title in cudos_topic
      await topicService.updateTopic(topic.topic_id, {
  topic_code: topic.topic_code || "",
  topic_title: editData.topic_title || "",
  topic_content: topic.topic_content || "",
  course_id: Number(courseId),
  semester_id: Number(semId),
  academic_batch_id: Number(batchId),
  created_by: 1,
  conduction_date: undefined,
  actual_delivery_date: editData.actual_delivery_date || undefined
});

      // 2. Update instructor + delivery date in lms_map_instructor_topic + cudos_topic
      if (mapId && editData.instructor_id) {
        await topicService.updateMapping(mapId, {
          instructor_id:        editData.instructor_id,
        });
      } else if (!mapId && editData.instructor_id) {
        // Topic not yet imported → import it first
        await topicService.importCudosTopics({
          course_id:         courseId || 1,
          semester_id:       semId || 1,
          section_id:        filters?.section || 1,
          topic_ids:         [topic.topic_id],
          instructor_id:     editData.instructor_id,
          academic_batch_id: batchId || 1,
        });
      }

      // 3. Update delivery date in first schedule row if exists
      if (editData.actual_delivery_date && schedules.length > 0) {
        await topicService.updateSchedule(schedules[0].schedule_id, {
          actual_delivery_date: editData.actual_delivery_date
        });
      }

      // 4. Reflect in parent table immediately
      const instrName = instructors.find(i => i.value === editData.instructor_id)?.label ?? "Not Assigned";
      if (updateTopicInTable) {
        updateTopicInTable(topic.topic_id, {
          topic_title:          editData.topic_title,
          instructor_id:        editData.instructor_id || undefined,
          instructor_name:      instrName,
          actual_delivery_date: editData.actual_delivery_date || undefined,
        });
      }

      toast("✅ Topic details saved successfully!");
      setShowEditDetails(false);
      await loadSchedules();
    } catch (err: any) {
      toast(err?.message || "Error saving topic details");
    } finally {
      setLoading(false);
    }
  };

  // ── Add New Topic ────────────────────────────────────────────────
  const handleAddNewTopic = async () => {
  if (!newTopic.topic_title?.trim() || !newTopic.topic_code?.trim() || !newTopic.instructor_id) {
    toast("❌ Please fill topic title, code, and select instructor");
    return;
  }

  setLoading(true);

  try {
    const courseId  = Number(topic.course_id || filters?.course);
    const semId     = Number(filters?.semester || semester_id);
    const sectionId = Number(filters?.section);
    const batchId   = Number(filters?.academic_batch_id || academic_batch_id);

    // 🚨 VALIDATION (VERY IMPORTANT)
    if (!courseId || !semId || !sectionId || !batchId) {
      toast("❌ Missing required academic details");
      return;
    }

    // ✅ CALL API
    const res: any = await topicService.addNewTopic({
      academic_batch_id: batchId,
      semester_id: semId,
      course_id: courseId,
      section_id: sectionId,

      topic_title: newTopic.topic_title.trim(),
      topic_code: newTopic.topic_code.trim(),
      topic_content: newTopic.topic_content || "",

      topic_hrs: String(newTopic.topic_hrs || ""),
      num_of_sessions: Number(newTopic.num_of_sessions) || 1,
      delivery_date: newTopic.delivery_date || undefined,
      instructor_id: Number(newTopic.instructor_id),
      created_by: 1
    });

    console.log("✅ API RESPONSE:", res);

    // ✅ FIXED SUCCESS CHECK
    if (!res?.topic_id) {
      throw new Error(res?.message || "Failed to add topic");
    }

    const newTopicId = res.topic_id;
    const mappingId = res.mapping_id;

    const instrName =
      instructors.find(i => i.value === newTopic.instructor_id)?.label || "Assigned";

    // ✅ ADD TO TABLE
    if (addTopicToTable) {
      addTopicToTable({
        id: Date.now(),
        topic_id: newTopicId,
        mapping_id: mappingId,

        topic_title: newTopic.topic_title.trim(),
        topic_code: newTopic.topic_code.trim(),
        topic_content: newTopic.topic_content,

        topic_hrs: newTopic.topic_hrs,
        num_of_sessions: Number(newTopic.num_of_sessions),

        course_id: courseId,
        section_id: sectionId,

        instructor_id: Number(newTopic.instructor_id),
        instructor_name: instrName,

        actual_delivery_date: newTopic.delivery_date || undefined,
        is_imported: true
      });
    }

    toast("✅ Topic added successfully!");

    // RESET
    setNewTopic({
      topic_title: "",
      topic_code: "",
      topic_content: "",
      topic_hrs: "",
      num_of_sessions: 1,
      instructor_id: 0,
      delivery_date: ""
    });

    setShowAddNewTopic(false);
    refresh();

  } catch (err: any) {
  console.error("❌ FULL ERROR:", err);

  alert(
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong"
  );
}
};

  // ── Add Extra Class ──────────────────────────────────────────────
  const handleAddExtraClass = async () => {
    if (!extraClass.date) { toast("Please select a date"); return; }
    const mapId = topic.mapping_id ?? topic.inst_map_id;
    if (!mapId) { toast("Topic must be imported first"); return; }
    try {
      await topicService.addExtraClass({
        mapping_id: mapId,
        class_date: extraClass.date,
        start_time: extraClass.startTime || undefined,
        end_time:   extraClass.endTime   || undefined,
        notes:      extraClass.notes,
      });
      toast("✅ Extra class added!");
      setShowExtraClass(false);
      setExtraClass({ date: "", startTime: "", endTime: "", notes: "" });
      await loadSchedules();
    } catch { toast("Error adding extra class"); }
  };

  // ── Render ───────────────────────────────────────────────────────
  const mapId = topic.mapping_id ?? topic.inst_map_id;

  return (
    <>
      {/* ── Main Edit Modal ──────────────────────────────────────── */}
      <div className="modal show d-block" style={{ position: "fixed", inset: 0, zIndex: 1050, backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Topic &amp; Lesson Schedule</h5>
              <button type="button" className="btn-close" onClick={close} />
            </div>

            <div className="modal-body">
              {/* Topic info header */}
              <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h6 className="mb-1">{topic.topic_title}</h6>
                  <small className="text-muted">Code: {topic.topic_code}</small>
                </div>
                <button className="btn btn-warning btn-sm" onClick={() => setShowEditDetails(true)}>
                  Edit Topic Details
                </button>
              </div>

              {/* Action buttons */}
             <div className="d-flex gap-2 mb-3">
  <button className="btn btn-primary" onClick={handleAddMore}>
    Add More
  </button>

  <button
    className="btn btn-success"
    onClick={() => {
  loadInstructors();   // ✅ always load
  setShowAddNewTopic(true);
}}
  >
    Add Topic
  </button>

  <button className="btn btn-secondary" onClick={() => {
    if (!mapId) {
      toast("Topic must be imported before adding extra class.");
      return;
    }
    setShowExtraClass(true);
  }}>
    Extra Class
  </button>
</div>

              {/* Lesson schedule table — matches demo image 10 */}
              {schedules.length === 0 ? (
  <>
    <div className="alert alert-warning">
      No lesson schedules found. Click "Add More" to create schedules.
    </div>

    {/* ✅ ADD FIRST ROW BUTTON */}
    <button
      className="btn btn-sm btn-outline-primary mt-2"
      onClick={() => {
        setSchedules([
          {
            schedule_id: 0,
            topic_id: topic.topic_id,
            session_number: 1,
            portion_to_be_covered: "",
            conduction_date: null,
            actual_delivery_date: null
          }
        ]);
      }}
    >
      + Add First Row
    </button>
  </>
) : (
                <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table className="table table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 90 }}>Lecture No.</th>
                        <th>Portion to be Covered per Hour *</th>
                        <th style={{ width: 170 }}>Planned Delivery Date *</th>
                        <th style={{ width: 170 }}>Actual Delivery Date *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s, index) => (
                        <tr key={s.schedule_id}>
                          <td className="text-center align-middle">
                            <span className="badge bg-secondary">{s.session_number}</span>
                          </td>
                          <td>
                            <input
  type="text"
  className="form-control form-control-sm"
  value={s.portion_to_be_covered ?? ""}
  placeholder="Portion to be covered"
  onChange={(e) => {
    const updated = [...schedules];
    updated[index] = {
      ...updated[index],
      portion_to_be_covered: e.target.value
    };
    setSchedules(updated);
  }}
/>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={(s.conduction_date || "").split("T")[0] || ""}
                              onChange={(e) =>
                                handleScheduleDateChange(s.schedule_id, "conduction_date", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={(s.actual_delivery_date || "").split("T")[0] || ""}
                              onChange={(e) =>
                                handleScheduleDateChange(s.schedule_id, "actual_delivery_date", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                    Note: The lesson schedule will be added to the calendar only if the date is selected.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-danger" onClick={close}>Cancel</button>
              <button
  className="btn btn-success"
  onClick={async () => {
    try {
      let mapId = topic.mapping_id ?? topic.inst_map_id;

      // ✅ ensure imported
      if (!mapId) {
        const res: any = await topicService.importCudosTopics({
          course_id: topic.course_id!,
          semester_id: semester_id,
          section_id: topic.section_id!,
          topic_ids: [topic.topic_id],
          instructor_id: topic.instructor_id || 1,
          academic_batch_id: academic_batch_id
        });

        mapId = res?.mapping_id;
      }

      // ✅ save all rows
    for (let sch of schedules) {
  if (!sch.schedule_id || sch.schedule_id === 0) {
    await topicService.addSchedule({
      mapping_id: mapId,
      session_number: sch.session_number || 1,
      portion_to_be_covered: sch.portion_to_be_covered || "",
      conduction_date: sch.conduction_date || undefined,
      actual_delivery_date: sch.actual_delivery_date || undefined
    });
  }
}
      toast("Saved successfully");
      close();
      refresh();

    } catch (err) {
      console.error(err);
      toast("Error saving schedules");
    }
  }}
>
  Save
</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Topic Details sub-modal ─────────────────────────── */}
      {showEditDetails && (
        <div className="modal show d-block" style={{ position: "fixed", inset: 0, zIndex: 1060, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Topic Details</h5>
                <button className="btn-close" onClick={() => setShowEditDetails(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Topic Title *</label>
                  <input
                    type="text" className="form-control"
                    value={editData.topic_title}
                    onChange={e => setEditData({ ...editData, topic_title: e.target.value })}
                    placeholder="Enter topic title"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Topic Code</label>
                  <input type="text" className="form-control" value={topic.topic_code} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Instructor</label>
                  <select
  className="form-select"
  value={editData.instructor_id || ""}
  onChange={(e) =>
    setEditData({
      ...editData,
      instructor_id: Number(e.target.value)
    })
  }
>
  <option value="">Select Instructor</option>

  {instructors.map((i) => (
    <option key={i.value} value={i.value}>
      {i.label}
    </option>
  ))}
</select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Delivery Date</label>
                  <input
                    type="date" className="form-control"
                    value={editData.actual_delivery_date}
                    onChange={e => setEditData({ ...editData, actual_delivery_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditDetails(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={saveEditDetails}
                  disabled={loading || !editData.topic_title.trim()}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add New Topic sub-modal ──────────────────────────────── */}
      {showAddNewTopic && (
        <div className="modal show d-block" style={{ position: "fixed", inset: 0, zIndex: 1060, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Topic</h5>
                <button className="btn-close" onClick={() => setShowAddNewTopic(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Topic Title *</label>
                  <input type="text" className="form-control" value={newTopic.topic_title}
                    onChange={e => setNewTopic({ ...newTopic, topic_title: e.target.value })}
                    placeholder="Enter topic title" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Topic Code *</label>
                  <input type="text" className="form-control" value={newTopic.topic_code}
                    onChange={e => setNewTopic({ ...newTopic, topic_code: e.target.value })}
                    placeholder="Enter topic code" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Topic Content</label>
                  <textarea className="form-control" rows={3} value={newTopic.topic_content}
                    onChange={e => setNewTopic({ ...newTopic, topic_content: e.target.value })}
                    placeholder="Enter topic content" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Topic Hours</label>
                  <input type="text" className="form-control" value={newTopic.topic_hrs}
                    onChange={e => setNewTopic({ ...newTopic, topic_hrs: e.target.value })}
                    placeholder="Enter topic hours" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Number of Sessions</label>
                  <input type="number" className="form-control" min={1} value={newTopic.num_of_sessions}
                    onChange={e => setNewTopic({ ...newTopic, num_of_sessions: Number(e.target.value) })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Assign Instructor *</label>
                  <select className="form-select" value={newTopic.instructor_id}
                    onChange={e => setNewTopic({ ...newTopic, instructor_id: Number(e.target.value) })}>
                    <option value={0}>Select Instructor</option>
                    {instructors.map(i => (
                     <option key={i.value} value={i.value}>
  {i.label}
</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Delivery Date</label>
                  <input type="date" className="form-control" value={newTopic.delivery_date}
                    onChange={e => setNewTopic({ ...newTopic, delivery_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddNewTopic(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddNewTopic}
                  disabled={loading || !newTopic.topic_title || !newTopic.topic_code || !newTopic.instructor_id}>
                  {loading ? "Adding..." : "Add Topic"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Extra Class sub-modal ────────────────────────────────── */}
      {showExtraClass && (
        <div className="modal show d-block" style={{ position: "fixed", inset: 0, zIndex: 1060, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Extra Class</h5>
                <button className="btn-close" onClick={() => setShowExtraClass(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Class Date *</label>
                  <input type="date" className="form-control" value={extraClass.date}
                    onChange={e => setExtraClass({ ...extraClass, date: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-control" value={extraClass.startTime}
                    onChange={e => setExtraClass({ ...extraClass, startTime: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-control" value={extraClass.endTime}
                    onChange={e => setExtraClass({ ...extraClass, endTime: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={extraClass.notes}
                    onChange={e => setExtraClass({ ...extraClass, notes: e.target.value })}
                    placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowExtraClass(false)}>Close</button>
                <button className="btn btn-primary" onClick={handleAddExtraClass}
                  disabled={!extraClass.date}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Add More" button in Edit page also opens the Add New Topic sub-modal */}
      {/* Shown inline inside the main modal via showAddNewTopic state */}
    </>
  );
}
