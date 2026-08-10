import React, { useState, useMemo, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/api";
import { LocalStorageHelper } from "../../../utils/localStorageHelper";
import { loginData } from "../../login/loginModel";
import { toast } from "react-toastify";

// ─── Confirmed API URLs (from live OpenAPI /openapi.json) ─────────────────────
// GET  /api/v1/announcements/announcements/send/user-types
// GET  /api/v1/announcements/announcements/send/departments
// GET  /api/v1/announcements/announcements/send/programs?dept_id=
// GET  /api/v1/announcements/announcements/send/curriculums?dept_id=&pgm_id=
// GET  /api/v1/announcements/announcements/send/recipients?user_type=&dept_id=&...
// POST /api/v1/announcements/announcements/send/create
// GET  /api/v1/announcements/announcements/send/sent
// DELETE /api/v1/announcements/announcements/send/sent/{announcement_id}

const API = {
    userTypes: "/api/v1/announcements/announcements/send/user-types",
    departments: "/api/v1/announcements/announcements/send/departments",
    programs: "/api/v1/announcements/announcements/send/programs",
    curriculums: "/api/v1/announcements/announcements/send/curriculums",
    recipients: "/api/v1/announcements/announcements/send/recipients",
    create: "/api/v1/announcements/announcements/send/create",
    sent: "/api/v1/announcements/announcements/send/sent",
};

// ─── Types matching actual backend response fields ───────────────────────────
interface Department { dept_id: number; dept_name: string; }
interface Program { pgm_id: number; pgm_title: string; dept_id: number; }
interface Curriculum { crclm_id: number; start_year: string; dept_id: number; pgm_id: number; }
interface Recipient { recipient_id: number; full_name: string; usn?: string; username?: string; }
interface SentItem {
    id: number;
    notify_description: string;
    target_user_type: string;
    created_at: string;
    delivery_date: string | null;
    recipient_count?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const fmtDate = (v: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const TYPE_BADGE: Record<string, string> = {
    student: "bg-blue-100 text-blue-700",
    faculty: "bg-green-100 text-green-700",
    parent: "bg-purple-100 text-purple-700",
};

// ─── Component ────────────────────────────────────────────────────────────────
const SendAnnouncementPage: React.FC = () => {
    const authState = LocalStorageHelper.getObject<loginData>("auth_state");
    const userId: number = (authState as any)?.user_id ?? (authState as any)?.id ?? 1;

    // ── Tabs ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"compose" | "sent">("compose");

    // ── Compose form ──────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        message: "",
        recipientType: "student" as "student" | "faculty" | "parent",
        delivery_date: "",
        delivery_time: "",
    });
    const [sending, setSending] = useState(false);

    // ── Recipient modal state ─────────────────────────────────────────────────
    const [showRecipientModal, setShowRecipientModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Filter dropdowns (loaded from backend)
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loadingRecip, setLoadingRecip] = useState(false);

    const [filter, setFilter] = useState({
        dept_id: "" as string,
        pgm_id: "" as string,
        academic_batch_id: "" as string,
        semester: "" as string,
        section: "" as string,
    });

    // Selected recipients
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Confirmed selection (after clicking "Confirm Selection")
    const [confirmedRecipients, setConfirmedRecipients] = useState<Recipient[]>([]);

    // ── Sent list ─────────────────────────────────────────────────────────────
    const [sentList, setSentList] = useState<SentItem[]>([]);
    const [loadingSent, setLoadingSent] = useState(false);

    // ── Load departments on mount ─────────────────────────────────────────────
    useEffect(() => {
        axiosInstance.get<{ data: Department[] }>(API.departments)
            .then(r => {
                const d = r.data?.data;
                setDepartments(Array.isArray(d) ? d : []);
            })
            .catch(() => { });
    }, []);

    // ── Load programs when dept changes ──────────────────────────────────────
    useEffect(() => {
        setPrograms([]); setFilter(f => ({ ...f, pgm_id: "" }));
        if (!filter.dept_id) return;
        axiosInstance.get<{ data: Program[] }>(API.programs, { params: { dept_id: filter.dept_id } })
            .then(r => {
                const d = r.data?.data;
                setPrograms(Array.isArray(d) ? d : []);
            })
            .catch(() => { });
    }, [filter.dept_id]);

    // ── Load curriculums when dept+program changes ────────────────────────────
    useEffect(() => {
        setCurriculums([]); setFilter(f => ({ ...f, academic_batch_id: "" }));
        if (!filter.dept_id) return;
        axiosInstance.get<{ data: Curriculum[] }>(API.curriculums, {
            params: { dept_id: filter.dept_id, pgm_id: filter.pgm_id || undefined }
        }).then(r => {
            const d = r.data?.data;
            setCurriculums(Array.isArray(d) ? d : []);
        }).catch(() => { });
    }, [filter.dept_id, filter.pgm_id]);

    // ── Load recipients based on all filters ─────────────────────────────────
    const loadRecipients = useCallback(async () => {
        setLoadingRecip(true);
        try {
            const params: Record<string, any> = { user_type: form.recipientType };
            if (filter.dept_id) params.dept_id = filter.dept_id;
            if (filter.pgm_id) params.pgm_id = filter.pgm_id;
            if (filter.academic_batch_id) params.academic_batch_id = filter.academic_batch_id;
            if (filter.semester) params.semester = filter.semester;
            if (filter.section) params.section = filter.section;

            // recipients returns { data: { total, items } } not { data: [...] }
            const r = await axiosInstance.get<{ data: { total: number; items: Recipient[] } }>(API.recipients, { params });
            const items = r.data?.data?.items;
            setRecipients(Array.isArray(items) ? items : []);
        } catch {
            toast.error("Failed to load recipients");
        } finally {
            setLoadingRecip(false);
        }
    }, [form.recipientType, filter]);

    // ── Fetch sent announcements ──────────────────────────────────────────────
    const fetchSent = useCallback(async () => {
        setLoadingSent(true);
        try {
            const r = await axiosInstance.get<{ data: SentItem[] }>(API.sent);
            const d = r.data?.data;
            setSentList(Array.isArray(d) ? d : []);
        } catch {
            toast.error("Failed to load sent announcements");
        } finally {
            setLoadingSent(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "sent") fetchSent();
    }, [activeTab, fetchSent]);

    // ── Select / deselect helpers ─────────────────────────────────────────────
    const toggleOne = (id: number) =>
        setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

    const allChecked = recipients.length > 0 && recipients.every(r => selectedIds.has(r.recipient_id));
    const toggleAll = () =>
        setSelectedIds(allChecked ? new Set() : new Set(recipients.map(r => r.recipient_id)));

    const confirmRecipients = () => {
        const sel = recipients.filter(r => selectedIds.has(r.recipient_id));
        setConfirmedRecipients(sel);
        setShowRecipientModal(false);
    };

    // ── Send announcement ─────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!form.message.trim()) return;
        setSending(true);
        try {
            const payload = {
                notify_description: form.message.trim(),
                created_by: userId,
                target_user_type: form.recipientType,
                delivery_date: form.delivery_date || null,
                delivery_time: form.delivery_time || null,
                delivery_hide_date: null,
                delivery_hide_time: null,
                display_to_timetable: 0,
                dept_id: filter.dept_id ? Number(filter.dept_id) : null,
                pgm_id: filter.pgm_id ? Number(filter.pgm_id) : null,
                academic_batch_id: filter.academic_batch_id ? Number(filter.academic_batch_id) : null,
                semester: filter.semester ? Number(filter.semester) : null,
                section: filter.section || null,
                recipient_ids: confirmedRecipients.map(r => r.recipient_id),
                recipient_usns: confirmedRecipients.map(r => r.usn ?? "").filter(Boolean),
            };

            await axiosInstance.post(API.create, payload);
            toast.success("Announcement sent successfully!");
            // Reset form
            setForm({ message: "", recipientType: "student", delivery_date: "", delivery_time: "" });
            setFilter({ dept_id: "", pgm_id: "", academic_batch_id: "", semester: "", section: "" });
            setSelectedIds(new Set());
            setConfirmedRecipients([]);
            setShowConfirm(false);
            setActiveTab("sent");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send announcement");
        } finally {
            setSending(false);
        }
    };

    // ── Delete sent announcement ──────────────────────────────────────────────
    const deleteSent = async (id: number) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await axiosInstance.delete(`${API.sent}/${id}`);
            setSentList(prev => prev.filter(a => a.id !== id));
            toast.success("Deleted successfully");
        } catch {
            toast.error("Failed to delete");
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-[#1f4e5f] text-white px-4 py-2 rounded-t-md font-semibold text-sm">
                Send Announcement
            </div>

            <div className="border rounded-b-md bg-white">
                {/* Tabs */}
                <div className="flex border-b">
                    {[{ key: "compose", label: "✉️ Compose" }, { key: "sent", label: "📤 Sent" }].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`px-6 py-2.5 text-sm font-medium transition-colors ${activeTab === key ? "border-b-2 border-[#1f4e5f] text-[#1f4e5f]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {/* ══ COMPOSE TAB ══ */}
                    {activeTab === "compose" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Form */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Recipient type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Recipient Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-3">
                                        {(["student", "faculty", "parent"] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setForm(f => ({ ...f, recipientType: t }))}
                                                className={`capitalize px-4 py-1.5 text-sm rounded-full border font-medium transition-colors ${form.recipientType === t
                                                    ? "bg-[#1f4e5f] text-white border-[#1f4e5f]"
                                                    : "text-gray-500 border-gray-300 hover:border-[#1f4e5f]"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery date / time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e5f]"
                                            value={form.delivery_date}
                                            onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                                        <input
                                            type="time"
                                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e5f]"
                                            value={form.delivery_time}
                                            onChange={e => setForm(f => ({ ...f, delivery_time: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={6}
                                        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e5f] resize-none"
                                        placeholder="Type your announcement message here..."
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
                                </div>

                                {/* Recipients summary */}
                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-gray-700">📋 Recipients</p>
                                        <button
                                            onClick={() => { setShowRecipientModal(true); loadRecipients(); }}
                                            className="text-sm text-[#1f4e5f] hover:underline font-medium"
                                        >
                                            {confirmedRecipients.length > 0 ? "Change Recipients" : "+ Select Recipients"}
                                        </button>
                                    </div>
                                    {confirmedRecipients.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-[#1f4e5f]">{confirmedRecipients.length}</span>
                                            <span className="text-sm text-gray-600 capitalize">{form.recipientType}s selected</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">No recipients selected. Click "Select Recipients" to choose.</p>
                                    )}
                                </div>

                                {/* Send button */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        disabled={!form.message.trim()}
                                        className="px-6 py-2.5 bg-[#1f4e5f] text-white text-sm font-medium rounded hover:bg-[#17404e] disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        📤 Send Announcement
                                    </button>
                                    <button
                                        onClick={() => { setForm({ message: "", recipientType: "student", delivery_date: "", delivery_time: "" }); setConfirmedRecipients([]); setSelectedIds(new Set()); }}
                                        className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Right: Preview */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">👁️ Preview</p>
                                <div className="border rounded-lg p-4 bg-white space-y-3 shadow-sm">
                                    <span className={`text-xs px-2 py-1 rounded font-medium capitalize ${TYPE_BADGE[form.recipientType]}`}>
                                        {form.recipientType}
                                    </span>
                                    <p className={`text-sm leading-relaxed ${!form.message ? "text-gray-300" : "text-gray-700"}`}>
                                        {form.message || "Your message will appear here..."}
                                    </p>
                                    <div className="border-t pt-2 text-xs text-gray-400 flex justify-between">
                                        <span>From: You (ID: {userId})</span>
                                        <span>{fmtDate(new Date().toISOString())}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ SENT TAB ══ */}
                    {activeTab === "sent" && (
                        <div>
                            <div className="flex justify-end mb-3">
                                <button onClick={fetchSent} className="text-sm text-gray-500 hover:text-[#1f4e5f] px-3 py-1 border rounded hover:border-[#1f4e5f]">
                                    🔄 Refresh
                                </button>
                            </div>
                            {loadingSent ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="text-4xl mb-3">⏳</div>
                                    <p className="text-sm">Loading sent announcements...</p>
                                </div>
                            ) : sentList.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="text-5xl mb-3">📤</div>
                                    <p className="text-sm">No announcements sent yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sentList.map(a => (
                                        <div key={a.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${TYPE_BADGE[a.target_user_type] ?? "bg-gray-100 text-gray-700"}`}>
                                                            {a.target_user_type}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{fmtDate(a.created_at)}</span>
                                                        {a.delivery_date && (
                                                            <span className="text-xs text-amber-600">📅 Delivers: {fmtDate(a.delivery_date)}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {a.notify_description?.length > 120
                                                            ? `${a.notify_description.slice(0, 120)}...`
                                                            : a.notify_description}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 items-center shrink-0">
                                                    {a.recipient_count !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-[#1f4e5f]">{a.recipient_count}</p>
                                                            <p className="text-xs text-gray-400">recipients</p>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => deleteSent(a.id)}
                                                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ MODAL — Select Recipients ═══ */}
            {showRecipientModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                        <div className="bg-[#1f4e5f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
                            <span className="font-semibold text-sm">Select Recipients — {form.recipientType}</span>
                            <button onClick={() => setShowRecipientModal(false)} className="text-white hover:opacity-75 text-xl leading-none">&times;</button>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                                    <select
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                        value={filter.dept_id}
                                        onChange={e => setFilter(f => ({ ...f, dept_id: e.target.value }))}
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                                    <select
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                        value={filter.pgm_id}
                                        onChange={e => setFilter(f => ({ ...f, pgm_id: e.target.value }))}
                                    >
                                        <option value="">All Programs</option>
                                        {programs.map(p => <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                                    <select
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                        value={filter.semester}
                                        onChange={e => setFilter(f => ({ ...f, semester: e.target.value }))}
                                    >
                                        <option value="">All Semesters</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                                    <select
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                        value={filter.section}
                                        onChange={e => setFilter(f => ({ ...f, section: e.target.value }))}
                                    >
                                        <option value="">All Sections</option>
                                        {["A", "B", "C", "D"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={loadRecipients}
                                disabled={loadingRecip}
                                className="mt-3 text-sm bg-[#1f4e5f] text-white px-4 py-1.5 rounded hover:bg-[#17404e] disabled:opacity-50"
                            >
                                {loadingRecip ? "Loading..." : "🔍 Search Recipients"}
                            </button>
                        </div>

                        {/* Recipient list */}
                        <div className="overflow-y-auto flex-1 p-2">
                            {loadingRecip ? (
                                <div className="text-center py-10 text-gray-400 text-sm">Loading recipients...</div>
                            ) : recipients.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    No recipients found. Try different filters or click Search.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left w-10">
                                                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                                            </th>
                                            <th className="p-2 text-left text-xs font-semibold text-gray-600">Name</th>
                                            <th className="p-2 text-left text-xs font-semibold text-gray-600">USN / ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipients.map(r => (
                                            <tr
                                                key={r.recipient_id}
                                                onClick={() => toggleOne(r.recipient_id)}
                                                className={`cursor-pointer border-b hover:bg-blue-50 transition-colors ${selectedIds.has(r.recipient_id) ? "bg-blue-50" : ""}`}
                                            >
                                                <td className="p-2">
                                                    <input type="checkbox" checked={selectedIds.has(r.recipient_id)} onChange={() => toggleOne(r.recipient_id)} onClick={e => e.stopPropagation()} />
                                                </td>
                                                <td className="p-2 font-medium text-gray-800 text-xs">{r.full_name}</td>
                                                <td className="p-2 font-mono text-xs text-gray-600">{r.usn || r.username || r.recipient_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center border-t">
                            <span className="text-sm text-gray-600 font-medium">{selectedIds.size} selected</span>
                            <div className="flex gap-2">
                                <button onClick={() => setShowRecipientModal(false)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                                <button onClick={confirmRecipients} className="px-4 py-2 text-sm bg-[#1f4e5f] text-white rounded hover:bg-[#17404e]">Confirm Selection</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODAL — Confirm Send ═══ */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
                        <div className="bg-[#1f4e5f] text-white px-4 py-3 rounded-t-lg">
                            <span className="font-semibold text-sm">Confirm Send</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm text-gray-700">You are about to send the announcement:</p>
                            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                                <p className="text-gray-700 text-xs leading-relaxed">{form.message.slice(0, 100)}{form.message.length > 100 ? "..." : ""}</p>
                                <p className="text-gray-500 text-xs">To: <span className="font-medium capitalize">{form.recipientType}s</span> ({confirmedRecipients.length > 0 ? `${confirmedRecipients.length} selected` : "all"})</p>
                                {form.delivery_date && <p className="text-gray-500 text-xs">Delivery: {form.delivery_date} {form.delivery_time}</p>}
                            </div>
                            <p className="text-xs text-amber-600">⚠️ This action cannot be undone once sent.</p>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSend} disabled={sending} className="px-4 py-2 text-sm bg-[#1f4e5f] text-white rounded hover:bg-[#17404e] disabled:opacity-50">
                                {sending ? "Sending..." : "📤 Send Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendAnnouncementPage;
