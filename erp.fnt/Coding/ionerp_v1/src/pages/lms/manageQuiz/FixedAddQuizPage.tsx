import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";

interface FixedAddQuizPageProps {
  initialBatchId?: number;
  initialSemesterId?: number;
  initialCourseId?: number;

  // ✅ NEW (safe optional labels)
  batchLabel?: string;
  semesterLabel?: string;
  courseLabel?: string;

  editQuizId?: number;
  editData?: any;

  onSuccess?: () => void;
  onCancel?: () => void;
}

const API = '/api/v1/manage_quiz';

const FixedAddQuizPage: React.FC<FixedAddQuizPageProps> = ({
  initialBatchId,
  initialSemesterId,
  initialCourseId,
  batchLabel,
  semesterLabel,
  courseLabel,
  onSuccess,
  onCancel
}) => {
  const userId = 1;

  // Form fields
  const [quizTitle, setQuizTitle] = useState('');
  const [batchId, setBatchId] = useState(initialBatchId || 0);
  const [semesterId, setSemesterId] = useState(initialSemesterId || 0);
  const [courseId, setCourseId] = useState(initialCourseId || 0);
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [coMap, setCoMap] = useState(false);
  const [blMap, setBlMap] = useState(false);
  const [shuffleQ, setShuffleQ] = useState(false);
  const [shuffleO, setShuffleO] = useState(false);
  const [practiceQuiz, setPracticeQuiz] = useState(false);
  const [shareAnswerKey, setShareAnswerKey] = useState(false);

  const [quizDate, setQuizDate] = useState("");
const [quizTime, setQuizTime] = useState("");
const [hours, setHours] = useState(0);
const [minutes, setMinutes] = useState(0);
const [displayDate, setDisplayDate] = useState("");
const [displayTime, setDisplayTime] = useState("");
const [instructions, setInstructions] = useState("");
const [description, setDescription] = useState("");

  // Dropdown data
  const [batches, setBatches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  // Loading states
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [saving, setSaving] = useState(false);

  // Use ref to prevent double-fetch in StrictMode
  const batchesFetched = useRef(false);

  // Load batches once on mount
  useEffect(() => {
    if (batchesFetched.current) return;
    batchesFetched.current = true;
    setLoadingBatches(true);
    axiosInstance.get(`${API}/meta/curriculums`)
      .then((r: any) => setBatches(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {})
      .then(() => setLoadingBatches(false), () => setLoadingBatches(false));
  }, []);

  // Load semesters when batch changes
  useEffect(() => {
    if (!batchId) { setSemesters([]); setSemesterId(0); return; }
    setLoadingSemesters(true);
    axiosInstance.get(`${API}/meta/terms`, { params: { academic_batch_id: batchId } })
      .then((r: any) => { setSemesters(Array.isArray(r.data?.data) ? r.data.data : []); setSemesterId(initialSemesterId || 0); })
      .catch(() => setSemesters([]))
      .then(() => setLoadingSemesters(false), () => setLoadingSemesters(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  // Load courses + sections when semester changes
  useEffect(() => {
    if (!batchId || !semesterId) { setCourses([]); setCourseId(0); setSections([]); setSectionIds([]); return; }
    setLoadingCourses(true);
    setLoadingSections(true);
    axiosInstance.get(`${API}/meta/courses`, { params: { academic_batch_id: batchId, semester_id: semesterId } })
      .then((r: any) => { setCourses(Array.isArray(r.data?.data) ? r.data.data : []); setCourseId(initialCourseId || 0); })
      .catch(() => setCourses([]))
      .then(() => setLoadingCourses(false), () => setLoadingCourses(false));
    axiosInstance.get(`${API}/meta/sections`, { params: { academic_batch_id: batchId, semester_id: semesterId } })
      .then((r: any) => { setSections(Array.isArray(r.data?.data) ? r.data.data : []); setSectionIds([]); })
      .catch(() => setSections([]))
      .then(() => setLoadingSections(false), () => setLoadingSections(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, semesterId]);

  // Load topics when course changes
  useEffect(() => {
    if (!batchId || !semesterId || !courseId) { setTopics([]); setTopicIds([]); return; }
    setLoadingTopics(true);
    axiosInstance.get(`${API}/meta/topics`, { params: { academic_batch_id: batchId, semester_id: semesterId, crs_id: courseId } })
      .then((r: any) => { setTopics(Array.isArray(r.data?.data) ? r.data.data : []); setTopicIds([]); })
      .catch(() => setTopics([]))
      .then(() => setLoadingTopics(false), () => setLoadingTopics(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, semesterId, courseId]);

  
  const handleSubmit = async () => {
  const finalDuration = hours * 60 + minutes;

  if (!quizTitle.trim()) {
    toast.warning('Quiz Title is required');
    return;
  }

  if (finalDuration <= 0) {
    toast.warning('Duration must be greater than 0');
    return;
  }

  if (!batchId || !semesterId || !courseId) {
    toast.warning('Please select Batch, Semester, and Course');
    return;
  }

  setSaving(true);

  try {
    await axiosInstance.post(`${API}/create`, {
      quiz_title: quizTitle.trim(),

      academic_batch_id: batchId,
      semester_id: semesterId,
      crs_id: courseId,

      quiz_date: quizDate,
      quiz_time: quizTime || null,

      duration: String(finalDuration),

      section_ids: sectionIds,
      topic_ids: topicIds,

      display_date: displayDate || quizDate,
      display_time: displayTime || quizTime,

      quiz_instruction: instructions || "",
      quiz_description: description || "",

      co_map_flag: coMap ? 1 : 0,
      bl_map_flag: blMap ? 1 : 0,
      shuffle_questions: shuffleQ ? 1 : 0,
      shuffle_options: shuffleO ? 1 : 0,
      practice_quiz: practiceQuiz ? 1 : 0,
      answer_key_share_flag: shareAnswerKey ? 1 : 0,

      marks_flag: 0,
      status: 1,
      created_by: userId
    });

    toast.success('Quiz created successfully!');
    if (onSuccess) onSuccess();

  } catch (err: any) {
    toast.error(`Failed: ${err?.response?.data?.detail || err?.message || 'Unknown error'}`);
  } finally {
    setSaving(false);
  }
};

  const selCls = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 bg-white text-gray-800";
  const lblCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-5">
      {/* Header */}
      <div className="bg-[#1f4e5f] text-white px-4 py-2.5 rounded-t-lg font-semibold text-sm flex justify-between items-center">
        <span>Create New Quiz</span>
        <button 
  onClick={() => onCancel && onCancel()} 
  className="text-white text-lg"
>
  &times;
</button>
      </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
  <div><strong>Curriculum:</strong> {batchLabel}</div>
  <div><strong>Semester:</strong> {semesterLabel}</div>
  <div><strong>Course:</strong> {courseLabel}</div>
</div>

      <div className="border border-gray-200 rounded-b-lg bg-white p-5">
        <div className="grid grid-cols-3 gap-4">
          {/* Quiz Title */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
  <div style={{ flex: 2 }}>
    <label>Quiz Title *</label>
    <input
      type="text"
      value={quizTitle}
      onChange={(e) => setQuizTitle(e.target.value)}
      style={{ width: "100%", padding: "8px", border: "1px solid #ccc" }}
    />
  </div>

  <div style={{ flex: 1 }}>
    <label>Date of Hosting *</label>
    <input
      type="date"
      value={quizDate}
      onChange={(e) => setQuizDate(e.target.value)}
      style={{ width: "100%", padding: "8px", border: "1px solid #ccc" }}
    />
  </div>
</div>

<div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
  <div>
    <label>Quiz Time *</label>
    <input
      type="time"
      value={quizTime}
      onChange={(e) => setQuizTime(e.target.value)}
      style={{ padding: "8px", border: "1px solid #ccc" }}
    />
  </div>

  <div>
    <label>Duration *</label>
    <div style={{ display: "flex", gap: "10px" }}>
      <select
  value={hours}
  onChange={(e) => setHours(Number(e.target.value))}
>
  {[0, 1, 2, 3].map((h) => (
    <option key={h} value={h}>
      {h} HH
    </option>
  ))}
</select>

      <select
  value={minutes}
  onChange={(e) => setMinutes(Number(e.target.value))}
>
  {[0, 15, 30, 45].map((m) => (
    <option key={m} value={m}>
      {m} MM
    </option>
  ))}
</select>
    </div>
  </div>
</div>

      

          {/* Sections (multi) */}
          <div className="col-span-2">
            <label className={lblCls}>Sections {loadingSections && <span className="text-blue-500">⟳</span>}</label>
            <select
              multiple
              className={`${selCls} h-28`}
              value={sectionIds.map(String)}
              onChange={e => setSectionIds(Array.from(e.target.selectedOptions, o => Number(o.value)))}
              disabled={!semesterId || loadingSections}
            >
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>{s.section}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{sectionIds.length} selected (Hold Ctrl/Cmd to select multiple)</p>
          </div>

          {/* Spacer */}
          <div />

          {/* Topics (multi) */}
          <div className="col-span-3">
            <label className={lblCls}>Topics {loadingTopics && <span className="text-blue-500">⟳</span>}</label>
            <select
              multiple
              className={`${selCls} h-28`}
              value={topicIds.map(String)}
              onChange={e => setTopicIds(Array.from(e.target.selectedOptions, o => Number(o.value)))}
              disabled={!courseId || loadingTopics}
            >
              {topics.map(t => (
                <option key={t.topic_id} value={t.topic_id}>{t.topic_title} ({t.topic_code})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{topicIds.length} selected (Hold Ctrl/Cmd to select multiple)</p>
          </div>

          {/* Display Quiz At */}
<div className="form-group">
  <label>Display quiz at</label>
  <input
    type="date"
    value={displayDate}
    onChange={(e) => setDisplayDate(e.target.value)}
  />
  <input
    type="time"
    value={displayTime}
    onChange={(e) => setDisplayTime(e.target.value)}
  />
</div>

{/* Instructions */}
<div className="form-group">
  <label>Quiz Instructions</label>
  <textarea
  value={instructions}
  onChange={(e) => setInstructions(e.target.value)}
  style={{
    width: "100%",
    minHeight: "80px",
    border: "1px solid #ccc",
    padding: "8px",
    borderRadius: "4px"
  }}
/>
</div>

{/* Additional Info */}
<div className="form-group">
  <label>Additional Information</label>
  <textarea
    style={{
      width: "100%",
      minHeight: "80px",
      border: "1px solid #ccc",
      padding: "8px",
      borderRadius: "4px"
    }}
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>

{/* File Upload */}
<div className="form-group">
  <label>Choose File</label>
  <input type="file" />
</div>

          {/* Checkboxes */}
          <div className="col-span-3 grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded border border-gray-100">
            {[
              ['CO Mapping', coMap, setCoMap],
              ["Bloom's Mapping", blMap, setBlMap],
              ['Shuffle Questions', shuffleQ, setShuffleQ],
              ['Shuffle Options', shuffleO, setShuffleO],
              ['Practice Quiz', practiceQuiz, setPracticeQuiz],
              ['Share Answer Key', shareAnswerKey, setShareAnswerKey],
            ].map(([label, val, setter]: any) => (
              <label key={label as string} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="accent-[#1f4e5f]" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2"
          >
            {saving ? <><span className="animate-spin">⟳</span> Creating...</> : 'Create Quiz'}
          </button>
          <button
  onClick={() => onCancel && onCancel()}
  className="bg-gray-400 text-white px-4 py-2 rounded"
>
  Cancel
</button>
        </div>
      </div>
    </div>
  );
};

export default FixedAddQuizPage;