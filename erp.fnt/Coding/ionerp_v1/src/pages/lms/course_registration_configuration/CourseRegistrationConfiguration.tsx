import React, { FormEvent, useEffect, useState } from "react";
import { errorMessage, registrationApi } from "./api";
import CourseLimitsDialog from "./CourseLimitsDialog";
import { Option, Options, Summary, TypeSummary } from "./types";
import "./courseRegistrationConfiguration.css";

interface Draft {
  start: string; end: string; total: string; own: string; other: string;
  limits: { course_type_id: number; minimum: string; maximum: string }[];
}
const emptyDraft: Draft = { start: "", end: "", total: "", own: "0", other: "0", limits: [] };
const storageKey = "course-registration-configuration.selection";
function remembered(): number[] {
  try { const value = JSON.parse(sessionStorage.getItem(storageKey) || "[]"); return Array.isArray(value) && value.length === 4 && value.every(Number.isInteger) ? value : [0, 0, 0, 0]; }
  catch { return [0, 0, 0, 0]; }
}
function fromSummary(data: Summary): Draft {
  return { start: data.start?.slice(0, 16) || "", end: data.end?.slice(0, 16) || "",
    total: data.total === null ? "" : String(data.total), own: String(data.own_electives), other: String(data.other_electives),
    limits: data.types.map(row => ({ course_type_id: row.course_type_id, minimum: row.minimum === null ? "" : String(row.minimum), maximum: row.maximum === null ? "" : String(row.maximum) })) };
}
function Select({ label, value, options, onChange, disabled }: { label: string; value: number; options: Option[]; onChange: (value: number) => void; disabled?: boolean }) {
  return <label>{label}<select value={value} disabled={disabled} onChange={e => onChange(Number(e.target.value))}><option value={0}>Select {label.toLowerCase()}</option>{options.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>;
}

export default function CourseRegistrationConfiguration() {
  const [selection, setSelection] = useState<number[]>(remembered);
  const [department, program, batch, term] = selection;
  const [options, setOptions] = useState<Options | null>(null);
  const [terms, setTerms] = useState<Option[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<TypeSummary | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    registrationApi.options(controller.signal).then(data => {
      setOptions(data);
      setSelection(current => {
        const curriculum = data.curricula.find(c => c.id === current[2]);
        return curriculum ? [curriculum.department_id, curriculum.program_id, curriculum.id, current[3]] : [0, 0, 0, 0];
      });
    }).catch(async err => { if (!controller.signal.aborted) setError(await errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Storage is optional. */ }
  }, [selection]);
  useEffect(() => {
    const controller = new AbortController();
    setTerms([]);
    if (batch && options?.curricula.some(c => c.id === batch)) {
      registrationApi.terms(batch, controller.signal).then(data => {
        setTerms(data);
        setSelection(current => current[2] === batch && current[3] && !data.some(t => t.id === current[3]) ? [current[0], current[1], batch, 0] : current);
      }).catch(async err => { if (!controller.signal.aborted) setError(await errorMessage(err)); });
    }
    return () => controller.abort();
  }, [batch, options]);
  useEffect(() => {
    const controller = new AbortController();
    setSummary(null); setDraft(emptyDraft); setDirty(false);
    if (!batch || !term || !options || !terms.some(t => t.id === term)) {
      if (options) setLoading(false);
      return () => controller.abort();
    }
    setLoading(true); setError("");
    registrationApi.summary(batch, term, controller.signal).then(data => { setSummary(data); setDraft(fromSummary(data)); })
      .catch(async err => { if (!controller.signal.aborted) setError(await errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [batch, term, options, terms, revision]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  function choose(next: number[]) {
    if (dirty && !window.confirm("Discard unsaved registration configuration?")) return;
    setNotice(""); setError(""); setDirty(false); setSelection(next);
  }
  function edit(field: keyof Omit<Draft, "limits">, value: string) { setDraft(old => ({ ...old, [field]: value })); setDirty(true); setNotice(""); }
  function editLimit(index: number, field: "minimum" | "maximum", value: string) {
    setDraft(old => ({ ...old, limits: old.limits.map((row, i) => i === index ? { ...row, [field]: value } : row) })); setDirty(true); setNotice("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!summary) return;
    setError(""); setNotice("");
    if (new Date(draft.end).getTime() - new Date(draft.start).getTime() < 1800000) { setError("The registration window must be at least 30 minutes."); return; }
    const limits = draft.limits.map(row => ({ course_type_id: row.course_type_id, minimum: Number(row.minimum), maximum: Number(row.maximum) }));
    if (limits.reduce((sum, row) => sum + Math.round(row.minimum * 10), 0) > Math.round(Number(draft.total) * 10)) { setError("The sum of minimum limits cannot exceed the total student limit."); return; }
    for (let i = 0; i < limits.length; i++) {
      if (limits[i].minimum > limits[i].maximum) { setError(`${summary.types[i].name}: minimum cannot exceed maximum.`); return; }
    }
    setSaving(true);
    try {
      await registrationApi.save(batch, term, { start: draft.start, end: draft.end, total: Number(draft.total), own_electives: Number(draft.own), other_electives: Number(draft.other), limits });
      setDirty(false); setNotice("Registration configuration saved."); setRevision(r => r + 1);
    } catch (err) { setError(await errorMessage(err)); }
    finally { setSaving(false); }
  }
  async function exportPdf() {
    setSaving(true); setError("");
    try { await registrationApi.pdf(batch, term); } catch (err) { setError(await errorMessage(err)); } finally { setSaving(false); }
  }
  return <main className="crc-page">
    <header><div><p className="crc-eyebrow">LMS · Registration setup</p><h1>Course registration configuration</h1><p>Set registration dates and enrollment limits for each curriculum and term.</p></div></header>
    {error && <div className="crc-error" role="alert">{error}</div>}
    {notice && <div className="crc-success" role="status">{notice}</div>}
    <section className="crc-card" aria-label="Select curriculum and term"><div className="crc-grid">
      <Select label="Department" value={department} options={options?.departments || []} disabled={saving || !options} onChange={id => choose([id, 0, 0, 0])} />
      <Select label="Program" value={program} options={(options?.programs || []).filter(p => !department || p.department_id === department)} disabled={saving || !options} onChange={id => choose([options?.programs.find(p => p.id === id)?.department_id || department, id, 0, 0])} />
      <Select label="Curriculum" value={batch} options={(options?.curricula || []).filter(c => (!department || c.department_id === department) && (!program || c.program_id === program))} disabled={saving || !options} onChange={id => { const row = options?.curricula.find(c => c.id === id); choose([row?.department_id || department, row?.program_id || program, id, 0]); }} />
      <Select label="Term" value={term} options={terms} disabled={saving || !batch} onChange={id => choose([department, program, batch, id])} />
    </div></section>
    {loading && <p role="status">Loading registration configuration…</p>}
    {!loading && !summary && options && <p className="crc-empty">Select a curriculum and term to configure registration.</p>}
    {summary && <form className="crc-card" onSubmit={submit}>
      <div className="crc-section-title"><h2>{summary.term_name}</h2><span className="crc-badge">{summary.mode === "credits" ? "Credit-based" : "Course-based"} registration</span></div>
      <p>Total available {summary.mode}: <strong>{summary.total_available}</strong> · Highest existing student registration: <strong>{summary.max_registered}</strong></p>
      <fieldset disabled={saving}><div className="crc-grid">
        <label>Registration starts<input required type="datetime-local" value={draft.start} onChange={e => edit("start", e.target.value)} /></label>
        <label>Registration ends<input required type="datetime-local" value={draft.end} onChange={e => edit("end", e.target.value)} /></label>
        <label>Total {summary.mode} a student can enroll<input required type="number" min={Math.max(1, summary.max_registered)} max="60" step={summary.mode === "credits" ? ".1" : "1"} value={draft.total} onChange={e => edit("total", e.target.value)} /></label>
        {summary.mode === "credits" && <><label>Open electives from own curriculum<input type="number" min="0" max="9" step="1" value={draft.own} onChange={e => edit("own", e.target.value)} /></label>
        <label>Open electives from other curricula<input type="number" min="0" max="9" step="1" value={draft.other} onChange={e => edit("other", e.target.value)} /></label></>}
      </div>
      <div className="crc-table-scroll"><table><thead><tr><th>Course type</th><th>Total {summary.mode}</th><th>Minimum {summary.mode}</th><th>Maximum {summary.mode}</th><th>Registrations</th><th>Course limits</th></tr></thead>
        <tbody>{summary.types.map((row, index) => <tr key={row.course_type_id}><th scope="row">{row.name}</th><td>{row.total}</td>
          <td><input aria-label={`${row.name} minimum`} required type="number" min={row.minimum_allowed} max={row.total} step={summary.mode === "credits" ? ".1" : "1"} value={draft.limits[index]?.minimum || ""} onChange={e => editLimit(index, "minimum", e.target.value)} /></td>
          <td><input aria-label={`${row.name} maximum`} required type="number" min={Math.max(row.minimum_allowed, row.max_registered)} max={row.total} step={summary.mode === "credits" ? ".1" : "1"} value={draft.limits[index]?.maximum || ""} onChange={e => editLimit(index, "maximum", e.target.value)} /></td>
          <td>{row.registered}</td><td><button type="button" disabled={dirty || (row.alias === "OPEN_ELECTIVE" && !summary.saved)} onClick={() => setModal(row)}>Configure courses</button></td></tr>)}</tbody>
      </table></div>
      {!summary.types.length && <p className="crc-empty">No active courses are available for this term.</p>}
      <p className="crc-help">Minimum cannot exceed maximum. The sum of minimum limits cannot exceed the total student limit. Existing registrations set the lowest permitted maximum. Save term changes before configuring courses or exporting.</p>
      <div className="crc-actions"><button type="button" disabled={!summary.saved || dirty || saving} onClick={exportPdf}>Export PDF</button><span className="crc-spacer" />
        <button type="button" disabled={!dirty} onClick={() => { if (window.confirm("Discard unsaved registration configuration?")) { setDraft(fromSummary(summary)); setDirty(false); setError(""); } }}>Cancel changes</button>
        <button type="submit" className="crc-primary" disabled={!dirty || !summary.types.length}>{saving ? "Saving…" : summary.saved ? "Update configuration" : "Save configuration"}</button></div>
      </fieldset>
    </form>}
    {modal && summary && <CourseLimitsDialog summary={summary} kind={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); setNotice("Course limits saved."); setRevision(r => r + 1); }} />}
  </main>;
}
