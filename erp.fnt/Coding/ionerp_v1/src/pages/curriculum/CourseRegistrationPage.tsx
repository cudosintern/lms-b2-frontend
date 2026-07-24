import React, { useState, useEffect, useMemo } from "react";
import CurriculumPageLayout from "./CurriculumPageLayout";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/api";
import { LmsApiEndpoint } from "../../utils/ApiEndpoint/lmsApiEndpoint";
import { Info, HelpCircle, List, ArrowUpDown } from "lucide-react";

import {
  CourseItem,
  AVAILABLE_MENTORS,
  DEFAULT_COURSES,
} from "./types/courseRegistration";

const CourseRegistrationPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [curriculumsLoading, setCurriculumsLoading] = useState(false);
  const [semestersLoading, setSemestersLoading] = useState(false);

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

  // Fetch curriculums
  useEffect(() => {
    const fetchCurriculums = async () => {
      setCurriculumsLoading(true);
      try {
        const url = LmsApiEndpoint.mentoringSession.curriculumList;
        const res = await axiosInstance.get<any>(url);
        if (res.data && res.data.status && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((b: any) => ({
            id: String(b.academic_batch_id),
            code: b.academic_batch_code,
            desc: b.academic_batch_desc || `${b.academic_batch_name || ""} ${b.academic_batch_code || ""}`.trim(),
          }));
          
          // Ensure "B. E in CSE 2022-2026" is in the mapped list
          const hasTarget = mapped.some((m: any) => m.desc.toLowerCase().includes("cse 2022") || m.desc.toLowerCase().includes("2022-2026"));
          if (!hasTarget) {
            mapped.unshift({ id: "999", code: "BE-CSE-2022", desc: "B. E in CSE 2022-2026" });
          }
          setCurriculums(mapped);
        } else {
          setCurriculums([
            { id: "999", code: "BE-CSE-2022", desc: "B. E in CSE 2022-2026" },
            { id: "1", code: "BE-CSE-2019", desc: "B. E in CSE 2019-2023" },
            { id: "2", code: "BE-ECE-2020", desc: "B. E in ECE 2020-2024" },
            { id: "3", code: "BE-ISE-2021", desc: "B. E in ISE 2021-2025" }
          ]);
        }
      } catch (err) {
        setCurriculums([
          { id: "999", code: "BE-CSE-2022", desc: "B. E in CSE 2022-2026" },
          { id: "1", code: "BE-CSE-2019", desc: "B. E in CSE 2019-2023" },
          { id: "2", code: "BE-ECE-2020", desc: "B. E in ECE 2020-2024" },
          { id: "3", code: "BE-ISE-2021", desc: "B. E in ISE 2021-2025" }
        ]);
      } finally {
        setCurriculumsLoading(false);
      }
    };
    fetchCurriculums();
  }, []);

  // Default to B. E in CSE 2022-2026 if loaded
  useEffect(() => {
    if (curriculums.length > 0 && !selectedCurriculum) {
      const defaultCur = curriculums.find(c => c.desc.includes("2022-2026") || c.desc.includes("CSE 2022"));
      if (defaultCur) {
        setSelectedCurriculum(defaultCur.id);
      } else {
        setSelectedCurriculum(curriculums[0].id);
      }
    }
  }, [curriculums, selectedCurriculum]);

  // Fetch terms/semesters based on curriculum
  useEffect(() => {
    if (!selectedCurriculum) {
      setSemesters([]);
      setSelectedTerm("");
      return;
    }
    const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
        const url = `${LmsApiEndpoint.mentoringSession.semestersByCurriculum}/${selectedCurriculum}`;
        const res = await axiosInstance.get<any>(url);
        if (res.data && res.data.status && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((s: any) => {
            const num = s.semester_desc ? s.semester_desc.match(/\d+/) : null;
            const desc = num ? `${num[0]} - Semester` : s.semester_desc;
            return {
              id: String(s.semester_id),
              code: s.semester_code,
              desc: desc,
            };
          });
          const hasSEM1 = mapped.some((s: any) => s.desc.includes("1 - Semester") || s.id === "1");
          if (!hasSEM1 && selectedCurriculum === "999") {
            mapped.unshift({ id: "1", code: "SEM1", desc: "1 - Semester" });
          }
          setSemesters(mapped);
        } else {
          setSemesters([
            { id: "1", code: "SEM1", desc: "1 - Semester" },
            { id: "2", code: "SEM2", desc: "2 - Semester" },
            { id: "3", code: "SEM3", desc: "3 - Semester" },
            { id: "4", code: "SEM4", desc: "4 - Semester" },
            { id: "5", code: "SEM5", desc: "5 - Semester" },
            { id: "6", code: "SEM6", desc: "6 - Semester" },
            { id: "7", code: "SEM7", desc: "7 - Semester" },
            { id: "8", code: "SEM8", desc: "8 - Semester" }
          ]);
        }
      } catch (err) {
        setSemesters([
          { id: "1", code: "SEM1", desc: "1 - Semester" },
          { id: "2", code: "SEM2", desc: "2 - Semester" },
          { id: "3", code: "SEM3", desc: "3 - Semester" },
          { id: "4", code: "SEM4", desc: "4 - Semester" },
          { id: "5", code: "SEM5", desc: "5 - Semester" },
          { id: "6", code: "SEM6", desc: "6 - Semester" },
          { id: "7", code: "SEM7", desc: "7 - Semester" },
          { id: "8", code: "SEM8", desc: "8 - Semester" }
        ]);
      } finally {
        setSemestersLoading(false);
      }
    };
    fetchSemesters();
  }, [selectedCurriculum]);

  // Default to 1 - Semester
  useEffect(() => {
    if (semesters.length > 0 && !selectedTerm) {
      const defaultSem = semesters.find(s => s.desc.includes("1 - Semester") || s.id === "1");
      if (defaultSem) {
        setSelectedTerm(defaultSem.id);
      } else {
        setSelectedTerm(semesters[0].id);
      }
    }
  }, [semesters, selectedTerm]);

  // Load mock course registration list based on selections
  useEffect(() => {
    if (!selectedCurriculum || !selectedTerm) {
      setCourses([]);
      return;
    }

    const key = `${selectedCurriculum}_${selectedTerm}`;
    const stored = localStorage.getItem(`lms_course_reg_${key}`);
    if (stored) {
      try {
        setCourses(JSON.parse(stored));
        return;
      } catch (e) {
        // ignore
      }
    }

    if (DEFAULT_COURSES[key]) {
      setCourses(DEFAULT_COURSES[key]);
      localStorage.setItem(`lms_course_reg_${key}`, JSON.stringify(DEFAULT_COURSES[key]));
    } else {
      // Fallback/Generic mock courses for other terms
      const genericCourses: CourseItem[] = [
        {
          id: `${key}_c1`,
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
          status: "Optional",
        },
        {
          id: `${key}_c2`,
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
          status: "Optional",
        }
      ];
      setCourses(genericCourses);
      localStorage.setItem(`lms_course_reg_${key}`, JSON.stringify(genericCourses));
    }
  }, [selectedCurriculum, selectedTerm]);

  // Assign modal triggers
  const openAssignModal = (course: CourseItem) => {
    setSelectedCourseForAssign(course);
    setAssignSection(course.section || "");
    setAssignInstructor(course.instructor || "");
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForAssign) return;

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourseForAssign.id) {
        return {
          ...c,
          section: assignSection,
          instructor: assignInstructor,
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    const key = `${selectedCurriculum}_${selectedTerm}`;
    localStorage.setItem(`lms_course_reg_${key}`, JSON.stringify(updatedCourses));
    
    setIsAssignModalOpen(false);
    toast.success(`Section & Instructor updated for ${selectedCourseForAssign.title}!`);
  };

  const handleClearAssignment = () => {
    if (!selectedCourseForAssign) return;

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourseForAssign.id) {
        return {
          ...c,
          section: "",
          instructor: "",
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    const key = `${selectedCurriculum}_${selectedTerm}`;
    localStorage.setItem(`lms_course_reg_${key}`, JSON.stringify(updatedCourses));

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
                setSelectedTerm("");
                setCurrentPage(1);
              }}
              disabled={curriculumsLoading}
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
                setCurrentPage(1);
              }}
              disabled={!selectedCurriculum || semestersLoading}
            >
              <option value="">{semestersLoading ? "Loading..." : "Select Term"}</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.desc}</option>
              ))}
            </select>
          </div>
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
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center font-semibold text-slate-500">{c.totalMarks}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350">{c.owner}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355">{c.reviewer || "-"}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{c.mode}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <div className="flex flex-col gap-1">
                          {c.instructor ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{c.instructor}</span>
                          ) : null}
                          <button
                            onClick={() => openAssignModal(c)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline transition text-left cursor-pointer"
                          >
                            Add / Edit
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1 py-1">
                          <span className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold tracking-wider uppercase text-center shadow-xs cursor-pointer select-none">
                            Optional
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pl-1">
                            N/A
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50/20">
                    {selectedCurriculum && selectedTerm ? "No data matched the search query." : "No data available in table"}
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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">-- Select Section --</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  {/* Instructor/Mentor select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Course Instructor (Mentor): <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={assignInstructor}
                      onChange={(e) => setAssignInstructor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    >
                      <option value="">-- Select Instructor --</option>
                      {AVAILABLE_MENTORS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-wrap items-center justify-between p-4 border-t border-solid border-slate-200 dark:border-slate-700 rounded-b bg-slate-50 dark:bg-slate-800/30 gap-2">
                  <div>
                    {(selectedCourseForAssign.section || selectedCourseForAssign.instructor) && (
                      <button
                        type="button"
                        onClick={handleClearAssignment}
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
