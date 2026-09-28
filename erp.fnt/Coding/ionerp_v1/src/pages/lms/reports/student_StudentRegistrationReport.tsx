import React, { useEffect, useRef, useState } from "react";
import client from "../../../utils/api";
import { errorMessage } from "../course_registration_configuration/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

type Option = { id: number | string; name: string };
type Course = { course_id: number; course_code: string; course_name: string; course_type_id: number; course_type: string; credits: number; registered_date?: string };
type Student = { student_id: number; usn: string; name: string; section: string; curriculum?: string; registered_courses?: Course[]; total_credits?: number };
type Registration = Student & Partial<Course>;
type Overall = { course_type_id: number; course_type: string; total_students: number; registered_students: number; unregistered_students: number };
type Summary = { course_type_id: number; course_type: string; total_registered: number; courses: (Course & { registered_students: number; other_dept_students: number })[] };
type Report = { warnings: string[]; curriculum: string; term: string; sections: Option[]; students: Student[]; overall_summary: Overall[]; summary: Summary[]; columns: { course_type_id: number; course_type: string; slot: number }[]; can_approve: boolean; finalized: boolean };
type Modal = { title: string; courseType: string; course?: Course; courses?: Course[]; students: Registration[] };
const base = "/api/v1/student-registration";
async function read<T>(url: string, signal: AbortSignal) {
  // Compatible with the application's legacy Axios type declarations.
  const config = { signal, timeout: 30000, preserveSessionOnUnauthorized: true };
  return await client.get<T>(url, config);
}
const storageKey = "student-registration-report.filters";
function remembered(): string[] {
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]"); return Array.isArray(saved) && saved.length === 3 && saved.every(v => typeof v === "string") ? saved : ["", "", ""]; }
  catch { return ["", "", ""]; }
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function StudentRegistrationReport() {
  const [selection, setSelection] = useState(remembered);
  const [batch, term, section] = selection;
  const [curricula, setCurricula] = useState<Option[]>([]), [terms, setTerms] = useState<Option[]>([]);
  const [report, setReport] = useState<Report | null>(null), [modal, setModal] = useState<Modal | null>(null);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const modalRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    read<Option[]>(`${base}/curriculums`, controller.signal).then(({ data }) => {
      setCurricula(data);
      setSelection(old => data.some(c => String(c.id) === old[0]) ? old : ["", "", ""]);
    }).catch(async e => { if (!controller.signal.aborted) setError(await errorMessage(e)); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Optional storage. */ } }, [selection]);
  useEffect(() => {
    const controller = new AbortController(); setTerms([]);
    if (batch && curricula.some(c => String(c.id) === batch)) {
      read<Option[]>(`${base}/terms?academic_batch_id=${batch}`, controller.signal).then(({ data }) => {
        if (controller.signal.aborted) return;
        setTerms(data); setSelection(old => !old[1] || data.some(t => String(t.id) === old[1]) ? old : [old[0], "", ""]);
      }).catch(async e => { if (!controller.signal.aborted) setError(await errorMessage(e)); });
    }
    return () => controller.abort();
  }, [batch, curricula]);
  useEffect(() => {
    const controller = new AbortController();
    setReport(null); setModal(null); modalRequest.current?.abort(); setBusy(false); setError("");
    if (!batch || !term || !terms.some(t => String(t.id) === term)) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    const params = new URLSearchParams({ academic_batch_id: batch, semester_id: term });
    if (section) params.set("section", section);
    read<Report>(`${base}/report?${params}`, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted) setReport(data);
    }).catch(async e => { if (!controller.signal.aborted) setError(await errorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [batch, term, section, terms, revision]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { modalRequest.current?.abort(); setModal(null); setBusy(false); } };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); modalRequest.current?.abort(); };
  }, []);
  function params() { const result = new URLSearchParams({ academic_batch_id: batch, semester_id: term }); if (section) result.set("section", section); return result; }
  function choose(next: string[]) { modalRequest.current?.abort(); setReport(null); setModal(null); setSelection(next); }
  async function view(type: number, title: string, registered = true, course?: number, other = false, byCourse = false) {
    modalRequest.current?.abort(); const controller = new AbortController(); modalRequest.current = controller;
    setBusy(true); setError("");
    const query = params(); query.set("course_type_id", String(type)); query.set("registered", String(registered));
    if (course) query.set("course_id", String(course));
    query.set("other", String(other)); query.set("by_course", String(byCourse));
    try { const { data } = await read<Registration[]>(`${base}/view-students?${query}`, controller.signal); if (!controller.signal.aborted) setModal({ title, courses: byCourse ? report?.summary.find(row => row.course_type_id === type)?.courses : undefined, course: course ? report?.summary.flatMap(row => row.courses).find(c => c.course_id === course) : undefined, courseType: report?.overall_summary.find(r => r.course_type_id === type)?.course_type || "", students: data }); }
    catch (e) { if (!controller.signal.aborted) setError(await errorMessage(e)); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  async function approve() {
    if (!report || !window.confirm(`Approve all active courses for ${report.curriculum} / ${report.term} for EMS? This applies to every section.`)) return;
    setBusy(true); setError("");
    try {
      const config = { timeout: 30000, preserveSessionOnUnauthorized: true };
      await client.post(`${base}/approve?academic_batch_id=${batch}&semester_id=${term}`, undefined, config);
      setRevision(v => v + 1);
    }
    catch (e) { setError(await errorMessage(e)); }
    finally { setBusy(false); }
  }
  function courseCell(student: Student, column: Report["columns"][number]) {
    return student.registered_courses?.filter(c => c.course_type_id === column.course_type_id)[column.slot];
  }
  function exportTables() {
    if (!report) return [];
    if (modal) return [{ name: modal.title, headers: ["Section", "USN", "Student", "Curriculum", "Courses", "Credits", "Registered on"],
      rows: modal.students.map(s => [s.section, s.usn, s.name, s.curriculum || report.curriculum,
        s.course_code || s.registered_courses?.map(c => c.course_code).join(", ") || "",
        s.credits ?? s.total_credits ?? "", s.registered_date || s.registered_courses?.map(c => `${c.course_code}: ${c.registered_date || ""}`).join("; ") || ""]) }];
    return [
      { name: "Students", headers: ["No.", "Section", "USN", "Student", ...report.columns.map(c => c.course_type), "Credits", "Signature"],
        rows: report.students.map((s, i) => [i + 1, s.section, s.usn, s.name, ...report.columns.map(c => courseCell(s, c)?.course_code || ""), s.total_credits ?? 0, ""]) },
      { name: "Overall Summary", headers: ["Course type", "Total students", "Registered", "Unregistered"], rows: report.overall_summary.map(r => [r.course_type, r.total_students, r.registered_students, r.unregistered_students]) },
      { name: "Course Summary", headers: ["Course type", "Course", "Title", "Credits", "Other curricula", "Registered", "Type total"],
        rows: report.summary.flatMap(r => r.courses.map((c, i) => [r.course_type, c.course_code, c.course_name, c.credits, c.other_dept_students, c.registered_students, i === 0 ? r.total_registered : ""])) },
    ];
  }
  async function exportReport(format: "pdf" | "xlsx") {
    if (!report) return; setBusy(true); setError("");
    try {
      const title = `${report.curriculum} / ${report.term} / ${section ? report.sections.find(s => String(s.id) === section)?.name : "All sections"}`;
      const tables = exportTables();
      if (format === "pdf") {
        const pdf = new jsPDF({ orientation: "landscape", format: "a3" });
        tables.forEach((table, index) => {
          if (index) pdf.addPage();
          pdf.setFontSize(13); pdf.text("Student Registration Report", 14, 14);
          pdf.setFontSize(10); pdf.text(pdf.splitTextToSize(title, 390), 14, 22);
          pdf.text(table.name, 14, 36);
          autoTable(pdf, { head: [table.headers], body: table.rows, startY: 40, styles: { fontSize: 8, overflow: "linebreak" }, horizontalPageBreak: true, horizontalPageBreakRepeat: [0, 1, 2, 3], margin: { top: 15, bottom: 15 } });
        });
        pdf.save(`student-registration-${batch}-${term}.pdf`);
      } else {
        const workbook = new ExcelJS.Workbook();
        tables.forEach(table => {
          const sheet = workbook.addWorksheet(table.name.slice(0, 31).replace(/[\\/*?:\[\]]/g, " "));
          sheet.addRow(["Student Registration Report"]); sheet.addRow([title]); sheet.addRow(table.headers); sheet.addRows(table.rows);
          sheet.getRow(3).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 3 }];
          sheet.columns.forEach(column => { column.width = 22; });
          sheet.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
        });
        download(new Blob([await workbook.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `student-registration-${batch}-${term}.xlsx`);
      }
    } catch (e) { setError(await errorMessage(e)); } finally { setBusy(false); }
  }
  const button = (label: string, action: () => void, disabled = false) => <button type="button" className={label.startsWith("Export") ? "btn btn-success" : label === "Close" ? "btn btn-danger" : "btn btn-default"} disabled={busy || loading || disabled} onClick={action} style={{ margin: 4, padding: "6px 10px", cursor: "pointer" }}>{label}</button>;
  return <div className="registration-report" style={{ padding: 24 }}>
    <style>{`.registration-report table{border-collapse:collapse;width:100%;margin:12px 0}.registration-report th,.registration-report td{border:1px solid #ccd3dd;padding:8px;text-align:left;vertical-align:top}.registration-report th{background:#f7f7f7}.registration-report select{margin:0 18px 0 8px;padding:7px}.registration-report button:disabled{cursor:default;opacity:.6}.registration-report .btn-success{background:#28a745;color:white;border:1px solid #28a745}.registration-report .btn-danger{background:#dc3545;color:white;border:1px solid #dc3545}.registration-report .section{background:#c7c5c5;font-weight:bold}`}</style>
    <h2 style={{ background: "#222f3e", color: "white", borderRadius: "16px 0 16px 0", padding: "8px 20px", fontSize: 18 }}>Student Registration Report</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <label>Curriculum <select value={batch} disabled={busy} onChange={e => choose([e.target.value, "", ""])}><option value="">Select Curriculum</option>{curricula.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Term <select value={term} disabled={!batch || busy} onChange={e => choose([batch, e.target.value, ""])}><option value="">Select Term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Section <select value={section} disabled={!report || busy} onChange={e => choose([batch, term, e.target.value])}><option value="">All sections</option>{report?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </div>
    {error && <p role="alert" style={{ color: "#ae2020" }}>{error} {button("Retry", () => setRevision(v => v + 1))}</p>}
    {(loading || busy) && <p role="status">Loading…</p>}
    {report && <>
      <p>{report.curriculum} — {report.term}</p>{report.warnings.map(warning => <p key={warning} role="alert" style={{ color: "#9b5200" }}>{warning}</p>)}
      {button("Export Excel", () => { void exportReport("xlsx"); })}{button("Export PDF", () => { void exportReport("pdf"); })}
      {report.can_approve && button(report.finalized ? "Approved for EMS" : "Approve for EMS", () => { void approve(); }, report.finalized)}
      {!report.students.length && <p>No students found for the selected filters.</p>}
      <div style={{ overflowX: "auto" }}><table><thead><tr><th>No.</th><th>Student USN</th><th>Student Name</th>{report.columns.length > 0 && <th colSpan={report.columns.length}>Registered Courses</th>}<th>Total Credits</th><th>Student Signature</th></tr></thead><tbody>
        {report.students.map((s, i) => <React.Fragment key={s.student_id}>
          {(i === 0 || report.students[i - 1].section !== s.section) && <><tr className="section"><td colSpan={5 + report.columns.length}>Section - {s.section}</td></tr><tr><td /><td /><td />{report.columns.map((c, index) => <th key={index}>{c.course_type}</th>)}<td /><td /></tr></>}
          <tr><td>{i + 1}</td><td>{s.usn}</td><td>{s.name}</td>{report.columns.map((column, j) => { const c = courseCell(s, column); return <td key={j} title={c ? `${c.course_name}; ${c.credits} credits; registered ${c.registered_date || "date unavailable"}` : "Not registered"}>{c?.course_code || "—"}</td>; })}<td>{s.total_credits}</td><td /></tr>
        </React.Fragment>)}
      </tbody></table></div>
      <h3>Overall Summary</h3><table><thead><tr><th>Course Type</th><th>Total Students</th><th>Registered Students</th><th>Unregistered Students</th></tr></thead><tbody>{report.overall_summary.map(r => <tr key={r.course_type_id}><td>{r.course_type}</td><td>{r.total_students}</td><td>{r.registered_students}{button("View Students", () => { void view(r.course_type_id, `${r.course_type} — Registered Students`); })}</td><td>{r.unregistered_students}{button("View Students", () => { void view(r.course_type_id, `${r.course_type} — Unregistered Students`, false); })}</td></tr>)}</tbody></table>
      <h3>Summary</h3><table><thead><tr><th>Course</th><th>Credits</th><th>Other curricula</th><th>Registered Students</th></tr></thead><tbody>{report.summary.map(r => <React.Fragment key={r.course_type_id}><tr className="section"><td colSpan={3}>{r.course_type}{button("View by Course", () => { void view(r.course_type_id, `${r.course_type} — By Course`, true, undefined, false, true); })}</td><td>Total: {r.total_registered}</td></tr>{r.courses.map(c => <tr key={c.course_id}><td>{c.course_code} — {c.course_name}</td><td>{c.credits}</td><td>{c.other_dept_students}{c.other_dept_students > 0 && button("View", () => { void view(r.course_type_id, `${c.course_code} — Other Curricula`, true, c.course_id, true); })}</td><td>{c.registered_students}{button("View", () => { void view(r.course_type_id, `${c.course_code} — Students`, true, c.course_id); })}</td></tr>)}</React.Fragment>)}</tbody></table>
    </>}
    {modal && report && <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 1000, display: "grid", placeItems: "center" }}><div role="dialog" aria-modal="true" aria-labelledby="registration-modal-title" onClick={e => e.stopPropagation()} style={{ background: "white", padding: 24, width: "90vw", maxHeight: "85vh", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h3 id="registration-modal-title" style={{ margin: 0 }}>{modal.title}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {button("Export PDF", () => { void exportReport("pdf"); })}{button("Export Excel", () => { void exportReport("xlsx"); })}{button("Close", () => setModal(null))}
        </div>
      </div>
      <table aria-label="Report selection"><tbody>
        <tr><th scope="row" style={{ width: 180 }}>Academic Batch</th><td>{report.curriculum}</td></tr>
        <tr><th scope="row">Term</th><td>{report.term}</td></tr>
        <tr><th scope="row">Section</th><td>{section ? report.sections.find(s => String(s.id) === section)?.name : "All sections"}</td></tr>
        <tr><th scope="row">Course Type</th><td>{modal.courseType}</td></tr>
        {modal.course && <tr><th scope="row">Course</th><td>{modal.course.course_code} — {modal.course.course_name}</td></tr>}
      </tbody></table>{report.warnings.map(warning => <p key={warning} role="alert" style={{ color: "#9b5200" }}>{warning}</p>)}
      {modal.courses ? (modal.courses.length === 0 ? <p>No courses found.</p> : modal.courses.map((course, index) => {
        const students = modal.students.filter(student => student.course_id === course.course_id);
        return <details key={course.course_id} open={index === 0} style={{ border: "1px solid #ccd3dd", borderRadius: 4, marginTop: 12 }}>
          <summary style={{ padding: "12px 16px", background: "#edf0f4", cursor: "pointer", fontWeight: 600 }}>
            {course.course_code} — {course.course_name} ({course.credits} credits) — {students.length} registered students
          </summary>
          <div style={{ padding: "0 16px", overflowX: "auto" }}>
            {!students.length ? <p>No registered students for this course.</p> : <table aria-label={`${course.course_code} registered students`}>
              <thead><tr><th>Sl. No.</th><th>Section</th><th>USN</th><th>Name</th><th>Academic Batch</th><th>Registration Date</th></tr></thead>
              <tbody>{students.map((student, i) => <tr key={student.student_id}>
                <td>{i + 1}</td><td>{student.section}</td><td>{student.usn}</td><td>{student.name}</td>
                <td>{student.curriculum || report.curriculum}</td><td>{student.registered_date || "—"}</td>
              </tr>)}</tbody>
            </table>}
          </div>
        </details>;
      })) : !modal.students.length ? <p>No students found.</p> : <table><thead><tr><th>Section</th><th>USN</th><th>Name</th><th>Curriculum</th><th>{modal.course ? "Registration Date" : "Courses / Registration Date"}</th><th>Credits</th></tr></thead><tbody>{modal.students.map((s, i) => <tr key={`${s.student_id}-${s.course_id || i}`}><td>{s.section}</td><td>{s.usn}</td><td>{s.name}</td><td>{s.curriculum || report.curriculum}</td><td>{modal.course ? s.registered_date || "—" : s.course_code ? `${s.course_code} — ${s.course_name} (${s.registered_date || ""})` : s.registered_courses?.map(c => <div key={c.course_id}>{c.course_code} — {c.registered_date || ""}</div>)}</td><td>{s.credits ?? s.total_credits}</td></tr>)}</tbody></table>}
    </div></div>}
  </div>;
}



