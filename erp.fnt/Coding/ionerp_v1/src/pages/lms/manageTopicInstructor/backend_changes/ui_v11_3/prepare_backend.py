from pathlib import Path
root=Path('backend_changes/ui_v11_3')
p=root/'topic_routes.py';s=p.read_text(encoding='utf-8-sig')
s=s.replace("            'lesson_schedule': ', '.join(p.portion_per_hour for p in ps if p.portion_per_hour),", "            'lesson_schedule': ', '.join(p.portion_per_hour for p in ps if p.portion_per_hour),\n            'portions': [serialize_portion(p, n) for n, p in enumerate(ps, 1)],")
a=s.index("    return success([{'topic_id': t.topic_id",s.index('def cudos_topics'));b=s.index("\n@router.post('/assign_topics')",a)
s=s[:a]+'''    owner = db.query(CudosMapCoursetoCourseInstructor).filter_by(
        academic_batch_id=request.academic_batch_id, semester_id=request.semester_id,
        crs_id=request.course_id, section_id=request.section_id).filter(
        CudosMapCoursetoCourseInstructor.course_instructor_id.isnot(None)).order_by(
        CudosMapCoursetoCourseInstructor.mcci_id).first()
    result = []
    for topic in topic_query(db, request).all():
        if bool(topic.category_id) != bool(section.parent_id):
            continue
        mapped = mapping_query(db, request).filter_by(topic_id=topic.topic_id).all()
        has_portions = bool(db.query(LMSMapPortionLS.portion_id).filter_by(
            topic_id=topic.topic_id, section_id=request.section_id).first())
        if not has_portions:
            has_portions = bool(db.query(CudosTopicLessonSchedule.lesson_schedule_id).filter_by(
                topic_id=topic.topic_id, academic_batch_id=request.academic_batch_id,
                crs_id=request.course_id).first())
        if not has_portions:
            has_portions = bool(db.execute(text("""SELECT lesson_schedule_id FROM topic_lesson_schedule
                WHERE topic_id=:topic AND academic_batch_id=:batch AND course_id=:course LIMIT 1"""),
                {'topic': topic.topic_id, 'batch': request.academic_batch_id, 'course': request.course_id}).first())
        result.append({'topic_id': topic.topic_id, 'topic_code': topic.topic_code,
            'topic_title': topic.topic_title, 'topic_hrs': topic.topic_hrs,
            'num_of_sessions': topic.num_of_sessions, 'has_portions': has_portions,
            'instructor_ids': [m.instructor_id for m in mapped if m.instructor_id],
            'default_instructor_id': owner.course_instructor_id if owner else None})
    return success(result)
''' + s[b:]
s=s.replace('        existing = {p.portion_id: p for p in portions(db, mapping)}','''        if request.instructor_ids is not None:
            assign(db, AssignTopicsRequest(**context_for(mapping).model_dump(), assignments=[
                TopicAssignment(topic_id=mapping.topic_id, instructor_ids=request.instructor_ids)]), actor(user))
        existing = {p.portion_id: p for p in portions(db, mapping)}''')
p.write_text(s,encoding='utf-8')
p=root/'topic_schema.py';s=p.read_text(encoding='utf-8-sig').replace('    schedules: List[SavedSchedule]','    schedules: List[SavedSchedule]\n    instructor_ids: Optional[List[int]] = Field(default=None, min_length=1, max_length=3)');p.write_text(s,encoding='utf-8')
p=root/'TimetableCalendarPage.tsx.snapshot';s=p.read_text(encoding='utf-8-sig')
s=s.replace('useCallback }','useCallback, useRef }',1)
s=s.replace('import axiosInstance', 'import { readTopicCalendarRequest } from "../manageTopicInstructor/topicUi";\nimport axiosInstance',1)
s=s.replace('  const today = new Date();','''  const topicHandoff = useRef(readTopicCalendarRequest(window.location.search));
  const openExtraRequested = useRef(new URLSearchParams(window.location.search).get("open_extra_class") === "true");
  const today = new Date();''',1)
s=s.replace('const [selectedBatch, setSelectedBatch] = useState("");','const [selectedBatch, setSelectedBatch] = useState(() => topicHandoff.current?.batch || "");')
s=s.replace('setTerms(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedTerm("");','''const rows = Array.isArray(r.data?.data) ? r.data.data : []; setTerms(rows);
        const requested = topicHandoff.current;
        setSelectedTerm(requested?.batch === selectedBatch && rows.some((term: Term) => String(term.semester_id) === requested.term) ? requested.term : "");''')
s=s.replace('setCourses(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedCourse("");','''const rows = Array.isArray(r.data?.data) ? r.data.data : []; setCourses(rows);
        const requested = topicHandoff.current;
        setSelectedCourse(requested?.batch === selectedBatch && requested.term === selectedTerm && rows.some((course: Course) => String(course.crs_id) === requested.course) ? requested.course : "");''')
s=s.replace('        if (!cancelled) setSections(sectionOptions);','''        if (!cancelled) {
          setSections(sectionOptions);
          const requested = topicHandoff.current;
          setSelectedSection(requested?.batch === selectedBatch && requested.term === selectedTerm && requested.course === selectedCourse && sectionOptions.some(section => String(section.section_id) === requested.section) ? requested.section : "");
        }''')
s=s.replace('        if (!cancelled) setSections([]);','        if (!cancelled) { setSections([]); setSelectedSection(""); }')
s=s.replace('          setSelectedSection("");\n          setLoadingSection(false);','          setLoadingSection(false);')
marker='  const fetchClasses = useCallback(async () => {'
s=s.replace(marker,'''  // Complete the topic editor handoff only after the dependent dropdowns load.
  useEffect(() => {
    if (!openExtraRequested.current || loadingBatch || loadingTerm || loadingCourse || loadingSection) return;
    if (!selectedBatch || !selectedTerm || !selectedCourse || !selectedSection) return;
    const requested = topicHandoff.current;
    if (requested && (requested.batch !== selectedBatch || requested.term !== selectedTerm || requested.course !== selectedCourse || requested.section !== selectedSection)) return;
    if (!sections.some(section => String(section.section_id) === selectedSection)) return;
    openExtraRequested.current = false;
    topicHandoff.current = null;
    setShowExtraClass(true);
  }, [selectedBatch, selectedTerm, selectedCourse, selectedSection, sections, loadingBatch, loadingTerm, loadingCourse, loadingSection]);

'''+marker)
p.write_text(s,encoding='utf-8')

