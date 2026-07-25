import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { TextField } from "@mui/material";
import "./studentCourseRegistration.css";

// ============================================
// API Base URL - Using Environment Variable
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL + '/lms_student_course_registration';
console.log("API_BASE_URL:", API_BASE_URL);

// ============================================
// Interfaces
// ============================================

interface Department {
  dept_id: number;
  dept_name: string;
}

interface Program {
  pgm_id: number;
  program_name: string;
}

interface Curriculum {
  curriculum_id: number;
  curriculum_name: string;
}

interface Term {
  semester_id: number;
  term_name: string;
}

interface CourseStructure {
  course_type: string;
  total_credits: number;
  min_credits: number;
  max_credits: number;
  students_registered: number;
}

interface Course {
  crs_id: number;
  crs_code: string;
  crs_title: string;
  total_credits: number;
  registered_count: number;
}

interface EnrollResponse {
  semester_id: number;
  course_type: string;
  course_type_id: number;
  courses: Course[];
  total_courses: number;
  total_registered: number;
  total_credits: number;
}

interface RegistrationSetupResponse {
  status: boolean;
  data: {
    semester: {
      start_date: string;
      start_time: string;
      end_date: string;
      end_time: string;
      min_credit: number;
      max_credit: number;
      own_elective: number;
      other_elective: number;
    };
    course_structure: CourseStructure[];
  };
  message?: string;
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

// ============================================
// SetCourseEnrollLimitModal Component
// ============================================

interface SetCourseEnrollLimitModalProps {
  open: boolean;
  curriculumName: string;
  termName: string;
  courseType: string;
  courses: Course[];
  semesterData?: {
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
  };
  onClose: () => void;
  onUpdate: (data: any) => void;
}

const SetCourseEnrollLimitModal: React.FC<SetCourseEnrollLimitModalProps> = ({
  open,
  curriculumName,
  termName,
  courseType,
  courses,
  semesterData,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpdateClick = async () => {
    setLoading(true);
    try {
      const updateData = {
        course_type: courseType,
      };
      await onUpdate(updateData);
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Check if this is Open Elective
  const isOpenElective = courseType?.toLowerCase().includes('open elective');

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Set Course Enroll Limit</h2>
        </div>
        
        <div style={modalStyles.infoContainer}>
          <table style={modalStyles.infoTable}>
            <tbody>
              <tr>
                <td style={modalStyles.infoLabel}>Curriculum</td>
                <td style={modalStyles.infoValue}>{curriculumName}</td>
              </tr>
              <tr>
                <td style={modalStyles.infoLabel}>Term</td>
                <td style={modalStyles.infoValue}>{termName}</td>
              </tr>
              <tr>
                <td style={modalStyles.infoLabel}>Type of Course</td>
                <td style={modalStyles.infoValue}>{courseType}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={modalStyles.tableContainer}>
          <table style={modalStyles.courseTable}>
            <thead>
              <tr>
                <th style={modalStyles.courseTh}>Course Code</th>
                <th style={modalStyles.courseTh}>Course</th>
                <th style={modalStyles.courseTh}>Credits</th>
                {isOpenElective && (
                  <>
                    <th style={modalStyles.courseTh}>Start Date</th>
                    <th style={modalStyles.courseTh}>Start Time</th>
                    <th style={modalStyles.courseTh}>End Date</th>
                    <th style={modalStyles.courseTh}>End Time</th>
                  </>
                )}
                <th style={modalStyles.courseTh}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {courses && courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.crs_id}>
                    <td style={modalStyles.courseTd}>{course.crs_code}</td>
                    <td style={modalStyles.courseTd}>{course.crs_title}</td>
                    <td style={modalStyles.courseTd}>{course.total_credits}</td>
                    {isOpenElective && (
                      <>
                        <td style={modalStyles.courseTd}>{semesterData?.start_date || '-'}</td>
                        <td style={modalStyles.courseTd}>{semesterData?.start_time || '-'}</td>
                        <td style={modalStyles.courseTd}>{semesterData?.end_date || '-'}</td>
                        <td style={modalStyles.courseTd}>{semesterData?.end_time || '-'}</td>
                      </>
                    )}
                    <td style={modalStyles.courseTd}>{course.registered_count || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isOpenElective ? 8 : 5} style={{ ...modalStyles.courseTd, textAlign: "center", padding: "20px" }}>
                    No courses available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={modalStyles.footer}>
          <button style={modalStyles.updateButton} onClick={handleUpdateClick} disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </button>
          <button style={modalStyles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Modal Styles
// ============================================

const modalStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modal: {
    width: "85%",
    maxWidth: "1100px",
    maxHeight: "90vh",
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden" as const,
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid #e8edf2",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#1a2634",
  },
  infoContainer: {
    padding: "16px 24px",
    borderBottom: "1px solid #e8edf2",
    flexShrink: 0,
  },
  infoTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  infoLabel: {
    padding: "6px 12px",
    fontWeight: 600,
    color: "#333",
    border: "1px solid #d0d7de",
    width: "150px",
    backgroundColor: "#ffffff",
  },
  infoValue: {
    padding: "6px 12px",
    color: "#333",
    border: "1px solid #d0d7de",
    backgroundColor: "#ffffff",
  },
  dateTimeContainer: {
    padding: "12px 24px",
    borderBottom: "1px solid #e8edf2",
    backgroundColor: "#ffffff",
  },
  dateTimeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "20px",
    alignItems: "center",
  },
  dateTimeGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  dateTimeLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  dateTimeValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
    padding: "4px 0",
  },
  tableContainer: {
    padding: "16px 24px",
    flex: 1,
    overflowY: "auto" as const,
    maxHeight: "45vh",
  },
  courseTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "13px",
  },
  courseTh: {
    padding: "8px 10px",
    border: "1px solid #d0d7de",
    textAlign: "left" as const,
    backgroundColor: "#f5f5f5",
    fontWeight: 600,
    color: "#333",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },
  courseTd: {
    padding: "8px 10px",
    border: "1px solid #d0d7de",
    color: "#333",
    fontSize: "13px",
    backgroundColor: "#ffffff",
  },
  footer: {
    padding: "12px 24px",
    borderTop: "1px solid #e8edf2",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexShrink: 0,
  },
  updateButton: {
    padding: "6px 24px",
    backgroundColor: "#4a9eff",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    height: "34px",
  },
  cancelButton: {
    padding: "6px 24px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    height: "34px",
  },
};

// ============================================
// Main Component
// ============================================

const DepartmentDropdown = () => {
  // Dropdown states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedTermName, setSelectedTermName] = useState("");
  const [curriculumName, setCurriculumName] = useState("");

  // Date/Time states
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  // Data states
  const [courseStructure, setCourseStructure] = useState<CourseStructure[]>([]);
  const [semesterData, setSemesterData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseType, setSelectedCourseType] = useState("");
  const [modalCourses, setModalCourses] = useState<Course[]>([]);

  // Editable states
  const [editableTotalCredits, setEditableTotalCredits] = useState<string>("60");
  const [editableMinCredits, setEditableMinCredits] = useState<string>("0");
  const [editableOwnElectives, setEditableOwnElectives] = useState<string>("0");
  const [editableOtherElectives, setEditableOtherElectives] = useState<string>("0");
  
  // Course level editable states
  const [editableCourseMinCredits, setEditableCourseMinCredits] = useState<{ [key: string]: string }>({});
  const [editableCourseMaxCredits, setEditableCourseMaxCredits] = useState<{ [key: string]: string }>({});
  const [editableMaxStudents, setEditableMaxStudents] = useState<{ [key: string]: string }>({});

  // ============================================
  // LOAD REGISTRATION DATA
  // ============================================

  const loadRegistrationData = async (semesterId: string) => {
    if (!semesterId) {
      console.log('⚠️ No semester ID provided');
      return;
    }
    
    console.log(`🔄 Loading data for semester: ${semesterId}`);
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get<RegistrationSetupResponse>(
        `${API_BASE_URL}/registration-setup/${semesterId}`
      );
      
      console.log('📥 Full Response:', response.data);
      
      if (response.data.status && response.data.data) {
        const { semester, course_structure } = response.data.data;
        
        setSemesterData(semester);
        
        // Set dates and times
        if (semester.start_date) {
          const [day, month, year] = semester.start_date.split('-');
          setStartDate(dayjs(`${year}-${month}-${day}`));
        }
        if (semester.start_time) {
          setStartTime(dayjs(semester.start_time, "hh:mm A"));
        }
        if (semester.end_date) {
          const [day, month, year] = semester.end_date.split('-');
          setEndDate(dayjs(`${year}-${month}-${day}`));
        }
        if (semester.end_time) {
          setEndTime(dayjs(semester.end_time, "hh:mm A"));
        }
        
        // Set editable fields from semester data
        setEditableTotalCredits(String(semester.max_credit || 0));
        setEditableMinCredits(String(semester.min_credit || 0));
        setEditableOwnElectives(String(semester.own_elective || 0));
        setEditableOtherElectives(String(semester.other_elective || 0));
        
        // Set course structure
        if (course_structure && course_structure.length > 0) {
          console.log(`✅ Course structure has ${course_structure.length} items`);
          setCourseStructure(course_structure);
          
          const minObj: { [key: string]: string } = {};
          const maxObj: { [key: string]: string } = {};
          const studentsObj: { [key: string]: string } = {};
          
          course_structure.forEach((item) => {
            if (item.course_type) {
              minObj[item.course_type] = String(item.min_credits || 0);
              maxObj[item.course_type] = String(item.max_credits || 0);
              studentsObj[item.course_type] = String(item.students_registered || 0);
            }
          });
          
          setEditableCourseMinCredits(minObj);
          setEditableCourseMaxCredits(maxObj);
          setEditableMaxStudents(studentsObj);
          setDataLoaded(true);
        } else {
          console.warn('⚠️ No course structure data found');
          setCourseStructure([]);
          setDataLoaded(false);
          setError("No course data available for this semester.");
        }
      } else {
        console.error('❌ Failed to load data:', response.data.message);
        setError(response.data.message || "Failed to load data");
        setDataLoaded(false);
      }
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(`Error: ${error.message}`);
      setDataLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOAD COURSES FOR MODAL
  // ============================================

  const loadCoursesForModal = async (courseType: string) => {
    if (!courseType || !selectedTerm) {
      alert('Please select a term first.');
      return;
    }
    
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/course-enroll-details/${selectedTerm}/${encodeURIComponent(courseType)}`;
      console.log(`🔍 Fetching courses for: ${courseType} from URL: ${url}`);
      
      const response = await axios.get<ApiResponse<EnrollResponse>>(url);
      
      console.log('📥 Courses response:', response.data);
      
      if (response.data.status && response.data.data) {
        const responseData = response.data.data;
        
        if (responseData.courses && Array.isArray(responseData.courses)) {
          setModalCourses(responseData.courses);
          setSelectedCourseType(responseData.course_type || courseType);
          setIsModalOpen(true);
        } else if (Array.isArray(responseData)) {
          setModalCourses(responseData);
          setSelectedCourseType(courseType);
          setIsModalOpen(true);
        } else {
          alert(`No courses found for "${courseType}".`);
        }
      } else {
        alert(`No courses found for "${courseType}".`);
      }
    } catch (error: any) {
      console.error('Error loading courses:', error);
      alert(`Failed to load courses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE ENROLL CLICK
  // ============================================

  const handleEnrollClick = (courseType: string) => {
    if (!courseType || !selectedTerm) {
      alert('Please select a term first.');
      return;
    }
    
    console.log(`🔍 Enroll clicked for: ${courseType}`);
    loadCoursesForModal(courseType);
  };

  // ============================================
  // HANDLE MODAL UPDATE
  // ============================================

  const handleModalUpdate = async (data: any) => {
    const updatedMaxStudents = { ...editableMaxStudents };
    updatedMaxStudents[data.course_type] = String(data.enrollment_limit || 0);
    setEditableMaxStudents(updatedMaxStudents);
    setIsModalOpen(false);
    await handleUpdate();
  };

  // ============================================
  // VALIDATION
  // ============================================

  const getValidationWarning = (courseType: string): string | null => {
    const min = parseFloat(editableCourseMinCredits[courseType]) || 0;
    const max = parseFloat(editableCourseMaxCredits[courseType]) || 0;
    const total = courseStructure.find(item => item.course_type === courseType)?.total_credits || 0;
    
    if (min > total) {
      return `⚠️ Min (${min}) > Total (${total})`;
    }
    if (max > total) {
      return `⚠️ Max (${max}) > Total (${total})`;
    }
    if (min > max) {
      return `⚠️ Min (${min}) > Max (${max})`;
    }
    return null;
  };

  const validateAllFields = (): string | null => {
    const total = parseFloat(editableTotalCredits) || 0;
    const minCredits = parseFloat(editableMinCredits) || 0;
    
    if (total <= 0) {
      return '❌ Total credits must be greater than 0';
    }
    
    if (minCredits < 0) {
      return '❌ Min credits cannot be negative';
    }
    
    if (minCredits > total) {
      return `❌ Min credits (${minCredits}) cannot exceed Total credits (${total})`;
    }

    let sumMin = 0;
    let sumMax = 0;
    const errorMessages: string[] = [];
    
    for (const item of courseStructure) {
      const min = parseFloat(editableCourseMinCredits[item.course_type]) || 0;
      const max = parseFloat(editableCourseMaxCredits[item.course_type]) || 0;
      const courseTotal = item.total_credits || 0;
      const courseType = item.course_type;
      
      if (min < 0) {
        errorMessages.push(`❌ Min credits cannot be negative for "${courseType}"`);
      }
      if (max < 0) {
        errorMessages.push(`❌ Max credits cannot be negative for "${courseType}"`);
      }
      if (min > max) {
        errorMessages.push(`❌ For "${courseType}": Min (${min}) cannot exceed Max (${max})`);
      }
      if (min > courseTotal) {
        errorMessages.push(`❌ For "${courseType}": Min (${min}) cannot exceed Total credits (${courseTotal})`);
      }
      if (max > courseTotal) {
        errorMessages.push(`❌ For "${courseType}": Max (${max}) cannot exceed Total credits (${courseTotal})`);
      }
      
      sumMin += min;
      sumMax += max;
    }

    if (errorMessages.length > 0) {
      return errorMessages.join('\n');
    }

    if (sumMin > total) {
      return `❌ Sum of Min credits (${sumMin}) exceeds Total credits (${total})`;
    }

    if (sumMax > total) {
      return `❌ Sum of Max credits (${sumMax}) exceeds Total credits (${total})`;
    }

    return null;
  };

  // ============================================
  // HANDLE UPDATE
  // ============================================

  const handleUpdate = async () => {
    if (!selectedTerm) {
      alert('Please select a term first.');
      return;
    }

    const validationError = validateAllFields();
    if (validationError) {
      alert(`❌ Validation Error:\n${validationError}`);
      return;
    }

    const total = parseFloat(editableTotalCredits) || 0;
    const minCredits = parseFloat(editableMinCredits) || 0;
    const ownElectives = parseInt(editableOwnElectives) || 0;
    const otherElectives = parseInt(editableOtherElectives) || 0;

    const updateData = {
      semester_id: parseInt(selectedTerm),
      min_credits: minCredits,
      total_credits: total,
      own_curriculum_electives: ownElectives,
      other_curriculum_electives: otherElectives,
      start_date: startDate ? startDate.format('DD-MM-YYYY') : null,
      start_time: startTime ? startTime.format('hh:mm A') : null,
      end_date: endDate ? endDate.format('DD-MM-YYYY') : null,
      end_time: endTime ? endTime.format('hh:mm A') : null,
      course_limits: courseStructure.map((item) => ({
        course_type: item.course_type,
        min_credits: parseFloat(editableCourseMinCredits[item.course_type]) || 0,
        max_credits: parseFloat(editableCourseMaxCredits[item.course_type]) || 0,
        max_students: parseInt(editableMaxStudents[item.course_type])  || 0
      }))
    };

    console.log('📤 Sending update data:', JSON.stringify(updateData, null, 2));
    console.log('📤 URL:', `${API_BASE_URL}/update-registration-settings`);
    
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/update-registration-settings`,
        updateData
      );

      console.log('📥 Response:', response.data);

      if (response.data.status) {
        alert('✅ Registration settings updated successfully!');
        
        console.log('🔄 Reloading data...');
        setRefreshTrigger(prev => prev + 1);
        await loadRegistrationData(selectedTerm);
        console.log('✅ Data reloaded!');
        
      } else {
        alert(`❌ Update failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ Update error:', error);
      if (error.response) {
        alert(`❌ Update failed: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        alert('❌ No response from server. Please check if backend is running.');
      } else {
        alert(`❌ Update failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PDF EXPORT
  // ============================================

  const exportPDF = async () => {
    if (!selectedTerm || !dataLoaded) {
      alert('Please load data first before exporting.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      console.log('📄 Generating PDF with fresh data...');
      console.log('📄 selectedTerm:', selectedTerm);
      
      const freshResponse = await axios.get<RegistrationSetupResponse>(
        `${API_BASE_URL}/registration-setup/${selectedTerm}`
      );
      
      console.log('📥 Fresh data for PDF:', freshResponse.data);
      
      if (!freshResponse.data.status || !freshResponse.data.data) {
        alert('Failed to fetch fresh data for PDF. Please try again.');
        setIsGeneratingPDF(false);
        return;
      }
      
      const { semester, course_structure } = freshResponse.data.data;
      
      const courseDetailsPromises = course_structure.map(async (item) => {
        try {
          const response = await axios.get<ApiResponse<EnrollResponse>>(
            `${API_BASE_URL}/course-enroll-details/${selectedTerm}/${encodeURIComponent(item.course_type)}`
          );
          
          if (response.data.status && response.data.data) {
            const courses = response.data.data.courses.map((course: any) => ({
              crs_code: course.crs_code || '',
              course_title: `${course.crs_code} - ${course.crs_title}`,
              credits: course.total_credits || 0,
              students_registered: course.registered_count || 0
            }));
            
            return {
              type: item.course_type,
              courses: courses
            };
          }
          return {
            type: item.course_type,
            courses: []
          };
        } catch (error) {
          console.error(`Error fetching courses for ${item.course_type}:`, error);
          return {
            type: item.course_type,
            courses: []
          };
        }
      });

      const courseDetails = await Promise.all(courseDetailsPromises);

      const semesterId = parseInt(selectedTerm);
      console.log('📤 semester_id being sent:', semesterId);

      const payload = {
        semester_id: semesterId,
        institute_name: "IonIdea Institute of Technology and Management",
        department: "Department of Computer Science & Engineering",
        program: String(programs.find(p => p.pgm_id.toString() === selectedProgram)?.program_name || "").trim(),
        curriculum: String(curriculumName || "").trim(),
        term: String(selectedTermName || "").trim(),
        startDate: startDate ? startDate.format('DD-MM-YYYY') : "",
        startTime: startTime ? startTime.format('hh:mm A') : "",
        endDate: endDate ? endDate.format('DD-MM-YYYY') : "",
        endTime: endTime ? endTime.format('hh:mm A') : "",
        totalCredits: semester.max_credit || 0,
        ownCurriculumElectives: semester.own_elective || 0,
        otherCurriculumElectives: semester.other_elective || 0,
        minCredits: semester.min_credit || 0,
        maxCredits: semester.max_credit || 0,
        courseCreditSummary: course_structure.map(item => ({
          type_of_course: item.course_type,
          total_credits: item.total_credits
        })),
        courseTypeLimits: course_structure.map(item => ({
          course_type_desc: item.course_type,
          stud_min_crs_enroll: item.min_credits || 0,
          stud_max_crs_enroll: item.max_credits || 0,
          students_registered: item.students_registered || 0
        })),
        studentsRegistered: course_structure.map(item => ({
          course_type_desc: item.course_type,
          students_registered: item.students_registered || 0
        })),
        courseDetails: courseDetails
      };

      console.log('📤 Sending PDF payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/export-pdf`,
        payload,
        {
          responseType: "blob",
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data instanceof Blob && response.data.size > 0) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Student_Course_Registration_Setup_${curriculumName || 'Curriculum'}_${selectedTermName || 'Term'}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        alert("✅ PDF downloaded successfully!");
      } else {
        alert("Generated PDF is empty. Please try again.");
      }
    } catch (error: any) {
      console.error("Export PDF Error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        alert(`Failed to generate PDF: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        alert('No response from server. Please check if backend is running.');
      } else {
        alert(`Failed to generate PDF: ${error.message}`);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============================================
  // Load Departments
  // ============================================

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await axios.get<ApiResponse<Department[]>>(
          `${API_BASE_URL}/departments`
        );
        if (response.data.status) {
          setDepartments(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    };
    loadDepartments();
  }, []);

  // ============================================
  // Load Programs
  // ============================================

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedProgram("");
    setSelectedCurriculum("");
    setSelectedTerm("");
    setCourseStructure([]);
    setDataLoaded(false);
    setError("");
    setCurriculums([]);
    setTerms([]);
    
    if (deptId) {
      try {
        const response = await axios.get<ApiResponse<Program[]>>(
          `${API_BASE_URL}/programs/${deptId}`
        );
        if (response.data.status) {
          setPrograms(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load programs:', error);
      }
    }
  };

  // ============================================
  // Load Curriculums
  // ============================================

  const handleProgramChange = async (programId: string) => {
  console.log('🔍 [handleProgramChange] Called with programId:', programId);
  
  setSelectedProgram(programId);
  setSelectedCurriculum("");
  setSelectedTerm("");
  setCourseStructure([]);
  setDataLoaded(false);
  setError("");
  setCurriculums([]);
  setTerms([]);
  
  if (programId) {
    try {
      const url = `${API_BASE_URL}/curriculums/${programId}`;
      console.log('🔍 [handleProgramChange] Fetching from URL:', url);
      
      const response = await axios.get<ApiResponse<Curriculum[]>>(url);
      console.log('📋 [handleProgramChange] Full response:', response.data);
      
      if (response.data.status) {
        const curriculumData = response.data.data || [];
        console.log('📋 [handleProgramChange] Available curriculums:', curriculumData);
        
        setCurriculums(curriculumData);
        // NO AUTO-SELECTION - User must select manually
      }
    } catch (error: any) {
      console.error('❌ [handleProgramChange] Error loading curriculums:', error);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
    }
  }
};

  // ============================================
  // Load Terms for Curriculum
  // ============================================

  const loadTermsForCurriculum = async (curriculumId: string) => {
  if (!curriculumId) return;
  
  console.log('🔍 [loadTermsForCurriculum] Called with curriculumId:', curriculumId);
  
  try {
    const url = `${API_BASE_URL}/terms/${curriculumId}`;
    console.log(`🔍 [loadTermsForCurriculum] Fetching from URL: ${url}`);
    
    const response = await axios.get<ApiResponse<Term[]>>(url);
    console.log('📥 [loadTermsForCurriculum] Full response:', response.data);
    
    if (response.data.status) {
      const termData = response.data.data || [];
      console.log(`📥 [loadTermsForCurriculum] Found ${termData.length} terms`);
      
      setTerms(termData);
      // NO AUTO-SELECTION - User must select manually
    }
  } catch (error: any) {
    console.error('❌ [loadTermsForCurriculum] Error loading terms:', error);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
};

  // ============================================
  // Handle Curriculum Change (manual)
  // ============================================

  const handleCurriculumChange = async (curriculumId: string) => {
    console.log('🔍 Curriculum selected manually:', curriculumId);
    
    const selected = curriculums.find(
      (c) => c.curriculum_id.toString() === curriculumId
    );
    console.log('🔍 Selected curriculum object:', selected);
    
    setSelectedCurriculum(curriculumId);
    setCurriculumName(selected?.curriculum_name || "");
    setSelectedTerm("");
    setCourseStructure([]);
    setDataLoaded(false);
    setError("");
    setTerms([]);
    
    if (curriculumId) {
      await loadTermsForCurriculum(curriculumId);
    }
  };

  // ============================================
  // Handle Term Change
  // ============================================

  const handleTermChange = async (semesterId: string) => {
    const selected = terms.find(
      (t) => t.semester_id.toString() === semesterId
    );
    console.log('🔍 Term selected:', selected);
    setSelectedTerm(semesterId);
    setSelectedTermName(selected?.term_name || "");
    setCourseStructure([]);
    setDataLoaded(false);
    setError("");
    
    if (semesterId) {
      await loadRegistrationData(semesterId);
    }
  };

  // ============================================
  // Custom TextField
  // ============================================

  const customTextField = (params: any) => (
  <TextField
    {...params}
    size="small"
    sx={{
      '& .MuiOutlinedInput-root': {
        height: '38px', /* Match button height */
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        '& fieldset': {
          borderColor: '#d0d7de',
          borderWidth: '1px',
        },
        '&:hover fieldset': {
          borderColor: '#d0d7de',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#1976d2',
          borderWidth: '2px',
        },
      },
      '& .MuiInputBase-input': {
        fontSize: '13px',
        padding: '6px 12px',
        height: '24px',
      },
    }}
  />
);

  // ============================================
  // Render
  // ============================================

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="iems-container">
        <div className="iems-panel-heading">
          <h2>Registration Setup</h2>
        </div>

        <div className="iems-panel-body">
          <div className="form-row">
            <div className="form-group">
              <label>Department*</label>
              <select
                value={selectedDept}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Program*</label>
              <select
                value={selectedProgram}
                onChange={(e) => handleProgramChange(e.target.value)}
                disabled={!selectedDept || loading}
              >
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program.pgm_id} value={program.pgm_id}>
                    {program.program_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Curriculum*</label>
              <select
                value={selectedCurriculum}
                onChange={(e) => handleCurriculumChange(e.target.value)}
                disabled={!selectedProgram || loading}
              >
                <option value="">Select Curriculum</option>
                {curriculums.map((curriculum) => (
                  <option key={curriculum.curriculum_id} value={curriculum.curriculum_id}>
                    {curriculum.curriculum_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Term*</label>
              <select
                value={selectedTerm}
                onChange={(e) => handleTermChange(e.target.value)}
                disabled={!selectedCurriculum || loading}
              >
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term.semester_id} value={term.semester_id}>
                    {term.term_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-datetime">
            <div className="form-group">
              <label>Start Date*</label>
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="DD-MM-YYYY"
                slots={{ textField: customTextField }}
              />
            </div>

            <div className="form-group">
              <label>Start Time*</label>
              <TimePicker
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                format="hh:mm A"
                ampm
                slots={{ textField: customTextField }}
              />
            </div>

            <div className="form-group">
              <label>End Date*</label>
              <DatePicker
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="DD-MM-YYYY"
                slots={{ textField: customTextField }}
              />
            </div>

            <div className="form-group">
              <label>End Time*</label>
              <TimePicker
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                format="hh:mm A"
                ampm
                slots={{ textField: customTextField }}
              />
            </div>

            <div className="form-group export-btn-wrapper">
              <label>&nbsp;</label>
              {dataLoaded && (
                <button
                  className="export-btn"
                  onClick={exportPDF}
                  disabled={isGeneratingPDF || loading}
                >
                  <span className="export-icon">📄</span>
                  {isGeneratingPDF ? "Generating..." : "Export PDF"}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-container">
            <p className="error-text">❌ {error}</p>
          </div>
        )}

        {dataLoaded && courseStructure.length > 0 ? (
          <div className="table-container">
            <div className="iems-summary">
              <div className="summary-row">
                <span className="summary-label">
                  {selectedTermName || "Semester"} | Total credits :
                </span>
                <span className="summary-value">{semesterData?.max_credit || 0}</span>
              </div>

              <div className="summary-row summary-row-editable">
                <span className="summary-label">
                  Total credits student can enroll for {selectedTermName || "Semester"} :
                </span>
                <input
                  type="number"
                  className="summary-input"
                  value={editableTotalCredits}
                  onChange={(e) => setEditableTotalCredits(e.target.value)}
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="summary-row summary-row-editable">
                <span className="summary-label">
                  Number of open-electives student can opt from - {curriculumName || "Curriculum"} :
                </span>
                <input
                  type="number"
                  className="summary-input"
                  value={editableOwnElectives}
                  onChange={(e) => setEditableOwnElectives(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>

              <div className="summary-row summary-row-editable">
                <span className="summary-label">
                  Number of open-electives student can opt from other curriculum :
                </span>
                <input
                  type="number"
                  className="summary-input"
                  value={editableOtherElectives}
                  onChange={(e) => setEditableOtherElectives(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <table className="iems-table">
              <thead>
                <tr>
                  <th>SI. No.</th>
                  <th>Type of course</th>
                  <th>Total credits</th>
                  <th colSpan={2}>No. of credits student can enroll</th>
                  <th>Max students allowed to enroll</th>
                  <th>Students registered</th>
                </tr>
                <tr>
                  <th className="sub-header"></th>
                  <th className="sub-header"></th>
                  <th className="sub-header"></th>
                  <th className="sub-header">Min</th>
                  <th className="sub-header">Max</th>
                  <th className="sub-header"></th>
                  <th className="sub-header"></th>
                </tr>
              </thead>
              <tbody>
                {courseStructure.map((item, index) => {
                  const warning = getValidationWarning(item.course_type);
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.course_type}</td>
                      <td>{item.total_credits}</td>
                      <td>
                        <input
                          type="number"
                          className={`table-input ${warning ? 'invalid' : ''}`}
                          value={editableCourseMinCredits[item.course_type] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditableCourseMinCredits({
                              ...editableCourseMinCredits,
                              [item.course_type]: value
                            });
                          }}
                          min="0"
                          max={item.total_credits}
                          step="0.5"
                        />
                        {warning && (
                          <span className="validation-warning">{warning}</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`table-input ${warning ? 'invalid' : ''}`}
                          value={editableCourseMaxCredits[item.course_type] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditableCourseMaxCredits({
                              ...editableCourseMaxCredits,
                              [item.course_type]: value
                            });
                          }}
                          min="0"
                          max={item.total_credits}
                          step="0.5"
                        />
                        {warning && (
                          <span className="validation-warning">{warning}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="enroll-btn"
                          onClick={() => handleEnrollClick(item.course_type)}
                        >
                          Enroll
                        </button>
                      </td>
                      <td>{item.students_registered || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

             <div className="notes-container">
      <p className="note">
        <strong>Note:</strong>
      </p>
      <p className="note">
        1. For each course type, choose the Min value & Max value from the interval of lowest credit and total credits. The Min value should not exceed the Max value.
      </p>
      <p className="note">
        2. The sum of Min values must be lesser than or equal to the total number of credits students can enroll.
      </p>
    </div>

    <div className="button-section">
      <div className="button-row">
        <button className="update-btn" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </button>
        <button className="cancel-btn">Cancel</button>
      </div>
      <div className="export-row">
        <button
          className="export-btn-bottom"
          onClick={exportPDF}
          disabled={isGeneratingPDF || loading || !dataLoaded}
        >
          <span className="export-icon">📄</span>
          {isGeneratingPDF ? "Generating..." : "Export PDF"}
        </button>
      </div>
    </div>
  </div>
) : null}

        {loading && (
          <div className="loading-container">
            <p>Loading data...</p>
          </div>
        )}
      </div>

      <SetCourseEnrollLimitModal
        open={isModalOpen}
        curriculumName={curriculumName}
        termName={selectedTermName}
        courseType={selectedCourseType}
        courses={modalCourses}
        semesterData={{
          start_date: semesterData?.start_date,
          start_time: semesterData?.start_time,
          end_date: semesterData?.end_date,
          end_time: semesterData?.end_time,
        }}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleModalUpdate}
      />
    </LocalizationProvider>
  );
};

export default DepartmentDropdown;