export interface CurriculumOption {
  id: number;
  name: string;
}

export interface TermOption {
  id: number;
  name: string;
}

export interface CourseItem {
  course_id: number;
  course_code: string;
  course_title: string;
  instructor: string;
  section: string;
  section_id: number;
  status: "LS not added" | "Not started" | "In-progress" | "Completed";
  color: "blue" | "red" | "orange" | "green";
}

export interface SectionGroup {
  section_id: number;
  section: string;
  courses: CourseItem[];
}

export interface TopicItem {
  topic_id: number;
  topic_code: string;
  topic_title: string;
  status: string;
  color: string;
  class_dates: string[];
}

export interface CourseTopicsResponse {
  course_id: number;
  section_id: number;
  topics: TopicItem[];
}