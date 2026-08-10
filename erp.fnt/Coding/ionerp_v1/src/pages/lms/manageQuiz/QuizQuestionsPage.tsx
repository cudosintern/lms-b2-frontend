import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useManageQuizService } from './manageQuizService';

import type { QuizDetails, QuizQuestion, QuizQuestionOption } from './quiz';

export default function QuizQuestionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const service = useManageQuizService();
  
  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  // const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  // const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<any[]>([]);
const [loading, setLoading] = useState(false);

const loadData = useCallback(async () => {
  if (!id) return;

  setLoading(true);

  try {
    // 1️⃣ Get quiz details
    const details = await service.getQuizDetails(Number(id));
    setQuizDetails(details);

    // 2️⃣ Get questions separately (IMPORTANT FIX)
    const questionsRes = await service.getQuizQuestions(Number(id));

    console.log("Questions API:", questionsRes);

    setQuestions(Array.isArray(questionsRes) ? questionsRes : []);

  } catch (error) {
    console.error("Failed to load quiz questions:", error);
  } finally {
    setLoading(true);
  }
}, [id, service]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="p-6 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f4e5f]"></div></div>;
  if (!quizDetails) return <div className="p-6">Quiz not found</div>;

  const { quiz } = quizDetails;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col max-w-6xl mx-auto">
        <div className="bg-[#1f4e5f] text-white px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold">View Quiz Questions</h1>
          <button onClick={() => navigate('/ems/manageQuiz')} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Quiz Info Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 mb-8 text-sm border-b pb-6 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-500 mb-1">Academic Batch:</p>
              <p className="font-semibold">{quiz.academic_batch_id}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Semester:</p>
              <p className="font-semibold">{quiz.semester_id}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Course:</p>
              <p className="font-semibold">{quiz.crs_id}</p>
            </div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 mb-8 text-sm border-b pb-6 bg-gray-50 p-4 rounded-lg">

  <div>
    <p className="text-gray-500 mb-1">Quiz Title:</p>
    <p className="font-semibold">{quiz.quiz_title}</p>
  </div>

  <div>
    <p className="text-gray-500 mb-1">Date:</p>
    <p className="font-semibold">{quiz.quiz_date || "—"}</p>
  </div>

  <div>
    <p className="text-gray-500 mb-1">Time:</p>
    <p className="font-semibold">{quiz.start_time || "—"}</p>
  </div>

  <div>
    <p className="text-gray-500 mb-1">Duration:</p>
    <p className="font-semibold">{quiz.duration} Mins.</p>
  </div>

  <div>
    <p className="text-gray-500 mb-1">Status:</p>
    <p className="font-semibold">{quiz.status}</p>
  </div>

  <div>
    <p className="text-gray-500 mb-1">Total Questions:</p>
    <p className="font-semibold">{questions.length}</p>
  </div>

</div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Questions ({questions.length})</h3>
            
            {questions.length > 0 ? (
              questions.map((q, idx) => (
                <div key={q.qq_id} className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <span className="bg-blue-100 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="font-medium text-gray-800 pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_text || q.question }} />
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                      Marks: {q.marks}
                    </span>
                  </div>

                  <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {q.options?.map((opt: QuizQuestionOption, oIdx: number) => (
                      <div 
                        key={oIdx} 
                        className={`p-3 rounded-md border text-sm flex items-center gap-3 ${opt.is_answer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-bold ${opt.is_answer ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt.option_value}</span>
                        {opt.is_answer && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider">Correct</span>}
                      </div>
                    ))}
                  </div>

                  <div className="ml-11 mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400">CLO:</span>
                      <span className="text-gray-700">{q.clo_ids?.[0] || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400">Bloom's:</span>
                      <span className="text-gray-700">{q.bloom_ids?.[0] || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                No questions added to this quiz yet.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            onClick={() => navigate('/ems/manageQuiz')}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

