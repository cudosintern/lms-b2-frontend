import React, { useEffect, useRef, useState } from "react";

export interface MarksRangeValues {
  startRange: string;
  endRange: string;
  includeAbsents: boolean;
}

export default function CustomMarksRangeDialog({ initialValues, onApply, onClose }: {
  initialValues: MarksRangeValues;
  onApply: (values: MarksRangeValues) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const start = Number(values.startRange);
    const end = Number(values.endRange);
    if (!values.startRange.trim() || !values.endRange.trim()) {
      setError("Enter both marks range limits.");
    } else if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < 0 || start > 100 || end > 100) {
      setError("Marks must be between 0 and 100.");
    } else if (start > end) {
      setError("Marks Start Range cannot exceed Marks End Range.");
    } else {
      onApply(values);
    }
  };

  return <dialog ref={dialog} className="marks-range-dialog" aria-labelledby="marks-range-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="marks-range-header">
      <h2 id="marks-range-title">Custom Range</h2>
      <button type="button" className="marks-range-close" aria-label="Close Custom Range" onClick={onClose}>×</button>
    </header>
    <form onSubmit={submit} noValidate>
      <div className="marks-range-fields">
        <label htmlFor="marks-start">Marks Start Range:<span>*</span></label>
        <input id="marks-start" autoFocus required type="number" min={0} max={100} step="any"
          placeholder="Enter marks start range (0 to 100)" value={values.startRange}
          onChange={(e) => setValues({ ...values, startRange: e.target.value })} />
        <label htmlFor="marks-end">Marks End Range:<span>*</span></label>
        <input id="marks-end" required type="number" min={0} max={100} step="any"
          placeholder="Enter marks end range (0 to 100)" value={values.endRange}
          onChange={(e) => setValues({ ...values, endRange: e.target.value })} />
      </div>
      {error && <p role="alert" className="marks-range-error">{error}</p>}
      <footer className="marks-range-footer">
        <label><input type="checkbox" checked={values.includeAbsents}
          onChange={(e) => setValues({ ...values, includeAbsents: e.target.checked })} /> Include Absent Students</label>
        <button type="submit" className="marks-range-submit">Submit</button>
        <button type="button" className="marks-range-cancel" onClick={onClose}>Cancel</button>
      </footer>
    </form>
  </dialog>;
}
