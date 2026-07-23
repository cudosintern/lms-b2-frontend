import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CurriculumPageLayout from "./CurriculumPageLayout";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/api";
import { LmsApiEndpoint } from "../../utils/ApiEndpoint/lmsApiEndpoint";
import { Info, HelpCircle, List, ArrowUpDown } from "lucide-react";

interface CourseItem {
  id: string;
  courseId: number | null;
  sectionId: string;  
  section: string;
  code: string;
  title: string;
  type: string;
  credits: number;
  totalMarks: number | null;
  owner: string;
  reviewer: string;
  mode: string;
  instructor: string;
  status: string;
}

interface CurriculumOption {
  id: string;
  code: string;
  desc: string;
}

interface SemesterOption {
  id: string;
  code: string;
  desc: string;
}

interface SectionOption {
  id: string;
  name: string;
}

interface RegistrationStatusData {
  registration_open: boolean;
  academic_batch_id: number;
  semester_id: number;
  registration_start?: string;
  registration_end?: string;
}

interface RegistrationDueDateData {
  status: boolean;
  enroll_start_date?: string;
  enroll_start_time?: string;
  enroll_end_date?: string;
  enroll_end_time?: string;
  formatted_enroll_start_date?: string;
  formatted_enroll_start_time?: string;
  formatted_enroll_end_date?: string;
  formatted_enroll_end_time?: string;
  is_registration_open?: boolean;
  registration_status?: string;
  validate_date?: number;
  status_message?: string;
  status_color?: string;
  remaining_days?: number;
  remaining_hours?: number;
  remaining_minutes?: number;
  remaining_seconds?: number;
}

interface RegisteredCourseApiItem {
  mcstd_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  course_type: string;
  component?: string | null;
  credits: number;
  section_id?: number | null;
  section_name?: string | null;
  batch_id?: number | null;
  registration_flag?: string | null;
  status?: number | string | null;
  registered_date?: string | null;
}

interface ApiListResponse<T> {
  status: boolean;
  message: string;
  data: T[];
}

interface ApiStatusResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

const toPositiveInteger = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const CourseRegistrationPage: React.FC = () => {
  const location = useLocation();

  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [curriculumsLoading, setCurriculumsLoading] = useState(false);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatusData | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationDueDate, setRegistrationDueDate] = useState<RegistrationDueDateData | null>(null);

  // Table controls
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof CourseItem; direction: "asc" | "desc" } | null>({
    key: "code",
    direction: "asc"
  });

  // Course registrations state
  const [courses, setCourses] = useState<CourseItem[]>([]);

  // Assign Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState<CourseItem | null>(null);
  const [assignSection, setAssignSection] = useState("");
  const [assignInstructor, setAssignInstructor] = useState("");

  const queryStudentContext = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);

    const studentId = toPositiveInteger(searchParams.get("student_id"));
    const baseAcademicBatchId = toPositiveInteger(
      searchParams.get("academic_batch_id"),
    );
    const baseSemesterId = toPositiveInteger(searchParams.get("semester_id"));

    const isValid = Boolean(
      studentId && baseAcademicBatchId && baseSemesterId,
    );

    return {
      studentId,
      baseAcademicBatchId,
      baseSemesterId,
      isValid,
    };
  }, [location.search]);

  const { studentId, baseAcademicBatchId, baseSemesterId } = queryStudentContext;

  const baseDetailsUnavailableMessage = !queryStudentContext.isValid
    ? "Student academic batch details are unavailable."
    : "";

  const registrationActionsDisabled =
    Boolean(baseDetailsUnavailableMessage) ||
    registrationStatusLoading ||
    !selectedCurriculum ||
    !selectedTerm ||
    registrationDueDate?.is_registration_open === false ||
    registrationStatus?.registration_open !== true;

  const registrationDisplayMessage =
    registrationDueDate?.status_message?.trim() || registrationMessage;

  // Fetch curriculums
  useEffect(() => {
    if (!baseAcademicBatchId || !baseSemesterId) {
      setCurriculums([]);
      setSelectedCurriculum("");
      setSemesters([]);
      setSelectedTerm("");
      setSections([]);
      setCourses([]);
      setRegistrationStatus(null);
      setRegistrationDueDate(null);
      setRegistrationMessage(baseDetailsUnavailableMessage);
      return;
    }

    const fetchCurriculums = async () => {
      setCurriculumsLoading(true);
      try {
        const res = await axiosInstance.get<
          ApiListResponse<{
            academic_batch_id: number;
            academic_batch_code: string;
            academic_batch_desc: string;
          }>
        >(LmsApiEndpoint.studentCourseRegistration.registrationAcademicBatchList, {
          params: {
            base_academic_batch_id: baseAcademicBatchId,
          },
        });

        if (res.data?.status) {
          const mapped = (res.data.data || []).map((batch) => ({
            id: String(batch.academic_batch_id),
            code: batch.academic_batch_code,
            desc: batch.academic_batch_desc,
          }));

          setCurriculums(mapped);
        } else {
          setCurriculums([]);
          toast.error(res.data?.message || "Unable to load curriculum list.");
        }
      } catch (error: any) {
        setCurriculums([]);
        toast.error(
          error?.response?.data?.message || "Unable to load curriculum list.",
        );
      } finally {
        setCurriculumsLoading(false);
      }
    };

    fetchCurriculums();
  }, [baseAcademicBatchId, baseSemesterId, baseDetailsUnavailableMessage]);

  useEffect(() => {
    if (!selectedCurriculum) {
      setSemesters([]);
      setSelectedTerm("");
      setSections([]);
      setCourses([]);
      setRegistrationStatus(null);
      setRegistrationDueDate(null);
      setRegistrationMessage(baseDetailsUnavailableMessage);
      return;
    }

    if (!baseSemesterId) {
      setSemesters([]);
      setSelectedTerm("");
      setSections([]);
      setCourses([]);
      setRegistrationStatus(null);
      setRegistrationDueDate(null);
      setRegistrationMessage("Student academic batch details are unavailable.");
      return;
    }

    const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
        const res = await axiosInstance.get<
          ApiListResponse<{
            semester_id: number;
            semester: number;
            semester_code: string;
            semester_desc: string;
            term_name: string;
          }>
        >(LmsApiEndpoint.studentCourseRegistration.registrationSemesterList, {
          params: {
            registration_academic_batch_id: Number(selectedCurriculum),
            base_semester_id: baseSemesterId,
          },
        });

        if (res.data?.status) {
          const mapped = (res.data.data || []).map((semester) => ({
            id: String(semester.semester_id),
            code: semester.semester_code,
            desc:
              semester.semester_desc?.trim() ||
              semester.term_name?.trim() ||
              `Semester ${semester.semester}`,
          }));

          setSemesters(mapped);
        } else {
          setSemesters([]);
          toast.error(res.data?.message || "Unable to load term list.");
        }
      } catch (error: any) {
        setSemesters([]);
        toast.error(error?.response?.data?.message || "Unable to load term list.");
      } finally {
        setSemestersLoading(false);
      }
    };

    fetchSemesters();
  }, [selectedCurriculum, baseSemesterId, baseDetailsUnavailableMessage]);

  useEffect(() => {
    if (curriculums.length === 0) {
      setSelectedCurriculum("");
      return;
    }

    if (!selectedCurriculum || !curriculums.some((curriculum) => curriculum.id === selectedCurriculum)) {
      setSelectedCurriculum(curriculums[0].id);
    }
  }, [curriculums, selectedCurriculum]);

  useEffect(() => {
    if (semesters.length === 0) {
      setSelectedTerm("");
      return;
    }

    if (!selectedTerm || !semesters.some((semester) => semester.id === selectedTerm)) {
      setSelectedTerm(semesters[0].id);
    }
  }, [semesters, selectedTerm]);

  useEffect(() => {
    if (!selectedCurriculum || !selectedTerm) {
      setSections([]);
      setCourses([]);
      setRegistrationStatus(null);
      setRegistrationDueDate(null);
      setRegistrationMessage(baseDetailsUnavailableMessage);
      return;
    }

    const fetchRegistrationStatus = async () => {
      setRegistrationStatusLoading(true);
      try {
        const res = await axiosInstance.get<ApiStatusResponse<RegistrationStatusData>>(
          LmsApiEndpoint.studentCourseRegistration.checkRegistrationStatus,
          {
            params: {
              academic_batch_id: Number(selectedCurriculum),
              semester_id: Number(selectedTerm),
            },
          },
        );

        if (res.data?.status) {
          setRegistrationStatus(res.data.data || null);
          setRegistrationMessage(res.data.message || "");
        } else {
          setRegistrationStatus(null);
          setRegistrationMessage(res.data?.message || "");
          toast.error(res.data?.message || "Unable to check registration status.");
        }
      } catch (error: any) {
        setRegistrationStatus(null);
        setRegistrationMessage("");
        toast.error(
          error?.response?.data?.message || "Unable to check registration status.",
        );
      } finally {
        setRegistrationStatusLoading(false);
      }
    };

    fetchRegistrationStatus();
  }, [selectedCurriculum, selectedTerm, baseDetailsUnavailableMessage]);

  useEffect(() => {
    if (!selectedCurriculum || !selectedTerm) {
      setRegistrationDueDate(null);
      return;
    }

    const fetchRegistrationDueDate = async () => {
      try {
        const res = await axiosInstance.get<
          ApiStatusResponse<RegistrationDueDateData>
        >(LmsApiEndpoint.studentCourseRegistration.validateRegistrationDueDate, {
          params: {
            academic_batch_id: Number(selectedCurriculum),
            semester_id: Number(selectedTerm),
          },
        });

        if (res.data?.status) {
          setRegistrationDueDate(res.data.data || null);
        } else {
          setRegistrationDueDate(null);
        }
      } catch {
        setRegistrationDueDate(null);
      }
    };

    fetchRegistrationDueDate();
  }, [selectedCurriculum, selectedTerm]);

  useEffect(() => {
    if (!selectedCurriculum || !selectedTerm) {
      setSections([]);
      return;
    }

    const fetchSections = async () => {
      setSectionsLoading(true);
      try {
        const res = await axiosInstance.post<
          ApiListResponse<{
            section_id: number;
            section_name: string;
          }>
        >(LmsApiEndpoint.studentCourseRegistration.registrationSectionList, {
          academic_batch_id: Number(selectedCurriculum),
          semester_id: Number(selectedTerm),
        });

        if (res.data?.status) {
          const mapped = (res.data.data || []).map((section) => ({
            id: String(section.section_id),
            name: section.section_name,
          }));
          setSections(mapped);
        } else {
          setSections([]);
          toast.error(res.data?.message || "Unable to load section list.");
        }
      } catch (error: any) {
        setSections([]);
        toast.error(
          error?.response?.data?.message || "Unable to load section list.",
        );
      } finally {
        setSectionsLoading(false);
      }
    };

    fetchSections();
  }, [selectedCurriculum, selectedTerm]);

  useEffect(() => {
    if (registrationActionsDisabled && isAssignModalOpen) {
      setIsAssignModalOpen(false);
    }
  }, [registrationActionsDisabled, isAssignModalOpen]);

  useEffect(() => {
    if (
      !studentId ||
      !baseAcademicBatchId ||
      !baseSemesterId ||
      !selectedCurriculum ||
      !selectedTerm
    ) {
      setCourses([]);
      return;
    }

    const fetchRegisteredCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await axiosInstance.post<
          ApiListResponse<RegisteredCourseApiItem>
        >(LmsApiEndpoint.studentCourseRegistration.registeredCourses, {
          parent_academic_batch_id: baseAcademicBatchId,
          parent_semester_id: baseSemesterId,
          student_id: studentId,
        });

        if (res.data?.status) {
          const mapped = (res.data.data || []).map((course) => ({
            id: String(course.mcstd_id ?? course.course_id),
            courseId:
              typeof course.course_id === "number" ? course.course_id : null,
            sectionId:
              course.section_id !== null && course.section_id !== undefined
                ? String(course.section_id)
                : "",
            section: course.section_name?.trim() || "",
            code: course.course_code || "",
            title: course.course_name || "",
            type: course.course_type || course.component || "",
            credits:
              typeof course.credits === "number" ? course.credits : 0,
            totalMarks: null,
            owner: "",
            reviewer: "",
            mode: "",
            instructor: "",
            status:
              course.registration_flag ||
              course.component ||
              (course.status !== null && course.status !== undefined
                ? String(course.status)
                : ""),
          }));

          setCourses(mapped);
        } else {
          setCourses([]);
          toast.error(res.data?.message || "Unable to load registered courses.");
        }
      } catch (error: any) {
        setCourses([]);
        toast.error(
          error?.response?.data?.message || "Unable to load registered courses.",
        );
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchRegisteredCourses();
  }, [
    studentId,
    baseAcademicBatchId,
    baseSemesterId,
    selectedCurriculum,
    selectedTerm,
  ]);

  // Assign modal triggers
  const openAssignModal = (course: CourseItem) => {
    if (registrationActionsDisabled) {
      toast.info(registrationDisplayMessage || "Registration is closed.");
      return;
    }

    setSelectedCourseForAssign(course);
    setAssignSection(course.sectionId || "");
    setAssignInstructor(course.instructor || "");
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForAssign || registrationActionsDisabled) return;

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourseForAssign.id) {
        const selectedSectionOption = sections.find(
          (section) => section.id === assignSection,
        );
        return {
          ...c,
          sectionId: assignSection,
          section: selectedSectionOption?.name || "",
          instructor: assignInstructor,
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    setIsAssignModalOpen(false);
    toast.success(`Section & Instructor updated for ${selectedCourseForAssign.title}!`);
  };

  const handleClearAssignment = () => {
    if (!selectedCourseForAssign || registrationActionsDisabled) return;

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourseForAssign.id) {
        return {
          ...c,
          sectionId: "",
          section: "",
          instructor: "",
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    setIsAssignModalOpen(false);
    toast.info(`Assignment cleared for ${selectedCourseForAssign.title}.`);
  };

  // Sorting logic
  const handleSort = (key: keyof CourseItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedCourses = useMemo(() => {
    if (!sortConfig) return courses;
    const sorted = [...courses].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [courses, sortConfig]);

  // Filtering logic
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return sortedCourses;
    const query = searchQuery.toLowerCase();
    return sortedCourses.filter(
      c =>
        c.code.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.instructor.toLowerCase().includes(query) ||
        c.owner.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query)
    );
  }, [sortedCourses, searchQuery]);

  // Pagination logic
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredCourses.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredCourses, currentPage, entriesPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / entriesPerPage));

  return (
    <CurriculumPageLayout>
      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Dark Header Title Bar */}
        <div className="bg-[#1e293b] text-white px-5 py-3 flex items-center justify-between shadow-sm">
          <span className="text-[15px] font-semibold tracking-wide">Student to course Registration</span>
          <div className="flex items-center gap-3">
            <button className="text-white/80 hover:text-white p-1 rounded hover:bg-slate-700/50 transition" title="View layout options">
              <List size={17} />
            </button>
            <button className="text-white/80 hover:text-white p-1 rounded hover:bg-slate-700/50 transition" title="Page Information">
              <Info size={17} />
            </button>
            <button className="text-white/80 hover:text-white p-1 rounded hover:bg-slate-700/50 transition" title="Get Help">
              <HelpCircle size={17} />
            </button>
          </div>
        </div>

        {/* Dropdowns Selection Panel */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-8 text-[13px] text-gray-700 dark:text-gray-300">
          {/* Curriculum Select */}
          <div className="flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">
              Curriculum:<span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <select
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-500 text-xs shadow-xs transition-colors w-72 h-8"
              value={selectedCurriculum}
              onChange={(e) => {
                setSelectedCurriculum(e.target.value);
                setSemesters([]);
                setSelectedTerm("");
                setSections([]);
                setCourses([]);
                setRegistrationStatus(null);
                setRegistrationDueDate(null);
                setRegistrationMessage("");
                setCurrentPage(1);
              }}
              disabled={curriculumsLoading || Boolean(baseDetailsUnavailableMessage)}
            >
              <option value="">{curriculumsLoading ? "Loading..." : "Select Curriculum"}</option>
              {curriculums.map(c => (
                <option key={c.id} value={c.id}>{c.desc}</option>
              ))}
            </select>
          </div>

          {/* Term/Semester Select */}
          <div className="flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">
              Term:<span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <select
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-500 text-xs shadow-xs transition-colors h-8 w-44 disabled:opacity-50"
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setSections([]);
                setCourses([]);
                setRegistrationStatus(null);
                setRegistrationDueDate(null);
                setRegistrationMessage("");
                setCurrentPage(1);
              }}
              disabled={!selectedCurriculum || semestersLoading || Boolean(baseDetailsUnavailableMessage)}
            >
              <option value="">{semestersLoading ? "Loading..." : "Select Term"}</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.desc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs">
          {baseDetailsUnavailableMessage ? (
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {baseDetailsUnavailableMessage}
            </span>
          ) : registrationStatusLoading ? (
            <span className="text-slate-500 dark:text-slate-400">Checking registration status...</span>
          ) : registrationDisplayMessage ? (
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`font-semibold ${
                  registrationDueDate?.is_registration_open === false ||
                  registrationStatus?.registration_open === false
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {registrationDisplayMessage}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Select Curriculum and Term to check registration status.
            </span>
          )}
        </div>

        {/* Table Controls (Show entries and Search) */}
        <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 focus:outline-none text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto">
            <span>Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 focus:outline-none text-xs w-full sm:w-64"
            />
          </div>
        </div>

        {/* Course Registration Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-y border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 uppercase font-semibold">
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600 w-16">SI No.</th>
                <th 
                  onClick={() => handleSort("section")} 
                  className="px-4 py-3 border-r border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Section</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Code</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Course Title</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Core / Elective</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600 text-center">Credits</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600 text-center">Total Marks</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Course Owner</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Course Reviewer</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Mode</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-600">Section/Course Instructor</th>
                <th className="px-4 py-3">Student to Course Registration Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((c, index) => {
                  const siNo = (currentPage - 1) * entriesPerPage + index + 1;

                  return (
                    <tr key={c.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">{siNo}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 font-semibold text-center">{c.section || "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">{c.code}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100">{c.title}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300">{c.credits}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center font-semibold text-slate-500">{c.totalMarks ?? "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350">{c.owner || "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355">{c.reviewer || "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{c.mode || "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <div className="flex flex-col gap-1">
                          {c.instructor ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{c.instructor}</span>
                          ) : null}
                          {registrationActionsDisabled ? (
                            <span className="font-bold text-slate-400 dark:text-slate-500 no-underline cursor-not-allowed opacity-70 select-none">
                              Add / Edit
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAssignModal(c)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline transition text-left cursor-pointer"
                            >
                              Add / Edit
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1 py-1">
                          <span className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold tracking-wider uppercase text-center shadow-xs cursor-pointer select-none">
                            {c.status || "-"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50/20">
                    {coursesLoading
                      ? "Loading courses..."
                      : selectedCurriculum && selectedTerm
                        ? "No data matched the search query."
                        : "No data available in table"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredCourses.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredCourses.length)} of {filteredCourses.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || filteredCourses.length === 0}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || filteredCourses.length === 0}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
            >
              Next →
            </button>
          </div>
        </div>

      </div>

      {/* Modal Backdrop / Overlay for assigning section & instructor */}
      {isAssignModalOpen && selectedCourseForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsAssignModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md mx-auto my-6 z-50 px-4">
            <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl outline-none focus:outline-none overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-solid border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Assign Section & Instructor
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {selectedCourseForAssign.code} - {selectedCourseForAssign.title}
                  </p>
                </div>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 float-right text-2xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  ×
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAssignSubmit}>
                <div className="relative p-6 flex-auto space-y-4 text-xs">
                  {/* Section select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Section:
                    </label>
                    <select
                      value={assignSection}
                      onChange={(e) => setAssignSection(e.target.value)}
                      disabled={sectionsLoading || sections.length === 0}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">
                        {sectionsLoading ? "Loading sections..." : "Select Section"}
                      </option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Instructor/Mentor select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Course Instructor (Mentor): <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={assignInstructor}
                      onChange={(e) => setAssignInstructor(e.target.value)}
                      placeholder="Enter Instructor"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-wrap items-center justify-between p-4 border-t border-solid border-slate-200 dark:border-slate-700 rounded-b bg-slate-50 dark:bg-slate-800/30 gap-2">
                  <div>
                    {(selectedCourseForAssign.section || selectedCourseForAssign.instructor) && (
                      <button
                        type="button"
                        onClick={handleClearAssignment}
                        disabled={registrationActionsDisabled}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded text-xs font-semibold transition cursor-pointer"
                      >
                        Clear Assignment
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registrationActionsDisabled}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </CurriculumPageLayout>
  );
};

export default CourseRegistrationPage;
