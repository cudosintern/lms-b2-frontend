import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useTopicService } from "./topicService";
import InstructorSelect from "./InstructorSelect";
import { InstructorOption } from "./topicUi";
import "./manageTopicInstructor.css";
interface Props {
  filters: { curriculum: number; semester: number; course: number; section: number };
  close: () => void; refresh: () => void; topics: any[];
  updateTopicInTable?: (id: number, values: any) => void;
  addTopicToTable?: (topic: any) => void;
}
export default function AssignInstructorModal({ filters, close, refresh }: Props) {
  const service = useTopicService();
  const [topics, setTopics] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const context = { academic_batch_id: filters.curriculum, semester_id: filters.semester, course_id: filters.course, section_id: filters.section };
  useEffect(() => {
    let active = true;
    Promise.all([service.getCudosTopics(context), service.getInstructorList(context)])
      .then(([rows, users]) => {
        if (!active) return;
        setTopics(rows); setInstructors(users);
        setSelected(Object.fromEntries(rows.map(t => [t.topic_id, t.instructor_ids?.length ? t.instructor_ids : t.has_portions !== false && users.length ? [t.default_instructor_id || users[0].value] : []])));
      })
      .catch(() => { if (active) setError("Unable to load topics and instructors. Close and try again."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [filters.curriculum, filters.semester, filters.course, filters.section, service]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) close(); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [busy, close]);
  const save = async () => {
    const assignments = topics.filter(t => selected[t.topic_id]?.length).map(t => ({ topic_id: t.topic_id, instructor_ids: selected[t.topic_id] }));
    if (!assignments.length) { toast.info("Select a faculty for at least one topic"); return; }
    setBusy(true);
    try { await service.assignTopics({ ...context, assignments }); await refresh(); toast.success("Topics assigned successfully"); close(); }
    catch (e: any) { setError(typeof e.response?.data?.detail === "string" ? e.response.data.detail : e.message || "Assignment failed"); }
    finally { setBusy(false); }
  };
  return createPortal(<div className="mti-backdrop" role="presentation" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.45)", overflow: "auto", boxSizing: "border-box" }}><section className="mti-modal" role="dialog" aria-modal="true" aria-labelledby="assign-topic-title" style={{ position: "relative", width: 600, maxWidth: "100%", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", background: "#fff", borderRadius: 6, flexShrink: 0 }}>
    <header className="mti-modal-header"><h2 id="assign-topic-title">Assign Topic to Course Instructor</h2><button className="mti-close" aria-label="Close assignment dialog" disabled={busy} onClick={close}>×</button></header>
    {error && <div className="mti-error" role="alert">{error}</div>}
    {topics.map((t, index) => <div className="mti-assignment-row" key={t.topic_id}>
      <div className={t.has_portions === false ? "mti-missing" : t.instructor_ids?.length ? "mti-assigned" : ""}>
        {/^\d+[.)]/.test(t.topic_title) ? t.topic_title : `${index + 1}. ${t.topic_title}`}
        {t.has_portions === false && <small style={{ display: "block", marginTop: 4 }}>Lesson portions have not been added yet.</small>}
      </div>
      <InstructorSelect label={`Instructors for ${t.topic_title}`} options={instructors} value={selected[t.topic_id] || []} locked={t.instructor_ids || []} disabled={busy} onChange={ids => {
        if (ids.length > 3) { toast.error("Cannot select more than 3 faculties"); return; }
        setSelected(values => ({ ...values, [t.topic_id]: ids }));
      }} />
    </div>)}
    {!topics.length && <p style={{ padding: 15 }}>{busy ? "Loading topics…" : "No topics found for this course and section."}</p>}
    <div className="mti-legend"><span className="mti-badge mti-success">Topic instructor assigned</span><span className="mti-badge mti-danger">Portion not added</span></div>
    <footer className="mti-modal-footer"><button className="mti-button mti-neutral" disabled={busy} onClick={close}>Close</button><button className="mti-button mti-primary" disabled={busy || !!error} onClick={save}>{busy ? "Please wait…" : "Submit"}</button></footer>
  </section></div>, document.body);
}
