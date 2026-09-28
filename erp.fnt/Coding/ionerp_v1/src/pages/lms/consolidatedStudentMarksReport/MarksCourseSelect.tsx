import React, { useEffect, useRef } from "react";
import { MarksCourseOption } from "./consolidatedStudentMarksReportTypes";

export default function MarksCourseSelect({ courses, selectedIds, disabled, loading, onChange }: {
  courses: MarksCourseOption[];
  selectedIds: number[];
  disabled: boolean;
  loading: boolean;
  onChange: (ids: number[]) => void;
}) {
  const dropdown = useRef<HTMLDetailsElement>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const allSelected = courses.length > 0 && courses.every((course) => selectedIds.includes(course.course_id));
  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selectedIds.length > 0 && !allSelected;
  }, [selectedIds, allSelected]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  useEffect(() => {
    if (disabled && dropdown.current) dropdown.current.open = false;
  }, [disabled]);
  return <details ref={dropdown} className="marks-course-select" onKeyDown={(event) => {
    if (event.key === "Escape" && dropdown.current) {
      dropdown.current.open = false;
      dropdown.current.querySelector("summary")?.focus();
    }
  }}>
    <summary id="marks-courses" aria-labelledby="marks-courses-label marks-courses"
      aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault(); }}>
      {loading ? "Loading courses..." : allSelected ? "All selected" : selectedIds.length ? `${selectedIds.length} selected` : "Select courses"}
      <span aria-hidden="true">▾</span>
    </summary>
    <div className="marks-course-options" role="group" aria-label="Course choices">
      <label className="marks-course-all"><input ref={selectAll} type="checkbox" checked={allSelected}
        disabled={disabled || !courses.length} onChange={(event) => onChange(event.target.checked ? courses.map((c) => c.course_id) : [])} />Select All</label>
      {courses.map((course) => <label key={course.course_id}><input type="checkbox" disabled={disabled}
        checked={selectedIds.includes(course.course_id)} onChange={(event) => onChange(event.target.checked
          ? [...selectedIds, course.course_id] : selectedIds.filter((id) => id !== course.course_id))} />
        {course.course_code} - {course.course_title}</label>)}
      {!courses.length && <div className="marks-course-empty">No courses available for this section.</div>}
    </div>
  </details>;
}
