export interface DepartmentItem {
  dept_id: number;
  dept_name: string;
}

export interface ProgramItem {
  pgm_id: number;
  pgm_title: string;
  pgm_acronym: string;
}

export interface CurriculumItem {
  crclm_id: number;
  crclm_name: string;
}

export interface MenteeItem {
  student_id: number;
  student_name: string;
  student_usn: string;
  student_email: string;
}

export interface MentorMenteeRecord {
  group_mentor_id: number;
  mentor_id: number;
  mentor_name: string;
  mentor_email: string;
  mentor_dept: string;
  group_title: string;
  mentees: MenteeItem[];
}
