import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";

interface FixedAddQuizPageProps {
  initialBatchId?: number;
  initialSemesterId?: number;
  initialCourseId?: number;
  selectedCurriculum?: any;
  selectedTermData?: any;
  selectedCourseData?: any;
  editQuizId?: number;
  editData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const API = '/api/v1/manage-quiz';

const FixedAddQuizPage: React.FC<FixedAddQuizPageProps> = ({
  initialBatchId,
  initialSemesterId,
  initialCourseId,
  selectedCurriculum,
  selectedTermData,
  selectedCourseData,
  editQuizId,
  editData,
  onSuccess,
  onCancel
}) => {
  const userId = 1;
  const [isEdit, setIsEdit] = useState(false);

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

  const batchesFetched = useRef(false);

  // Load batches once on mount
  useEffect(() => {
    if (batchesFetched.current) return;
    batchesFetched.current = true;
    setLoadingBatches(true);
    axiosInstance.get(`${API}/meta/curriculums`)
      .then((r: any) => {
        setBatches(Array.isArray(r.data?.data) ? r.data.data : []);
        setLoadingBatches(false);
      })
      .catch(() => {
        setLoadingBatches(false);
      });
  }, []);

  // Load semesters when batch changes
  useEffect(() => {
    if (!batchId) { 
      setSemesters([]); 
      setSemesterId(0); 
      return; 
    }
    setLoadingSemesters(true);
    axiosInstance.get(`${API}/meta/terms`, { params: { academic_batch_id: batchId } })
      .then((r: any) => {
        setSemesters(Array.isArray(r.data?.data) ? r.data.data : []);
        setLoadingSemesters(false);
      })
      .catch(() => {
        setSemesters([]);
        setLoadingSemesters(false);
      });
  }, [batchId]);

  // Load courses when semester changes
  useEffect(() => {
    if (!batchId || !semesterId) { 
      setCourses([]); 
      setCourseId(0); 
      setSections([]); 
      setSectionIds([]); 
      return; 
    }
    setLoadingCourses(true);
    axiosInstance.get(`${API}/meta/courses`, { params: { academic_batch_id: batchId, semester_id: semesterId } })
      .then((r: any) => {
        setCourses(Array.isArray(r.data?.data) ? r.data.data : []);
        setLoadingCourses(false);
      })
      .catch(() => {
        setCourses([]);
        setLoadingCourses(false);
      });
  }, [batchId, semesterId]);

  // Load sections when course changes
  useEffect(() => {
    if (!batchId || !semesterId || !courseId) { 
      setSections([]); 
      setSectionIds([]); 
      return; 
    }
    setLoadingSections(true);
    axiosInstance.get(`${API}/meta/sections`, { 
      params: { 
        academic_batch_id: batchId, 
        semester_id: semesterId,
        course_id: courseId
      } 
    })
      .then((r: any) => {
        let sectionsData = r.data?.data || r.data || [];
        if (!Array.isArray(sectionsData)) {
          sectionsData = sectionsData?.items || sectionsData?.sections || [];
        }
        if (!Array.isArray(sectionsData)) {
          sectionsData = [];
        }
        setSections(sectionsData);
        setLoadingSections(false);
      })
      .catch(() => {
        setSections([]);
        setLoadingSections(false);
      });
  }, [batchId, semesterId, courseId]);

  // Load topics when course changes
  useEffect(() => {
    if (!batchId || !semesterId || !courseId) { 
      setTopics([]); 
      setTopicIds([]); 
      return; 
    }
    setLoadingTopics(true);
    axiosInstance.get(`${API}/meta/topics`, { 
      params: { 
        academic_batch_id: batchId, 
        semester_id: semesterId, 
        crs_id: courseId
      } 
    })
      .then((r: any) => {
        const topicsData = r.data?.data || r.data || [];
        setTopics(Array.isArray(topicsData) ? topicsData : []);
        setLoadingTopics(false);
      })
      .catch(() => {
        setTopics([]);
        setLoadingTopics(false);
      });
  }, [batchId, semesterId, courseId]);

  // ✅ Load edit data if in edit mode
  useEffect(() => {
    console.log('🔍 Edit mode check:', { editQuizId, editData });
    
    if (editQuizId && editData) {
      console.log('📝 Loading edit data:', editData);
      setIsEdit(true);
      
      // Extract quiz data
      const quiz = editData.quiz || editData;
      console.log('📝 Quiz data:', quiz);
      
      // Set form fields from edit data
      setQuizTitle(quiz.quiz_title || '');
      setBatchId(quiz.academic_batch_id || initialBatchId || 0);
      setSemesterId(quiz.semester_id || initialSemesterId || 0);
      setCourseId(quiz.crs_id || initialCourseId || 0);
      setQuizDate(quiz.quiz_date || '');
      setQuizTime(quiz.quiz_time || '');
      setInstructions(quiz.quiz_instruction || '');
      setDescription(quiz.quiz_description || '');
      setDisplayDate(quiz.show_date || '');
      setDisplayTime(quiz.show_time || '');
      
      // Set checkboxes
      setCoMap(quiz.co_map_flag === 1);
      setBlMap(quiz.bl_map_flag === 1);
      setShuffleQ(quiz.shuffle_questions === 1);
      setShuffleO(quiz.shuffle_options === 1);
      setPracticeQuiz(quiz.practice_quiz === 1);
      setShareAnswerKey(quiz.answer_key_share_flag === 1);
      
      // ✅ Set section and topic IDs from edit data
      const sectionIdsFromEdit = editData.section_ids || [];
      const topicIdsFromEdit = editData.topic_ids || [];
      
      console.log('📝 Section IDs from edit:', sectionIdsFromEdit);
      console.log('📝 Topic IDs from edit:', topicIdsFromEdit);
      
      setSectionIds(sectionIdsFromEdit);
      setTopicIds(topicIdsFromEdit);
      
      // Parse duration into hours and minutes
      const durationStr = quiz.duration || '';
      if (durationStr) {
        const durationMinutes = parseInt(durationStr);
        if (!isNaN(durationMinutes)) {
          setHours(Math.floor(durationMinutes / 60));
          setMinutes(durationMinutes % 60);
        }
      }
    } else {
      // Reset to default values when not in edit mode
      setIsEdit(false);
      setBatchId(initialBatchId || 0);
      setSemesterId(initialSemesterId || 0);
      setCourseId(initialCourseId || 0);
    }
  }, [editQuizId, editData, initialBatchId, initialSemesterId, initialCourseId]);

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
      const payload: any = {
        quiz_title: quizTitle.trim(),
        academic_batch_id: batchId,
        semester_id: semesterId,
        crs_id: courseId,
        quiz_date: quizDate,
        quiz_time: quizTime || null,
        duration: String(finalDuration),
        section_ids: sectionIds,
        topic_ids: topicIds,
        show_date: displayDate || quizDate,
        show_time: displayTime || quizTime,
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
      };

      console.log('📤 Submitting payload:', payload);

      if (isEdit && editQuizId) {
        // Update existing quiz
        payload.modified_by = userId;
        await axiosInstance.put(`${API}/${editQuizId}`, payload);
        toast.success('Quiz updated successfully!');
      } else {
        // Create new quiz
        await axiosInstance.post(`${API}/create`, payload);
        toast.success('Quiz created successfully!');
      }

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('❌ Error:', err);
      toast.error(`Failed: ${err?.response?.data?.detail || err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const selCls = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 bg-white text-gray-800";
  const lblCls = "block text-sm font-medium text-gray-700 mb-1";

  // Get display labels
  const getBatchLabel = () => {
    if (selectedCurriculum) {
      return selectedCurriculum.academic_batch_desc || selectedCurriculum.label || selectedCurriculum.name || String(initialBatchId);
    }
    const found = batches.find(b => Number(b.academic_batch_id) === Number(initialBatchId));
    return found?.academic_batch_desc || found?.label || found?.name || String(initialBatchId);
  };

  const getSemesterLabel = () => {
    if (selectedTermData) {
      return selectedTermData.semester_desc || selectedTermData.label || `Semester ${selectedTermData.semester}` || String(initialSemesterId);
    }
    const found = semesters.find(s => Number(s.semester_id) === Number(initialSemesterId));
    return found?.semester_desc || found?.label || `Semester ${found?.semester}` || String(initialSemesterId);
  };

  const getCourseLabel = () => {
    if (selectedCourseData) {
      return selectedCourseData.crs_title || selectedCourseData.label || selectedCourseData.name || String(initialCourseId);
    }
    const found = courses.find(c => Number(c.crs_id) === Number(initialCourseId));
    return found?.crs_title || found?.label || found?.name || String(initialCourseId);
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="bg-[#1f4e5f] text-white px-4 py-2.5 rounded-t-lg font-semibold text-sm flex justify-between items-center">
        <span>{isEdit ? 'Edit Quiz' : 'Create New Quiz'}</span>
        <button 
          onClick={() => onCancel && onCancel()} 
          className="text-white text-lg"
        >
          &times;
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm p-3 bg-gray-50 rounded border">
        <div><strong>Curriculum:</strong> <span className="font-medium ml-1">{getBatchLabel()}</span></div>
        <div><strong>Semester:</strong> <span className="font-medium ml-1">{getSemesterLabel()}</span></div>
        <div><strong>Course:</strong> <span className="font-medium ml-1">{getCourseLabel()}</span></div>
      </div>

      <div className="border border-gray-200 rounded-b-lg bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Hosting *</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={quizDate}
              onChange={(e) => setQuizDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Time *</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={quizTime}
              onChange={(e) => setQuizTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
            <div className="flex gap-2">
              <select
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((h) => (
                  <option key={h} value={h}>{h} HH</option>
                ))}
              </select>
              <select
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m} MM</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-4">
          <label className={lblCls}>
            Sections {loadingSections && <span className="text-blue-500">⟳ Loading...</span>}
          </label>
          {loadingSections ? (
            <div className="text-sm text-gray-500 py-2">Loading sections...</div>
          ) : sections.length > 0 ? (
            <>
              <select
                multiple
                className={`${selCls} h-32`}
                value={sectionIds.map(String)}
                onChange={e => setSectionIds(Array.from(e.target.selectedOptions, o => Number(o.value)))}
                disabled={!courseId || loadingSections}
              >
                {sections.map((s: any) => (
                  <option key={s.section_id || s.id || s.value} value={s.section_id || s.id || s.value}>
                    {s.section || s.label || s.name || `Section ${s.section_id || s.id || s.value}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {sectionIds.length} selected (Hold Ctrl/Cmd to select multiple)
              </p>
            </>
          ) : (
            <div className="text-sm text-gray-400 py-2">No sections available for this course</div>
          )}
        </div>

        {/* Topics */}
        <div className="mb-4">
          <label className={lblCls}>
            Topics {loadingTopics && <span className="text-blue-500">⟳ Loading...</span>}
          </label>
          {loadingTopics ? (
            <div className="text-sm text-gray-500 py-2">Loading topics...</div>
          ) : topics.length > 0 ? (
            <>
              <select
                multiple
                className={`${selCls} h-32`}
                value={topicIds.map(String)}
                onChange={e => setTopicIds(Array.from(e.target.selectedOptions, o => Number(o.value)))}
                disabled={!courseId || loadingTopics}
              >
                {topics.map((t: any) => (
                  <option key={t.topic_id || t.id || t.value} value={t.topic_id || t.id || t.value}>
                    {t.topic_title || t.label || t.name || `Topic ${t.topic_id || t.id || t.value}`}
                    {t.topic_code && ` (${t.topic_code})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {topicIds.length} selected (Hold Ctrl/Cmd to select multiple)
              </p>
            </>
          ) : (
            <div className="text-sm text-gray-400 py-2">No topics available for this course</div>
          )}
        </div>

        {/* Display Quiz At */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display quiz at</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={displayDate}
              onChange={(e) => setDisplayDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display time</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={displayTime}
              onChange={(e) => setDisplayTime(e.target.value)}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Instructions</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter quiz instructions..."
          />
        </div>

        {/* Additional Info */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter additional information..."
          />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Choose File</label>
          <input
            type="file"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Checkboxes */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded border border-gray-100">
          {[
            ['CO Mapping', coMap, setCoMap],
            ["Bloom's Mapping", blMap, setBlMap],
            ['Shuffle Questions', shuffleQ, setShuffleQ],
            ['Shuffle Options', shuffleO, setShuffleO],
            ['Practice Quiz', practiceQuiz, setPracticeQuiz],
            ['Share Answer Key', shareAnswerKey, setShareAnswerKey],
          ].map(([label, val, setter]: any) => (
            <label key={label as string} className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={val} 
                onChange={e => setter(e.target.checked)} 
                className="accent-[#1f4e5f]" 
              />
              {label}
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2"
          >
            {saving ? <><span className="animate-spin">⟳</span> {isEdit ? 'Updating...' : 'Creating...'}</> : isEdit ? 'Update Quiz' : 'Create Quiz'}
          </button>
          <button
            onClick={() => onCancel && onCancel()}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixedAddQuizPage;