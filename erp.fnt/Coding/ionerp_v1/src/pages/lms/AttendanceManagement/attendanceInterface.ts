export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  section: string;
  status: "present" | "absent" | "late";
  absentReason?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseId: string;
  courseName: string;
  section: string;
  session: string;
  topic: string;
  hours: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  markedBy: string;
  markedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  type: "Theory" | "Lab";
}

export interface StudentAttendanceRecord {
  id?: string;
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: string;
  markedBy: string;
  notes?: string;
  markedAt?: string;
}