export interface DateTimeSlot {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export interface SubGroup {
  id: number;
  sub_group_id?: number;
  name: string;
  slots: DateTimeSlot[];
  locationUrl: string;
  menteeCount: number;
  menteeIds: number[];
}

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
}

export interface MentoringSession {
  schedule_id: number;
  curriculum_id: number;
  group_name: string;
  semester_id: number;
  questionnaire_id: number;
  session_agenda: string;
  sub_groups: {
    sub_group_id: number;
    sub_group_name: string;
    location: string;
    dates?: {
      start_date: string;
      end_date: string;
      start_time: string;
      end_time: string;
    }[];
  }[];
  mentor_names?: string[];
}

export const QUESTION_TYPES = [
  { id: 1, label: "Single Select" },
  { id: 2, label: "Multiple Select" },
  { id: 3, label: "Open Ended" }
];

export const QUESTIONNAIRE_CATEGORIES = [
  { id: 1, label: "Self-Assessment / Personal Questionnaire" },
  { id: 2, label: "Academic and Non Academic skills" }
];
