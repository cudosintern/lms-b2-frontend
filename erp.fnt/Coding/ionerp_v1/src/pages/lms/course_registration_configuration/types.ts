export interface Option { id: number; name: string }
export interface Options {
  enabled: boolean;
  mode: "courses" | "credits";
  departments: Option[];
  programs: (Option & { department_id: number })[];
  curricula: (Option & { department_id: number; program_id: number })[];
}
export interface TypeSummary {
  course_type_id: number; name: string; alias: string; total: number;
  minimum_allowed: number; minimum: number | null; maximum: number | null;
  registered: number; max_registered: number;
}
export interface Summary {
  academic_batch_id: number; semester_id: number; curriculum_name: string; term_name: string;
  mode: "courses" | "credits"; saved: boolean; total_available: number; max_registered: number;
  start: string | null; end: string | null; total: number | null;
  own_electives: number; other_electives: number; types: TypeSummary[];
}
export interface Course {
  course_id: number; code: string; title: string; credits: number; registered: number;
  capacity: number | null; start: string | null; end: string | null; alias: string;
}
export interface ConfigurationInput {
  start: string; end: string; total: number; own_electives: number; other_electives: number;
  limits: { course_type_id: number; minimum: number; maximum: number }[];
}
