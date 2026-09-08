import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTopicService } from "./topicService";
import EditTopicPage from "./EditTopicPage";
import AssignInstructorModal from "./AssignInstructorModal";
import { SquarePen, Download } from "lucide-react";
import { toast } from "react-toastify";
import { TopicPortion, displayDate } from "./topicUi";
import "./manageTopicInstructor.css";

interface DropdownOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface TopicRow {
  id: number;
  mapping_id?: number;
  topic_id: number;
  crs_id?: number;
  course_id?: number;
  topic_title: string;
  topic_code: string;
  topic_content?: string;   // ← replaces lesson_schedule in the table
  topic_hrs: string;
  num_of_sessions: number;
  section_id?: number;
  instructor_id?: number;
  instructor_ids?: number[];
  portions?: TopicPortion[];
  instructor_name?: string;
  lesson_schedule?: string; // kept internally
  conduction_date?: string;
  actual_delivery_date?: string;
  marks_expt?: number;
  is_imported?: boolean;
}

interface DropdownState {
  curriculumOptions: DropdownOption[];
  semesterOptions: DropdownOption[];
  courseOptions: DropdownOption[];
  sectionOptions: DropdownOption[];
}

const ManageTopicInstructor: React.FC = () => {
  const topicService = useTopicService();

  const [filters, setFilters] = useState(() => {
    const empty = { curriculum: "", semester: "", course: "", section: "" };
    try {
      const saved = JSON.parse(sessionStorage.getItem("lms.topicInstructor.filters") || "null");
      if (saved && Object.keys(empty).every(k => typeof saved[k] === "string")) return { ...empty, ...saved } as typeof empty;
    } catch { /* Storage may be unavailable. */ }
    return empty;
  });
  useEffect(() => {
    try { sessionStorage.setItem("lms.topicInstructor.filters", JSON.stringify(filters)); } catch { /* Optional persistence. */ }
  }, [filters]);

  const [dropdownOptions, setDropdownOptions] = useState<DropdownState>({
    curriculumOptions: [],
    semesterOptions: [],
    courseOptions: [],
    sectionOptions: []
  });

  const [tableData, setTableData] = useState<TopicRow[]>([]);
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);
  const context = { academic_batch_id: Number(filters.curriculum), semester_id: Number(filters.semester), course_id: Number(filters.course), section_id: Number(filters.section) };

 // ── Load curriculum on mount ────────────────────────────
  useEffect(() => {
    topicService.getCurriculumList().then((res: any) => {
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setDropdownOptions(prev => ({
        ...prev,
        curriculumOptions: arr.map((item: any) => ({
          value: item.value || item.academic_batch_id || item.id,
          label: item.label || item.academic_batch_name || item.name || `Batch ${item.id}`,
        }))
      }));
    }).catch(console.error);
  }, []);

  // ── Filter semesters when curriculum changes ──────────────────────────
  useEffect(() => {
    let active = true;
    if (filters.curriculum) {
      topicService.getSemesterList({ 
        academic_batch_id: Number(filters.curriculum) 
      }).then((res: any) => {
        if (!active) return;
        const arr = Array.isArray(res) ? res : (res?.data || []);
        setDropdownOptions(prev => ({
          ...prev,
          semesterOptions: arr.map((item: any) => ({
            value: item.value || item.semester_id || item.id,
            label: item.label || item.semester_name || item.name || `Semester ${item.id}`,
          }))
        }));
      }).catch(console.error);
    } else {
      setDropdownOptions(prev => ({ ...prev, semesterOptions: [] }));
      setFilters(prev => ({ ...prev, semester: "", course: "", section: "" }));
    }
    return () => { active = false; };
  }, [filters.curriculum]);

   // ── Load courses when curriculum + semester change ──────────────────
  useEffect(() => {
    let active = true;
    if (filters.curriculum && filters.semester) {
      topicService.getCourseList({
        academic_batch_id: Number(filters.curriculum),
        semester_id: Number(filters.semester)
      }).then((res: any) => {
        if (!active) return;
        console.log("Course data from service:", res);
        const arr = Array.isArray(res) ? res : (res?.data || res?.courses || []);
        setDropdownOptions(prev => ({
          ...prev,
          courseOptions: arr.map((item: any) => ({
            value: item.value || item.crs_id || item.course_id || item.id,
            label: item.label || item.crs_title || item.course_name || `Course ${item.id}`,
          }))
        }));
        
        // Reset course if current selection not in filtered list
        if (filters.course) {
          const stillExists = arr.some((item: any) => 
            String(item.value || item.crs_id || item.course_id || item.id) === filters.course
          );
          if (!stillExists) {
            setFilters(prev => ({ ...prev, course: "", section: "" }));
          }
        }
      }).catch(error => {
        if (!active) return;
        console.error("Error fetching courses:", error);
        setDropdownOptions(prev => ({ ...prev, courseOptions: [] }));
      });
    } else {
      setDropdownOptions(prev => ({ ...prev, courseOptions: [] }));
      if (!filters.curriculum || !filters.semester) {
        setFilters(prev => ({ ...prev, course: "", section: "" }));
      }
    }
    return () => { active = false; };
  }, [filters.curriculum, filters.semester]);

  // ── Load sections when semester/course change ───────────────────────
  useEffect(() => {
    let active = true;
    if (filters.semester && filters.curriculum && filters.course) {
      const payload = {
        semester_id: Number(filters.semester),
        academic_batch_id: Number(filters.curriculum),
        course_id: Number(filters.course)
      };

      topicService.getSectionList(payload).then((res: any) => {
        if (!active) return;
        console.log("Section data from service:", res);
        const arr = Array.isArray(res) ? res : [];
        setDropdownOptions(prev => ({
          ...prev,
          sectionOptions: arr.map((item: any) => ({
            value: item.value,
            label: item.label,
          }))
        }));
      }).catch(error => {
        if (!active) return;
        console.error("Error fetching sections:", error);
        setDropdownOptions(prev => ({ ...prev, sectionOptions: [] }));
      });
    } else {
      setDropdownOptions(prev => ({ ...prev, sectionOptions: [] }));
    }
    return () => { active = false; };
  }, [filters.semester, filters.curriculum, filters.course]);

  // ── Load topics whenever all 4 filters are set ──────────────────────
  const loadTopics = useCallback(async () => {
    const courseId    = Number(filters.course);
    const semesterId  = Number(filters.semester);
    const sectionId   = Number(filters.section);
    const curriculumId= Number(filters.curriculum);

    const version = ++requestVersion.current;
    if (!courseId || !semesterId || !sectionId || !curriculumId) { setTableData([]); setLoading(false); return; }

    setLoading(true);
    try {
      const res: any = await topicService.getTopicList({
        academic_batch_id: curriculumId,
        course_id: courseId,
        semester_id: semesterId,
        section_id: sectionId,
      });

      if (version !== requestVersion.current) return;
      const arr = Array.isArray(res) ? res : (res?.data || []);

      if (Array.isArray(arr) && arr.length > 0) {
        setTableData(arr.map((item: any, idx: number) => ({
          id:                   idx + 1,
          mapping_id:           item.mapping_id || item.inst_map_id,
          topic_id:             item.topic_id,
          crs_id:               item.crs_id || item.course_id,
          course_id:            item.course_id || item.crs_id || courseId,
          topic_title:          item.topic_title || item.topic_name || "",
          topic_code:           item.topic_code || "",
          topic_content:        item.topic_content || "",
          topic_hrs:            String(item.topic_hrs ?? ""),
          num_of_sessions:      Number(item.num_of_sessions ?? 0),
          section_id:           item.section_id || sectionId,
          instructor_id:        item.instructor_id,
          instructor_ids:       item.instructor_ids || [],
          portions:             item.portions || [],
          instructor_name:      item.instructor_name || "Not Assigned",
          lesson_schedule:      item.lesson_schedule || "",
          conduction_date:      item.conduction_date,
          actual_delivery_date: item.actual_delivery_date || item.delivery_date,
          marks_expt:           item.marks_expt,
          is_imported:          item.is_imported || false,
        })));
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to load topics", err);
      if (version === requestVersion.current) { setTableData([]); toast.error("Unable to load topics"); }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [filters.curriculum, filters.course, filters.semester, filters.section, topicService]);


  useEffect(() => {
    const c = Number(filters.course);
    const s = Number(filters.semester);
    const sec = Number(filters.section);
    const cur = Number(filters.curriculum);
    loadTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.curriculum, filters.course, filters.semester, filters.section]);


  const labels = {
    curriculum: dropdownOptions.curriculumOptions.find(o => String(o.value) === filters.curriculum)?.label || "",
    semester: dropdownOptions.semesterOptions.find(o => String(o.value) === filters.semester)?.label || "",
    course: dropdownOptions.courseOptions.find(o => String(o.value) === filters.course)?.label || "",
    section: dropdownOptions.sectionOptions.find(o => String(o.value) === filters.section)?.label || "",
  };
  if (editingTopic) return <EditTopicPage topic={editingTopic} academic_batch_id={context.academic_batch_id}
    semester_id={context.semester_id} labels={labels}
    filters={{ course: context.course_id, semester: context.semester_id, section: context.section_id, academic_batch_id: context.academic_batch_id }}
    close={() => setEditingTopic(null)} refresh={loadTopics} />;

  return <div className="mti"><section className="mti-card">
    <h1 className="mti-heading">Manage Topic Instructor</h1>
    <div className="mti-filters">
      {(["curriculum", "semester", "course", "section"] as const).map(field => <div key={field}>
        <label htmlFor={`mti-${field}`}>{field === "curriculum" ? "Curriculum" : field === "semester" ? "Term" : field === "course" ? "Course" : "Section"}: <span className="mti-required">*</span></label>
        <select id={`mti-${field}`} className="mti-field" value={filters[field]} onChange={e => {
          const value=e.target.value;
          ++requestVersion.current;
          setTableData([]);
          setDropdownOptions(prev => ({ ...prev,
            ...(field === "curriculum" ? { semesterOptions: [], courseOptions: [], sectionOptions: [] } : {}),
            ...(field === "semester" ? { courseOptions: [], sectionOptions: [] } : {}),
            ...(field === "course" ? { sectionOptions: [] } : {}) }));
          setFilters(prev => ({ ...prev, [field]:value,
            ...(field === "curriculum" ? { semester:"",course:"",section:"" } : {}),
            ...(field === "semester" ? { course:"",section:"" } : {}),
            ...(field === "course" ? { section:"" } : {}) }));
        }}>
          <option value="">Select {field === "semester" ? "Term" : field}</option>
          {dropdownOptions[`${field}Options` as keyof DropdownState].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>)}
    </div>
    <div className="mti-toolbar"><button className="mti-button mti-success" disabled={!filters.curriculum || !filters.semester || !filters.course || !filters.section} onClick={() => setShowAssignModal(true)}><Download size={13} />Import Topics</button></div>
    {loading ? <p role="status">Loading topics…</p> : <div className="mti-table-wrap"><table className="mti-table mti-list-table">
      <thead><tr><th>Sl No.</th><th>Topic Title</th><th>Lesson Schedule</th><th>Delivery date</th><th>Handled by</th><th>Edit</th></tr></thead>
      {tableData.map((topic,index) => {
        const rows = topic.portions?.length ? topic.portions : [{ schedule_id:0, session_number:1, portion_to_be_covered:topic.lesson_schedule || "", actual_delivery_date:topic.actual_delivery_date }];
        return <tbody key={topic.topic_id}>{rows.map((portion,rowIndex) => <tr key={portion.schedule_id || rowIndex}>
          {rowIndex === 0 && <><td rowSpan={rows.length} style={{ verticalAlign:"top",textAlign:"center" }}>{index+1}</td><td rowSpan={rows.length} className="mti-topic-title">{topic.topic_title}</td></>}
          <td className={`mti-portion ${"lesson_schedule_id" in portion && !portion.lesson_schedule_id ? "mti-added" : ""}`}>{portion.portion_to_be_covered || "—"}</td>
          <td className="mti-date">{displayDate(portion.actual_delivery_date)}</td>
          {rowIndex === 0 && <><td rowSpan={rows.length} className="mti-instructor">{topic.instructor_name}</td><td rowSpan={rows.length} className="mti-edit"><button className="mti-link-button" aria-label={`Edit ${topic.topic_title}`} title={topic.mapping_id ? "Edit lesson schedule" : "Import and assign this topic first"} disabled={!topic.mapping_id} onClick={() => setEditingTopic(topic)}><SquarePen size={15} /></button></td></>}
        </tr>)}</tbody>;
      })}
      {!tableData.length && <tbody><tr><td colSpan={6} style={{ textAlign:"center" }}>No data available in table</td></tr></tbody>}
    </table></div>}
  </section>
  {showAssignModal && <AssignInstructorModal filters={{ curriculum:context.academic_batch_id,semester:context.semester_id,course:context.course_id,section:context.section_id }} topics={tableData} close={() => setShowAssignModal(false)} refresh={loadTopics} />}
  </div>;
};
export default ManageTopicInstructor;
