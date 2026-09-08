export type SelectOption = { id: number; name: string };

export type CourseType = {
  course_type_id: number;
  name: string;
  alias: string;
  total: number;
  minimum_available: number;
  minimum?: number;
  maximum?: number;
  registered: number;
};

export type CourseRegistrationOverview = {
  credits_mode: boolean;
  header: Record<string, string | number | null>;
  course_types: CourseType[];
};

export type Course = {
  course_id: number;
  code: string;
  title: string;
  credits: number;
  student_limit: number | null;
  registered: number;
  reg_start_date: string | null;
  reg_end_date: string | null;
  course_type_name: string;
  course_type_alias: string;
};

export interface Department {
  dept_id: number;
  dept_name: string;
}

export interface Program {
  pgm_id: number;
  program_name: string;
}

export interface Curriculum {
  curriculum_id: number;
  curriculum_name: string;
}

export interface Term {
  semester_id: number;
  term_name: string;
}

export interface CourseStructure {
  course_type: string;
  total_credits: number;
  min_credits: number;
  max_credits: number;
  max_students?: number;
  students_registered: number;
}

export interface RegistrationSemester {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  min_credit: number;
  max_credit: number;
  own_elective: number;
  other_elective: number;
}

export interface RegistrationSetup {
  semester: RegistrationSemester;
  course_structure: CourseStructure[];
}

export interface CourseEnrollmentDetail {
  crs_id: number;
  crs_code: string;
  crs_title: string;
  total_credits: number;
  registered_count: number;
}

export interface EnrollmentDetails {
  semester_id: number;
  course_type: string;
  course_type_id: number;
  courses: CourseEnrollmentDetail[];
  total_courses: number;
  total_registered: number;
  total_credits: number;
}

export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

export interface CourseLimitInput {
  course_type: string;
  min_credits: number;
  max_credits: number;
  max_students: number;
}

export interface UpdateRegistrationSetupPayload {
  semester_id: number;
  min_credits: number;
  total_credits: number;
  own_curriculum_electives: number;
  other_curriculum_electives: number;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  course_limits: CourseLimitInput[];
}

export interface RegistrationSetupEndpoints {
  departments: string;
  programs: (departmentId: string | number) => string;
  curriculums: (programId: string | number) => string;
  terms: (curriculumId: string | number) => string;
  getSetup: (semesterId: string | number) => string;
  enrollmentDetails: (semesterId: string | number, courseType: string) => string;
  updateSetup: string;
  exportPdf: string;
}

