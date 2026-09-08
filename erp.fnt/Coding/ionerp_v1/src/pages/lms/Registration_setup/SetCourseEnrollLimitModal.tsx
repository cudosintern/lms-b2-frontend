import type { CSSProperties } from "react";
import type { Course, SemesterRegistration } from "./studentCourseRegistration.types";

interface Props {
  open: boolean;
  curriculumName: string;
  termName: string;
  courseType: string;
  courses: Course[];
  semesterData?: Pick<SemesterRegistration, "start_date" | "start_time" | "end_date" | "end_time"> | null;
  onClose: () => void;
}

const overlay: CSSProperties = { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0, 0, 0, .5)" };
const modal: CSSProperties = { width: "85%", maxWidth: 1100, maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 4, boxShadow: "0 4px 20px rgba(0, 0, 0, .2)" };
const cell: CSSProperties = { padding: "8px 10px", border: "1px solid #d0d7de", textAlign: "left" };

export function SetCourseEnrollLimitModal({ open, curriculumName, termName, courseType, courses, semesterData, onClose }: Props) {
  if (!open) return null;
  const isOpenElective = courseType.toLowerCase().includes("open elective");

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <section style={modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Course enrollment details">
        <header style={{ padding: "16px 24px", borderBottom: "1px solid #e8edf2" }}><h2 style={{ margin: 0, fontSize: 18 }}>Course Enrollment Details</h2></header>
        <div style={{ padding: "16px 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            <tr><th style={cell}>Curriculum</th><td style={cell}>{curriculumName}</td></tr>
            <tr><th style={cell}>Term</th><td style={cell}>{termName}</td></tr>
            <tr><th style={cell}>Type of Course</th><td style={cell}>{courseType}</td></tr>
          </tbody></table>
        </div>
        <div style={{ padding: "0 24px 16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>
            <th style={cell}>Course Code</th><th style={cell}>Course</th><th style={cell}>Credits</th>
            {isOpenElective && <><th style={cell}>Start Date</th><th style={cell}>Start Time</th><th style={cell}>End Date</th><th style={cell}>End Time</th></>}
            <th style={cell}>Registered</th>
          </tr></thead><tbody>{courses.length ? courses.map((course) => <tr key={course.crs_id}>
            <td style={cell}>{course.crs_code}</td><td style={cell}>{course.crs_title}</td><td style={cell}>{course.total_credits}</td>
            {isOpenElective && <><td style={cell}>{semesterData?.start_date || "-"}</td><td style={cell}>{semesterData?.start_time || "-"}</td><td style={cell}>{semesterData?.end_date || "-"}</td><td style={cell}>{semesterData?.end_time || "-"}</td></>}
            <td style={cell}>{course.registered_count || 0}</td>
          </tr>) : <tr><td style={{ ...cell, textAlign: "center" }} colSpan={isOpenElective ? 8 : 4}>No courses available</td></tr>}</tbody></table>
        </div>
        <footer style={{ padding: "12px 24px", borderTop: "1px solid #e8edf2", textAlign: "right" }}><button type="button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}
