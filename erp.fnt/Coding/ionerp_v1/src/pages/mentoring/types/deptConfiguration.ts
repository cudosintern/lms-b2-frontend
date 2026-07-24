export interface DepartmentItem {
  dept_id: number;
  dept_name: string;
  dept_acronym: string;
}

export interface UserItem {
  user_id: number;
  name: string;
  email: string;
}

export interface CurriculumItem {
  crclm_id: number;
  crclm_name: string;
}

export interface CrossDeptMentorRecord {
  id: number;
  mentor_user_id: number;
  mentor_name: string;
  mentor_email: string;
  mentor_dept_id: number;
  mentor_dept_name: string;
  assigned_dept_id: number;
  assigned_dept_name: string;
  curriculum_id?: number | null;
  curriculum_name?: string | null;
}
