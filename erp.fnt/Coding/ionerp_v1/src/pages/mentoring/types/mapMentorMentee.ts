export interface MentoringGroup {
  id: number;
  curriculum: string;
  group_title: string;
  applicable_terms: string;
  config_type: string;
  questionnaire_title: string;
  mentors: string[];
  mentees: string[];
  session_date: string;
  session_status: string;
}

export const DEFAULT_CONFIG_TYPES = [
  "CSE Config type 2",
  "CSE Config type -1",
  "ECE Config type 1",
  "General Config Type"
];

export const INITIAL_GROUPS: MentoringGroup[] = [
  {
    id: 1,
    curriculum: "B. E in BT 2015-2019",
    group_title: "a",
    applicable_terms: "Term 1",
    config_type: "CSE Config type 2",
    questionnaire_title: "Student MMP Questionnaire",
    mentors: ["Dr. Ameen", "Mr. C J Savanurmat"],
    mentees: [],
    session_date: "",
    session_status: ""
  }
];

export const AVAILABLE_MENTORS = [
  "Dr. Ameen",
  "Mr. C J Savanurmat",
  "Dr. Anil Kumar",
  "Prof. Sunita Rao",
  "Dr. Ramesh Patil",
  "Prof. Kavita Sharma",
  "Dr. Vijay Singh",
  "Prof. Deepa Nair",
  "Dr. Suresh Menon",
  "Dr. Priya Pillai",
  "Dr. Smith",
  "Prof. Johnson"
];

export const LOCAL_STORAGE_KEY = "lms_mentoring_groups";
export const CONFIG_TYPES_LS_KEY = "lms_mentoring_config_types";
