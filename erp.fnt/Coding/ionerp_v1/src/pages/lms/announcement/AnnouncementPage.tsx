import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../../../utils/api";
import { LocalStorageHelper } from "../../../utils/localStorageHelper";
import { loginData } from "../../login/loginModel";
import { toast } from "react-toastify";

// ─── API endpoints ────────────────────────────────────────────────────────────
const SEND_API = {
  userTypes: "/api/v1/announcements/announcements/send/user-types",
  departments: "/api/v1/announcements/announcements/send/departments",
  programs: "/api/v1/announcements/announcements/send/programs",
  curriculums: "/api/v1/announcements/announcements/send/curriculums",
  recipients: "/api/v1/announcements/announcements/send/recipients",
  create: "/api/v1/announcements/announcements/send/create",
  sent: "/api/v1/announcements/announcements/send/sent",
  receivedStudent: (uid: number) => `/api/v1/announcements/announcements/received/student/${uid}`,
  receivedFaculty: (uid: number) => `/api/v1/announcements/announcements/received/faculty/${uid}`,
  deleteStudent: (annId: number, uid: number) => `/api/v1/announcements/announcements/received/student/${annId}/${uid}`,
  deleteFaculty: (annId: number, uid: number) => `/api/v1/announcements/announcements/received/faculty/${annId}/${uid}`,
  deleteSent: (annId: number) => `/api/v1/announcements/announcements/send/sent/${annId}`,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { dept_id: number; dept_name: string; }
interface Program { pgm_id: number; pgm_title: string; dept_id: number; }
interface Curriculum { crclm_id: number; start_year: string; dept_id: number; pgm_id: number; }

interface GroupedRecipient {
  group_id: string;
  group_name: string;
  group_type: 'department' | 'program' | 'curriculum';
  items?: RecipientItem[];
  subgroups?: GroupedRecipient[];
}

interface RecipientItem {
  recipient_id: number;
  full_name: string;
  usn?: string;
  username?: string;
  dept_id?: number;
  pgm_id?: number;
  academic_batch_id?: number;
  semester?: number;
  section?: string;
  parent_usn?: string;
  parent_name?: string;
  student_usn?: string;
}

interface RecipientResponse {
  total: number;
  grouped: {
    user_type: string;
    groups: GroupedRecipient[];
  };
  items: RecipientItem[];
}

interface ReceivedAnn {
  id: number; description: string; file_name?: string;
  created_at: string; seen_flag: number; seen_on: string | null; sender?: string;
  delivery_date?: string; delivery_time?: string;
}

interface SentAnn {
  lmsn_id: number; notify_description: string;
  delivery_date?: string; delivery_time?: string;
  created_by: number; created_at: string;
}

// ─── Selection state per user type ───────────────────────────────────────────
interface RecipientSelections {
  student: Set<number>;
  faculty: Set<number>;
  parent: Set<number>;
}

const fmtDate = (v: string | null | undefined) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtDateTime = (date?: string, time?: string) => {
  if (!date) return "—";
  const t = time ? ` ${time}` : "";
  return `${date}${t}`;
};

const USER_TYPES = ["Select All", "Faculty", "Student", "Parent"];

// ─── Rich Text Toolbar Button ─────────────────────────────────────────────────
const ToolBtn: React.FC<{ title: string; label: string; cmd?: string; cmdValue?: string; onClick?: () => void }> = ({
  title, label, cmd, cmdValue, onClick
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={e => {
      e.preventDefault();
      if (cmd) document.execCommand(cmd, false, cmdValue ?? "");
      if (onClick) onClick();
    }}
    className="px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-200 rounded select-none"
    dangerouslySetInnerHTML={{ __html: label }}
  />
);

// ─── Multi-Select Dropdown Component ────────────────────────────────────────
interface MultiSelectOption {
  value: string | number;
  label: string;
}

const MultiSelectDropdown: React.FC<{
  options: MultiSelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  placeholder: string;
  label: string;
  required?: boolean;
}> = ({ options, selected, onChange, placeholder, label, required = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (value: string | number) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const selectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-left bg-white flex justify-between items-center focus:outline-none hover:border-gray-400"
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-800 truncate"}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <span className="text-gray-400 ml-2 shrink-0">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-0.5 max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              <input
                type="checkbox"
                className="accent-[#1f3a4f]"
                checked={selected.length === options.length && options.length > 0}
                onChange={selectAll}
              />
              Select All
            </label>
          </div>
          {options.map(opt => (
            <label
              key={String(opt.value)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
            >
              <input
                type="checkbox"
                className="accent-[#1f3a4f]"
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const AnnouncementPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<loginData>("auth_state");
  const userType: string = (authState as any)?.user_type ?? "U";
  const isStudent = userType === "S";
  const userRole: 'faculty' | 'student' = isStudent ? 'student' : 'faculty';

  const userId: number = isStudent
    ? ((authState as any)?.student_id ?? 1)
    : ((authState as any)?.user_id ?? (authState as any)?.id ?? 1);

  const [activeTab, setActiveTab] = useState<"received" | "send" | "sent">("received");

  // ── Received tab state ─────────────────────────────────────────────────────
  const [received, setReceived] = useState<ReceivedAnn[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [recSearchTerm, setRecSearchTerm] = useState("");
  const [recShowEntries, setRecShowEntries] = useState(10);
  const [recPage, setRecPage] = useState(1);
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ann_read_ids") || "[]")); }
    catch { return new Set(); }
  });
  const [openAnn, setOpenAnn] = useState<ReceivedAnn | null>(null);

  // ── Sent tab state ─────────────────────────────────────────────────────────
  const [sentList, setSentList] = useState<SentAnn[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [sentSearchTerm, setSentSearchTerm] = useState("");

  // ── Send tab state ─────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [selectedPgmIds, setSelectedPgmIds] = useState<number[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [hideDate, setHideDate] = useState("");
  const [hideTime, setHideTime] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [displayInTimetable, setDisplayInTimetable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSelectUsers, setShowSelectUsers] = useState(false);
  
  // ── Separate selections for each user type ────────────────────────────────
  const [selections, setSelections] = useState<RecipientSelections>({
    student: new Set<number>(),
    faculty: new Set<number>(),
    parent: new Set<number>(),
  });
  
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientUserType, setRecipientUserType] = useState<"student" | "faculty" | "parent">("student");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [groupedRecipients, setGroupedRecipients] = useState<GroupedRecipient[]>([]);
  const [flatRecipients, setFlatRecipients] = useState<RecipientItem[]>([]);
  
  // ── Accordion state: track which group is expanded ────────────────────────
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const userTypeRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const isStudentSelected = selectedUserTypes.includes("Student");
  const isFacultySelected = selectedUserTypes.includes("Faculty");
  const isParentSelected = selectedUserTypes.includes("Parent");
  const unseenCount = received.filter(r => !readIds.has(r.id)).length;

  // ── Get selected count for each user type ─────────────────────────────────
  const getSelectedCount = (type: 'student' | 'faculty' | 'parent') => {
    return selections[type]?.size || 0;
  };

  // ── Mark as read helper ────────────────────────────────────────────────────
  const markRead = (ann: ReceivedAnn) => {
    setOpenAnn(ann);
    if (!readIds.has(ann.id)) {
      const next = new Set(readIds);
      next.add(ann.id);
      setReadIds(next);
      localStorage.setItem("ann_read_ids", JSON.stringify(Array.from(next)));
    }
  };

  // ── Delete received announcement ──────────────────────────────────────────
  const deleteReceived = async (ann: ReceivedAnn) => {
    try {
      const url = userRole === 'faculty'
        ? SEND_API.deleteFaculty(ann.id, userId)
        : SEND_API.deleteStudent(ann.id, userId);
      await axiosInstance.delete(url);
      toast.success("Announcement removed");
      setReceived(prev => prev.filter(r => r.id !== ann.id));
    } catch { toast.error("Failed to remove announcement"); }
  };

  // ── Delete sent announcement ──────────────────────────────────────────────
  const deleteSent = async (annId: number) => {
    if (!window.confirm("Delete this sent announcement and all its recipient mappings?")) return;
    try {
      await axiosInstance.delete(SEND_API.deleteSent(annId));
      toast.success("Announcement deleted");
      setSentList(prev => prev.filter(a => a.lmsn_id !== annId));
    } catch { toast.error("Failed to delete announcement"); }
  };

  // ── Load received announcements ──────────────────────────────────────────
  const fetchReceived = useCallback(async () => {
    setLoadingReceived(true);
    try {
      const url = isStudent
        ? SEND_API.receivedStudent(userId)
        : SEND_API.receivedFaculty(userId);
      const r: any = await axiosInstance.get(url);
      const d = r.data?.data ?? r.data?.items ?? r.data ?? [];
      const mapped: ReceivedAnn[] = Array.isArray(d) ? d.map((item: any) => ({
        id: item.id ?? item.lmsn_id,
        description: item.description ?? item.notify_description ?? "",
        file_name: item.file_name || null,
        created_at: item.created_at,
        delivery_date: item.delivery_date,
        delivery_time: item.delivery_time,
        seen_flag: item.seen_flag ?? 0,
        seen_on: item.seen_on ?? null,
        sender: item.sender ?? `User ${item.created_by ?? ""}`,
      })) : [];
      const now = new Date();
      const visible = mapped.filter(ann => {
        if (!ann.delivery_date) return true;
        const timeStr = ann.delivery_time || "00:00:00";
        const [h, m, s] = timeStr.split(':');
        const paddedTime = `${(h || '0').padStart(2, '0')}:${m || '00'}:${s || '00'}`;
        const scheduled = new Date(`${ann.delivery_date}T${paddedTime}`);
        return scheduled <= now;
      });
      setReceived(visible);
    } catch {
      toast.error("Failed to load announcements");
    }
    finally { setLoadingReceived(false); }
  }, [userId, isStudent]);

  // ── Load sent announcements ──────────────────────────────────────────────
  const fetchSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const r: any = await axiosInstance.get(SEND_API.sent, { params: { page: 1, page_size: 100 } });
      const d = r.data?.data?.items ?? r.data?.items ?? r.data?.data ?? [];
      setSentList(Array.isArray(d) ? d : []);
    } catch { toast.error("Failed to load sent announcements"); }
    finally { setLoadingSent(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "received") fetchReceived();
    else if (activeTab === "sent") fetchSent();
  }, [activeTab, fetchReceived, fetchSent]);

  // ── Load departments ──────────────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get(SEND_API.departments)
      .then((r: any) => { const d = r.data?.data; setDepartments(Array.isArray(d) ? d : []); })
      .catch(() => {});
  }, []);

  // ── Load programs when departments change ─────────────────────────────────
  useEffect(() => {
    if (selectedDeptIds.length === 0) {
      setPrograms([]);
      setSelectedPgmIds([]);
      return;
    }
    axiosInstance.get(SEND_API.programs, { params: { dept_ids: selectedDeptIds.join(",") } })
      .then((r: any) => { const d = r.data?.data; setPrograms(Array.isArray(d) ? d : []); })
      .catch(() => setPrograms([]));
  }, [selectedDeptIds]);

  // ── Load curriculums when dept/program changes ────────────────────────────
  useEffect(() => {
    if (selectedDeptIds.length === 0 || !isStudentSelected) {
      setCurriculums([]);
      setSelectedBatchIds([]);
      return;
    }
    const params: any = { dept_ids: selectedDeptIds.join(",") };
    if (selectedPgmIds.length > 0) {
      params.pgm_ids = selectedPgmIds.join(",");
    }
    axiosInstance.get(SEND_API.curriculums, { params })
      .then((r: any) => { const d = r.data?.data; setCurriculums(Array.isArray(d) ? d : []); })
      .catch(() => setCurriculums([]));
  }, [selectedDeptIds, selectedPgmIds, isStudentSelected]);

  // ── Close user type dropdown ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userTypeRef.current && !userTypeRef.current.contains(e.target as Node))
        setShowUserTypeDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Toggle user type ──────────────────────────────────────────────────────
  const toggleUserType = (type: string) => {
    if (type === "Select All") {
      setSelectedUserTypes(prev => prev.length === USER_TYPES.length - 1 ? [] : ["Faculty", "Student", "Parent"]);
      return;
    }
    setSelectedUserTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // ── Load recipients for Select Users modal ───────────────────────────────
const openSelectUsers = async (userType: "student" | "faculty" | "parent") => {
  // Check if departments are selected
  if (selectedDeptIds.length === 0) {
    toast.warning("Please select at least one department first");
    return;
  }
  
  // For students and parents, check if programs are selected
  if (userType === "student" || userType === "parent") {
    if (selectedPgmIds.length === 0) {
      toast.warning("Please select at least one program first");
      return;
    }
    if (selectedBatchIds.length === 0) {
      toast.warning("Please select at least one curriculum first");
      return;
    }
  }
  
  setRecipientUserType(userType);
  setShowSelectUsers(true);
  setLoadingRecipients(true);
  setRecipientSearch("");
  // Reset expanded groups when opening modal
  setExpandedGroups(new Set());
  
  try {
    const params: any = { user_type: userType };
    if (selectedDeptIds.length > 0) {
      params.dept_ids = selectedDeptIds.join(",");
    }
    if (userType === "student" || userType === "parent") {
      if (selectedPgmIds.length > 0) {
        params.pgm_ids = selectedPgmIds.join(",");
      }
      if (selectedBatchIds.length > 0) {
        params.academic_batch_ids = selectedBatchIds.join(",");
      }
    }
    
    const r: any = await axiosInstance.get(SEND_API.recipients, { params });
    const responseData = r.data?.data as RecipientResponse;
    
    if (responseData?.grouped) {
      setGroupedRecipients(responseData.grouped.groups || []);
      setFlatRecipients(responseData.items || []);
    } else {
      setGroupedRecipients([]);
      setFlatRecipients([]);
    }
  } catch (err) {
    console.error("Failed to load recipients:", err);
    setGroupedRecipients([]);
    setFlatRecipients([]);
    toast.error("Failed to load recipients");
  }
  finally { setLoadingRecipients(false); }
};

  // ── Toggle recipient selection for current user type ──────────────────────
  const toggleRecipientSelection = (recipientId: number) => {
    const currentSelections = selections[recipientUserType] || new Set<number>();
    const newSelections = new Set(currentSelections);
    
    if (newSelections.has(recipientId)) {
      newSelections.delete(recipientId);
    } else {
      newSelections.add(recipientId);
    }
    
    setSelections(prev => ({
      ...prev,
      [recipientUserType]: newSelections,
    }));
  };

  // ── Toggle group selection for current user type ──────────────────────────
  const toggleGroupSelection = (groupItems: RecipientItem[]) => {
    const currentSelections = selections[recipientUserType] || new Set<number>();
    const allSelected = groupItems.every(item => currentSelections.has(item.recipient_id));
    const newSelections = new Set(currentSelections);
    
    groupItems.forEach(item => {
      if (allSelected) {
        newSelections.delete(item.recipient_id);
      } else {
        newSelections.add(item.recipient_id);
      }
    });
    
    setSelections(prev => ({
      ...prev,
      [recipientUserType]: newSelections,
    }));
  };

  // ── Toggle all recipients for current user type ──────────────────────────
  const toggleAllRecipients = () => {
    const currentSelections = selections[recipientUserType] || new Set<number>();
    const visibleRecipients = flatRecipients.filter(r => {
      const q = recipientSearch.toLowerCase().trim();
      if (!q) return true;
      return r.full_name.toLowerCase().includes(q) ||
        (r.usn || "").toLowerCase().includes(q) ||
        (r.username || "").toLowerCase().includes(q);
    });
    const allSelected = visibleRecipients.every(r => currentSelections.has(r.recipient_id));
    const newSelections = new Set(currentSelections);
    
    if (allSelected) {
      visibleRecipients.forEach(r => newSelections.delete(r.recipient_id));
    } else {
      visibleRecipients.forEach(r => newSelections.add(r.recipient_id));
    }
    
    setSelections(prev => ({
      ...prev,
      [recipientUserType]: newSelections,
    }));
  };

  // ── Toggle accordion for a group ──────────────────────────────────────────
const toggleGroupAccordion = (groupId: string, depth: number = 0, groupType: string = '') => {
  setExpandedGroups(prev => {
    const newSet = new Set(prev);
    
    if (newSet.has(groupId)) {
      // If already expanded, close it
      newSet.delete(groupId);
    } else {
      // For Faculty: Only one department can be open at a time
      // For Students/Parents: Only one program can be open at a time
      if (recipientUserType === 'faculty') {
        // Close all other departments
        const toRemove: string[] = [];
        newSet.forEach(id => {
          if (id.startsWith('dept_')) {
            toRemove.push(id);
          }
        });
        toRemove.forEach(id => newSet.delete(id));
      } else {
        // For students/parents: Close other programs at the same level
        // but keep parent groups open
        const toRemove: string[] = [];
        newSet.forEach(id => {
          // Check if this is at the same depth level
          const idParts = id.split('-');
          const targetParts = groupId.split('-');
          // If it's a program or curriculum at the same depth, close it
          if (idParts.length === targetParts.length && idParts.length >= 2) {
            // Same depth level - close it
            toRemove.push(id);
          }
        });
        toRemove.forEach(id => newSet.delete(id));
      }
      newSet.add(groupId);
    }
    
    return newSet;
  });
};

// ── Check if a group is expanded ──────────────────────────────────────────
const isGroupExpanded = (groupId: string) => {
  return expandedGroups.has(groupId);
};

// ── Render grouped recipients with accordion ─────────────────────────────
const renderGroupedRecipientsWithAccordion = (groups: GroupedRecipient[], depth: number = 0, parentId: string = '') => {
  const currentSelections = selections[recipientUserType] || new Set<number>();
  const searchTerm = recipientSearch.toLowerCase().trim();
  const isFaculty = recipientUserType === 'faculty';
  
  // Filter groups based on search
  const filteredGroups = groups.filter(group => {
    if (!searchTerm) return true;
    
    // Check if group name matches
    if (group.group_name.toLowerCase().includes(searchTerm)) return true;
    
    // Check if any item in this group matches
    if (group.items && group.items.some(item => 
      item.full_name.toLowerCase().includes(searchTerm) ||
      (item.usn || "").toLowerCase().includes(searchTerm) ||
      (item.username || "").toLowerCase().includes(searchTerm)
    )) return true;
    
    // Check subgroups recursively
    if (group.subgroups) {
      return group.subgroups.some(sub => {
        if (sub.group_name.toLowerCase().includes(searchTerm)) return true;
        if (sub.items && sub.items.some(item => 
          item.full_name.toLowerCase().includes(searchTerm) ||
          (item.usn || "").toLowerCase().includes(searchTerm) ||
          (item.username || "").toLowerCase().includes(searchTerm)
        )) return true;
        return false;
      });
    }
    
    return false;
  });

  if (filteredGroups.length === 0 && searchTerm) {
    return (
      <tr>
        <td colSpan={3} className="p-4 text-center text-gray-400 text-sm">
          No results found for "{searchTerm}"
        </td>
      </tr>
    );
  }

  return filteredGroups.map(group => {
    const hasSubgroups = group.subgroups && group.subgroups.length > 0;
    const hasItems = group.items && group.items.length > 0;
    const groupFullId = parentId ? `${parentId}-${group.group_id}` : group.group_id;
    const isExpanded = isGroupExpanded(groupFullId);
    const indent = depth * 16;
    
    // Different styling for faculty vs students/parents
    const bgColor = isFaculty 
      ? (depth === 0 ? 'bg-gray-50' : 'bg-white')
      : (depth === 0 ? 'bg-gray-50' : depth === 1 ? 'bg-blue-50/30' : 'bg-white');
    
    const borderColor = isFaculty
      ? (depth === 0 ? 'border-gray-200' : 'border-gray-100')
      : (depth === 0 ? 'border-gray-200' : depth === 1 ? 'border-blue-200' : 'border-gray-100');
    
    const textColor = isFaculty
      ? (depth === 0 ? 'font-semibold text-gray-800' : 'font-medium text-gray-700')
      : (depth === 0 ? 'font-semibold text-gray-800' : depth === 1 ? 'font-semibold text-blue-700' : 'font-medium text-gray-700');
    
    // Filter items within this group based on search
    const filteredItems = group.items?.filter(item => {
      if (!searchTerm) return true;
      return item.full_name.toLowerCase().includes(searchTerm) ||
        (item.usn || "").toLowerCase().includes(searchTerm) ||
        (item.username || "").toLowerCase().includes(searchTerm);
    }) || [];

    // Check if any child matches search (for auto-expand)
    const hasMatchingChild = searchTerm && (
      filteredItems.length > 0 ||
      (group.subgroups && group.subgroups.some(sub => 
        sub.group_name.toLowerCase().includes(searchTerm) ||
        sub.items?.some(item => 
          item.full_name.toLowerCase().includes(searchTerm) ||
          (item.usn || "").toLowerCase().includes(searchTerm) ||
          (item.username || "").toLowerCase().includes(searchTerm)
        )
      ))
    );

    // Auto-expand if search matches child
    const shouldBeExpanded = isExpanded || (searchTerm && hasMatchingChild);

    // For faculty: Only render department level with faculty items
    if (isFaculty) {
      return (
        <React.Fragment key={groupFullId}>
          {/* Department header - Clickable accordion */}
          <tr 
            className={`${bgColor} border-b ${borderColor} cursor-pointer hover:bg-gray-100 transition-colors`}
            onClick={() => toggleGroupAccordion(groupFullId, depth, group.group_type)}
          >
            <td className="p-2" style={{ paddingLeft: `${8 + indent}px` }}>
              <span className={`text-xs ${textColor}`}>
                <span className="inline-block mr-1 w-4 text-center">
                  {shouldBeExpanded ? '▼' : '▶'}
                </span>
                📚 {group.group_name}
                {hasItems && ` (${group.items?.length || 0} faculty)`}
              </span>
            </td>
            <td className="p-2 text-xs text-gray-400">
              Department
            </td>
            <td className="p-2" onClick={e => e.stopPropagation()}>
              {hasItems && (
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && filteredItems.every(item => currentSelections.has(item.recipient_id))}
                  onChange={() => {
                    if (filteredItems.length > 0) {
                      const allSelected = filteredItems.every(item => currentSelections.has(item.recipient_id));
                      const newSelections = new Set(currentSelections);
                      filteredItems.forEach(item => {
                        if (allSelected) {
                          newSelections.delete(item.recipient_id);
                        } else {
                          newSelections.add(item.recipient_id);
                        }
                      });
                      setSelections(prev => ({
                        ...prev,
                        [recipientUserType]: newSelections,
                      }));
                    }
                  }}
                />
              )}
            </td>
          </tr>
          
          {/* Faculty items - only show when expanded */}
          {shouldBeExpanded && (
            <>
              {filteredItems.map(item => (
                <tr key={item.recipient_id} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                  <td className="p-2" style={{ paddingLeft: `${24 + indent}px` }}>
                    <span className="text-xs text-gray-600">{item.full_name}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.username || ''})</span>
                  </td>
                  <td className="p-2 text-xs text-gray-400">Faculty</td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={currentSelections.has(item.recipient_id)}
                      onChange={() => toggleRecipientSelection(item.recipient_id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                </tr>
              ))}
            </>
          )}
        </React.Fragment>
      );
    }

    // For Students/Parents: Show Program -> Curriculum -> Students hierarchy
    return (
      <React.Fragment key={groupFullId}>
        {/* Program header - Clickable accordion */}
        <tr 
          className={`${bgColor} border-b ${borderColor} cursor-pointer hover:bg-gray-100 transition-colors`}
          onClick={() => toggleGroupAccordion(groupFullId, depth, group.group_type)}
        >
          <td className="p-2" style={{ paddingLeft: `${8 + indent}px` }}>
            <span className={`text-xs ${textColor}`}>
              <span className="inline-block mr-1 w-4 text-center">
                {shouldBeExpanded ? '▼' : '▶'}
              </span>
              {group.group_type === 'department' ? '📚' : group.group_type === 'program' ? '📖' : '📅'}
              {' '}{group.group_name}
              {hasItems && ` (${group.items?.length || 0})`}
              {hasSubgroups && ` (${group.subgroups?.length || 0} curriculums)`}
            </span>
          </td>
          <td className="p-2 text-xs text-gray-400">
            {group.group_type} {depth > 0 && `• Level ${depth + 1}`}
          </td>
          <td className="p-2" onClick={e => e.stopPropagation()}>
            {hasItems && (
              <input
                type="checkbox"
                checked={filteredItems.length > 0 && filteredItems.every(item => currentSelections.has(item.recipient_id))}
                onChange={() => {
                  if (filteredItems.length > 0) {
                    const allSelected = filteredItems.every(item => currentSelections.has(item.recipient_id));
                    const newSelections = new Set(currentSelections);
                    filteredItems.forEach(item => {
                      if (allSelected) {
                        newSelections.delete(item.recipient_id);
                      } else {
                        newSelections.add(item.recipient_id);
                      }
                    });
                    setSelections(prev => ({
                      ...prev,
                      [recipientUserType]: newSelections,
                    }));
                  }
                }}
              />
            )}
          </td>
        </tr>
        
        {/* Items/Subgroups - only show when expanded */}
        {shouldBeExpanded && (
          <>
            {/* If this is a Program (depth 1), show curriculums as subgroups */}
            {hasSubgroups && group.group_type === 'program' && (
              renderGroupedRecipientsWithAccordion(group.subgroups!, depth + 1, groupFullId)
            )}
            
            {/* If this is a Curriculum (depth 2), show students as items */}
            {hasItems && group.group_type === 'curriculum' && (
              filteredItems.map(item => (
                <tr key={item.recipient_id} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                  <td className="p-2" style={{ paddingLeft: `${24 + indent}px` }}>
                    <span className="text-xs text-gray-600">{item.full_name}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.usn || ''})</span>
                  </td>
                  <td className="p-2 text-xs text-gray-400">
                    {recipientUserType === 'parent' ? 'Parent' : 'Student'}
                    {item.section && ` • Sec ${item.section}`}
                    {item.semester && ` • Sem ${item.semester}`}
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={currentSelections.has(item.recipient_id)}
                      onChange={() => toggleRecipientSelection(item.recipient_id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                </tr>
              ))
            )}
            
            {/* If this is a Department (depth 0), show programs as subgroups */}
            {hasSubgroups && group.group_type === 'department' && (
              renderGroupedRecipientsWithAccordion(group.subgroups!, depth + 1, groupFullId)
            )}
          </>
        )}
      </React.Fragment>
    );
  });
};

  // ── Submit announcement ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const plainText = editorRef.current?.innerText?.trim() ?? "";
    const htmlContent = editorRef.current?.innerHTML ?? "";
    if (!plainText) { toast.error("Announcement description is required."); return; }
    if (selectedUserTypes.length === 0) { toast.error("Please select at least one user type."); return; }
    if (selectedDeptIds.length === 0) { toast.error("Please select at least one department."); return; }
    
    // Validate delivery date
    if (deliveryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (deliveryDate < today) {
        toast.error("Delivery date must be today or in the future");
        return;
      }
    }
    
    // Validate hide date
    if (hideDate && deliveryDate) {
      if (hideDate <= deliveryDate) {
        toast.error("Hide date must be after delivery date");
        return;
      }
    }

    setSubmitting(true);
    let anySuccess = false;
    const errors: string[] = [];

    for (const userType of selectedUserTypes) {
      const userTypeKey = userType.toLowerCase() as 'student' | 'faculty' | 'parent';
      const recipientIds = Array.from(selections[userTypeKey] || new Set<number>());
      
      // Skip if no recipients selected for this user type
      if (recipientIds.length === 0) {
        toast.warning(`No recipients selected for ${userType}`);
        continue;
      }

      const payload: any = {
        notify_description: htmlContent,
        created_by: userId,
        target_user_type: userTypeKey,
        display_to_timetable: displayInTimetable ? 1 : 0,
        dept_ids: selectedDeptIds,
        recipient_ids: recipientIds,
        recipient_usns: [],
      };
      
      if (deliveryDate) payload.delivery_date = deliveryDate;
      if (deliveryTime) payload.delivery_time = deliveryTime;
      if (hideDate) payload.delivery_hide_date = hideDate;
      if (hideTime) payload.delivery_hide_time = hideTime;
      
      // Only send program and batch IDs for student/parent
      if (userTypeKey !== 'faculty') {
        if (selectedPgmIds.length > 0) payload.pgm_ids = selectedPgmIds;
        if (selectedBatchIds.length > 0) payload.academic_batch_ids = selectedBatchIds;
      }

      try {
        const res: any = await axiosInstance.post(SEND_API.create, payload, {
          headers: { "Content-Type": "application/json" },
        });
        if (res.data?.status === false) {
          errors.push(res.data?.message || `Failed to send to ${userType}`);
        } else {
          anySuccess = true;
        }
      } catch (e: any) {
        const msg = e?.response?.data?.detail || e?.response?.data?.message || `Failed to send to ${userType}`;
        errors.push(msg);
        console.error("Error sending announcement:", e);
      }
    }

    setSubmitting(false);
    if (anySuccess) {
      toast.success("Announcement sent successfully!");
      if (editorRef.current) editorRef.current.innerHTML = "";
      setDescHtml("");
      setDeliveryDate(""); setDeliveryTime(""); setHideDate(""); setHideTime("");
      setSelectedUserTypes([]); 
      setSelectedDeptIds([]); 
      setSelectedPgmIds([]);
      setSelectedBatchIds([]);
      setAttachFile(null); 
      setDisplayInTimetable(false); 
      // Reset all selections
      setSelections({
        student: new Set<number>(),
        faculty: new Set<number>(),
        parent: new Set<number>(),
      });
      setActiveTab("received");
    }
    if (errors.length > 0) errors.forEach(e => toast.error(e));
  };

  // ── Received table data ──────────────────────────────────────────────────
  const filteredRec = received.filter(r =>
    (r.description || "").replace(/<[^>]+>/g, "").toLowerCase().includes(recSearchTerm.toLowerCase()) ||
    (r.sender || "").toLowerCase().includes(recSearchTerm.toLowerCase())
  );
  const recTotal = Math.max(1, Math.ceil(filteredRec.length / recShowEntries));
  const recPage_ = Math.min(recPage, recTotal);
  const recPageData = filteredRec.slice((recPage_ - 1) * recShowEntries, recPage_ * recShowEntries);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">
            {isStudent ? "Received Announcements" : "Send / Receive Announcement"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("received")}
            className={`relative px-8 py-2.5 text-sm font-medium transition-colors ${activeTab === "received"
              ? "text-[#1f3a4f] border-b-2 border-[#1f3a4f]"
              : "text-gray-500 hover:text-gray-700"}`}
          >
            Received
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unseenCount}
              </span>
            )}
          </button>
          {!isStudent && (
            <button
              onClick={() => setActiveTab("send")}
              className={`px-8 py-2.5 text-sm font-medium transition-colors ${activeTab === "send"
                ? "text-[#1f3a4f] border-b-2 border-[#1f3a4f]"
                : "text-gray-500 hover:text-gray-700"}`}
            >
              Send
            </button>
          )}
          {!isStudent && (
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-8 py-2.5 text-sm font-medium transition-colors ${activeTab === "sent"
                ? "text-[#1f3a4f] border-b-2 border-[#1f3a4f]"
                : "text-gray-500 hover:text-gray-700"}`}
            >
              Sent History
            </button>
          )}
        </div>

        {/* ══════════════════════════ RECEIVED TAB ══════════════════════════ */}
        {activeTab === "received" && (
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Viewing as:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${userRole === 'faculty' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {userRole === 'faculty' ? '👨‍🏫 Faculty' : '🎓 Student'}
              </span>
              <span className="text-xs text-gray-400 ml-auto">Only shows announcements scheduled for now or earlier</span>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                  value={recShowEntries} onChange={e => { setRecShowEntries(Number(e.target.value)); setRecPage(1); }}>
                  {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <input type="text" className="border border-gray-300 rounded px-2 py-0.5 text-sm w-40"
                  value={recSearchTerm} onChange={e => { setRecSearchTerm(e.target.value); setRecPage(1); }} />
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-[#d6dde3] text-gray-700">
                  <tr>
                    <th className="px-3 py-2 w-8 text-left"><input type="checkbox" /></th>
                    <th className="px-3 py-2 text-left">Sl No.</th>
                    <th className="px-3 py-2 text-left">Notice</th>
                    <th className="px-3 py-2 text-left">Sent On</th>
                    <th className="px-3 py-2 text-left">Scheduled For</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingReceived ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                  ) : recPageData.length > 0 ? recPageData.map((r, idx) => {
                    const isRead = readIds.has(r.id);
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50 transition-colors ${!isRead ? "bg-blue-50/30" : ""}`}>
                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                        <td className="px-3 py-2 cursor-pointer" onClick={() => markRead(r)}>{(recPage_ - 1) * recShowEntries + idx + 1}</td>
                        <td className="px-3 py-2 cursor-pointer" onClick={() => markRead(r)}>
                          <span className={`text-xs ${!isRead ? "font-bold text-gray-900" : "text-gray-600"}`}>
                            {(r.description || "").replace(/<[^>]+>/g, "").slice(0, 80)}{(r.description || "").length > 80 ? "…" : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{fmtDate(r.created_at)}</td>
                        <td className="px-3 py-2 text-xs text-blue-600">
                          {r.delivery_date ? fmtDateTime(r.delivery_date, r.delivery_time) : "Immediate"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isRead
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"}`}>
                            {isRead ? "Read" : "Unread"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => markRead(r)} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-1 hover:bg-blue-200">View</button>
                          <button onClick={() => deleteReceived(r)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Delete</button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No announcements found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
              <span>
                Showing {filteredRec.length === 0 ? 0 : (recPage_ - 1) * recShowEntries + 1} to{" "}
                {Math.min(recPage_ * recShowEntries, filteredRec.length)} of {filteredRec.length} entries
              </span>
              <div className="flex gap-1">
                <button onClick={() => setRecPage(p => Math.max(1, p - 1))} disabled={recPage_ === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40">Previous</button>
                <button onClick={() => setRecPage(p => Math.min(recTotal, p + 1))} disabled={recPage_ === recTotal}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ SENT HISTORY TAB ══════════════════════ */}
        {activeTab === "sent" && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600 font-medium">All Sent Announcements</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <input type="text" className="border border-gray-300 rounded px-2 py-0.5 text-sm w-40"
                  value={sentSearchTerm} onChange={e => setSentSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-[#d6dde3] text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Sl No.</th>
                    <th className="px-3 py-2 text-left">Notice (preview)</th>
                    <th className="px-3 py-2 text-left">Sent On</th>
                    <th className="px-3 py-2 text-left">Scheduled Delivery</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingSent ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                  ) : sentList.filter(s =>
                      (s.notify_description || "").replace(/<[^>]+>/g, "").toLowerCase().includes(sentSearchTerm.toLowerCase())
                    ).map((s, idx) => (
                    <tr key={s.lmsn_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {(s.notify_description || "").replace(/<[^>]+>/g, "").slice(0, 100)}
                        {(s.notify_description || "").length > 100 ? "…" : ""}
                      </td>
                      <td className="px-3 py-2 text-xs">{fmtDate(s.created_at)}</td>
                      <td className="px-3 py-2 text-xs text-blue-600">
                        {s.delivery_date ? fmtDateTime(s.delivery_date, s.delivery_time) : "Immediate"}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => deleteSent(s.lmsn_id)}
                          className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!loadingSent && sentList.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No sent announcements found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════ SEND TAB ══════════════════════════════ */}
        {activeTab === "send" && (
          <div className="p-5">
            {/* Row 1: User Type + Department + (Program + Curriculum if Student) */}
            <div className="grid gap-4 mb-4">
              {/* User Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  User Type: <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={userTypeRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserTypeDropdown(v => !v)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-left bg-white flex justify-between items-center focus:outline-none"
                  >
                    <span className={selectedUserTypes.length === 0 ? "text-gray-400" : "text-gray-800 truncate"}>
                      {selectedUserTypes.length === 0 ? "Select User Type" : selectedUserTypes.join(", ")}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>
                  {showUserTypeDropdown && (
                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-0.5 max-h-60 overflow-y-auto">
                      {USER_TYPES.map(t => (
                        <label key={t} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm
                          ${selectedUserTypes.includes(t) ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}>
                          <input
                            type="checkbox"
                            className="accent-[#1f3a4f]"
                            checked={t === "Select All"
                              ? selectedUserTypes.length === USER_TYPES.length - 1
                              : selectedUserTypes.includes(t)}
                            onChange={() => toggleUserType(t)}
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Department - Multi-select */}
              <MultiSelectDropdown
                options={departments.map(d => ({ value: d.dept_id, label: d.dept_name }))}
                selected={selectedDeptIds}
                onChange={(selected) => setSelectedDeptIds(selected as number[])}
                placeholder="Select Department(s)"
                label="Department"
                required={true}
              />

              {/* Program - Multi-select (only for Student/Parent) */}
              {(isStudentSelected || isParentSelected) && programs.length > 0 && (
                <MultiSelectDropdown
                  options={programs.map(p => ({ value: p.pgm_id, label: p.pgm_title }))}
                  selected={selectedPgmIds}
                  onChange={(selected) => setSelectedPgmIds(selected as number[])}
                  placeholder="Select Program(s)"
                  label="Program"
                />
              )}

              {/* Curriculum - Multi-select (only for Student/Parent) */}
              {(isStudentSelected || isParentSelected) && curriculums.length > 0 && (
                <MultiSelectDropdown
                  options={curriculums.map(c => ({ value: c.crclm_id, label: c.start_year }))}
                  selected={selectedBatchIds}
                  onChange={(selected) => setSelectedBatchIds(selected as number[])}
                  placeholder="Select Curriculum(s)"
                  label="Curriculum"
                />
              )}
            </div>

            {/* Select Users buttons */}
            {(isStudentSelected || isFacultySelected || isParentSelected) && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {isStudentSelected && (
                  <button 
                    onClick={() => openSelectUsers("student")}
                    disabled={selectedDeptIds.length === 0 || selectedPgmIds.length === 0 || selectedBatchIds.length === 0}
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${
                      selectedDeptIds.length === 0 || selectedPgmIds.length === 0 || selectedBatchIds.length === 0
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                        : 'text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    👩‍🎓 Select Students 
                    {selectedDeptIds.length === 0 
                      ? ' (Select dept first)' 
                      : selectedPgmIds.length === 0
                      ? ' (Select program first)'
                      : selectedBatchIds.length === 0
                      ? ' (Select curriculum first)'
                      : selectedDeptIds.length > 0 && ` (${selectedDeptIds.length} dept${selectedDeptIds.length > 1 ? 's' : ''})`
                    }
                    {getSelectedCount('student') > 0 && ` • ${getSelectedCount('student')} selected`}
                  </button>
                )}
                {isParentSelected && (
                  <button 
                    onClick={() => openSelectUsers("parent")}
                    disabled={selectedDeptIds.length === 0 || selectedPgmIds.length === 0 || selectedBatchIds.length === 0}
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${
                      selectedDeptIds.length === 0 || selectedPgmIds.length === 0 || selectedBatchIds.length === 0
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                        : 'text-purple-600 border border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    👨‍👩‍👦 Select Parents 
                    {selectedDeptIds.length === 0 
                      ? ' (Select dept first)' 
                      : selectedPgmIds.length === 0
                      ? ' (Select program first)'
                      : selectedBatchIds.length === 0
                      ? ' (Select curriculum first)'
                      : selectedDeptIds.length > 0 && ` (${selectedDeptIds.length} dept${selectedDeptIds.length > 1 ? 's' : ''})`
                    }
                    {getSelectedCount('parent') > 0 && ` • ${getSelectedCount('parent')} selected`}
                  </button>
                )}
                {isFacultySelected && (
                  <button 
                    onClick={() => openSelectUsers("faculty")}
                    disabled={selectedDeptIds.length === 0}
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${
                      selectedDeptIds.length === 0 
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                        : 'text-purple-600 border border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    👨‍🏫 Select Faculty 
                    {selectedDeptIds.length === 0 
                      ? ' (Select dept first)' 
                      : selectedDeptIds.length > 0 && ` (${selectedDeptIds.length} dept${selectedDeptIds.length > 1 ? 's' : ''})`
                    }
                    {getSelectedCount('faculty') > 0 && ` • ${getSelectedCount('faculty')} selected`}
                  </button>
                )}
              </div>
            )}

            {/* Delivery date & time */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap w-36 text-right shrink-0">
                  Date &amp; time of delivery: <span className="text-red-500">*</span>
                </label>
                <input type="date" 
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#1f3a4f]"
                  value={deliveryDate} 
                  onChange={e => setDeliveryDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                />
                <input type="time" 
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#1f3a4f]"
                  value={deliveryTime} 
                  onChange={e => setDeliveryTime(e.target.value)} 
                />
              </div>
              <div />
            </div>

            {/* Hide notice after */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap w-36 text-right shrink-0">
                  Hide notice after :
                </label>
                <input type="date" 
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#1f3a4f]"
                  value={hideDate} 
                  onChange={e => setHideDate(e.target.value)}
                  min={deliveryDate || undefined}
                />
                <input type="time" 
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#1f3a4f]"
                  value={hideTime} 
                  onChange={e => setHideTime(e.target.value)} 
                />
              </div>
              <div />
            </div>

            {/* Scheduling note */}
            {deliveryDate && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                ⏰ This announcement will only appear to recipients on <strong>{deliveryDate} at {deliveryTime || "00:00"}</strong> and will not be visible before that time.
                {hideDate && (
                  <span className="block mt-1">⏹️ Will be hidden after <strong>{hideDate} at {hideTime || "23:59"}</strong></span>
                )}
              </div>
            )}

            {/* Announcement Description */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Announcement Description: <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded">
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
                  <ToolBtn title="Undo" label="↩" cmd="undo" />
                  <ToolBtn title="Redo" label="↪" cmd="redo" />
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <ToolBtn title="Bold" label="<strong>B</strong>" cmd="bold" />
                  <ToolBtn title="Italic" label="<em>I</em>" cmd="italic" />
                  <ToolBtn title="Underline" label="<u>U</u>" cmd="underline" />
                  <ToolBtn title="Strikethrough" label="<s>S</s>" cmd="strikeThrough" />
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <ToolBtn title="Align Left" label="≡" cmd="justifyLeft" />
                  <ToolBtn title="Align Center" label="≡" cmd="justifyCenter" />
                  <ToolBtn title="Align Right" label="≡" cmd="justifyRight" />
                  <ToolBtn title="Justify" label="≡" cmd="justifyFull" />
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <ToolBtn title="Bullet List" label="• ≡" cmd="insertUnorderedList" />
                  <ToolBtn title="Numbered List" label="1 ≡" cmd="insertOrderedList" />
                  <ToolBtn title="Indent" label="⇥" cmd="indent" />
                  <ToolBtn title="Outdent" label="⇤" cmd="outdent" />
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <select
                    className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white ml-1"
                    defaultValue=""
                    onChange={e => {
                      document.execCommand("fontSize", false, e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>Size</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => setDescHtml(editorRef.current?.innerHTML ?? "")}
                  className="min-h-[120px] px-3 py-2 text-sm focus:outline-none"
                  style={{ lineHeight: 1.6 }}
                />
                <div className="text-right text-xs text-gray-400 px-2 pb-1">
                  {(editorRef.current?.innerText ?? descHtml.replace(/<[^>]+>/g, "")).length}/2000
                </div>
              </div>
            </div>

            {/* Choose File */}
            <div className="mb-2">
              <label className="text-xs font-medium text-gray-700 mb-1 block">Choose File:</label>
              <div className="flex gap-2">
                <input type="text" readOnly placeholder="File Name" value={attachFile?.name || ""}
                  className="flex-1 border border-gray-300 rounded-l px-3 py-1.5 text-sm bg-gray-50" />
                <label className="bg-[#1a6caf] hover:bg-[#155a94] text-white px-4 py-1.5 text-sm rounded-r cursor-pointer whitespace-nowrap transition-colors">
                  Browse
                  <input type="file" className="hidden" accept=".jpeg,.jpg,.png,.pdf"
                    onChange={e => setAttachFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="mt-1 text-xs text-orange-600 space-y-0.5">
                <p>Note*: Only .jpeg, .jpg, .png, .pdf file formats are allowed.</p>
                <p>Note*: Maximum file size is 5MB.</p>
              </div>
            </div>

            {/* Display in timetable + Submit */}
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-600">
                <input type="checkbox" className="accent-[#1f3a4f] w-4 h-4"
                  checked={displayInTimetable} onChange={e => setDisplayInTimetable(e.target.checked)} />
                <span>Display this notice in the <span className="font-semibold">timetable</span> (attachment will not be displayed.)</span>
              </label>
              <button onClick={handleSubmit} disabled={submitting}
                className="bg-[#1a6caf] hover:bg-[#155a94] disabled:opacity-50 text-white px-6 py-1.5 rounded text-sm font-medium transition-colors">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Read Announcement Modal ═════════════════════════════════════════════ */}
      {openAnn && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="bg-[#1f3a4f] text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Announcement</span>
              <button onClick={() => setOpenAnn(null)} className="text-white text-2xl font-light leading-none">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 border-b pb-3">
                <div><span className="font-medium text-gray-700">Sent On:</span> {fmtDate(openAnn.created_at)}</div>
                {openAnn.delivery_date && (
                  <div><span className="font-medium text-gray-700">Scheduled:</span> {fmtDateTime(openAnn.delivery_date, openAnn.delivery_time)}</div>
                )}
                {openAnn.file_name && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Attachment:</span>{" "}
                    <span className="text-blue-600">{openAnn.file_name}</span>
                  </div>
                )}
              </div>
              <div
                className="text-sm text-gray-700 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: openAnn.description }}
              />
            </div>
            <div className="px-5 py-3 border-t flex justify-between items-center">
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ Marked as Read</span>
              <button onClick={() => setOpenAnn(null)}
                className="px-5 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Select Users Modal with Accordion ═══════════════════════════════════ */}
      {showSelectUsers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">
                Select {recipientUserType === "faculty" ? "👨‍🏫 Faculty" : recipientUserType === "parent" ? "👨‍👩‍👦 Parents" : "👩‍🎓 Students"}
                {selectedDeptIds.length > 0 && ` (${selectedDeptIds.length} dept${selectedDeptIds.length > 1 ? 's' : ''})`}
                {getSelectedCount(recipientUserType) > 0 && ` • ${getSelectedCount(recipientUserType)} selected`}
              </span>
              <button onClick={() => setShowSelectUsers(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="px-3 pt-3 flex items-center gap-2">
              <input 
                type="text" 
                placeholder={`Search by name or ${recipientUserType === "faculty" ? "username" : "USN"}...`}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1f3a4f]"
                value={recipientSearch} 
                onChange={e => setRecipientSearch(e.target.value)} 
              />
              {recipientSearch && (
                <button 
                  onClick={() => setRecipientSearch("")}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              {loadingRecipients ? (
                <div className="text-center py-10 text-gray-400 text-sm">Loading recipients...</div>
              ) : groupedRecipients.length === 0 && flatRecipients.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <div className="text-4xl mb-2">👤</div>
                  No recipients found for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-xs font-semibold">Group / Name</th>
                        <th className="p-2 text-left text-xs font-semibold">Info</th>
                        <th className="p-2 w-8">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const currentSelections = selections[recipientUserType] || new Set<number>();
                              const visibleItems = flatRecipients.filter(r => {
                                const q = recipientSearch.toLowerCase().trim();
                                if (!q) return true;
                                return r.full_name.toLowerCase().includes(q) ||
                                  (r.usn || "").toLowerCase().includes(q) ||
                                  (r.username || "").toLowerCase().includes(q);
                              });
                              return visibleItems.length > 0 && visibleItems.every(r => currentSelections.has(r.recipient_id));
                            })()}
                            onChange={toggleAllRecipients}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedRecipients.length > 0 ? (
                        renderGroupedRecipientsWithAccordion(groupedRecipients)
                      ) : (
                        flatRecipients
                          .filter(r => {
                            const q = recipientSearch.toLowerCase().trim();
                            if (!q) return true;
                            return r.full_name.toLowerCase().includes(q) ||
                              (r.usn || "").toLowerCase().includes(q) ||
                              (r.username || "").toLowerCase().includes(q);
                          })
                          .map(r => {
                            const currentSelections = selections[recipientUserType] || new Set<number>();
                            return (
                              <tr key={r.recipient_id} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                                <td className="p-2 text-xs text-gray-600">{r.full_name}</td>
                                <td className="p-2 text-xs text-gray-400">{r.usn || r.username || ''}</td>
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={currentSelections.has(r.recipient_id)}
                                    onChange={() => toggleRecipientSelection(r.recipient_id)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {getSelectedCount(recipientUserType)} recipient{getSelectedCount(recipientUserType) !== 1 ? 's' : ''} selected
                {recipientSearch && ` (filtered from ${flatRecipients.length} total)`}
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center border-t">
              <span className="text-sm text-gray-600">{getSelectedCount(recipientUserType)} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSelectUsers(false)}
                  className="px-4 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={() => setShowSelectUsers(false)}
                  className="px-4 py-1.5 text-sm bg-[#1f3a4f] text-white rounded hover:bg-[#17404e] transition-colors">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementPage;