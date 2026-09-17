import React, { FormEvent, useEffect, useRef, useState } from "react";
import { errorMessage, registrationApi } from "./api";
import { Course, Summary, TypeSummary } from "./types";

type Draft = Omit<Course, "capacity"> & { capacity: string };
export default function CourseLimitsDialog({ summary, kind, onClose, onSaved }: {
  summary: Summary; kind: TypeSummary; onClose: () => void; onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const editable = kind.alias === "ELECTIVE" || kind.alias === "OPEN_ELECTIVE";
  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    registrationApi.courses(summary.academic_batch_id, summary.semester_id, kind.course_type_id, controller.signal)
      .then(data => setRows(data.map(row => ({ ...row, capacity: row.capacity === null ? "" : String(row.capacity) }))))
      .catch(async err => { if (!controller.signal.aborted) setError(await errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [summary.academic_batch_id, summary.semester_id, kind.course_type_id]);
  function close() { if (!busy && (!dirty || window.confirm("Discard unsaved course limits?"))) onClose(); }
  function edit(index: number, field: "capacity" | "start" | "end", value: string) {
    setRows(old => old.map((row, i) => i === index ? { ...row, [field]: value } : row)); setDirty(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const open = kind.alias === "OPEN_ELECTIVE";
    const payload = rows.map(row => ({ course_id: row.course_id, capacity: row.capacity === "" ? null : Number(row.capacity),
      start: open ? row.start : null, end: open ? row.end : null }));
    for (let i = 0; i < rows.length; i++) {
      const row = payload[i];
      if (row.capacity !== null && (!Number.isInteger(row.capacity) || row.capacity < rows[i].registered)) {
        setError(`${rows[i].code}: capacity must be a whole number at least ${rows[i].registered}, or blank for unlimited.`); return;
      }
      if (open) {
        if (!summary.start || !summary.end) { setError("Save the term window first."); return; }
        const start = new Date(row.start || "").getTime(), end = new Date(row.end || "").getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1800000 || start < new Date(summary.start).getTime() || end > new Date(summary.end).getTime()) {
          setError(`${rows[i].code}: use a window of at least 30 minutes within the saved term window.`); return;
        }
      }
    }
    setBusy(true);
    try { await registrationApi.saveCourses(summary.academic_batch_id, summary.semester_id, kind.course_type_id, payload); onSaved(); }
    catch (err) { setError(await errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="crc-dialog" aria-labelledby="crc-dialog-title" onCancel={event => { event.preventDefault(); close(); }}>
    <form onSubmit={submit}>
      <h2 id="crc-dialog-title">{kind.name} — course limits</h2>
      {editable ? <p>Leave capacity blank for unlimited enrollment. Zero prevents new registrations.</p> : <p>Enrollment details for this course type are read-only.</p>}
      {kind.alias === "OPEN_ELECTIVE" && <p>Use a window of at least 30 minutes inside {summary.start?.replace("T", " ")} to {summary.end?.replace("T", " ")}.</p>}
      {error && <p role="alert" className="crc-error">{error}</p>}
      <fieldset disabled={busy}><div className="crc-table-scroll"><table>
        <thead><tr><th>Course</th><th>Credits</th><th>Registered</th><th>Capacity</th>{kind.alias === "OPEN_ELECTIVE" && <><th>Start</th><th>End</th></>}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.course_id}>
          <th scope="row">{row.code}<small>{row.title}</small></th><td>{row.credits}</td><td>{row.registered}</td>
          <td>{editable ? <input aria-label={`${row.code} capacity`} type="number" min={row.registered} step="1" placeholder="Unlimited" value={row.capacity} onChange={e => edit(index, "capacity", e.target.value)} /> : row.capacity || "Unlimited"}</td>
          {kind.alias === "OPEN_ELECTIVE" && <><td><input aria-label={`${row.code} start`} required type="datetime-local" value={row.start?.slice(0, 16) || ""} min={summary.start?.slice(0, 16)} max={summary.end?.slice(0, 16)} onChange={e => edit(index, "start", e.target.value)} /></td>
          <td><input aria-label={`${row.code} end`} required type="datetime-local" value={row.end?.slice(0, 16) || ""} min={summary.start?.slice(0, 16)} max={summary.end?.slice(0, 16)} onChange={e => edit(index, "end", e.target.value)} /></td></>}
        </tr>)}</tbody></table></div></fieldset>
      {busy && <p role="status">Loading or saving course limits…</p>}
      <div className="crc-actions"><button type="button" onClick={close} disabled={busy}>{editable ? "Cancel" : "Close"}</button>{editable && <button type="submit" className="crc-primary" disabled={busy || !dirty || !rows.length}>Save course limits</button>}</div>
    </form>
  </dialog>;
}
