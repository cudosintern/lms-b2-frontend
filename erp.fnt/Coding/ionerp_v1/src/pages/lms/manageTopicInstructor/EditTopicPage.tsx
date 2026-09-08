import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useTopicService } from "./topicService";
import InstructorSelect from "./InstructorSelect";
import { TopicPortion, TopicLabels, InstructorOption, isoDate, clockTime, displayTime, extraClassUrl } from "./topicUi";
import "./manageTopicInstructor.css";
interface Props {
  topic: any; academic_batch_id: number; semester_id: number;
  filters?: { course?: number; semester?: number; section?: number; academic_batch_id?: number };
  labels?: TopicLabels; close: () => void; refresh: () => void;
  updateTopicInTable?: (id: number, values: any) => void;
  addTopicToTable?: (topic: any) => void; tableData?: any[];
}
export default function EditTopicPage({ topic, academic_batch_id, semester_id, filters, labels, close, refresh }: Props) {
  const service = useTopicService();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<TopicPortion[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [selected, setSelected] = useState<number[]>(topic.instructor_ids || (topic.instructor_id ? [topic.instructor_id] : []));
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const nextId = useRef(-1);
  const mappingId = topic.mapping_id || topic.inst_map_id;
  const context = { academic_batch_id: filters?.academic_batch_id || academic_batch_id,
    semester_id: filters?.semester || semester_id, course_id: filters?.course || topic.course_id || topic.crs_id,
    section_id: filters?.section || topic.section_id };
  const draftKey = `lms.topicInstructor.draft.${context.academic_batch_id}.${context.semester_id}.${context.course_id}.${context.section_id}.${topic.topic_id}`;
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setBusy(true);
    Promise.all([service.getInstructorList(context), service.getTopicSchedules({ mapping_id: mappingId }), service.getDeliverySlots(mappingId)])
      .then(([users, rows, times]) => {
        if (!active) return;
        setInstructors(users); setSlots(times);
        setLoaded(true);
        let restored = rows;
        try {
          const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
          if (draft?.mappingId === mappingId && Array.isArray(draft.schedules)) {
            restored = [...draft.schedules.filter((row: TopicPortion) => row.schedule_id < 0 || rows.some(r => r.schedule_id === row.schedule_id)), ...rows.filter(row => !draft.schedules.some((r: TopicPortion) => r.schedule_id === row.schedule_id))];
            if (Array.isArray(draft.instructors)) setSelected(draft.instructors);
          }
        } catch { /* A draft is optional. */ }
        nextId.current = Math.min(0, ...restored.map((r: TopicPortion) => r.schedule_id)) - 1;
        setSchedules(restored.map((row: TopicPortion) => ({ ...row, conduction_date: isoDate(row.conduction_date) || null, actual_delivery_date: isoDate(row.actual_delivery_date) || null, start_time: clockTime(row.start_time) || null, end_time: clockTime(row.end_time) || null })));
      })
      .catch(() => { if (active) setError("Unable to load lesson schedules. Return to the topic list and try again."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [mappingId, topic.topic_id, service, draftKey]);
  const clearDraft = () => { try { sessionStorage.removeItem(draftKey); } catch { /* Optional storage. */ } };
  const addRow = () => setSchedules(rows => [...rows, { schedule_id: nextId.current--, session_number: Math.max(0, ...rows.map(r => Number(r.session_number) || 0)) + 1, portion_to_be_covered: "", conduction_date: null, actual_delivery_date: null, start_time: null, end_time: null }]);
  const change = (id: number, values: Partial<TopicPortion>) => setSchedules(rows => rows.map(row => row.schedule_id === id ? { ...row, ...values } : row));
  const save = async () => {
    if (!selected.length) { toast.error("Select an instructor"); return; }
    if (schedules.some(s => !s.portion_to_be_covered?.trim() || !Number.isInteger(s.session_number) || s.session_number < 1)) { toast.error("Enter a lecture number and portion for every row"); return; }
    setBusy(true); setError("");
    try { await service.saveSchedules(mappingId, schedules, selected); clearDraft(); await refresh(); toast.success("Lesson schedule details saved successfully"); close(); }
    catch (e: any) { setError(typeof e.response?.data?.detail === "string" ? e.response.data.detail : e.message || "Unable to save schedules"); }
    finally { setBusy(false); }
  };
  const extraClass = () => {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ mappingId, schedules, instructors: selected })); }
    catch { toast.error("Unable to preserve your edits. Save or cancel them before opening the calendar."); return; }
    navigate(extraClassUrl(context));
  };
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  return <div className="mti"><section className="mti-card" aria-label="Edit topic lesson schedule">
    <h1 className="mti-heading">Manage Topic Instructor</h1>
    <div className="mti-context"><div>Curriculum: {labels?.curriculum || academic_batch_id}</div><div>Term: {labels?.semester || semester_id}</div><div>Course: {labels?.course || topic.topic_code}</div><div>Section: {labels?.section || context.section_id}</div></div>
    <div className="mti-topic-line"><div>Topic: {topic.topic_title}</div><div style={{ display:"flex",alignItems:"center",gap:8 }}><span>Instructor:</span><div style={{ flex:1 }}><InstructorSelect label="Topic instructors" options={instructors} value={selected} locked={topic.instructor_ids || (topic.instructor_id ? [topic.instructor_id] : [])} disabled={busy} onChange={setSelected} /></div></div><div className="mti-toolbar"><button className="mti-button mti-primary" disabled={busy || !loaded} onClick={addRow}>Add More</button></div></div>
    {error && <div className="mti-error" role="alert">{error}</div>}
    {busy && !schedules.length ? <p>Loading lesson schedules…</p> : <div className="mti-table-wrap"><table className="mti-table mti-schedule-table"><thead><tr><th>Lecture No. <span className="mti-required">*</span></th><th>Portion to be covered per hour <span className="mti-required">*</span></th><th>Planned Delivery Date</th><th>Actual Delivery Date <span className="mti-required">*</span></th><th>Delivery time <span className="mti-required">*</span></th><th>Action</th></tr></thead><tbody>
      {schedules.map(row => {
        const choices = slots.filter(slot => isoDate(slot.class_date) === isoDate(row.actual_delivery_date));
        const current = row.start_time && row.end_time ? `${clockTime(row.start_time)}|${clockTime(row.end_time)}` : "";
        const options = Array.from(new Map(choices.map(slot => [`${clockTime(slot.start_time)}|${clockTime(slot.end_time)}`, slot])).entries());
        return <tr key={row.schedule_id}>
          <td><input className="mti-field" aria-label={`Lecture number ${row.session_number}`} type="number" min={1} disabled={busy} value={row.session_number} onChange={e => change(row.schedule_id, { session_number: Number(e.target.value) })} /></td>
          <td><input className="mti-field" aria-label={`Portion for lecture ${row.session_number}`} disabled={busy} value={row.portion_to_be_covered} onChange={e => change(row.schedule_id, { portion_to_be_covered:e.target.value })} /></td>
          <td><input className="mti-field" type="date" aria-label={`Planned date for lecture ${row.session_number}`} disabled={busy} value={isoDate(row.conduction_date)} onChange={e => change(row.schedule_id, { conduction_date:e.target.value || null })} /></td>
          <td><input className="mti-field" type="date" aria-label={`Actual date for lecture ${row.session_number}`} max={maxDate} disabled={busy} value={isoDate(row.actual_delivery_date)} onChange={e => change(row.schedule_id, { actual_delivery_date:e.target.value || null, start_time:null, end_time:null })} /></td>
          <td><select className="mti-field" aria-label={`Delivery time for lecture ${row.session_number}`} disabled={busy || !row.actual_delivery_date} value={current} onChange={e => { const [start,end]=e.target.value.split("|"); change(row.schedule_id,{ start_time:start || null, end_time:end || null }); }}>
            <option value="">{row.actual_delivery_date && !options.length && !current ? "No slots" : "Select"}</option>
            {current && !options.some(([key]) => key === current) && <option value={current}>{displayTime(row.start_time)}</option>}
            {options.map(([key,slot]) => <option key={key} value={key}>{displayTime(slot.start_time)}</option>)}
          </select></td>
          <td>{row.schedule_id < 0 && <button className="mti-button mti-danger mti-delete" title="Delete new row" aria-label={`Delete lecture ${row.session_number}`} disabled={busy} onClick={() => setSchedules(rows => rows.filter(r => r.schedule_id !== row.schedule_id))}><Trash2 size={15} /></button>}</td>
        </tr>;
      })}
      {!schedules.length && <tr><td colSpan={6}>No portions found. Click Add More to add a lecture.</td></tr>}
    </tbody></table></div>}
    <footer className="mti-edit-footer"><p>Note: The lesson schedule will be added to the calendar only if the date and time are selected.</p><div style={{ display:"flex",gap:4 }}><button className="mti-button mti-primary" disabled={busy || !loaded} onClick={extraClass}>Extra Class <CalendarDays size={13} /></button><button className="mti-button mti-danger" disabled={busy} onClick={() => { clearDraft(); close(); }}>Cancel</button><button className="mti-button mti-success" disabled={busy || !loaded} onClick={save}>{busy ? "Saving…" : "Save"}</button></div></footer>
  </section></div>;
}

