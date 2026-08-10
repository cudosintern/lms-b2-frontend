import React, { useEffect, useState, useRef, useCallback } from "react";
import moment from "moment";
import CustomDataTable from "./CustomDataTable";
import { toast } from "react-toastify";

import {
  getDepartments,
  getPrograms,
  getCurriculumList,
  getTermList,
  getSectionList,
  getDateInfo,
  generateReport,
  getDrilldown,
  exportPDF,
  exportExcel,
  DropdownOption,
  ReportRequest,
  ReportRow,
  DrilldownRow,
} from "./consolidatedAbsenteesReportService";

// ─── tiny helper ──────────────────────────────────────────────────────────────
const toOpts = (list: DropdownOption[]) =>
  list.map((d) => ({ value: d.id, label: d.name }));

type Opt = { value: number; label: string };

// ─── DateRangePicker ──────────────────────────────────────────────────────────
// A self-contained date range picker that mirrors Image 5:
// Left panel: preset shortcuts.  Right panel: two-month calendar.
// Scheduled dates are highlighted in green.
interface DatePickerProps {
  startDate: string;
  endDate: string;
  scheduledDates: string[];
  onChange: (start: string, end: string) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: "Today",       fn: () => { const d = moment().format("YYYY-MM-DD"); return [d, d]; } },
  { label: "Yesterday",   fn: () => { const d = moment().subtract(1, "days").format("YYYY-MM-DD"); return [d, d]; } },
  { label: "Last 7 Days", fn: () => [moment().subtract(6, "days").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")] },
  { label: "Last 30 Days",fn: () => [moment().subtract(29, "days").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")] },
  { label: "This Month",  fn: () => [moment().startOf("month").format("YYYY-MM-DD"), moment().endOf("month").format("YYYY-MM-DD")] },
  { label: "Last Month",  fn: () => [moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD")] },
  { label: "Custom Range",fn: () => null },
];

const DateRangePicker: React.FC<DatePickerProps> = ({ startDate, endDate, scheduledDates, onChange, onClose }) => {
  const [leftMonth, setLeftMonth] = useState(() => moment(startDate || undefined).startOf("month"));
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd]   = useState(endDate);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState("Custom Range");
  const scheduledSet = new Set(scheduledDates.map((d) => moment(d).format("YYYY-MM-DD")));

  const rightMonth = leftMonth.clone().add(1, "month");

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label);
    const result = preset.fn();
    if (result) {
      setTempStart(result[0]);
      setTempEnd(result[1]);
    }
  };

  const handleDayClick = (day: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(day);
      setTempEnd("");
    } else {
      if (day < tempStart) {
        setTempEnd(tempStart);
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
      setActivePreset("Custom Range");
    }
  };

  const inRange = (day: string) => {
    const end = tempEnd || hoveredDate || "";
    if (!tempStart || !end) return false;
    const [s, e] = tempStart <= end ? [tempStart, end] : [end, tempStart];
    return day > s && day < e;
  };

  const renderMonth = (baseMonth: moment.Moment) => {
    const start = baseMonth.clone().startOf("month").startOf("week");
    const end   = baseMonth.clone().endOf("month").endOf("week");
    const weeks: moment.Moment[][] = [];
    let cur = start.clone();
    while (cur.isSameOrBefore(end, "day")) {
      const week: moment.Moment[] = [];
      for (let i = 0; i < 7; i++) { week.push(cur.clone()); cur.add(1, "day"); }
      weeks.push(week);
    }
    return (
      <div style={{ width: 220 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
          {baseMonth.isSame(leftMonth) ? (
            <button style={calBtn} onClick={() => setLeftMonth(leftMonth.clone().subtract(1, "month"))}>‹</button>
          ) : <span style={{ width: 24 }} />}
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {baseMonth.format("MMMM")} {baseMonth.format("YYYY")}
          </span>
          {baseMonth.isSame(rightMonth) ? (
            <button style={calBtn} onClick={() => setLeftMonth(leftMonth.clone().add(1, "month"))}>›</button>
          ) : <span style={{ width: 24 }} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} style={{ fontSize: 11, color: "#888", padding: "2px 0", fontWeight: 600 }}>{d}</div>
          ))}
          {weeks.flat().map((day, idx) => {
            const ds    = day.format("YYYY-MM-DD");
            const isThisMonth = day.isSame(baseMonth, "month");
            const isStart = ds === tempStart;
            const isEnd   = ds === (tempEnd || "");
            const isBetween = inRange(ds);
            const isScheduled = scheduledSet.has(ds);
            const isSelected  = isStart || isEnd;

            return (
              <div
                key={idx}
                onMouseEnter={() => { if (tempStart && !tempEnd) setHoveredDate(ds); }}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => isThisMonth && handleDayClick(ds)}
                style={{
                  padding: "4px 0",
                  fontSize: 12,
                  cursor: isThisMonth ? "pointer" : "default",
                  color: !isThisMonth ? "#ccc" : isSelected ? "#fff" : "#333",
                  background: isSelected ? "#17a2b8" : isBetween ? "#d4f0f4" : "transparent",
                  borderRadius: isSelected ? "50%" : 0,
                  fontWeight: isScheduled && isThisMonth ? 700 : 400,
                  ...(isScheduled && isThisMonth && !isSelected && { color: "#28a745" }),
                }}
              >
                {day.date()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  

  return (
    <div style={{
      position: "absolute", zIndex: 2000, top: "100%", left: 0,
      background: "#fff", border: "1px solid #ddd", borderRadius: 6,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)", display: "flex",
      minWidth: 540, marginTop: 4
    }}>
      {/* Presets */}
      <div style={{ width: 130, borderRight: "1px solid #eee", padding: "8px 0" }}>
        {PRESETS.map((p) => (
          <div
            key={p.label}
            onClick={() => applyPreset(p)}
            style={{
              padding: "8px 14px", fontSize: 13, cursor: "pointer",
              background: activePreset === p.label ? "#17a2b8" : "transparent",
              color:      activePreset === p.label ? "#fff" : "#333",
            }}
          >
            {p.label}
          </div>
        ))}
      </div>

      {/* Calendars */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 24 }}>
          {renderMonth(leftMonth)}
          {renderMonth(rightMonth)}
        </div>
        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 12, gap: 12 }}>
          <span style={{ fontSize: 12, color: "#555" }}>
            {tempStart && tempEnd
              ? `${moment(tempStart).format("MM/DD/YYYY")} - ${moment(tempEnd).format("MM/DD/YYYY")}`
              : tempStart
              ? `${moment(tempStart).format("MM/DD/YYYY")} - ...`
              : ""}
          </span>
          <button onClick={onClose} style={{ ...footBtn, background: "#fff", color: "#555", border: "1px solid #ccc" }}>Cancel</button>
          <button
            onClick={() => {
              if (tempStart && tempEnd) { onChange(tempStart, tempEnd); onClose(); }
              else if (tempStart) { onChange(tempStart, tempStart); onClose(); }
            }}
            style={{ ...footBtn, background: "#28a745", color: "#fff", border: "none" }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const calBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#555", width: 24, height: 24, padding: 0,
};
const footBtn: React.CSSProperties = {
  padding: "5px 16px", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600,
};

// ─── DrilldownModal ────────────────────────────────────────────────────────────
interface DrilldownMeta {
  department: string;
  term: string;
  course: string;
  section: string;
  course_id: number;
  section_id: number;
}

const DrilldownModal: React.FC<{
  open: boolean;
  meta: DrilldownMeta | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}> = ({ open, meta, startDate, endDate, onClose }) => {
  const [rows, setRows] = useState<DrilldownRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !meta) return;
    setLoading(true);
    setRows([]);
    getDrilldown({ course_id: meta.course_id, section_id: meta.section_id, start_date: startDate, end_date: endDate })
      .then(setRows).catch(console.error).finally(() => setLoading(false));
  }, [open, meta, startDate, endDate]);

  if (!open || !meta) return null;

  const filtered = rows.filter(
    (r) =>
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.usno?.toLowerCase().includes(search.toLowerCase())
  );

  const drillCols = [
    { name: "Sl.No",   selector: (_: DrilldownRow, i?: number) => (i ?? 0) + 1,   width: "60px" },
    { name: "Date",    selector: (r: DrilldownRow) => r.attendance_date, sortable: true,
      cell: (r: DrilldownRow) => r.attendance_date ? moment(r.attendance_date).format("DD-MM-YYYY") : "-" },
    { name: "Student Name", selector: (r: DrilldownRow) => r.student_name, sortable: true },
    { name: "USN",          selector: (r: DrilldownRow) => r.usno, sortable: true },
    { name: "Parent Contact No",  selector: (r: DrilldownRow) => r.parent_contact ?? r.mobile ?? "-" },
    { name: "Student Contact No", selector: (r: DrilldownRow) => r.student_contact ?? r.mobile ?? "-" },
  ];

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Drilldown details</span>
          <button style={S.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={S.modalMeta}>
          <strong>Department:</strong> {meta.department}<br />
          <strong>Term:</strong> {meta.term}<br />
          <strong>Course:</strong> {meta.course}<br />
          <strong>Section:</strong> {meta.section}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <input
            style={S.searchInput} placeholder="Search..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 30 }}>Loading...</div>
        ) : (
          <CustomDataTable
            columns={drillCols as any}
            data={filtered}
            pagination
            paginationPerPage={10}
            striped
            highlightOnHover
            customStyles={tableStyles}
            noDataComponent={<div style={{ padding: 24, color: "#888" }}>No absent students found.</div>}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ConsolidatedAbsenteesReport: React.FC = () => {
  // dropdowns
  const [deptOpts,    setDeptOpts]    = useState<Opt[]>([]);
  const [progOpts,    setProgOpts]    = useState<Opt[]>([]);
  const [currOpts,    setCurrOpts]    = useState<Opt[]>([]);
  const [termOpts,    setTermOpts]    = useState<Opt[]>([]);
  const [sectionOpts, setSectionOpts] = useState<Opt[]>([]);

  // selected values (arrays of IDs, empty = "All")
  const [selDepts,    setSelDepts]    = useState<number[]>([]);
  const [selProgs,    setSelProgs]    = useState<number[]>([]);
  const [selCurrs,    setSelCurrs]    = useState<number[]>([]);
  const [selTerms,    setSelTerms]    = useState<number[]>([]);
  const [selSections, setSelSections] = useState<number[]>([]);

  // dates
  const [startDate,      setStartDate]      = useState("");
  const [endDate,        setEndDate]        = useState("");
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // report
  const [reportData,    setReportData]    = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [tableSearch,   setTableSearch]   = useState("");
  const [perPage,       setPerPage]       = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // drilldown
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillMeta, setDrillMeta] = useState<DrilldownMeta | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  // ── close pickers on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node))   setShowDatePicker(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── 1. On mount: load departments + date info, then auto-generate ──
  useEffect(() => {
    const init = async () => {
      const [depts, dateInfo] = await Promise.all([
        getDepartments().catch(() => [] as DropdownOption[]),
        getDateInfo().catch(() => ({ latest_attendance_date: null, scheduled_dates: [] })),
      ]);

      setDeptOpts(toOpts(depts));
      setScheduledDates(dateInfo.scheduled_dates);

   let ed = dateInfo.latest_attendance_date
  ? moment(dateInfo.latest_attendance_date).format("YYYY-MM-DD")
  : moment().format("YYYY-MM-DD");

let sd = moment("2026-01-01").format("YYYY-MM-DD");

setStartDate(sd);
setEndDate(ed);

// 🔥 AUTO LOAD
autoGenerate(sd, ed, [], [], [], [], []);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoGenerate = async (
  sd: string,
  ed: string,
  deptIds: number[],
  progIds: number[],
  currIds: number[],
  semIds: number[],
  secIds: number[]
) => {

  const payload = {
    start_date: sd,
    end_date: ed,
    department_ids: deptIds.length ? deptIds : null,
    program_ids: progIds.length ? progIds : null,
    curriculum_ids: currIds.length ? currIds : null,
    semester_ids: semIds.length ? semIds : null,
    section_ids: secIds.length ? secIds : null,
  };

  setLastPayload(payload);

  const data = await generateReport(payload);

  // ✅ USE YOUR STATE
  setReportData(data);
};

  // ── cascade: dept → program ────────────────────────────────────────
  useEffect(() => {
    setProgOpts([]); setSelProgs([]);
    setCurrOpts([]); setSelCurrs([]);
    setTermOpts([]); setSelTerms([]);
    setSectionOpts([]); setSelSections([]);
    if (selDepts.length === 1) {
      getPrograms(selDepts[0]).then((d) => setProgOpts(toOpts(d))).catch(console.error);
    }
  }, [selDepts]);

  useEffect(() => {
    setCurrOpts([]); setSelCurrs([]);
    setTermOpts([]); setSelTerms([]);
    setSectionOpts([]); setSelSections([]);
    if (selProgs.length === 1) {
      getCurriculumList(selProgs[0]).then((d) => setCurrOpts(toOpts(d))).catch(console.error);
    }
  }, [selProgs]);

  useEffect(() => {
    setTermOpts([]); setSelTerms([]);
    setSectionOpts([]); setSelSections([]);
    if (selCurrs.length === 1) {
      getTermList(selCurrs[0]).then((d) => setTermOpts(toOpts(d))).catch(console.error);
    }
  }, [selCurrs]);

  useEffect(() => {
  setSectionOpts([]);
  setSelSections([]);

  if (selTerms.length > 0) {
    // take first selected term (since dropdown is single select now)
    getSectionList(selTerms[0])
      .then((d) => setSectionOpts(toOpts(d)))
      .catch(console.error);
  }
}, [selTerms]);

  // ── Generate Report ───────────────────────────────────────────────
  const handleGenerate = () => {
    if (!startDate || !endDate) { toast("Please select a date range."); return; }
    autoGenerate(startDate, endDate, selDepts, selProgs, selCurrs, selTerms, selSections);
  };

  // ── build payload for exports ─────────────────────────────────────
  const buildPayload = () => ({
  start_date: startDate,
  end_date: endDate,

  department_ids: selDepts.length ? selDepts : null,
  program_ids: selProgs.length ? selProgs : null,
  curriculum_ids: selCurrs.length ? selCurrs : null,
  semester_ids: selTerms.length ? selTerms : null,
  section_ids: selSections.length ? selSections : null,
});

  // ── Export handlers ───────────────────────────────────────────────
  const handleExportPDF = async () => {
  const payload = lastPayload;   // 🔥 USE SAME DATA AS UI

  const res = await exportPDF(payload);

  const url = window.URL.createObjectURL(
    new Blob([res.data as BlobPart], { type: "application/pdf" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "Absentees_Report.pdf";
  link.click();
};

  const handleExportExcel = async () => {
  const payload = lastPayload;   // 🔥 USE SAME DATA

  const res = await exportExcel(payload);

  const url = window.URL.createObjectURL(
    new Blob([res.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "Absentees_Report.xlsx";
  link.click();
};
  // ── filtered table data ───────────────────────────────────────────
  const filteredData = reportData.filter((r) =>
    [r.department, r.course, r.section, r.term]
      .some((v) => v?.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  // ── drilldown ─────────────────────────────────────────────────────
  const openDrilldown = (row: ReportRow) => {
    setDrillMeta({
      department: row.department,
      term: row.term,
      course: row.course,
      section: row.section,
      course_id:  row.course_id!,
      section_id: row.section_id!,
    });
    setDrillOpen(true);
  };

  // ── Multi-select dropdown helper (native <select multiple> style) ─
  // We use a simple custom single-select with an "All" option at the top.
  // Selecting "All" (value 0) clears the array; selecting an item sets it.
const renderDropdown = (
  label: string,
  required: boolean,
  opts: Opt[],
  selected: number[],
  onChange: (ids: number[]) => void,
  disabled = false
) => (
  <div style={S.filterItem}>
    <label style={S.label}>
      {label}{required && <span style={{ color: "red" }}> *</span>}
    </label>

    <select
      disabled={disabled}
      value={selected.length ? selected[0] : 0}
      onChange={(e) => {
        const val = Number(e.target.value);

        if (val === 0) {
          // Select All → empty array (backend treats as ALL)
          onChange([]);
        } else {
          onChange([val]);
        }
      }}
      style={{
        ...S.multiSelect,
        background: disabled ? "#f5f5f5" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <option value={0}>Select All</option>

      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

  // ── Table columns ─────────────────────────────────────────────────
  const columns = [
    { name: "Department",   selector: (r: ReportRow) => r.department,    sortable: true, wrap: true },
    { name: "Term",         selector: (r: ReportRow) => r.term,          sortable: true, width: "140px" },
    { name: "Course",       selector: (r: ReportRow) => r.course,        sortable: true, wrap: true },
    { name: "Section",      selector: (r: ReportRow) => r.section,       sortable: true, width: "100px" },
    { name: "Absent Count", selector: (r: ReportRow) => r.absent_count,  sortable: true, width: "130px" },
    {
      name: "Action", width: "130px",
      cell: (r: ReportRow) =>
        r.absent_count > 0 ? (
          <button style={S.drillBtn} onClick={() => openDrilldown(r)}>Drilldown</button>
        ) : null,
    },
  ];

  // ── date label ────────────────────────────────────────────────────
  const dateLabel =
    startDate && endDate
      ? `${moment(startDate).format("MMMM D, YYYY")} - ${moment(endDate).format("MMMM D, YYYY")}`
      : "Select date range";

  // ── render ────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Title */}
      <div style={S.titleBar}>
        <span style={S.titleText}>Consolidated Absentees Report</span>
      </div>

      {/* Dropdowns row */}
      <div style={S.filterRow}>
        {renderDropdown("Department", true,  deptOpts,    selDepts,    setSelDepts)}
        {renderDropdown("Program",    true,  progOpts,    selProgs,    setSelProgs,    !progOpts.length)}
        {renderDropdown("Curriculum", false, currOpts,    selCurrs,    setSelCurrs,    !currOpts.length)}
        {renderDropdown("Term",       false, termOpts,    selTerms,    setSelTerms,    !termOpts.length)}
        {renderDropdown("Section",    false, sectionOpts, selSections, setSelSections, !sectionOpts.length)}
      </div>

      {/* Date + Buttons row */}
      <div style={S.dateRow}>
        {/* Date range input */}
        <div ref={dateRef} style={{ position: "relative" }}>
          <label style={S.label}>Date</label>
          <div style={S.dateInput} onClick={() => setShowDatePicker((p) => !p)}>
            <span style={{ marginRight: 8 }}>📅</span>
            <span>{dateLabel}</span>
            <span style={{ marginLeft: 8, color: "#888" }}>▾</span>
          </div>
          {showDatePicker && (
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              scheduledDates={scheduledDates}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>

        {/* Action buttons */}
        <div style={S.btnGroup}>
          <button
            style={{ ...S.generateBtn, opacity: reportLoading ? 0.7 : 1 }}
            onClick={handleGenerate}
            disabled={reportLoading}
          >
            {reportLoading ? "Generating..." : "Generate Report"}
          </button>

          {/* Export dropdown */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button
              style={{ ...S.exportBtn, opacity: exportLoading ? 0.7 : 1 }}
              onClick={() => setShowExportMenu((p) => !p)}
              disabled={exportLoading || reportData.length === 0}
            >
              {exportLoading ? "Exporting..." : "⬇ Export"} ▾
            </button>
            {showExportMenu && (
              <div style={S.exportMenu}>
                <div style={S.exportItem} onClick={handleExportPDF}>
                  <span style={{ marginRight: 8 }}>📄</span>.pdf
                </div>
                <div style={S.exportItem} onClick={handleExportExcel}>
                  <span style={{ marginRight: 8 }}>📊</span>.xls
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div style={S.tableCard}>
        <div style={S.tableToolbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={S.perPageSelect}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Search:</span>
            <input
              style={S.searchInput}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>
        </div>

        <CustomDataTable
          columns={columns as any}
          data={filteredData}
          pagination
          paginationPerPage={perPage}
          progressPending={reportLoading}
          striped
          highlightOnHover
          customStyles={tableStyles}
          noDataComponent={
            <div style={{ padding: 24, color: "#888" }}>
              reportLoading
  ? "Loading..."
  : "No data available"
            </div>
          }
        />
      </div>

      {/* Drilldown Modal */}
      <DrilldownModal
        open={drillOpen}
        meta={drillMeta}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setDrillOpen(false)}
      />
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:        { padding: "20px", fontFamily: "Segoe UI, sans-serif", background: "#f4f6f9", minHeight: "100vh" },
  titleBar:    { background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)", borderRadius: 6, padding: "14px 20px", marginBottom: 20 },
  titleText:   { color: "#fff", fontSize: 18, fontWeight: 600 },
  filterRow:   { display: "flex", flexWrap: "wrap", gap: 16, background: "#fff", borderRadius: 6, padding: "16px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  filterItem:  { flex: "1 1 150px", minWidth: 140 },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 },
  multiSelect: { width: "100%", border: "1px solid #ccc", borderRadius: 4, padding: "6px 8px", fontSize: 13, height: 36, outline: "none" },
  dateRow:     { display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: "#fff", borderRadius: 6, padding: "16px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  dateInput:   { display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 4, padding: "7px 12px", cursor: "pointer", fontSize: 13, background: "#fff", minWidth: 260, userSelect: "none" },
  btnGroup:    { display: "flex", gap: 10 },
  generateBtn: { background: "#28a745", color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  exportBtn:   { background: "#28a745", color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  exportMenu:  { position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #ddd", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 500, minWidth: 130 },
  exportItem:  { padding: "10px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center" },
  tableCard:   { background: "#fff", borderRadius: 6, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  tableToolbar:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13 },
  perPageSelect:{ border: "1px solid #ccc", borderRadius: 4, padding: "3px 6px", fontSize: 13 },
  searchInput: { border: "1px solid #ccc", borderRadius: 4, padding: "5px 10px", fontSize: 13, outline: "none" },
  drillBtn:    { background: "#17a2b8", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", cursor: "pointer", fontWeight: 500, fontSize: 12 },
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal:       { background: "#fff", borderRadius: 8, width: "85vw", maxWidth: 900, maxHeight: "90vh", overflow: "auto", padding: "20px", position: "relative" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #eee" },
  closeBtn:    { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666", lineHeight: 1 },
  modalMeta:   { background: "#f8f9fa", borderRadius: 4, padding: "10px 14px", marginBottom: 14, fontSize: 13, lineHeight: 1.8 },
};

const tableStyles = {
  table:     { borderCollapse: "collapse" as const, width: "100%", fontSize: 13 },
  headRow:   { background: "#f1f3f5", fontWeight: 700 },
  headCells: { padding: "10px 12px", borderBottom: "2px solid #dee2e6", fontSize: 13 },
  cells:     { padding: "10px 12px", borderBottom: "1px solid #dee2e6" },
  pagination:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", marginTop: 8, fontSize: 13 },
};

export default ConsolidatedAbsenteesReport;
