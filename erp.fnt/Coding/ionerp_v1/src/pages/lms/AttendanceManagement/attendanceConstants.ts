import { Course, Student} from "./attendanceInterface";

// ─── Mock Data ──────────────────────────────────────────────────────────────
export const mockBatches = [
  'B in ARCH 2024-2029', 
  'B in ARCH 2015-2020', 
  'B in ARCH 2016-2021', 
  'B. E in BT 2015-2019', 
  'B. E in BT 2020-2024', 
  'B. E in CSE 2017-2021'
];
export const mockSemesters = [
  '1 - Semester', 
  '2 - Semester', 
  '3 - Semester', 
  '4 - Semester', 
  '5 - Semester', 
  '6 - Semester', 
  '7 - Semester', 
  '8 - Semester'
];
export const mockCourses: Course[] = [
  { id: 'CS201', name: 'Data Structures', code: 'CS201', type: 'Theory' },
  { id: 'CS202', name: 'Computer Networks', code: 'CS202', type: 'Theory' },
  { id: 'CS203L', name: 'DBMS Lab', code: 'CS203L', type: 'Lab' },
  { id: 'CS204', name: 'Operating Systems', code: 'CS204', type: 'Theory' },
  { id: 'CS204T', name: 'OS Tutorial', code: 'CS204T', type: 'Theory' },
  { id: 'CS205', name: 'Web Technologies', code: 'CS205', type: 'Theory' },
  { id: 'CS206L', name: 'Networks Lab', code: 'CS206L', type: 'Lab' },
  { id: 'CS207', name: 'DBMS', code: 'CS207', type: 'Theory' },
  { id: 'CS207T', name: 'DBMS Tutorial', code: 'CS207T', type: 'Theory' },
  { id: 'CS201T', name: 'DS Tutorial', code: 'CS201T', type: 'Theory' },
  { id: 'CS201L', name: 'Data Structures Lab', code: 'CS201L', type: 'Lab' },
  { id: 'CS208L', name: 'Web Technologies Lab', code: 'CS208L', type: 'Lab' },
];

// ─── Timetable Integration Data ─────────────────────────────────────────────
export const MOCK_TIMETABLE_SCHEDULE = {
  'Monday': [
    { courseId: 'CS201', startTime: '08:30', endTime: '09:30', type: 'lecture', sessionName: 'P1 - Theory' },
    { courseId: 'CS202', startTime: '09:30', endTime: '10:30', type: 'lecture', sessionName: 'P2 - Theory' },
    { courseId: 'CS203L', startTime: '11:30', endTime: '12:30', type: 'lab', sessionName: 'P4 - Practical' },
    { courseId: 'CS204T', startTime: '01:30', endTime: '02:30', type: 'tutorial', sessionName: 'P5 - Tutorial' },
  ],
  'Tuesday': [
    { courseId: 'CS204', startTime: '08:30', endTime: '09:30', type: 'lecture', sessionName: 'P1 - Theory' },
    { courseId: 'CS205', startTime: '10:30', endTime: '11:30', type: 'lecture', sessionName: 'P3 - Theory' },
    { courseId: 'CS206L', startTime: '01:30', endTime: '02:30', type: 'lab', sessionName: 'P5 - Practical' },
    { courseId: 'CS206L', startTime: '02:30', endTime: '03:30', type: 'lab', sessionName: 'P6 - Practical' },
  ],
  'Wednesday': [
    { courseId: 'CS201', startTime: '09:30', endTime: '10:30', type: 'lecture', sessionName: 'P2 - Theory' },
    { courseId: 'CS207', startTime: '10:30', endTime: '11:30', type: 'lecture', sessionName: 'P3 - Theory' },
    { courseId: 'CS201T', startTime: '02:30', endTime: '03:30', type: 'tutorial', sessionName: 'P6 - Tutorial' },
    { courseId: 'CS205', startTime: '03:30', endTime: '04:30', type: 'lecture', sessionName: 'P7 - Theory' },
  ],
  'Thursday': [
    { courseId: 'CS202', startTime: '08:30', endTime: '09:30', type: 'lecture', sessionName: 'P1 - Theory' },
    { courseId: 'CS204', startTime: '09:30', endTime: '10:30', type: 'lecture', sessionName: 'P2 - Theory' },
    { courseId: 'CS201L', startTime: '11:30', endTime: '12:30', type: 'lab', sessionName: 'P4 - Practical' },
    { courseId: 'CS201L', startTime: '01:30', endTime: '02:30', type: 'lab', sessionName: 'P5 - Practical' },
  ],
  'Friday': [
    { courseId: 'CS207', startTime: '08:30', endTime: '09:30', type: 'lecture', sessionName: 'P1 - Theory' },
    { courseId: 'CS202', startTime: '10:30', endTime: '11:30', type: 'lecture', sessionName: 'P3 - Theory' },
    { courseId: 'CS208L', startTime: '01:30', endTime: '02:30', type: 'lab', sessionName: 'P5 - Practical' },
    { courseId: 'CS208L', startTime: '02:30', endTime: '03:30', type: 'lab', sessionName: 'P6 - Practical' },
    { courseId: 'CS207T', startTime: '03:30', endTime: '04:30', type: 'tutorial', sessionName: 'P7 - Tutorial' },
  ],
  'Saturday': [
    { courseId: 'CS204', startTime: '08:30', endTime: '09:30', type: 'lecture', sessionName: 'P1 - Theory' },
    { courseId: 'CS201', startTime: '09:30', endTime: '10:30', type: 'lecture', sessionName: 'P2 - Theory' },
  ]
};

export const initialStudents: Student[] = [
  { id: '1', rollNumber: 'CS2021001', name: 'John Doe', email: 'john@example.com', section: 'A', status: 'present' },
  { id: '2', rollNumber: 'CS2021002', name: 'Jane Smith', email: 'jane@example.com', section: 'A', status: 'present' },
  { id: '3', rollNumber: 'CS2021003', name: 'Mike Johnson', email: 'mike@example.com', section: 'A', status: 'present' },
  { id: '4', rollNumber: 'CS2021004', name: 'Sarah Williams', email: 'sarah@example.com', section: 'A', status: 'present' },
  { id: '5', rollNumber: 'CS2021005', name: 'Tom Brown', email: 'tom@example.com', section: 'A', status: 'present' },
  { id: '6', rollNumber: 'CS2021006', name: 'Emily Davis', email: 'emily@example.com', section: 'A', status: 'present' },
  { id: '7', rollNumber: 'CS2021007', name: 'James Wilson', email: 'james@example.com', section: 'A', status: 'present' },
  { id: '8', rollNumber: 'CS2021008', name: 'Sophia Miller', email: 'sophia@example.com', section: 'A', status: 'present' },
  { id: '9', rollNumber: 'CS2021009', name: 'Daniel Garcia', email: 'daniel@example.com', section: 'A', status: 'present' },
  { id: '10', rollNumber: 'CS2021010', name: 'Olivia Martinez', email: 'olivia@example.com', section: 'A', status: 'present' },
  { id: '11', rollNumber: 'CS2021011', name: 'Ethan Anderson', email: 'ethan@example.com', section: 'A', status: 'present' },
  { id: '12', rollNumber: 'CS2021012', name: 'Emma Taylor', email: 'emma@example.com', section: 'A', status: 'present' },
  { id: '13', rollNumber: 'CS2021013', name: 'Noah Thomas', email: 'noah@example.com', section: 'A', status: 'present' },
  { id: '14', rollNumber: 'CS2021014', name: 'Ava Jackson', email: 'ava@example.com', section: 'A', status: 'present' },
  { id: '15', rollNumber: 'CS2021015', name: 'Liam White', email: 'liam@example.com', section: 'A', status: 'present' },
  { id: '16', rollNumber: 'CS2021016', name: 'Isabella Harris', email: 'isabella@example.com', section: 'A', status: 'present' },
  { id: '17', rollNumber: 'CS2021017', name: 'Mason Martin', email: 'mason@example.com', section: 'A', status: 'present' },
  { id: '18', rollNumber: 'CS2021018', name: 'Mia Thompson', email: 'mia@example.com', section: 'A', status: 'present' },
  { id: '19', rollNumber: 'CS2021019', name: 'William Garcia', email: 'william@example.com', section: 'A', status: 'present' },
  { id: '20', rollNumber: 'CS2021020', name: 'Charlotte Martinez', email: 'charlotte@example.com', section: 'A', status: 'present' },
  { id: '21', rollNumber: 'CS2021021', name: 'Benjamin Robinson', email: 'benjamin@example.com', section: 'A', status: 'present' },
  { id: '22', rollNumber: 'CS2021022', name: 'Amelia Clark', email: 'amelia@example.com', section: 'A', status: 'present' },
  { id: '23', rollNumber: 'CS2021023', name: 'Lucas Rodriguez', email: 'lucas@example.com', section: 'A', status: 'present' },
  { id: '24', rollNumber: 'CS2021024', name: 'Harper Lewis', email: 'harper@example.com', section: 'A', status: 'present' },
  { id: '25', rollNumber: 'CS2021025', name: 'Henry Lee', email: 'henry@example.com', section: 'A', status: 'present' },
];