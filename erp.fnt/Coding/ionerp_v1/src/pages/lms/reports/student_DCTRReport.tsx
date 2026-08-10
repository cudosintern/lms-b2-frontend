import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: number | string;
  name: string;
}

interface Program {
  id: number | string;
  name: string;
  department_id?: number | string;
}

interface Curriculum {
  id: string;
  name: string;
}

interface Term {
  id: number | string;
  name: string;
  curriculum_id?: number | string;
}

interface Section {
  id: number | string;
  name: string;
  term_id?: number | string;
}

interface DCTRRecord {
  department: string;
  time: string;
  date: string;
  email: string;
  section: string;
  class_timings: string;
  scheduled_class: string;
  scheduled_faculty: string;
  faculty: string;
  students_present: number;
  status:
    | "Attendance Not Taken"
    | "Finalized"
    | "Class Not Scheduled"
    | "InProgress"
    | string;
}

// ─── API Base ─────────────────────────────────────────────────────────────────
// FIX: Your backend runs on http://localhost:8000 (visible in your console:
// "API URL: http://localhost:8000") while React dev server is on :3000.
// Calling /api/v1/... hits :3000 which returns HTML → "Unexpected token <".
//
// We read the base URL from the same env variable your project's api.ts uses
// (REACT_APP_API_URL or VITE_API_URL). If neither is set we fall back to
// http://localhost:8000 so local dev works without any config change.
const API_BASE: string = (() => {
  // Vite projects expose import.meta.env; CRA projects use process.env.
  // We try both safely so this file compiles under either build tool.
  try {
    // @ts-ignore — import.meta.env is only defined in Vite
    const vite = (import.meta as Record<string, Record<string,string>>).env;
    if (vite?.VITE_API_URL) return vite.VITE_API_URL.replace(/\/$/, "") + "/api/v1";
  } catch { /* not Vite */ }
  if (typeof process !== "undefined") {
    const cra = (process as any).env?.REACT_APP_API_URL;
    if (cra) return cra.replace(/\/$/, "") + "/api/v1";
  }
  // Hard fallback — matches what your console shows ("API URL: http://localhost:8000")
  return "http://localhost:8000/api/v1";
})();

/**
 * Generic fetch helper.
 * Builds URL with query params and returns parsed JSON.
 * Uses plain string concatenation (not URL constructor) so relative paths
 * like /api/v1/... are never accidentally re-based.
 * Throws on network failures and non-2xx responses with detailed messages.
 */
async function apiFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  // Build query string manually to avoid URL constructor edge-cases
  let urlStr = path;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
      .join("&");
    if (qs) urlStr += (urlStr.includes("?") ? "&" : "?") + qs;
  }

  let res: Response;
  try {
    // FIX: include cookies/session so the authenticated backend accepts the request.
    // Your app uses session-based auth (role "ionems" is already in the console),
    // so without credentials the backend may return a 401/redirect → HTML → JSON parse error.
    res = await fetch(urlStr, { credentials: "include" });
  } catch (networkErr) {
    // Network-level failure: no server, DNS failure, CORS preflight blocked
    throw new Error(
      "Network error reaching " + urlStr + ": " + (networkErr as Error).message
    );
  }

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    throw new Error(
      "API " + res.status + " " + res.statusText +
      " [" + urlStr + "]" + (body ? " — " + body.slice(0, 200) : "")
    );
  }

  const json = await res.json();
  // DEBUG: remove once API shapes are confirmed
  console.debug("[apiFetch]", urlStr, json);
  return json as T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deduplicate an array of objects by a key */
function uniqueById<T extends { id: string | number }>(arr: T[]): T[] {
  return arr.filter((item, i, self) => self.findIndex((x) => x.id === item.id) === i);
}

// ─── Multi-Select Dropdown ────────────────────────────────────────────────────

interface Option {
  id: string | number;
  name: string;
}

interface MultiSelectProps {
  label: string;
  required?: boolean;
  options: Option[];
  selected: (string | number)[];
  onChange: (vals: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect({
  label,
  required,
  options,
  selected,
  onChange,
  placeholder = "Select",
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectOne = (id: string | number) => {
    onChange([id]); // only one selection
    setOpen(false);
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : options.find((o) => o.id === selected[0])?.name || placeholder;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>

      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((p) => !p)}
          style={{
            width: "100%",
            padding: "6px 32px 6px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: disabled ? "#f3f4f6" : "#fff",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
            fontSize: 13,
            color: "#374151",
            position: "relative",
          }}
        >
          {displayText}
          <span
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 2px)",
              left: 0,
              zIndex: 1000,
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: "100%",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => selectOne(opt.id)}
                style={{
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#374151",
                  background: selected.includes(opt.id) ? "#eff6ff" : "#fff",
                }}
              >
                {opt.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Date Range Picker ────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  /**
   * FIX: Accept scheduledDates so the picker can highlight them.
   * These are ISO date strings returned by /timetable/scheduled-dates.
   */
  scheduledDates?: string[];
}

function DateRangePicker({ startDate, endDate, onChange, scheduledDates = [] }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const ref = React.useRef<HTMLDivElement>(null);

  // Keep local state in sync if parent resets dates
  useEffect(() => { setLocalStart(startDate); }, [startDate]);
  useEffect(() => { setLocalEnd(endDate); }, [endDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatDisplay = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const apply = () => {
    if (localStart && localEnd) {
      onChange(localStart, localEnd);
      setOpen(false);
    }
  };

  /**
   * FIX: Build a Set of scheduled date strings (normalised to YYYY-MM-DD)
   * so we can show a hint label in the picker UI.
   */
  const scheduledSet = React.useMemo(
  () => new Set(scheduledDates),
  [scheduledDates]
);

  const hasScheduled = scheduledSet.size > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }} ref={ref}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Date</label>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          padding: "6px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          background: "#fff",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 13,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 240,
        }}
      >
        <span>📅</span>
        {startDate && endDate
          ? `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`
          : "Select date range"}
        <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 10 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 1001,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: 16,
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 280,
          }}
        >
          {/* FIX: Show scheduled dates hint when available */}
          {hasScheduled && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 12,
                color: "#1d4ed8",
              }}
            >
              🗓 {scheduledSet.size} scheduled date{scheduledSet.size !== 1 ? "s" : ""} available for selected sections
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Start Date</label>
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                style={{
                  padding: "5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
              {/* FIX: Highlight if start date is a scheduled date */}
              {localStart && scheduledSet.has(localStart) && (
                <span style={{ fontSize: 11, color: "#16a34a" }}>✓ Scheduled date</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>End Date</label>
              <input
                type="date"
                value={localEnd}
                min={localStart}
                onChange={(e) => setLocalEnd(e.target.value)}
                style={{
                  padding: "5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
              {/* FIX: Highlight if end date is a scheduled date */}
              {localEnd && scheduledSet.has(localEnd) && (
                <span style={{ fontSize: 11, color: "#16a34a" }}>✓ Scheduled date</span>
              )}
            </div>
          </div>

          {/* FIX: Show list of scheduled dates within selected range for quick navigation */}
          {hasScheduled && localStart && localEnd && (() => {
            const inRange = Array.from(scheduledSet)
              .filter((d) => d >= localStart && d <= localEnd)
              .sort();
            if (inRange.length === 0) return null;
            return (
              <div style={{ fontSize: 12, color: "#374151" }}>
                <span style={{ color: "#6b7280" }}>Scheduled dates in range: </span>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  {inRange.map((d) => formatDisplay(d)).join(", ")}
                </span>
              </div>
            );
          })()}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "5px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={apply}
              disabled={!localStart || !localEnd}
              style={{
                padding: "5px 14px",
                border: "none",
                borderRadius: 4,
                background: !localStart || !localEnd ? "#86efac" : "#22c55e",
                color: "#fff",
                cursor: !localStart || !localEnd ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, { color: string; bg: string }> = {
    "Attendance Not Taken": { color: "#dc2626", bg: "#fef2f2" },
    Finalized: { color: "#16a34a", bg: "#f0fdf4" },
    InProgress: { color: "#d97706", bg: "#fffbeb" },
    "Class Not Scheduled": { color: "#6b7280", bg: "#f9fafb" },
  };

  const style = styleMap[status] ?? { color: "#374151", bg: "#f3f4f6" };

  return (
    <span
      style={{
        color: style.color,
        background: style.bg,
        fontWeight: 600,
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 12,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

// ─── Pagination Button ────────────────────────────────────────────────────────

function paginationBtnStyle(
  disabled: boolean,
  active = false
): React.CSSProperties {
  return {
    padding: "4px 10px",
    border: `1px solid ${active ? "#3b82f6" : "#d1d5db"}`,
    borderRadius: 4,
    background: active ? "#3b82f6" : disabled ? "#f9fafb" : "#fff",
    color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const formatDate = (d: string) => {
  const dt = new Date(d);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DCTRReport() {
  // ── Dropdown Data ──
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // ── Selected Filters ──
  const [selectedDept, setSelectedDept] = useState<string | number | null>(null);
const [selectedProgram, setSelectedProgram] = useState<string | number | null>(null);
const [selectedCurriculum, setSelectedCurriculum] = useState<string | number | null>(null);
const [selectedTerm, setSelectedTerm] = useState<string | number | null>(null);
const [selectedSection, setSelectedSection] = useState<string | number | null>(null);

  // ── Date Range ──
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // ── Table State ──
  const [tableData, setTableData] = useState<DCTRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // FIX: scheduledDates is now wired to the DateRangePicker for highlighting
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);

  // ── Table Controls ──
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Loading states for cascaded dropdowns ──
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  // ─── 1. Load Departments on mount ───────────────────────────────────────────
  // GET /api/v1/hierarchy/departments  — no params required
  // FIX: Backend may return the array directly OR wrapped in a data/departments
  // key. We handle all common shapes defensively.
  useEffect(() => {
    apiFetch<
      | Department[]
      | { data?: Department[]; departments?: Department[]; results?: Department[] }
    >(`${API_BASE}/hierarchy/departments`)
      .then((res) => {
        // Unwrap any envelope shape the backend might use
        let depts: Department[] = [];
        if (Array.isArray(res)) {
          depts = res;
        } else if (res && typeof res === "object") {
          const anyRes = res as Record<string, unknown>;
          const inner =
            anyRes["data"] ?? anyRes["departments"] ?? anyRes["results"] ?? [];
          depts = Array.isArray(inner) ? (inner as Department[]) : [];
        }
        if (depts.length === 0) {
          console.warn("[Departments] API returned empty or unrecognised shape:", res);
        }
        setDepartments(depts);
        setSelectedDept(null);
      })
      .catch((e) => {
        console.error("Failed to fetch departments:", e);
        setError("Failed to load departments — " + e.message + ". Please refresh.");
      });
  }, []);

  // ─── 2. Load Programs when departments change ────────────────────────────────
  // GET /api/v1/hierarchy/programs?dept_id=<integer>  (one call per dept)
  useEffect(() => {
    if (!selectedDept) {
  setPrograms([]);
  setSelectedProgram(null);
  return;
}

    setLoadingPrograms(true);

    Promise.all([
  apiFetch<Program[]>(`${API_BASE}/hierarchy/programs`, {
    dept_id: String(selectedDept),
  }),
])
      .then((results) => {
  const flat = results.flatMap((res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  });

  console.log("PROGRAMS:", flat); // debug

  const unique = uniqueById(flat);
  setPrograms(unique);
})
      .catch((e) => console.error("Failed to fetch programs:", e))
      .finally(() => setLoadingPrograms(false));
 }, [selectedDept]);

  // ─── 3. Load Curriculums filtered by selected departments ───────────────────
  // CORRECTED API: GET /api/v1/hierarchy/curriculums-by-dept?dept_id=<integer>
  // (one call per selected department, results merged & deduplicated)
  // Response shape may be a plain array OR wrapped: { data: [...] }
  // Each item shape: { academic_batch_id, academic_batch_desc } or { id, name }
  useEffect(() => {
    if (!selectedDept) {
  setCurriculums([]);
  setSelectedCurriculum(null);
  return;
}

    setLoadingCurriculums(true);

    Promise.all([
  apiFetch(
    `${API_BASE}/hierarchy/curriculums-by-dept`,
    { dept_id: String(selectedDept) }
  ).then((res) => {
    const raw = Array.isArray(res)
      ? res
      : Array.isArray((res as any)["data"])
      ? (res as any)["data"]
      : [];

    return raw.map((c: any) => ({
      id: String(c.academic_batch_id ?? c.id ?? ""),
      name: String(c.academic_batch_desc ?? c.name ?? ""),
    }));
  }),
])
      .then((results) => {
        const flat = results.flat();
        // Deduplicate by id (same curriculum may appear under multiple depts)
        const unique = flat.filter(
          (c, i, self) => self.findIndex((x) => x.id === c.id) === i
        );
        setCurriculums(unique);
       setSelectedCurriculum(null);
      })
      .catch((e) => console.error("Failed to fetch curriculums:", e))
      .finally(() => setLoadingCurriculums(false));
 }, [selectedDept]); // re-fetch whenever selected departments change

  // ─── 4. Load Terms when curriculums change ───────────────────────────────────
  // GET /api/v1/hierarchy/terms?academic_batch_id=<id>  (one call per curriculum)
  // FIX: param name corrected to academic_batch_id (not curriculum_id)
  // FIX: each Term is tagged with curriculum_id so we can group them later
  useEffect(() => {
    if (!selectedCurriculum) {
  setTerms([]);
  setSelectedTerm(null);
  return;
}

    setLoadingTerms(true);

    Promise.all([
  apiFetch<Term[]>(`${API_BASE}/hierarchy/terms`, {
    academic_batch_id: String(selectedCurriculum),
  }).then((termList) =>
    termList.map((t) => ({
      ...t,
      curriculum_id: selectedCurriculum,
    }))
  ),
])
      .then((results) => {
        const flat = results.flat();
        const unique = uniqueById(flat);
        setTerms(unique);
        setSelectedTerm(null);// default: all selected
      })
      .catch((e) => console.error("Failed to fetch terms:", e))
      .finally(() => setLoadingTerms(false));
  }, [selectedCurriculum]);

  // ─── 5. Load Sections when terms change ─────────────────────────────────────
  // GET /api/v1/hierarchy/sections?semester_id=<id>  (one call per term)
  useEffect(() => {
    if (!selectedTerm) {
  setSections([]);
  setSelectedSection(null);
  return;
}

    setLoadingSections(true);

    Promise.all([
  apiFetch<Section[]>(`${API_BASE}/hierarchy/sections`, {
    semester_id: String(selectedTerm),
  }),
])
      .then((results) => {
        const flat = results.flat();
        const unique = uniqueById(flat);
        setSections(unique);
        setSelectedSection(null); // default: all selected
      })
      .catch((e) => console.error("Failed to fetch sections:", e))
      .finally(() => setLoadingSections(false));
  }, [selectedTerm]);

  // ─── 6. Fetch Scheduled Dates for date picker highlighting ──────────────────
  // GET /api/v1/timetable/scheduled-dates?section_id=<id>&semester_id=<id>
  // FIX: Results are now stored in scheduledDates and passed to DateRangePicker
  useEffect(() => {
    if (!selectedSection || !selectedTerm){
      setScheduledDates([]);
      return;
    }

    Promise.all([
  apiFetch<string[]>(`${API_BASE}/timetable/scheduled-dates`, {
    section_id: String(selectedSection),
    semester_id: String(selectedTerm),
  }),
])
      .then((results) => {
        const flat = results.flat();
        // FIX: Normalise all dates to YYYY-MM-DD and deduplicate
        const uniqueDates = Array.from(
          new Set(flat.map((d: any) => {
  if (typeof d === "string") return d.split("T")[0];
  if (d?.date) return String(d.date).split("T")[0];
  return "";
}))
        );
        setScheduledDates(uniqueDates);
      })
      .catch((e) => console.error("Failed to fetch scheduled dates:", e));
 }, [selectedSection, selectedTerm]);
  // ─── 7. Generate Report ──────────────────────────────────────────────────────
  const handleGenerateReport = useCallback(async () => {
    if (!selectedDept) {
  setCurriculums([]);
  setSelectedCurriculum(null);
  return;
}
    if (!selectedProgram) {
      setError("Please select at least one Program.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select a valid date range.");
      return;
    }

    if (!selectedSection) {
  setError("Please select a Section.");
  return;
}
    setError(null);
    setLoading(true);
    setReportGenerated(false);
    setCurrentPage(1);

    // Build query params — send comma-separated IDs for multi-selects
    const params: Record<string, string> = {
  start_date: startDate,
  end_date: endDate,
  dept_id: selectedDept ? String(selectedDept) : "",
  program_id: selectedProgram ? String(selectedProgram) : "",
  academic_batch_id: selectedCurriculum ? String(selectedCurriculum) : "",
  semester_id: selectedTerm ? String(selectedTerm) : "",
  section_id: selectedSection ? String(selectedSection) : "",
};

    // Optional filters — only include if user has made selections
    

    try {
      // Try primary DCTR report endpoint first
      let data: any[] = await apiFetch<any[]>(
  `${API_BASE}/timetable/lesson-status`,
  {
    semester_id: String(selectedTerm),
    class_date: startDate,
    section_id: String(selectedSection)   // ✅ ADD THIS LINE
  }
);

      const rows = (Array.isArray(data) ? data : []).map((item: any) => ({
  department: item.department || "-",   // ✅ from backend
  time: "-", 
  date: item.class_date || startDate,   // ✅ from backend
  email: "-",
  section: item.section || "-",         // ✅ from backend
  class_timings: item.class_timings || "-",  // ✅ from backend
  scheduled_class: item.course_title,
  scheduled_faculty: "-",
  faculty: item.faculty || "-",         // ✅ from backend
  students_present: 0,
  status: item.status || "Class Not Scheduled",
}));

      // ─── FIX: Lesson Status enrichment ──────────────────────────────────────
      // Previously this called the API but discarded the results entirely.
      // Now we use the returned status to overwrite row.status so the table
      // reflects real-time attendance state from the lesson-status endpoint.
      //
      // We use allSettled so a single 404/500 won't abort the whole report.
      

      // Merge lesson status into each row
      

      setTableData(rows);
      setReportGenerated(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch report. Please try again.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedDept,
    selectedProgram ? [selectedProgram] : [],
    selectedCurriculum ? [selectedCurriculum] : [],
    selectedTerm ? [selectedTerm] : [],
    selectedSection ? [selectedSection] : [],
    startDate,
    endDate,
  ]);

  // ─── 8. CSV Export ───────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Department",
      "Time",
      "Date",
      "Email",
      "Section",
      "Class Timings",
      "Scheduled Class",
      "Scheduled Faculty",
      "Faculty",
      "Students Present",
      "Status",
    ];

    const rows = filteredData.map((r) => [
      r.department,
      r.time,
      r.date,
      r.email,
      r.section,
      r.class_timings,
      r.scheduled_class,
      r.scheduled_faculty,
      r.faculty,
      r.students_present,
      r.status,
    ]);

    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DCTR_Report_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Filtering & Pagination ───────────────────────────────────────────────────
  const filteredData = tableData.filter((row) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return Object.values(row).some((v) => String(v).toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Visible page numbers (up to 5, centred around current page)
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
    return start + i;
  });

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #1a3050 100%)",
          padding: "14px 24px",
          borderRadius: "6px 6px 0 0",
        }}
      >
        <h2
          style={{
            color: "#fff",
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          DCTR Report
        </h2>
      </div>

      {/* ── Filter Bar (cascaded dropdowns) ── */}
      <div
        style={{
          background: "#fff",
          padding: "18px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-end",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Department — always enabled; required */}
        <MultiSelect
  label="Department"
  required
  options={departments.map((d) => ({ id: d.id, name: d.name }))}
  selected={selectedDept ? [selectedDept] : []}
  onChange={(vals) => setSelectedDept(vals[0])}
  placeholder="Select department"
/>

        {/* Program — enabled once departments are loaded; required */}
        <MultiSelect
  label="Program"
  required
  options={programs.map((p) => ({ id: p.id, name: p.name }))}
  selected={selectedProgram ? [selectedProgram] : []}
  onChange={(vals) => setSelectedProgram(vals[0])}
  placeholder="Select program"
/>

        {/* Curriculum — depends on Department (GET /hierarchy/curriculums-by-dept) */}
        <MultiSelect
  label="Curriculum"
  options={curriculums}
  selected={selectedCurriculum ? [selectedCurriculum] : []}
  onChange={(vals) => setSelectedCurriculum(vals[0])}
  placeholder="Select curriculum"
/>

        {/* Term — depends on curriculum */}
        {/*
          FIX: Terms are grouped by curriculum at the data level.
          The MultiSelect receives a flat list; curriculum_id is preserved
          on each Term object for any downstream grouping needs (e.g. a
          GroupedMultiSelect can be swapped in without changing state logic).
        */}
        <MultiSelect
  label="Term"
  options={terms}
  selected={selectedTerm ? [selectedTerm] : []}
  onChange={(vals) => setSelectedTerm(vals[0])}
  placeholder="Select term"
/>

        {/* Section — depends on term */}
        <MultiSelect
  label="Section"
  options={sections}
  selected={selectedSection ? [selectedSection] : []}
  onChange={(vals) => setSelectedSection(vals[0])}
  placeholder="Select section"
/>
      </div>

      {/* ── Date Range + Actions ── */}
      <div
        style={{
          background: "#fff",
          padding: "12px 24px 16px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          position: "relative",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* FIX: Pass scheduledDates into DateRangePicker so it can highlight them */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          scheduledDates={scheduledDates}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            style={{
              padding: "8px 20px",
              background: loading ? "#86efac" : "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.3,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Loading...
              </>
            ) : (
              "Generate Report"
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            style={{
              padding: "8px 16px",
              background: filteredData.length === 0 ? "#86efac" : "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: filteredData.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🗂 Export CSV
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "10px 24px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Table Section ── */}
      <div
        style={{
          background: "#fff",
          margin: "16px",
          borderRadius: 6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Table Controls */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#374151",
            }}
          >
            Show{" "}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "3px 6px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>{" "}
            entries
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#374151",
            }}
          >
            Search:{" "}
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter results…"
              style={{
                padding: "4px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 13,
                width: 200,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "Department",
                  "Time",
                  "Date",
                  "Email",
                  "Section",
                  "Class Timings",
                  "Scheduled Class",
                  "Scheduled Faculty",
                  "Faculty",
                  "Students Present",
                  "Status",
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ textAlign: "center", padding: 48, color: "#6b7280" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          border: "3px solid #e5e7eb",
                          borderTop: "3px solid #22c55e",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      Loading report data…
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}
                  >
                    {reportGenerated
                      ? "No records found for the selected filters."
                      : "Select filters and click 'Generate Report' to view data."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      background: i % 2 === 0 ? "#fff" : "#f9fafb",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#eff6ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "#fff" : "#f9fafb")
                    }
                  >
                    <td style={{ padding: "9px 12px", color: "#374151", fontWeight: 500 }}>
                      {row.department}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {row.time}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {row.date}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#2563eb" }}>{row.email}</td>
                    <td style={{ padding: "9px 12px" }}>{row.section}</td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                      {row.class_timings}
                    </td>
                    <td style={{ padding: "9px 12px" }}>{row.scheduled_class}</td>
                    <td style={{ padding: "9px 12px" }}>{row.scheduled_faculty}</td>
                    <td style={{ padding: "9px 12px" }}>{row.faculty}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 600 }}>
                      {row.students_present}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredData.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #e5e7eb",
              fontSize: 13,
              color: "#6b7280",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} entries
            </span>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={paginationBtnStyle(currentPage === 1)}
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={paginationBtnStyle(currentPage === 1)}
              >
                ‹ Prev
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={paginationBtnStyle(false, page === currentPage)}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={paginationBtnStyle(currentPage === totalPages)}
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={paginationBtnStyle(currentPage === totalPages)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
