import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../../../utils/api";
import { LocalStorageHelper } from "../../../utils/localStorageHelper";
import { loginData } from "../../login/loginModel";
import { toast } from "react-toastify";

// ─── API endpoints ────────────────────────────────────────────────────────────
const SEND_API = {
  userTypes: "/api/v1/announcements/announcements/send/user-types",
  departments: "/api/v1/announcements/announcements/send/departments",
  curriculums: "/api/v1/announcements/announcements/send/curriculums",
  recipients: "/api/v1/announcements/announcements/send/recipients",
  create: "/api/v1/announcements/announcements/send/create",
  sent: "/api/v1/announcements/announcements/send/sent",
  // Student endpoint: uses iems_students.student_id via ssd_id
  receivedStudent: (uid: number) => `/api/v1/announcements/announcements/received/student/${uid}`,
  // Faculty endpoint: uses iems_users.id via faculty_id
  receivedFaculty: (uid: number) => `/api/v1/announcements/announcements/received/faculty/${uid}`,
  deleteStudent: (annId: number, uid: number) => `/api/v1/announcements/announcements/received/student/${annId}/${uid}`,
  deleteFaculty: (annId: number, uid: number) => `/api/v1/announcements/announcements/received/faculty/${annId}/${uid}`,
  deleteSent: (annId: number) => `/api/v1/announcements/announcements/send/sent/${annId}`,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { dept_id: number; dept_name: string; }
interface Curriculum { crclm_id: number; start_year: string; }
interface Recipient { recipient_id: number; full_name: string; usn?: string; username?: string; }
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

// Check if a scheduled announcement should be visible now
const isAnnouncementVisible = (ann: ReceivedAnn): boolean => {
  if (!ann.delivery_date) return true; // No schedule = show immediately
  const dateStr = ann.delivery_date;
  const timeStr = ann.delivery_time || "00:00:00";
  const [h, m, s] = timeStr.split(':');
  const paddedTime = `${(h || '0').padStart(2, '0')}:${m || '00'}:${s || '00'}`;
  const scheduled = new Date(`${dateStr}T${paddedTime}`);
  return scheduled <= new Date();
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

// ─── Component ────────────────────────────────────────────────────────────────
const AnnouncementPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<loginData>("auth_state");
  // For faculty: id = iems_users.id. For students: id = student_id from iems_students.
  const userType: string = (authState as any)?.user_type ?? "U";
  const isStudent = userType === "S";
  const userRole: 'faculty' | 'student' = isStudent ? 'student' : 'faculty';

  // Faculty uses their iems_users.id; students use their iems_students.student_id
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
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [hideDate, setHideDate] = useState("");
  const [hideTime, setHideTime] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [displayInTimetable, setDisplayInTimetable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSelectUsers, setShowSelectUsers] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<number>>(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientUserType, setRecipientUserType] = useState<"student" | "faculty">("student");
  const [recipientSearch, setRecipientSearch] = useState("");
  const userTypeRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // ── Confirm delete modal state ─────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'received'; ann: ReceivedAnn } | { type: 'sent'; annId: number } | null>(null);

  const isStudentSelected = selectedUserTypes.includes("Student");
  const isFacultySelected = selectedUserTypes.includes("Faculty");
  const unseenCount = received.filter(r => !readIds.has(r.id)).length;

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

  // ── Delete received announcement ───────────────────────────
  const deleteReceived = async (ann: ReceivedAnn) => {
    setDeleteConfirm({ type: 'received', ann });
  };

  const confirmDeleteReceived = async (ann: ReceivedAnn) => {
    try {
      const url = userRole === 'faculty'
        ? SEND_API.deleteFaculty(ann.id, userId)
        : SEND_API.deleteStudent(ann.id, userId);
      await axiosInstance.delete(url);
      toast.success("Announcement removed");
      setReceived(prev => prev.filter(r => r.id !== ann.id));
    } catch { toast.error("Failed to remove announcement"); }
  };

  // ── Delete sent announcement (admin/sender) ────────────────────────────────
  const deleteSent = async (annId: number) => {
    if (!window.confirm("Delete this sent announcement and all its recipient mappings?")) return;
    try {
      await axiosInstance.delete(SEND_API.deleteSent(annId));
      toast.success("Announcement deleted");
      setSentList(prev => prev.filter(a => a.lmsn_id !== annId));
    } catch { toast.error("Failed to delete announcement"); }
  };

  // ── Load received announcements (role-aware, filters future-scheduled) ─────
  const fetchReceived = useCallback(async () => {
    setLoadingReceived(true);
    try {
      // Students: call student-specific endpoint with their student_id
      // Faculty: call generic endpoint with their iems_users.id
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
      // Filter: only show if delivery_date/time has passed (extra safety on frontend)
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
  }, [userId, userRole]);

  // ── Load sent announcements list ───────────────────────────────────────────
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

  // ── Load departments ───────────────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get(SEND_API.departments)
      .then((r: any) => { const d = r.data?.data; setDepartments(Array.isArray(d) ? d : []); })
      .catch(() => {});
  }, []);

  // ── Load curriculums when dept changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedDept || !isStudentSelected) { setCurriculums([]); setSelectedCurriculum(""); return; }
    axiosInstance.get(SEND_API.curriculums, { params: { dept_id: selectedDept } })
      .then((r: any) => { const d = r.data?.data; setCurriculums(Array.isArray(d) ? d : []); })
      .catch(() => setCurriculums([]));
  }, [selectedDept, isStudentSelected]);

  // ── Close user type dropdown on outside click ─────────────────────────────
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

  // ── Load recipients for Select Users modal ────────────────────────────────
  const openSelectUsers = async (userType: "student" | "faculty") => {
    setRecipientUserType(userType);
    setShowSelectUsers(true);
    setLoadingRecipients(true);
    setRecipientSearch("");
    try {
      const params: any = { user_type: userType };
      if (selectedDept) params.dept_id = selectedDept;
      if (selectedCurriculum && userType === "student") params.academic_batch_id = selectedCurriculum;
      const r: any = await axiosInstance.get(SEND_API.recipients, { params });
      const items = r.data?.data?.items ?? r.data?.items ?? r.data;
      const fetched: Recipient[] = Array.isArray(items) ? items : [];
      setRecipients(fetched);
    } catch {
      // On error, show empty array
      setRecipients([]);
    }
    finally { setLoadingRecipients(false); }
  };

  // ── Submit announcement ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const plainText = editorRef.current?.innerText?.trim() ?? "";
    const htmlContent = editorRef.current?.innerHTML ?? "";
    if (!plainText) { toast.error("Announcement description is required."); return; }
    if (selectedUserTypes.length === 0) { toast.error("Please select at least one user type."); return; }
    setSubmitting(true);
    let anySuccess = false;
    const errors: string[] = [];

    for (const userType of selectedUserTypes) {
      const payload: any = {
        notify_description: htmlContent,
        created_by: userId,
        target_user_type: userType.toLowerCase(),
        display_to_timetable: displayInTimetable ? 1 : 0,
        recipient_ids: Array.from(selectedRecipientIds),
        recipient_usns: [],
      };
      if (deliveryDate) payload.delivery_date = deliveryDate;
      if (deliveryTime) payload.delivery_time = deliveryTime;
      if (hideDate) payload.delivery_hide_date = hideDate;
      if (hideTime) payload.delivery_hide_time = hideTime;
      if (selectedDept) payload.dept_id = Number(selectedDept);
      if (selectedCurriculum) payload.academic_batch_id = Number(selectedCurriculum);

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
        errors.push(e?.response?.data?.detail || e?.response?.data?.message || `Failed to send to ${userType}`);
      }
    }

    setSubmitting(false);
    if (anySuccess) {
      toast.success("Announcement sent successfully!");
      if (editorRef.current) editorRef.current.innerHTML = "";
      setDescHtml("");
      setDeliveryDate(""); setDeliveryTime(""); setHideDate(""); setHideTime("");
      setSelectedUserTypes([]); setSelectedDept(""); setSelectedCurriculum("");
      setAttachFile(null); setDisplayInTimetable(false); setSelectedRecipientIds(new Set());
      setActiveTab("received");
    }
    if (errors.length > 0) errors.forEach(e => toast.error(e));
  };

  // ── Received table data ────────────────────────────────────────────────────
  const filteredRec = received.filter(r =>
    (r.description || "").toLowerCase().includes(recSearchTerm.toLowerCase()) ||
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

        {/* Tabs — students only see Received */}
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
          {/* Send and Sent History tabs — faculty only */}
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
            {/* Role badge */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Viewing as:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${userRole === 'faculty' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {userRole === 'faculty' ? '👨‍🏫 Faculty' : '🎓 Student'}
              </span>
              <span className="text-xs text-gray-400 ml-auto">Only shows announcements scheduled for now or earlier</span>
            </div>

            {/* Controls */}
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

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-[#d6dde3] text-gray-700">
                  <tr>
                    <th className="px-3 py-2 w-8 text-left"><input type="checkbox" /></th>
                    <th className="px-3 py-2 text-left">Sl No. ⇅</th>
                    <th className="px-3 py-2 text-left">Notice ⇅</th>
                    <th className="px-3 py-2 text-left">Sent On ⇅</th>
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
                      <tr
                        key={r.id}
                        className={`hover:bg-blue-50 transition-colors ${!isRead ? "bg-blue-50/30" : ""}`}
                      >
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
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No announcements found{received.length === 0 ? " (or none are scheduled to appear yet)" : ""}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
              <span className="text-sm text-gray-600 font-medium">All Sent Announcements (Admin View)</span>
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
            {/* Row 1: User Type + Department + (Curriculum if Student) */}
            <div className={`grid gap-4 mb-4 ${isStudentSelected ? "grid-cols-3" : "grid-cols-2"}`}>
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
                    <span className={selectedUserTypes.length === 0 ? "text-gray-400" : "text-gray-800"}>
                      {selectedUserTypes.length === 0 ? "Select User Type" : selectedUserTypes.join(", ")}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>
                  {showUserTypeDropdown && (
                    <div className="absolute z-20 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-0.5">
                      {USER_TYPES.map(t => (
                        <label key={t} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm
                          ${t === "Student" && selectedUserTypes.includes("Student") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}>
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

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Department: <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none"
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>

              {/* Curriculum (only for Student) */}
              {isStudentSelected && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Curriculum: <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none"
                    value={selectedCurriculum}
                    onChange={e => setSelectedCurriculum(e.target.value)}
                  >
                    <option value="">Select Curriculum</option>
                    {curriculums.map(c => <option key={c.crclm_id} value={c.crclm_id}>{c.start_year}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Select Users buttons — show for both Faculty and Student */}
            {(isStudentSelected || isFacultySelected) && (
              <div className="flex gap-2 mb-4">
                {isStudentSelected && (
                  <button onClick={() => openSelectUsers("student")}
                    className="text-xs text-blue-600 border border-blue-300 px-3 py-1.5 rounded hover:bg-blue-50">
                    👩‍🎓 Select Students ({selectedRecipientIds.size > 0 ? `${selectedRecipientIds.size} selected` : "all"})
                  </button>
                )}
                {isFacultySelected && (
                  <button onClick={() => openSelectUsers("faculty")}
                    className="text-xs text-purple-600 border border-purple-300 px-3 py-1.5 rounded hover:bg-purple-50">
                    👨‍🏫 Select Faculty ({selectedRecipientIds.size > 0 ? `${selectedRecipientIds.size} selected` : "all"})
                  </button>
                )}
              </div>
            )}

            {/* Row 2: Delivery date & time */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap w-36 text-right shrink-0">
                  Date &amp; time of delivery: <span className="text-red-500">*</span>
                </label>
                <input type="date" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                  value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                <input type="time" className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                  value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
              </div>
              <div />
            </div>

            {/* Row 3: Hide notice after */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap w-36 text-right shrink-0">
                  Hide notice after :
                </label>
                <input type="date" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                  value={hideDate} onChange={e => setHideDate(e.target.value)} />
                <input type="time" className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                  value={hideTime} onChange={e => setHideTime(e.target.value)} />
              </div>
              <div />
            </div>

            {/* Scheduling note */}
            {deliveryDate && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                ⏰ This announcement will only appear to recipients on <strong>{deliveryDate} at {deliveryTime || "00:00"}</strong> and will not be visible before that time.
              </div>
            )}

            {/* Announcement Description — contentEditable rich text */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Announcement Description: <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded">
                {/* Toolbar */}
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
                {/* Editor area */}
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
                <label className="bg-[#1a6caf] hover:bg-[#155a94] text-white px-4 py-1.5 text-sm rounded-r cursor-pointer whitespace-nowrap">
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
                className="bg-[#1a6caf] hover:bg-[#155a94] disabled:opacity-50 text-white px-6 py-1.5 rounded text-sm font-medium">
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
              {/* Meta info */}
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
              {/* Content */}
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

      {/* ══ Select Users Modal ══════════════════════════════════════════════════ */}
      {showSelectUsers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">
                Select {recipientUserType === "faculty" ? "👨‍🏫 Faculty" : "👩‍🎓 Students"}
              </span>
              <button onClick={() => setShowSelectUsers(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="px-3 pt-3">
              <input type="text" placeholder={`Search by name or ${recipientUserType === "faculty" ? "username" : "USN"}...`}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none"
                value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)} />
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              {loadingRecipients ? (
                <p className="text-center py-10 text-gray-400 text-sm">Loading...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 w-8">
                        <input type="checkbox"
                          checked={recipients.length > 0 && recipients.every(r => selectedRecipientIds.has(r.recipient_id))}
                          onChange={() => {
                            const all = recipients.every(r => selectedRecipientIds.has(r.recipient_id));
                            setSelectedRecipientIds(all ? new Set() : new Set(recipients.map(r => r.recipient_id)));
                          }} />
                      </th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600">{recipientUserType === "faculty" ? "Username" : "USN"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients
                      .filter(r => {
                        const q = recipientSearch.toLowerCase();
                        return r.full_name.toLowerCase().includes(q) ||
                          (r.usn || "").toLowerCase().includes(q) ||
                          (r.username || "").toLowerCase().includes(q);
                      })
                      .map(r => (
                        <tr key={r.recipient_id}
                          className={`border-b cursor-pointer hover:bg-blue-50 ${selectedRecipientIds.has(r.recipient_id) ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedRecipientIds(prev => {
                            const s = new Set(prev);
                            s.has(r.recipient_id) ? s.delete(r.recipient_id) : s.add(r.recipient_id);
                            return s;
                          })}>
                          <td className="p-2">
                            <input type="checkbox" checked={selectedRecipientIds.has(r.recipient_id)}
                              onChange={() => {}} onClick={e => e.stopPropagation()} />
                          </td>
                          <td className="p-2 text-xs font-medium">{r.full_name}</td>
                          <td className="p-2 text-xs font-mono text-gray-500">{r.usn || r.username || r.recipient_id}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center border-t">
              <span className="text-sm text-gray-600">{selectedRecipientIds.size} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSelectUsers(false)}
                  className="px-4 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={() => setShowSelectUsers(false)}
                  className="px-4 py-1.5 text-sm bg-[#1f3a4f] text-white rounded hover:bg-[#17404e]">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementPage;
