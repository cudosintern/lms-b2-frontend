import React, { useMemo, useState, useEffect, useCallback } from "react";
import DataTable from "../../../components/Table/DataTable";
import { useTopicService } from "./topicService";
import EditTopicPage from "./EditTopicPage";
import AssignInstructorModal from "./AssignInstructorModal";
import { SquarePen, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface DropdownOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface TopicRow {
  id: number;
  mapping_id?: number;
  topic_id: number;
  crs_id?: number;
  course_id?: number;
  topic_title: string;
  topic_code: string;
  topic_content?: string;   // ← replaces lesson_schedule in the table
  topic_hrs: string;
  num_of_sessions: number;
  section_id?: number;
  instructor_id?: number;
  instructor_name?: string;
  lesson_schedule?: string; // kept internally
  conduction_date?: string;
  actual_delivery_date?: string;
  marks_expt?: number;
  is_imported?: boolean;
}

interface DropdownState {
  curriculumOptions: DropdownOption[];
  semesterOptions: DropdownOption[];
  courseOptions: DropdownOption[];
  sectionOptions: DropdownOption[];
}

const ManageTopicInstructor: React.FC = () => {
  const topicService = useTopicService();

  const [filters, setFilters] = useState({
    curriculum: "",
    semester: "",
    course: "",
    section: ""
  });

  const [dropdownOptions, setDropdownOptions] = useState<DropdownState>({
    curriculumOptions: [],
    semesterOptions: [],
    courseOptions: [],
    sectionOptions: []
  });

  const [tableData, setTableData] = useState<TopicRow[]>([]);
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);

 // ── Load curriculum on mount ────────────────────────────
  useEffect(() => {
    topicService.getCurriculumList().then((res: any) => {
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setDropdownOptions(prev => ({
        ...prev,
        curriculumOptions: arr.map((item: any) => ({
          value: item.value || item.academic_batch_id || item.id,
          label: item.label || item.academic_batch_name || item.name || `Batch ${item.id}`,
        }))
      }));
    }).catch(console.error);
  }, []);

  // ── Filter semesters when curriculum changes ──────────────────────────
  useEffect(() => {
    if (filters.curriculum) {
      topicService.getSemesterList({ 
        academic_batch_id: Number(filters.curriculum) 
      }).then((res: any) => {
        const arr = Array.isArray(res) ? res : (res?.data || []);
        setDropdownOptions(prev => ({
          ...prev,
          semesterOptions: arr.map((item: any) => ({
            value: item.value || item.semester_id || item.id,
            label: item.label || item.semester_name || item.name || `Semester ${item.id}`,
          }))
        }));
      }).catch(console.error);
    } else {
      setDropdownOptions(prev => ({ ...prev, semesterOptions: [] }));
      setFilters(prev => ({ ...prev, semester: "", course: "", section: "" }));
    }
  }, [filters.curriculum]);

   // ── Load courses when curriculum + semester change ──────────────────
  useEffect(() => {
    if (filters.curriculum && filters.semester) {
      topicService.getCourseList({
        academic_batch_id: Number(filters.curriculum),
        semester_id: Number(filters.semester)
      }).then((res: any) => {
        console.log("Course data from service:", res);
        const arr = Array.isArray(res) ? res : (res?.data || res?.courses || []);
        setDropdownOptions(prev => ({
          ...prev,
          courseOptions: arr.map((item: any) => ({
            value: item.value || item.crs_id || item.course_id || item.id,
            label: item.label || item.crs_title || item.course_name || `Course ${item.id}`,
          }))
        }));
        
        // Reset course if current selection not in filtered list
        if (filters.course) {
          const stillExists = arr.some((item: any) => 
            String(item.value || item.crs_id || item.course_id || item.id) === filters.course
          );
          if (!stillExists) {
            setFilters(prev => ({ ...prev, course: "", section: "" }));
          }
        }
      }).catch(error => {
        console.error("Error fetching courses:", error);
        setDropdownOptions(prev => ({ ...prev, courseOptions: [] }));
      });
    } else {
      setDropdownOptions(prev => ({ ...prev, courseOptions: [] }));
      if (!filters.curriculum || !filters.semester) {
        setFilters(prev => ({ ...prev, course: "", section: "" }));
      }
    }
  }, [filters.curriculum, filters.semester]);

  // ── Load sections when semester/course change ───────────────────────
  useEffect(() => {
    if (filters.semester && filters.curriculum && filters.course) {
      const payload = {
        semester_id: Number(filters.semester),
        academic_batch_id: Number(filters.curriculum),
        course_id: Number(filters.course)
      };

      topicService.getSectionList(payload).then((res: any) => {
        console.log("Section data from service:", res);
        const arr = Array.isArray(res) ? res : [];
        setDropdownOptions(prev => ({
          ...prev,
          sectionOptions: arr.map((item: any) => ({
            value: item.value,
            label: item.label,
          }))
        }));
      }).catch(error => {
        console.error("Error fetching sections:", error);
        setDropdownOptions(prev => ({ ...prev, sectionOptions: [] }));
      });
    } else {
      setDropdownOptions(prev => ({ ...prev, sectionOptions: [] }));
    }
  }, [filters.semester, filters.curriculum, filters.course]);

  // ── Load topics whenever all 4 filters are set ──────────────────────
  const loadTopics = useCallback(async () => {
    const courseId    = Number(filters.course);
    const semesterId  = Number(filters.semester);
    const sectionId   = Number(filters.section);
    const curriculumId= Number(filters.curriculum);

    if (!courseId || !semesterId || !sectionId || !curriculumId) return;

    setLoading(true);
    try {
      const res: any = await topicService.getTopicList({
        academic_batch_id: curriculumId,
        course_id: courseId,
        semester_id: semesterId,
        section_id: sectionId,
      });

      const arr = Array.isArray(res) ? res : (res?.data || []);

      if (Array.isArray(arr) && arr.length > 0) {
        setTableData(arr.map((item: any, idx: number) => ({
          id:                   idx + 1,
          mapping_id:           item.mapping_id || item.inst_map_id,
          topic_id:             item.topic_id,
          crs_id:               item.crs_id || item.course_id,
          course_id:            item.course_id || item.crs_id || courseId,
          topic_title:          item.topic_title || item.topic_name || "",
          topic_code:           item.topic_code || "",
          topic_content:        item.topic_content || "",
          topic_hrs:            String(item.topic_hrs ?? ""),
          num_of_sessions:      Number(item.num_of_sessions ?? 0),
          section_id:           item.section_id || sectionId,
          instructor_id:        item.instructor_id,
          instructor_name:      item.instructor_name || "Not Assigned",
          lesson_schedule:      item.lesson_schedule || "",
          conduction_date:      item.conduction_date,
          actual_delivery_date: item.actual_delivery_date || item.delivery_date,
          marks_expt:           item.marks_expt,
          is_imported:          item.is_imported || false,
        })));
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to load topics", err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.curriculum, filters.course, filters.semester, filters.section, topicService]);


  useEffect(() => {
    const c = Number(filters.course);
    const s = Number(filters.semester);
    const sec = Number(filters.section);
    const cur = Number(filters.curriculum);
    if (c && s && sec && cur) loadTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.curriculum, filters.course, filters.semester, filters.section]);

  // ── Table mutation helpers ─────────────────────────────────────────
  const updateTopicInTable = useCallback((topicId: number, updates: Partial<TopicRow>) => {
    setTableData(prev => prev.map(t => t.topic_id === topicId ? { ...t, ...updates } : t));
  }, []);

  const addTopicToTable = useCallback((newTopic: TopicRow) => {
    setTableData(prev => {
      const exists = prev.some(t => t.topic_id === newTopic.topic_id);
      if (exists) return prev.map(t => t.topic_id === newTopic.topic_id ? { ...t, ...newTopic } : t);
      return [...prev, newTopic];
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleImportTopics = () => {
    if (!filters.curriculum || !filters.course || !filters.semester || !filters.section) {
      toast("Please select Curriculum, Semester, Course and Section first");
      return;
    }
    setShowAssignModal(true);
  };

  const handleEdit = (topic: TopicRow) => {
    if (topic?.topic_id) setEditingTopic(topic);
  };

  const handleDelete = async (topic: TopicRow) => {
    if (!topic?.topic_id) return;
    if (!window.confirm(`Are you sure you want to delete topic "${topic.topic_title}"?`)) return;
    try {
      await topicService.deleteTopic(topic.topic_id);
      setTableData(prev => prev.filter(t => t.topic_id !== topic.topic_id));
      toast("✅ Topic deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      toast("❌ Failed to delete topic");
    }
  };

  // ── Column definitions — Lesson Schedule replaced by Topic Content ─
  const columnDefs = useMemo(() => [
    { headerName: "Sl No",        valueGetter: (p: any) => p.node.rowIndex + 1, width: 70 },
    { headerName: "Topic Title",  field: "topic_title",  flex: 1, minWidth: 180 },
    {
      headerName: "Topic Content",
      field: "topic_content",
      flex: 2,
      minWidth: 250,
      cellRenderer: (p: any) => (
        <div style={{ whiteSpace: "normal", lineHeight: "1.4", padding: "4px 0", fontSize: 12 }}>
          {p.data.topic_content || "—"}
        </div>
      )
    },
    {
      headerName: "Handled By",
      field: "instructor_name",
      width: 160,
      valueGetter: (p: any) => p.data.instructor_name || "Not Assigned"
    },
    {
      headerName: "Delivery Date",
      field: "actual_delivery_date",
      width: 130,
      valueGetter: (p: any) => p.data.actual_delivery_date || "—"
    },
    {
      headerName: "Actions",
      width: 100,
      cellRenderer: (p: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <SquarePen
            size={18} color="#17439c" style={{ cursor: "pointer" }}
            onClick={() => handleEdit(p.data)}
          />
          <Trash2
            size={18} color="#d11a2a" style={{ cursor: "pointer" }}
            onClick={() => handleDelete(p.data)}
          />
        </div>
      )
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className="p-6">
      <div className="bg-[#1f4e5f] text-white px-4 py-2 rounded-t-md font-semibold">
        Manage Topic Instructor
      </div>

      <div className="border p-4 bg-white rounded-b-md">
        {/* Filters */}
        <div className="grid grid-cols-5 gap-4 items-end mb-6">
          {["curriculum", "semester", "course", "section"].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">{field} *</label>
              <select
                className="w-full border rounded px-2 py-2"
                value={filters[field as keyof typeof filters]}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters(prev => {
                    const updated = { ...prev, [field]: val };
                    if (field === "curriculum" || field === "semester") {
                      updated.course  = "";
                      updated.section = "";
                    }
                    if (field === "course") updated.section = "";
                    return updated;
                  });
                }}
              >
                <option value="">Select {field}</option>
                {dropdownOptions[`${field}Options` as keyof typeof dropdownOptions]?.map((o: DropdownOption) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}

          <button
            onClick={handleImportTopics}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            disabled={!filters.course || !filters.semester || !filters.section}
          >
            Import Topics
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <span className="spinner-border spinner-border-sm me-2" />
            Loading topics...
          </div>
        ) : (
          <DataTable columnDefs={columnDefs} rowData={tableData} pagination pageSize={10} />
        )}
      </div>

      {/* Edit modal */}
      {editingTopic && (
        <EditTopicPage
          topic={editingTopic}
          academic_batch_id={Number(filters.curriculum) || 0}
          semester_id={Number(filters.semester) || 0}
          filters={{
            course:            Number(filters.course)     || undefined,
            semester:          Number(filters.semester)   || undefined,
            section:           Number(filters.section)    || undefined,
            academic_batch_id: Number(filters.curriculum) || undefined
          }}
          close={() => setEditingTopic(null)}
          refresh={loadTopics}
          updateTopicInTable={updateTopicInTable}
          addTopicToTable={addTopicToTable}
          tableData={tableData}
        />
      )}

      {/* Assign/Import modal */}
      {showAssignModal && (
        <AssignInstructorModal
          filters={{
            curriculum: Number(filters.curriculum),
            semester:   Number(filters.semester),
            course:     Number(filters.course),
            section:    Number(filters.section),
          }}
          topics={tableData}
          close={() => setShowAssignModal(false)}
          refresh={loadTopics}
          updateTopicInTable={updateTopicInTable}
          addTopicToTable={addTopicToTable}
        />
      )}
    </div>
  );
};

export default ManageTopicInstructor;
