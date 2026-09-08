from pathlib import Path
p=Path('ManageTopicInstructor.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('useMemo, ','').replace('import DataTable from "../../../components/Table/DataTable";\n','').replace('import { SquarePen, Trash2 }','import { SquarePen, Download }')
s=s.replace('import { toast } from "react-toastify";', 'import { toast } from "react-toastify";\nimport { TopicPortion, displayDate } from "./topicUi";\nimport "./manageTopicInstructor.css";')
s=s.replace('  instructor_id?: number;', '  instructor_id?: number;\n  instructor_ids?: number[];\n  portions?: TopicPortion[];')
s=s.replace('          instructor_id:        item.instructor_id,','          instructor_id:        item.instructor_id,\n          instructor_ids:       item.instructor_ids || [],\n          portions:             item.portions || [],')
s=s[:s.index('  // ── Table mutation helpers')]+'''
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
'''
s=s.replace('  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);\n','')
p.write_text(s,encoding='utf-8')
p=Path('topicService.ts');s=p.read_text(encoding='utf-8-sig').replace('schedules: (ScheduleInput & { schedule_id: number })[]) => request(`${base}/save_schedules`, "post", { mapping_id, schedules })','schedules: (ScheduleInput & { schedule_id: number })[], instructor_ids?: number[]) => request(`${base}/save_schedules`, "post", { mapping_id, schedules, ...(instructor_ids ? { instructor_ids } : {}) })');p.write_text(s,encoding='utf-8')
