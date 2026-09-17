import React, { useEffect, useRef, useState } from "react";

export type Option = { value: number; label: string; group?: string; ids?: number[] };

export default function CheckboxDropdown({ label, required, options, selected, onChange, disabled = false }: {
  label: string; required: boolean; options: Option[]; selected: number[];
  onChange: (ids: number[]) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const allRef = useRef<HTMLInputElement>(null);
  const ids = Array.from(new Set(options.flatMap(o => o.ids ?? [o.value])));
  const all = ids.length > 0 && ids.every(id => selected.includes(id));
  const count = options.filter(o => (o.ids ?? [o.value]).some(id => selected.includes(id))).length;
  useEffect(() => { if (allRef.current) allRef.current.indeterminate = count > 0 && !all; }, [count, all, open]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const visible = options.filter(o => `${o.group ?? ""} ${o.label}`.toLowerCase().includes(search.toLowerCase()));
  const groups = Array.from(new Set(visible.map(o => o.group ?? "")));
  return <div ref={ref} style={{ position: "relative", flex: "1 1 160px", minWidth: 150 }} onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{label}{required && <span style={{ color: "red" }}> *</span>}</label>
    <button type="button" aria-label={label} aria-expanded={open && !disabled} disabled={disabled}
      onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 4, background: disabled ? "#f5f5f5" : "white" }}>
      {all ? "All selected" : count === 1 ? options.find(o => (o.ids ?? [o.value]).some(id => selected.includes(id)))?.label : count ? `${count} selected` : `Select ${label}`} <span style={{ float: "right" }}>▾</span>
    </button>
    {open && !disabled && <div style={{ position: "absolute", top: "100%", left: 0, minWidth: "100%", width: 250, zIndex: 2100, background: "white", border: "1px solid #ccc", boxShadow: "0 4px 12px #0002", borderRadius: 4, padding: 6 }}>
      <input aria-label={`Search ${label}`} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 6, marginBottom: 5 }} />
      <label style={{ display: "block", padding: 6, fontWeight: 600 }}><input ref={allRef} type="checkbox" checked={all} onChange={() => onChange(all ? [] : ids)} /> Select All</label>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {groups.map(group => <div key={group}>
          {group && <div style={{ padding: "7px 6px", fontWeight: 600, background: "#f1f3f5" }}>{group}</div>}
          {visible.filter(o => (o.group ?? "") === group).map(o => {
            const values = o.ids ?? [o.value];
            const checked = values.every(id => selected.includes(id));
            return <label key={o.value} style={{ display: "block", padding: 6, background: checked ? "#337ab7" : "white", color: checked ? "white" : "#333" }}>
              <input type="checkbox" checked={checked} onChange={() => onChange(checked ? selected.filter(id => !values.includes(id)) : Array.from(new Set([...selected, ...values])))} /> {o.label}
            </label>;
          })}
        </div>)}
        {!visible.length && <div style={{ padding: 8 }}>No options found.</div>}
      </div>
    </div>}
  </div>;
}
