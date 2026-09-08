export interface QuizQuestionOption {
  option_value: string;
  is_answer: number | boolean;
}

export interface MetaOption {
  id: number | string;
  name?: string;
  code?: string;
  semester_desc?: string;
  crs_title?: string;
  crs_code?: string;
  section?: string;
  topic_title?: string;
  topic_code?: string;
  academic_batch_id?: number;
  semester_id?: number;
  crs_id?: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  academic_year?: string;
  semester?: string;
}

export interface Quiz {
  quiz_id: number;
  quiz_title: string;
  quiz_instruction?: string;
  quiz_description?: string;
  academic_batch_id: number;
  semester_id: number;
  crs_id: number;
  quiz_date?: string;
  quiz_time?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  duration: string;
  file_name?: string;
  file_path?: string;
  marks_flag: number;
  co_map_flag: number;
  bl_map_flag: number;
  practice_quiz: number;
  shuffle_questions: number;
  shuffle_options: number;
  answer_key_share_flag: number;
  status: number;
  created_by: number;
  created_date?: string;
  question_count: number;
  student_count: number;
  started_count: number;
  answer_count: number;
  total_marks: number;
  section_names?: string;
  topic_names?: string;
}

export interface QuizQuestion {
  qq_id: number;
  quiz_id: number;
  question: string;
  question_text: string;
  question_type: number;
  marks: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  options: QuizQuestionOption[];
  clo_id?: string | number;
  bloom_id?: string | number;
  clo_ids: number[];
  bloom_ids: number[];
}

export interface QuizDetails {
  quiz: Quiz;
  section_ids: number[];
  topic_ids: number[];
  questions: QuizQuestion[];
  students: any[];
  started_count: number;
  answers_count: number;
  is_edit_blocked: boolean;
}

export interface QuizStudent {
  quiz_student_map_id: number;
  quiz_id: number;
  ssd_id: number;
  student_id: number;   // ✅ ADD THIS
  student_usn?: string;
  student_name?: string;

  // fallback (in case backend sends different keys)
  usn?: string;
  name?: string;
  answer_count: number;
}

export interface CreateQuizPayload {
  quiz_title: string;
  quiz_instruction?: string;
  quiz_description?: string;
  academic_batch_id: number;
  semester_id: number;
  crs_id: number;
  quiz_date?: string;
  quiz_time?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  duration: string;
  file_name?: string;
  file_path?: string;
  marks_flag: number;
  co_map_flag: number;
  bl_map_flag: number;
  practice_quiz: number;
  shuffle_questions: number;
  shuffle_options: number;
  answer_key_share_flag: number;
  status: number;
  created_by: number;
  section_ids: number[];
  topic_ids: number[];
}

