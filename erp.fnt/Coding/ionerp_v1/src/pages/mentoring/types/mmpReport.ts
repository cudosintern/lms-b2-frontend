export interface CurriculumItem {
  curriculum_id: number;
  curriculum_code: string;
  curriculum_desc: string;
}

export interface SemesterItem {
  semester_id: number;
  semester: number;
  semester_desc: string;
}

export interface GroupItem {
  mentors_group_id: number;
  mentors_pgm_title: string;
  questionnaire_id: number;
  mentors: any[];
}

export interface MenteeItem {
  student_id: number;
  student_name: string;
  student_usn?: string;
  student_email?: string;
}

export interface SessionData {
  schedule_id: number;
  curriculum_id: number;
  group_name: string;
  semester_id: number;
  questionnaire_id: number;
  session_agenda: string;
  sub_groups: {
    sub_group_name: string;
    location: string;
    dates?: {
      start_date: string;
      end_date: string;
      start_time: string;
      end_time: string;
    }[];
  }[];
}

export interface QuestionnaireAnswer {
  questionnaire_que_id: number;
  question_text: string;
  text_answer: string;
  selected_options: {
    questionnaire_options_id: number;
    specification: string;
  }[];
}

export interface StudentSessionReport {
  session: SessionData;
  response: {
    submitted_at: string;
    answers: QuestionnaireAnswer[];
  } | null;
  comments: {
    sender_name: string;
    comment: string;
    created_date: string;
  }[];
}
