import React, { useEffect, useRef, useState } from "react";
import api from "../../../utils/api";
import { dctrList } from "./dailyClassReportService";

export const isoDay = (day: Date) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
const fromIso = (value: string) => new Date(`${value}T12:00:00`);

export default function DctrDateRange({ start, end, onChange, filters, enabled }: {
  start: string; end: string; onChange: (start: string, end: string) => void;
  filters: Record<string, string>; enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => start.slice(0, 7));
  const [draft, setDraft] = useState([start, end]);
  const [choosingEnd, setChoosingEnd] = useState(false);
  const [scheduled, setScheduled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const controller = new AbortController();
    setScheduled(new Set()); setError(""); setLoading(enabled);
    if (enabled) {
      const first = fromIso(`${month}-01`);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
      const config = { params: { ...JSON.parse(filterKey), start_date: isoDay(first), end_date: isoDay(last) }, signal: controller.signal };
      Promise.resolve(api.get("/api/v1/daily-class-report/scheduled-dates", config))
        .then(response => { if (active) setScheduled(new Set(dctrList<string>(response.data))); })
        .catch(() => { if (active) setError("Unable to load scheduled dates."); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; controller.abort(); };
  }, [open, month, filterKey, enabled, retry]);
  const shift = (offset: number) => {
    const date = fromIso(`${month}-01`);
    setMonth(isoDay(new Date(date.getFullYear(), date.getMonth() + offset, 1, 12)).slice(0, 7));
  };
  const pick = (value: string) => {
    if (!choosingEnd) { setDraft([value, value]); setChoosingEnd(true); }
    else { setDraft([draft[0], value].sort()); setChoosingEnd(false); }
  };
  return <div ref={root} style={{ position: "relative" }} onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
  }}>
    <label style={{ display: "block" }}>Date range *</label>
    <button ref={trigger} type="button" aria-label="Choose date range" aria-expanded={open} onClick={() => {
      setDraft([start, end]); setMonth(start.slice(0, 7)); setChoosingEnd(false); setOpen(value => !value);
    }} style={{ padding: "8px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: 4 }}>
      {fromIso(start).toLocaleDateString()} – {fromIso(end).toLocaleDateString()} ▾
    </button>
    {open && <div role="dialog" aria-label="Select date range" style={{ position: "absolute", top: "100%", left: 0, zIndex: 1100, background: "white", border: "1px solid #cbd5e1", borderRadius: 6, padding: 16, width: 320, maxWidth: "calc(100vw - 100px)", boxShadow: "0 4px 16px #0003" }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label>Start Date <input aria-label="Start Date" type="date" value={draft[0]} onChange={e => setDraft([e.target.value, draft[1]])} /></label>
        <label>End Date <input aria-label="End Date" type="date" min={draft[0]} value={draft[1]} onChange={e => setDraft([draft[0], e.target.value])} /></label>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0" }}>
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        <button type="button" onClick={() => { const today = isoDay(new Date()); setDraft([today, today]); setMonth(today.slice(0, 7)); setChoosingEnd(false); }}>Today</button>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}>›</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {[0].map(offset => {
          const first = fromIso(`${month}-01`);
          first.setMonth(first.getMonth() + offset);
          const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
          return <div key={offset} style={{ flex: "1 1 230px" }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <span key={day} style={{ textAlign: "center", fontSize: 12 }}>{day}</span>)}
              {Array.from({ length: first.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
              {Array.from({ length: days }, (_, i) => {
                const day = isoDay(new Date(first.getFullYear(), first.getMonth(), i + 1, 12));
                const marked = scheduled.has(day);
                const inRange = day >= draft[0] && day <= draft[1];
                return <button type="button" key={day} aria-label={day} aria-pressed={inRange}
                  title={marked ? "Classes scheduled" : undefined} onClick={() => pick(day)} style={{
                    padding: "6px 0", background: "transparent", color: marked ? "#15803d" : "#334155",
                    fontWeight: marked ? 700 : 400, border: inRange ? "1px solid #334155" : "1px solid transparent", borderRadius: 3,
                  }}>{i + 1}</button>;
              })}
            </div>
          </div>;
        })}
      </div>
      <p style={{ fontSize: 12, color: "#15803d" }}>{loading ? "Loading scheduled dates…" : "Green dates have scheduled classes."}</p>
      {!enabled && <p>Select the report filters to see scheduled dates.</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
        <button type="button" disabled={!draft[0] || !draft[1] || draft[0] > draft[1]} onClick={() => { onChange(draft[0], draft[1]); setOpen(false); trigger.current?.focus(); }}>Apply dates</button>
      </div>
    </div>}
  </div>;
}
