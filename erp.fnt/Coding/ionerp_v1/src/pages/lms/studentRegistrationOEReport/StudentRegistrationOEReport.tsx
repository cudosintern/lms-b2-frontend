import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import client from "../../../utils/api";
import { errorMessage } from "../course_registration_configuration/api";

type Option = { id: number; name: string };
type Row = { student_usn: string; student_name: string; section_name: string; crs_code: string; crs_title: string; offering_department: string; offering_crclm: string; faculty_name: string };
type Report = { curriculum: string; term: string; organisation: string; department: string; rows: Row[] };
const columns: [keyof Row, string][] = [["student_usn", "USN"], ["student_name", "Student Name"], ["section_name", "Section"], ["crs_code", "Course Code"], ["crs_title", "Course Title"], ["offering_department", "Offered by Department"], ["offering_crclm", "Offered by Curriculum"], ["faculty_name", "Faculty"]];
const base = "/api/v1/student-registration-oe";
const storageKey = "student-registration-oe.filters";
function remembered(): string[] {
  try { const value = JSON.parse(sessionStorage.getItem(storageKey) || "[]"); return Array.isArray(value) && value.length === 2 && value.every(v => typeof v === "string") ? value : ["", ""]; }
  catch { return ["", ""]; }
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function StudentRegistrationOEReport() {
  const [[batch, term], setSelection] = useState(remembered);
  const [curricula, setCurricula] = useState<Option[]>([]), [terms, setTerms] = useState<Option[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(false), [exporting, setExporting] = useState(false);
  const [revision, setRevision] = useState(0), [search, setSearch] = useState(""), [page, setPage] = useState(0), [size, setSize] = useState(10);
  const [sort, setSort] = useState<{ key: keyof Row; ascending: boolean }>({ key: "section_name", ascending: true });
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify([batch, term])); } catch { /* Storage is optional. */ } }, [batch, term]);
  useEffect(() => {
    const controller = new AbortController(); setError("");
    const config = { signal: controller.signal, timeout: 30000, preserveSessionOnUnauthorized: true };
    client.get<Option[]>(`${base}/curriculums`, config).then(({ data }) => {
      if (controller.signal.aborted) return;
      setCurricula(data); setSelection(old => data.some(c => String(c.id) === old[0]) ? old : ["", ""]);
    }).catch(async e => { const message = await errorMessage(e); if (!controller.signal.aborted) setError(message); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const controller = new AbortController(); setTerms([]); setReport(null);
    if (batch && curricula.some(c => String(c.id) === batch)) {
      const config = { signal: controller.signal, timeout: 30000, preserveSessionOnUnauthorized: true };
      client.get<Option[]>(`${base}/terms?academic_batch_id=${batch}`, config).then(({ data }) => {
        if (controller.signal.aborted) return;
        setTerms(data); setSelection(old => data.some(t => String(t.id) === old[1]) ? old : [old[0], ""]);
      }).catch(async e => { const message = await errorMessage(e); if (!controller.signal.aborted) setError(message); });
    }
    return () => controller.abort();
  }, [batch, curricula]);
  useEffect(() => {
    const controller = new AbortController(); setReport(null); setPage(0);
    if (!batch || !term || !terms.some(t => String(t.id) === term)) { setLoading(false); return () => controller.abort(); }
    setLoading(true); setError("");
    const config = { signal: controller.signal, timeout: 30000, preserveSessionOnUnauthorized: true };
    async function loadReport() {
      try {
        const { data } = await client.get<Report>(`${base}/report?academic_batch_id=${batch}&semester_id=${term}`, config);
        if (!controller.signal.aborted) setReport(data);
      } catch (e) {
        const message = await errorMessage(e);
        if (!controller.signal.aborted) setError(message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadReport();
    return () => controller.abort();
  }, [batch, term, terms]);
  const filtered = useMemo(() => (report?.rows || []).filter(row => columns.some(([key]) => String(row[key] || "").toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (sort.ascending ? 1 : -1) * String(a[sort.key] || "").localeCompare(String(b[sort.key] || ""), undefined, { numeric: true })), [report, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  async function exportReport(format: "xlsx" | "csv") {
    if (!report?.rows.length) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet("Open Elective Registrations");
      [report.organisation, report.department, "Student Registration OE Report", `Curriculum: ${report.curriculum}`, `Term: ${report.term}`].forEach(label => sheet.addRow([label]));
      sheet.addRow([]); const header = sheet.addRow(["Sl No", ...columns.map(([, label]) => label)]); header.font = { bold: true };
      // Export all registrations, as in the legacy report, irrespective of table search/page.
      report.rows.forEach((row, index) => sheet.addRow([index + 1, ...columns.map(([key]) => {
        const value = String(row[key] || ""); return format === "csv" && /^[=+@\-\t\r\n]/.test(value) ? `'${value}` : value;
      })]));
      sheet.columns.forEach((column, index) => { column.width = index === 0 ? 8 : 28; });
      const buffer = format === "xlsx" ? await workbook.xlsx.writeBuffer() : await workbook.csv.writeBuffer();
      download(new Blob([buffer], { type: format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv;charset=utf-8" }), `student-registration-oe-${batch}-${term}.${format}`);
    } catch (e) { setError(await errorMessage(e)); } finally { setExporting(false); }
  }
  const fieldClass = "border rounded p-2 bg-white";
  return <main className="p-6 bg-white rounded shadow space-y-5">
    <h1 className="text-xl font-semibold">Student Registration OE Report</h1>
    <div className="flex flex-wrap gap-6">
      <label className="flex flex-col gap-1">Curriculum *<select className={fieldClass} value={batch} onChange={e => { setReport(null); setTerms([]); setError(""); setSelection([e.target.value, ""]); }}>
        <option value="">Select Curriculum</option>{curricula.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label className="flex flex-col gap-1">Term *<select className={fieldClass} disabled={!batch || !terms.length} value={term} onChange={e => { setReport(null); setSelection([batch, e.target.value]); }}>
        <option value="">Select Term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select></label>
    </div>
    {error && <div role="alert" className="text-red-700">{error} <button className={fieldClass} onClick={() => setRevision(v => v + 1)}>Retry</button></div>}
    {loading && <p role="status">Loading Open Elective registrations…</p>}
    {report && <>
      <div className="flex flex-wrap items-center gap-3">
        <label>Search <input className={fieldClass} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
        <label>Rows <select className={fieldClass} value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}>{[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}</select></label>
        {report.rows.length > 0 && <>
          <button className="btn btn-success rounded px-3 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={exporting} onClick={() => exportReport("xlsx")}>Export Excel</button>
          <button className="btn btn-success rounded px-3 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={exporting} onClick={() => exportReport("csv")}>Export CSV</button>
        </>}
      </div>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100"><th className="border p-2">Sl No</th>
        {columns.map(([key, label]) => <th className="border p-2" key={key} aria-sort={sort.key === key ? sort.ascending ? "ascending" : "descending" : "none"}><button onClick={() => { setSort({ key, ascending: sort.key !== key || !sort.ascending }); setPage(0); }}>{label}{sort.key === key ? sort.ascending ? " ▲" : " ▼" : ""}</button></th>)}
      </tr></thead><tbody>{filtered.slice(page * size, (page + 1) * size).map((row, index) => <tr key={page * size + index}><td className="border p-2">{page * size + index + 1}</td>{columns.map(([key]) => <td key={key} className="border p-2">{row[key] || "—"}</td>)}</tr>)}
        {!filtered.length && <tr><td colSpan={9} className="border p-6 text-center">{report.rows.length ? "No matching registrations" : "No Open Elective registrations found"}</td></tr>}
      </tbody></table></div>
      <div className="flex items-center gap-3"><span>{filtered.length} registrations · Page {page + 1} of {pages}</span><button className={fieldClass} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><button className={fieldClass} disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </>}
  </main>;
}
