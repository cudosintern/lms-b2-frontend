export interface CourseItem {
  id: string;
  section: string;
  code: string;
  title: string;
  type: string;
  credits: number;
  totalMarks: number;
  owner: string;
  reviewer: string;
  mode: string;
  instructor: string;
  status: string;
}

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

export const DEFAULT_COURSES: Record<string, CourseItem[]> = {
  "999_1": [
    {
      id: "c1",
      section: "",
      code: "15EPHL101",
      title: "Engineering Physics Lab",
      type: "Practical",
      credits: 1,
      totalMarks: 100,
      owner: "Mr. Ion Admin",
      reviewer: "",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c2",
      section: "",
      code: "15EHSL101",
      title: "Social Innovation",
      type: "Humanities Science",
      credits: 2,
      totalMarks: 100,
      owner: "Mr. Ion Admin",
      reviewer: "",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c3",
      section: "",
      code: "15EEEF101",
      title: "Basic Electrical Engineering",
      type: "Basic",
      credits: 3,
      totalMarks: 100,
      owner: "Mr. A S S Bennal",
      reviewer: "Mrs. Rohini B Jyoti",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c4",
      section: "",
      code: "15EMEL101",
      title: "Computer Aided Engineering Drawing",
      type: "Practical",
      credits: 3,
      totalMarks: 100,
      owner: "Mr. A S S Bennal",
      reviewer: "Mr. C M Koti",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c5",
      section: "",
      code: "15ECVF101",
      title: "Engineering Mechanics",
      type: "Basic",
      credits: 4,
      totalMarks: 100,
      owner: "Mr. A S S Bennal",
      reviewer: "",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c6",
      section: "",
      code: "15EPHB101",
      title: "Engineering Physics",
      type: "Basic Science",
      credits: 3,
      totalMarks: 100,
      owner: "Mr. Ion Admin",
      reviewer: "",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    },
    {
      id: "c7",
      section: "",
      code: "15EMAB101",
      title: "Analytical Geometry and Calculus",
      type: "Basic Science",
      credits: 5,
      totalMarks: 100,
      owner: "Mr. Ion Admin",
      reviewer: "",
      mode: "Theory",
      instructor: "",
      status: "Optional"
    }
  ]
};
