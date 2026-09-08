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
  students_registered: number;
  max_students?: number;
}

export interface Course {
  crs_id: number;
  crs_code: string;
  crs_title: string;
  total_credits: number;
  registered_count: number;
}

export interface SemesterRegistration {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  min_credit: number;
  max_credit: number;
  own_elective: number;
  other_elective: number;
}

export interface EnrollResponse {
  semester_id: number;
  course_type: string;
  course_type_id: number;
  courses: Course[];
  total_courses: number;
  total_registered: number;
  total_credits: number;
}

export interface RegistrationSetupResponse {
  status: boolean;
  data: {
    semester: SemesterRegistration;
    course_structure: CourseStructure[];
  };
  message?: string;
}

export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

export interface RegistrationUpdatePayload {
  semester_id: number;
  min_credits: number;
  total_credits: number;
  own_curriculum_electives: number;
  other_curriculum_electives: number;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  course_limits: Array<{
    course_type: string;
    min_credits: number;
    max_credits: number;
    max_students: number;
  }>;
}
