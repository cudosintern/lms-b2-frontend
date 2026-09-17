import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../../utils/api";
import { dctrList, DctrOption, DctrRow, csvCell, reportCell, compareReportRows } from "./dailyClassReportService";
import DataTable from "../../../components/Table/DataTable";
import DctrDateRange from "./DctrDateRange";

const API = "/api/v1/daily-class-report";
const levels = ["departments", "programs", "curriculums", "terms", "sections"];
const labels = ["Department", "Program", "Curriculum", "Term", "Section"];
const keys = ["dept_id", "program_id", "academic_batch_id", "semester_id", "section_id"];
const columns: [keyof DctrRow, string][] = [
  ["department", "Department"], ["time", "Time"], ["date", "Date"], ["email", "Email"],
  ["section", "Section"], ["class_timings", "Class Timings"], ["scheduled_class", "Scheduled Class"],
  ["scheduled_faculty", "Scheduled Faculty"], ["faculty", "Attendance Recorded By"],
  ["students_present", "Students Present"], ["status", "Status"],
];
const control: React.CSSProperties = { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 4, background: "white", minWidth: 150 };
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const message = (error: any) => {
  const detail = error?.response?.data?.detail;
  return typeof detail === "string" ? detail : error?.message || "Unable to load report";
};

function Dropdown({ index, selected, onChange }: { index: number; selected: string[][]; onChange: (index: number, value: string[]) => void }) {
  const [options, setOptions] = useState<DctrOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const parentKey = JSON.stringify(selected.slice(0, index));
  const ready = selected.slice(0, index).every(values => values.length > 0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setOptions([]); setError(""); setLoading(ready);
    if (ready) {
      const parents: string[][] = JSON.parse(parentKey);
      const params = Object.fromEntries(parents.map((value, i) => [keys[i], value.join(",")]));
      const config = { params, signal: controller.signal };
      Promise.resolve(axiosInstance.get(`${API}/options/${levels[index]}`, config))
        .then(response => {
          if (active) {
            const list = dctrList<DctrOption>(response.data).map(o => ({ id: String(o.id), name: o.name }));
            setOptions(list);
            onChange(index, list.map(o => o.id));
          }
        })
        .catch(e => { if (active) setError(message(e)); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; controller.abort(); };
  }, [index, parentKey, ready, retry, onChange]);
  const allSelected = options.length > 0 && selected[index].length === options.length;
  const visibleOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  return <div ref={container} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}
    onKeyDown={e => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>
    <label id={`dctr-label-${index}`}>{labels[index]} *</label>
    <button ref={trigger} type="button" aria-label={labels[index]} aria-expanded={open} aria-controls={`dctr-options-${index}`}
      style={{ ...control, textAlign: "left" }} disabled={!ready || loading || !!error || !options.length} onClick={() => setOpen(value => !value)}>
      {loading ? "Loading…" : !ready ? `Select ${labels[index - 1]} first` : !options.length ? "No options available" : allSelected ? "All selected" : selected[index].length ? `${selected[index].length} selected` : `Select ${labels[index]}`} <span style={{ float: "right" }}>▾</span>
    </button>
    {open && <div id={`dctr-options-${index}`} role="group" aria-labelledby={`dctr-label-${index}`} style={{ position: "absolute", top: "100%", left: 0, zIndex: 1000, background: "white", border: "1px solid #cbd5e1", borderRadius: 4, boxShadow: "0 4px 12px #0003", padding: 8, minWidth: "100%", width: 240 }}>
      <input autoFocus aria-label={`Search ${labels[index]}`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...control, width: "100%", minWidth: 0, boxSizing: "border-box" }} />
      <label style={{ display: "block", padding: "8px 4px", fontWeight: 600 }}><input type="checkbox" checked={allSelected}
        ref={node => { if (node) node.indeterminate = selected[index].length > 0 && !allSelected; }}
        onChange={e => onChange(index, e.target.checked ? options.map(o => o.id) : [])} /> Select All</label>
      <div style={{ maxHeight: 240, overflowY: "auto" }}>{visibleOptions.map(o => <label key={o.id} style={{ display: "flex", alignItems: "start", gap: 8, padding: 6 }}>
        <input type="checkbox" checked={selected[index].includes(o.id)} onChange={e => onChange(index, e.target.checked ? [...selected[index], o.id] : selected[index].filter(id => id !== o.id))} />{o.name}
      </label>)}{!visibleOptions.length && <p>No matching options</p>}</div>
    </div>}
    {error && <div role="alert" style={{ color: "#b91c1c", fontSize: 12 }}>{error} <button type="button" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
  </div>;
}

export default function DCTRReport() {
  const [selected, setSelected] = useState<string[][]>([[], [], [], [], []]);
  const [startDate, setStartDate] = useState(localToday);
  const [endDate, setEndDate] = useState(localToday);
  const [rows, setRows] = useState<DctrRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const grid = useRef<any>(null);
  const columnDefs = useMemo(() => columns.map(([key, title]) => ({
    field: key, headerName: title, sortable: true, sortingOrder: ["asc", "desc"], resizable: true,
    minWidth: key === "scheduled_class" || key === "faculty" || key === "scheduled_faculty" ? 210 : 145,
    valueGetter: (params: any) => params.data ? reportCell(params.data, key) : "",
    comparator: (_a: unknown, _b: unknown, a: any, b: any) => compareReportRows(a.data, b.data, key),
    tooltipValueGetter: (params: any) => params.value,
  })), []);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  useEffect(() => () => { version.current++; request.current?.abort(); }, []);
  const invalidate = useCallback(() => {
    version.current++; request.current?.abort();
    setRows([]); setGenerated(false); setLoading(false); setError("");
  }, []);
  const changeFilter = useCallback((index: number, value: string[]) => {
    invalidate();
    setSelected(previous => previous.map((old, i) => i < index ? old : i === index ? value : []));
  }, [invalidate]);
  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected.every(values => values.length > 0) || !startDate || !endDate || startDate > endDate) {
      setError("Select all filters and a valid date range."); return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++version.current;
    setLoading(true); setError(""); setRows([]); setGenerated(false);
    try {
      const params = { ...Object.fromEntries(selected.map((value, i) => [keys[i], value.join(",")])), start_date: startDate, end_date: endDate };
      const config = { params, signal: controller.signal };
      const response = await axiosInstance.get(`${API}/report`, config);
      if (version.current === current) { setRows(dctrList<DctrRow>(response.data)); setGenerated(true); }
    } catch (e) { if (version.current === current) setError(message(e)); }
    finally { if (version.current === current) setLoading(false); }
  };
  const filtered = useMemo(() => rows.filter(row => columns.some(([key]) => String(reportCell(row, key)).toLowerCase().includes(search.toLowerCase()))), [rows, search]);
  const exportCsv = () => {
    const exportRows: DctrRow[] = [];
    if (grid.current) grid.current.forEachNodeAfterFilterAndSort((node: any) => { if (node.data) exportRows.push(node.data); });
    else exportRows.push(...filtered);
    const lines = [columns.map(([, label]) => label), ...exportRows.map(row => columns.map(([key]) => reportCell(row, key)))];
    const blob = new Blob(["\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `daily-class-report-${startDate}-${endDate}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh", color: "#334155" }}>
    <h1 style={{ fontSize: 22, marginBottom: 20 }}>Daily Class Timetable Report</h1>
    <form onSubmit={generate} style={{ background: "white", padding: 20, borderRadius: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {levels.map((level, index) => <Dropdown key={`${level}:${selected.slice(0, index).join(":")}`} index={index} selected={selected} onChange={changeFilter} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "end", marginTop: 20 }}>
        <DctrDateRange start={startDate} end={endDate} filters={Object.fromEntries(selected.map((ids, i) => [keys[i], ids.join(",")]))}
          enabled={selected.every(ids => ids.length > 0)} onChange={(start, end) => { invalidate(); setStartDate(start); setEndDate(end); }} />
        <button type="submit" disabled={loading || !selected.every(values => values.length > 0)} style={{ ...control, background: "#15803d", color: "white" }}>{loading ? "Loading…" : "Generate Report"}</button>
        <button type="button" onClick={exportCsv} disabled={!filtered.length || loading} style={control}>Export CSV</button>
      </div>
    </form>
    {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
    {generated && rows.some(row => row.status === "Attendance Match Ambiguous") && <p role="status" style={{ fontSize: 13 }}>Some legacy attendance records cannot be linked to a unique class. Their status and totals are not attributed to individual classes.</p>}
    <section aria-label="Report results" style={{ background: "white", padding: 16, marginTop: 20, borderRadius: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <label>Show <select aria-label="Rows per page" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}</select> entries</label>
        <label>Search: <input value={search} onChange={e => { setSearch(e.target.value); grid.current?.paginationGoToFirstPage(); }} style={control} /></label>
      </div>
      {!filtered.length && <p role="status">{loading ? "Loading report…" : generated ? "No records found for the selected filters." : "Select filters and generate the report."}</p>}
      <DataTable columnDefs={columnDefs} rowData={filtered} pagination pageSize={pageSize}
        onGridReady={(params: any) => { grid.current = params.api; }} />
    </section>
  </main>;
}
