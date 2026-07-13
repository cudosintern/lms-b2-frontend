import React, { useState, useEffect, useCallback } from "react";
import MentoringPageLayout from "./MentoringPageLayout";
import { 
  AlertCircle, 
  Bookmark, 
  MessageCircle, 
  FileText, 
  Clock, 
  MapPin,
  FileDown
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/api";
import { LmsApiEndpoint } from "../../utils/ApiEndpoint/lmsApiEndpoint";

// Interfaces
interface CurriculumItem {
  curriculum_id: number;
  curriculum_code: string;
  curriculum_desc: string;
}

interface SemesterItem {
  semester_id: number;
  semester: number;
  semester_desc: string;
}

interface GroupItem {
  mentors_group_id: number;
  mentors_pgm_title: string;
  questionnaire_id: number;
  mentors: any[];
}

interface MenteeItem {
  student_id: number;
  student_name: string;
  student_usn?: string;
  student_email?: string;
}

interface SessionData {
  schedule_id: number;
  curriculum_id: number;
  group_name: string;
  semester_id: number;
  questionnaire_id: number;
  session_agenda: string;
  sub_groups: {
    sub_group_name: string;
    location: string;
    dates?: {
      start_date: string;
      end_date: string;
      start_time: string;
      end_time: string;
    }[];
  }[];
}

interface QuestionnaireAnswer {
  questionnaire_que_id: number;
  question_text: string;
  text_answer: string;
  selected_options: {
    questionnaire_options_id: number;
    specification: string;
  }[];
}

interface StudentSessionReport {
  session: SessionData;
  response: {
    submitted_at: string;
    answers: QuestionnaireAnswer[];
  } | null;
  comments: {
    sender_name: string;
    comment: string;
    created_date: string;
  }[];
}

const MmpReportPage: React.FC = () => {
  // Dropdown Selections
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // Data Lists
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [students, setStudents] = useState<MenteeItem[]>([]);

  // Selected Student Profile Info
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<MenteeItem | null>(null);

  // Counselling Report Data
  const [studentReport, setStudentReport] = useState<any>(null);
  const [studentReportLoading, setStudentReportLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Report Data
  const [reportList, setReportList] = useState<StudentSessionReport[]>([]);

  // Loading Flags
  const [curriculumsLoading, setCurriculumsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // API Call Wrapper
  const apiCall = useCallback(async (url: string, method: "get" | "post" | "put" | "delete", payload?: any) => {
    try {
      const response = await axiosInstance.request<{ status: boolean; message: string; data: any }>({
        url,
        method,
        data: payload,
      });
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      return { status: false, message: msg, data: null };
    }
  }, []);

  // 1. Fetch Curriculums on mount
  useEffect(() => {
    const fetchCurriculums = async () => {
      setCurriculumsLoading(true);
      const res = await apiCall(LmsApiEndpoint.mentoringSession.curriculumList, "get");
      if (res && res.status) {
        const mapped = (res.data || []).map((b: any) => ({
          curriculum_id: b.academic_batch_id,
          curriculum_code: b.academic_batch_code,
          curriculum_desc: b.academic_batch_desc,
        }));
        setCurriculums(mapped);
      } else {
        toast.error(res?.message || "Failed to load curriculums.");
      }
      setCurriculumsLoading(false);
    };
    fetchCurriculums();
  }, [apiCall]);

  // 2. Fetch Groups & Terms when Curriculum changes
  useEffect(() => {
    if (!selectedCurriculum) {
      setGroups([]);
      setSemesters([]);
      setSelectedGroup("");
      setSelectedTerm("");
      setStudents([]);
      setSelectedStudent("");
      setReportList([]);
      setSelectedStudentInfo(null);
      return;
    }

    const loadCurriculumDetails = async () => {
      setGroupsLoading(true);
      setTermsLoading(true);

      const semRes = await apiCall(
        `${LmsApiEndpoint.mentoringSession.semestersByCurriculum}/${selectedCurriculum}`,
        "get"
      );
      if (semRes && semRes.status) {
        setSemesters(semRes.data || []);
      } else {
        toast.error("Failed to load semesters.");
      }
      setTermsLoading(false);

      const groupRes = await apiCall(
        `${LmsApiEndpoint.mentoringSession.groupsByCurriculum}/${selectedCurriculum}`,
        "get"
      );
      if (groupRes && groupRes.status) {
        setGroups(groupRes.data || []);
      } else {
        toast.error("Failed to load mentoring groups.");
      }
      setGroupsLoading(false);
    };

    loadCurriculumDetails();
  }, [selectedCurriculum, apiCall]);

  // 3. Fetch Students when Mentoring Group changes
  useEffect(() => {
    if (!selectedGroup) {
      setStudents([]);
      setSelectedStudent("");
      setReportList([]);
      setSelectedStudentInfo(null);
      return;
    }

    const loadStudents = async () => {
      setStudentsLoading(true);
      const res = await apiCall(
        `${LmsApiEndpoint.mentoringSession.groupMentees}/${selectedGroup}`,
        "get"
      );
      if (res && res.status) {
        setStudents(res.data || []);
      } else {
        toast.error("Failed to load students.");
      }
      setStudentsLoading(false);
    };

    loadStudents();
  }, [selectedGroup, apiCall]);

  // 4. Update student profile info locally on student select and fetch comprehensive report details
  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentInfo(null);
      setStudentReport(null);
      setReportList([]);
      return;
    }
    const studentObj = students.find(s => String(s.student_id) === selectedStudent);
    if (studentObj) {
      setSelectedStudentInfo(studentObj);
    }
  }, [selectedStudent, students]);

  useEffect(() => {
    if (!selectedStudent || !selectedStudentInfo) {
      setStudentReport(null);
      return;
    }

    const fetchStudentReport = async () => {
      setStudentReportLoading(true);
      const res = await apiCall(
        `api/v1/student-details/info?student_id=${selectedStudent}`,
        "get"
      );
      if (res && (res.status as any) === "success") {
        setStudentReport(res.data);
      } else {
        setStudentReport(null);
      }
      setStudentReportLoading(false);
    };

    fetchStudentReport();
  }, [selectedStudent, selectedStudentInfo, apiCall]);

  const handleExportPDF = async () => {
    if (!selectedStudentInfo) {
      toast.error("Please select a student first.");
      return;
    }
    const usn = selectedStudentInfo.student_usn || studentReport?.personal_info?.usn;
    if (!usn) {
      toast.error("USN not found for the selected student.");
      return;
    }

    setExportingPdf(true);
    try {
      const response = await axiosInstance.get(`api/v1/student-details/export/pdf?usn=${usn}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `student_profile_${usn}.pdf`;
      link.click();
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  // 5. Fetch report when all selections are complete
  useEffect(() => {
    if (!selectedCurriculum || !selectedGroup || !selectedTerm || !selectedStudent) {
      setReportList([]);
      return;
    }

    const generateReport = async () => {
      setReportLoading(true);
      try {
        // Fetch all mentoring sessions
        const sessionsRes = await apiCall(LmsApiEndpoint.mentoringSession.getMentoringSessions, "get");
        if (!sessionsRes || !sessionsRes.status) {
          toast.error("Failed to fetch mentoring sessions.");
          setReportLoading(false);
          return;
        }

        // Filter sessions by selected Curriculum, Term, and Mentoring Group
        const groupObj = groups.find(g => String(g.mentors_group_id) === selectedGroup);
        const filteredSessions = (sessionsRes.data || []).filter((s: any) => {
          const matchCurriculum = s.academic_batch_id === parseInt(selectedCurriculum);
          const matchTerm = s.semester_id === parseInt(selectedTerm);
          const matchGroup = groupObj ? s.group_name === groupObj.mentors_pgm_title : false;
          return matchCurriculum && matchTerm && matchGroup;
        });

        // For each matching session, fetch the response of the selected student
        const compiledReports: StudentSessionReport[] = [];
        for (const session of filteredSessions) {
          // Fetch mentees list with their responses
          const menteesRes = await apiCall(`${LmsApiEndpoint.mentoring.sessions}/${session.schedule_id}/mentees`, "get");
          let studentResponse: any = null;
          let studentProfileFromSession: any = null;

          if (menteesRes && menteesRes.status && menteesRes.data) {
            const studentData = (menteesRes.data || []).find((m: any) => String(m.student_id) === selectedStudent);
            if (studentData) {
              studentProfileFromSession = studentData;
              studentResponse = studentData.response || null;
            }
          }

          // Fetch chat comments history for this session & student
          const chatRes = await apiCall(
            `${LmsApiEndpoint.mentoring.sessions}/${session.schedule_id}/chat?mentee_id=${selectedStudent}`,
            "get"
          );
          const chatComments = chatRes && chatRes.status ? (chatRes.data || []) : [];

          // Keep details of student usn/email if not set yet
          if (studentProfileFromSession && selectedStudentInfo) {
            if (!selectedStudentInfo.student_usn && studentProfileFromSession.student_usn) {
              setSelectedStudentInfo(prev => prev ? { ...prev, student_usn: studentProfileFromSession.student_usn } : null);
            }
            if (!selectedStudentInfo.student_email && studentProfileFromSession.student_email) {
              setSelectedStudentInfo(prev => prev ? { ...prev, student_email: studentProfileFromSession.student_email } : null);
            }
          }

          compiledReports.push({
            session: {
              schedule_id: session.schedule_id,
              curriculum_id: session.academic_batch_id,
              group_name: session.group_name,
              semester_id: session.semester_id,
              questionnaire_id: session.questionnaire_id,
              session_agenda: session.session_agenda,
              sub_groups: session.sub_groups || [],
            },
            response: studentResponse,
            comments: chatComments,
          });
        }

        setReportList(compiledReports);
      } catch (err) {
        toast.error("An error occurred while compiling the report.");
      } finally {
        setReportLoading(false);
      }
    };

    generateReport();
  }, [selectedCurriculum, selectedGroup, selectedTerm, selectedStudent, groups, apiCall, selectedStudentInfo]);

  const hasSelections = selectedCurriculum && selectedGroup && selectedTerm && selectedStudent;

  return (
    <MentoringPageLayout>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[600px] transition-all duration-300">
        
        {/* Banner Title - Styled exactly like the mockup image */}
        <div className="bg-[#1b2b3c] text-white px-6 py-2.5 font-bold text-lg flex items-center justify-between shadow-sm relative overflow-hidden" style={{ borderTopLeftRadius: '4px', borderTopRightRadius: '30px' }}>
          <span>MMP Report</span>
        </div>

        {/* Dropdowns filters row */}
        <div className="p-6 pb-2 border-b border-gray-150 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Curriculum Selector */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                Curriculum: <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                disabled={curriculumsLoading}
                className="w-full px-3 py-1.5 text-[13px] border border-gray-300 bg-white text-gray-750 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select Curriculum</option>
                {curriculums.map(c => (
                  <option key={c.curriculum_id} value={c.curriculum_id}>
                    {c.curriculum_desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Mentoring Group Selector */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                Filter by Mentoring Group: <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                disabled={!selectedCurriculum || groupsLoading}
                className="w-full px-3 py-1.5 text-[13px] border border-gray-300 bg-white text-gray-750 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select Mentoring Program</option>
                {groups.map(g => (
                  <option key={g.mentors_group_id} value={g.mentors_group_id}>
                    {g.mentors_pgm_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selector */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                Term: <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                disabled={!selectedCurriculum || termsLoading}
                className="w-full px-3 py-1.5 text-[13px] border border-gray-300 bg-white text-gray-750 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select Term</option>
                {semesters.map(s => (
                  <option key={s.semester_id} value={s.semester_id}>
                    {s.semester_desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Selector */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                Student: <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={!selectedGroup || studentsLoading}
                className="w-full px-3 py-1.5 text-[13px] border border-gray-300 bg-white text-gray-750 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_name}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Report Display Area */}
        <div className="p-6 flex-grow flex flex-col">
          {(reportLoading || studentReportLoading) ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold text-gray-500">Compiling report data...</span>
            </div>
          ) : !hasSelections ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold py-4">
              No data to display
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">

              {/* Student Counselling Form (matching mockup style) */}
              {studentReport && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-6">
                  
                  {/* Form Title & PDF Export Row */}
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white uppercase tracking-wide">
                      Student Counselling Form for UG
                    </h2>
                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPdf}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#457b9d] hover:bg-[#1d3557] disabled:bg-gray-400 text-white rounded text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {exportingPdf ? "Exporting PDF..." : "Export to PDF"}
                    </button>
                  </div>

                  {/* Section 1: Department & Counsellor Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5 font-bold bg-gray-50 dark:bg-gray-800/50 w-1/4">
                            Department:
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5 w-1/2">
                            {studentReport.personal_info?.department || "N/A"}
                          </td>
                          <td 
                            rowSpan={4} 
                            className="border border-gray-300 dark:border-gray-600 p-2.5 text-center bg-gray-50 dark:bg-gray-800/50 w-1/4"
                          >
                            <div className="flex flex-col items-center justify-center p-2">
                              <div className="w-20 h-24 border border-dashed border-gray-400 bg-gray-100/50 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-[10px] font-semibold text-center p-1">
                                <span>student profile</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5 font-bold bg-gray-50 dark:bg-gray-800/50">
                            Counsellor Name:
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                            {studentReport.personal_info?.counsellor_name ? (
                              <div className="whitespace-pre-line font-bold text-gray-800 dark:text-gray-100">
                                {studentReport.personal_info.counsellor_name}
                              </div>
                            ) : "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5 font-bold bg-gray-50 dark:bg-gray-800/50">
                            Program:
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                            {studentReport.personal_info?.program || "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5 font-bold bg-gray-50 dark:bg-gray-800/50">
                            Curriculum:
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                            {studentReport.personal_info?.curriculum || "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Personal Information */}
                  <div>
                    <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                      Personal Information :
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50 w-1/3">
                              Student Name:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              - {studentReport.personal_info?.full_name || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Application No:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.application_no || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              USN:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold">
                              {studentReport.personal_info?.usn || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Father's Name:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.father_name || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Father's Profession:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.father_profession || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Mother's Name:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.mother_name || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Mother's Profession:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.mother_profession || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Contact Details */}
                  <div>
                    <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                      Contact Details :
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5 w-1/2">Permanent Address:</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5 w-1/2">Present Address:</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5 align-top min-h-[50px]">
                              {studentReport.addresses?.permanent?.address ? (
                                <div>
                                  {studentReport.addresses.permanent.address}
                                  {studentReport.addresses.permanent.address2 && `, ${studentReport.addresses.permanent.address2}`}
                                  <br />
                                  {studentReport.addresses.permanent.city}, {studentReport.addresses.permanent.state}
                                  <br />
                                  {studentReport.addresses.permanent.country} - {studentReport.addresses.permanent.postal_code}
                                </div>
                              ) : (
                                <span className="italic text-gray-400 font-bold">No data to display</span>
                              )}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5 align-top min-h-[50px]">
                              {studentReport.addresses?.correspondence?.address ? (
                                <div>
                                  {studentReport.addresses.correspondence.address}
                                  {studentReport.addresses.correspondence.address2 && `, ${studentReport.addresses.correspondence.address2}`}
                                  <br />
                                  {studentReport.addresses.correspondence.city}, {studentReport.addresses.correspondence.state}
                                  <br />
                                  {studentReport.addresses.correspondence.country} - {studentReport.addresses.correspondence.postal_code}
                                </div>
                              ) : (
                                <span className="italic text-gray-400 font-bold">No data to display</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Phone Number:</span> {studentReport.personal_info?.home_phone || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Phone Number:</span> {studentReport.personal_info?.home_phone || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Mobile:</span> {studentReport.personal_info?.contact || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Mobile:</span> {studentReport.personal_info?.contact || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Email:</span> {studentReport.personal_info?.email || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2.5">
                              <span className="font-bold">Email:</span> {studentReport.personal_info?.email || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Parent / Guardian Information */}
                  <div>
                    <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                      Parent / Guardian Information :
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50 w-1/3">
                              Parent / Guardian Name:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.parent_guardian_name || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Relationship:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.relationship || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Home/Phone:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.home_phone || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold bg-gray-50 dark:bg-gray-800/50">
                              Cell Phone:
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.personal_info?.cell_phone || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Academic Qualifications */}
                  <div>
                    <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                      Academic Qualifications (10th & 12th %) :
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold text-center">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">Qualification</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">Board/University</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">Year of Passing</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">Percentage</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">10th Standard / SSLC</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">
                              {studentReport.education_details?.tenth_board || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.education_details?.tenth_year || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold text-emerald-600 dark:text-emerald-400">
                              {studentReport.education_details?.tenth_percentage ? `${studentReport.education_details.tenth_percentage}%` : "N/A"}
                            </td>
                          </tr>
                          <tr className="text-center">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">12th Standard / PUC</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">
                              {studentReport.education_details?.twelfth_board || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              {studentReport.education_details?.twelfth_year || "N/A"}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 font-bold text-emerald-600 dark:text-emerald-400">
                              {studentReport.education_details?.twelfth_percentage ? `${studentReport.education_details.twelfth_percentage}%` : "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 6: Course-wise Attendance & Secured Marks */}
                  <div>
                    <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                      Course-wise Attendance & Secured Marks (All Occasions & Semesters) :
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold text-center">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left w-12">Sem</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left w-28">Course Code</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">Course Title</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 w-24">Attendance %</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2">Secured Marks (Occasion Breakdown)</td>
                          </tr>
                        </thead>
                        <tbody>
                          {(!studentReport.marks_details || studentReport.marks_details.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="border border-gray-300 dark:border-gray-600 p-4 text-center italic text-gray-400">
                                No courses or marks details found for this student.
                              </td>
                            </tr>
                          ) : (
                            studentReport.marks_details.map((course: any, cIdx: number) => {
                              const attObj = studentReport.attendance_details?.find((a: any) => a.course_code === course.course_code);
                              const attPerc = attObj ? attObj.attendance_percentage : null;
                              
                              return (
                                <tr key={cIdx}>
                                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold">{course.semester}</td>
                                  <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">{course.course_code}</td>
                                  <td className="border border-gray-300 dark:border-gray-600 p-2">{course.course_title}</td>
                                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-blue-600 dark:text-blue-400">
                                    {attPerc !== null ? `${attPerc}%` : "N/A"}
                                  </td>
                                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      {course.occasions && course.occasions.length > 0 ? (
                                        course.occasions.map((occ: any, oIdx: number) => (
                                          <span 
                                            key={oIdx} 
                                            className="text-xs bg-slate-50 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 font-semibold"
                                          >
                                            {occ.occasion_name}: <span className="text-blue-600 dark:text-blue-400">{occ.secured_marks}</span>/{occ.total_marks}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="italic text-gray-400">No marks recorded</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 7: Questionnaire Response */}
                  {studentReport.questionnaire_responses && studentReport.questionnaire_responses.length > 0 && (
                    <div>
                      <h3 className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                        Questionnaire Responses :
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-[13px] text-gray-750 dark:text-gray-300">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold text-center">
                              <td className="border border-gray-300 dark:border-gray-600 p-2 w-10">#</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">Question</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-left">Response</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 w-40">Submitted At</td>
                            </tr>
                          </thead>
                          <tbody>
                            {studentReport.questionnaire_responses.map((q: any, qIdx: number) => (
                              <tr key={qIdx}>
                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold">{qIdx + 1}</td>
                                <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">{q.question_text}</td>
                                <td className="border border-gray-300 dark:border-gray-600 p-2 bg-blue-50/10 dark:bg-blue-900/5">{q.response_value}</td>
                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-xs text-gray-500">{q.submitted_at || "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Sessions Details List */}
              {reportList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-gray-50/50 dark:bg-gray-900/10">
                  <AlertCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    No mentoring sessions or questionnaire responses found for the selected configuration.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-blue-500" />
                    MMP Questionnaire & Session Feedback
                  </h3>

                  {reportList.map((rep, idx) => {
                    const hasResponse = rep.response && rep.response.answers && rep.response.answers.length > 0;
                    const hasComments = rep.comments && rep.comments.length > 0;

                    return (
                      <div 
                        key={rep.session.schedule_id} 
                        className="border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-gray-800/30 flex flex-col"
                      >
                        {/* Session Top Header */}
                        <div className="bg-slate-100 dark:bg-gray-800 px-5 py-4 border-b border-slate-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col text-left">
                            <span className="text-base font-bold text-gray-800 dark:text-white">
                              Session Agenda: {rep.session.session_agenda || "Regular Mentoring Meet"}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Bookmark className="h-3.5 w-3.5 text-blue-500" />
                                Group: <strong>{rep.session.group_name}</strong>
                              </span>
                              {rep.session.sub_groups.map((sg, sgIdx) => (
                                <span key={sgIdx} className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                                  {sg.sub_group_name} ({sg.location || "Online"})
                                </span>
                              ))}
                            </div>
                          </div>
                          {hasResponse && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full w-max border border-emerald-200/50 dark:border-emerald-900/50">
                              Submitted at: {rep.response?.submitted_at}
                            </span>
                          )}
                        </div>

                        {/* Content Split Layout: Questionnaire answers left, Comments right */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-gray-800 flex-grow">
                          
                          {/* Left side: Questionnaire Responses */}
                          <div className="p-5 flex flex-col gap-4">
                            <h4 className="text-[13px] font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-gray-800 pb-2">
                              <FileText className="h-4.5 w-4.5 text-blue-500" />
                              Questionnaire Responses
                            </h4>

                            {!hasResponse ? (
                              <div className="text-slate-400 italic text-sm py-8 text-center bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-gray-800 rounded-xl">
                                No response submitted by student for this session.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4 text-[13px]">
                                {rep.response?.answers.map((ans, aIdx) => (
                                  <div key={aIdx} className="border-b border-slate-100 dark:border-gray-800/60 pb-3 last:border-b-0">
                                    <div className="font-bold text-gray-850 dark:text-slate-200 mb-2">
                                      {aIdx + 1}. {ans.question_text || "Question"}
                                    </div>
                                    
                                    {ans.text_answer ? (
                                      <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                                        {ans.text_answer}
                                      </div>
                                    ) : ans.selected_options && ans.selected_options.length > 0 ? (
                                      <div className="flex flex-col gap-1.5 pl-3">
                                        {ans.selected_options.map((opt, oIdx) => (
                                          <span key={oIdx} className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✓</span>
                                            {opt.specification || "Option"}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 italic pl-3">No choice selected / unanswered</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right side: Comments & Chats */}
                          <div className="p-5 flex flex-col gap-4">
                            <h4 className="text-[13px] font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-gray-800 pb-2">
                              <MessageCircle className="h-4.5 w-4.5 text-blue-500" />
                              Mentor Feedback & Discussion Comments
                            </h4>

                            {!hasComments ? (
                              <div className="text-slate-400 italic text-sm py-8 text-center bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-gray-800 rounded-xl">
                                No mentoring feedback comments or logs recorded.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1">
                                {rep.comments.map((msg, cIdx) => (
                                  <div 
                                    key={cIdx} 
                                    className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800/60 rounded-xl text-[13px]"
                                  >
                                    <div className="flex justify-between items-center flex-wrap gap-2 pb-1 border-b border-slate-200/50 dark:border-gray-700/50">
                                      <span className="font-bold text-gray-800 dark:text-white text-xs">{msg.sender_name}</span>
                                      <span className="text-[10px] text-gray-450 flex items-center gap-1 font-semibold">
                                        <Clock className="h-3 w-3" />
                                        {msg.created_date}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed pt-1">
                                      {msg.comment}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </MentoringPageLayout>
  );
};

export default MmpReportPage;
