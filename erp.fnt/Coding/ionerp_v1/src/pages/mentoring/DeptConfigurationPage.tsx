import React, { useState, useEffect, useMemo } from "react";
import { FaSort, FaSortUp, FaSortDown, FaSave } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import MentoringPageLayout from "./MentoringPageLayout";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────
interface MentorFromOtherDept {
  id: number;
  user_name: string;
  from_department: string;
  email: string;
  to_curriculum: string;
}

interface MentorToOtherDept {
  id: number;
  user_name: string;
  email: string;
  from_curriculum: string;
  to_department: string;
}

// ─────────────────────────────────────────────
// Static mock data
// ─────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Mathematics",
  "Physics",
];

const USERS_BY_DEPT: Record<string, { name: string; email: string }[]> = {
  "Computer Science": [
    { name: "Dr. Anil Kumar", email: "anil.kumar@college.edu" },
    { name: "Prof. Sunita Rao", email: "sunita.rao@college.edu" },
  ],
  "Mechanical Engineering": [
    { name: "Dr. Ramesh Patil", email: "ramesh.patil@college.edu" },
    { name: "Prof. Kavita Sharma", email: "kavita.sharma@college.edu" },
  ],
  "Civil Engineering": [
    { name: "Dr. Vijay Singh", email: "vijay.singh@college.edu" },
  ],
  "Electronics & Communication": [
    { name: "Prof. Deepa Nair", email: "deepa.nair@college.edu" },
    { name: "Dr. Suresh Menon", email: "suresh.menon@college.edu" },
  ],
  "Information Technology": [
    { name: "Dr. Priya Pillai", email: "priya.pillai@college.edu" },
  ],
  "Mathematics": [
    { name: "Prof. Leena Joshi", email: "leena.joshi@college.edu" },
  ],
  "Physics": [
    { name: "Dr. Mohan Das", email: "mohan.das@college.edu" },
  ],
};

const CURRICULA = [
  "B.Tech - CSE",
  "B.Tech - Mech",
  "B.Tech - Civil",
  "B.Tech - ECE",
  "B.Tech - IT",
  "M.Tech - CSE",
  "M.Tech - ECE",
];

const LS_FROM_KEY = "lms_mentors_from_other_depts";
const LS_TO_KEY = "lms_mentors_to_other_depts";

const INITIAL_FROM: MentorFromOtherDept[] = [
  {
    id: 1,
    user_name: "Dr. Ramesh Patil",
    from_department: "Mechanical Engineering",
    email: "ramesh.patil@college.edu",
    to_curriculum: "B.Tech - CSE",
  },
  {
    id: 2,
    user_name: "Prof. Deepa Nair",
    from_department: "Electronics & Communication",
    email: "deepa.nair@college.edu",
    to_curriculum: "B.Tech - IT",
  },
];

const INITIAL_TO: MentorToOtherDept[] = [
  {
    id: 1,
    user_name: "Dr. Anil Kumar",
    email: "anil.kumar@college.edu",
    from_curriculum: "B.Tech - CSE",
    to_department: "Mechanical Engineering",
  },
  {
    id: 2,
    user_name: "Prof. Sunita Rao",
    email: "sunita.rao@college.edu",
    from_curriculum: "B.Tech - CSE",
    to_department: "Electronics & Communication",
  },
];

// ─────────────────────────────────────────────
// Reusable sort icon
// ─────────────────────────────────────────────
const SortIcon: React.FC<{
  col: string;
  sortCol: string;
  sortDir: "asc" | "desc";
}> = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col) return <FaSort className="inline ml-1 text-gray-400 text-xs" />;
  return sortDir === "asc" ? (
    <FaSortUp className="inline ml-1 text-gray-700 text-sm" />
  ) : (
    <FaSortDown className="inline ml-1 text-gray-700 text-sm" />
  );
};

// ─────────────────────────────────────────────
// Generic Pagination Controls
// ─────────────────────────────────────────────
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  entriesPerPage: number;
  onPrev: () => void;
  onNext: () => void;
}> = ({ currentPage, totalPages, totalEntries, entriesPerPage, onPrev, onNext }) => {
  const start = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const end = Math.min(currentPage * entriesPerPage, totalEntries);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-gray-500">
      <span>
        Showing {start} to {end} of {totalEntries} entries
      </span>
      <div className="flex gap-1">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Tab 1: Mentors FROM Other Departments
// ─────────────────────────────────────────────
const MentorsFromTab: React.FC = () => {
  const [data, setData] = useState<MentorFromOtherDept[]>([]);
  const [filterDept, setFilterDept] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Add-mentor form state
  const [formDept, setFormDept] = useState("");
  const [formUser, setFormUser] = useState("");
  const [formCurriculum, setFormCurriculum] = useState("");
  const [formErrors, setFormErrors] = useState<{ dept?: string; user?: string; curriculum?: string }>({});

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LS_FROM_KEY);
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { setData(INITIAL_FROM); }
    } else {
      setData(INITIAL_FROM);
      localStorage.setItem(LS_FROM_KEY, JSON.stringify(INITIAL_FROM));
    }
  }, []);

  const save = (updated: MentorFromOtherDept[]) => {
    setData(updated);
    localStorage.setItem(LS_FROM_KEY, JSON.stringify(updated));
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const processed = useMemo(() => {
    let result = [...data];
    if (filterDept) result = result.filter(r => r.from_department === filterDept);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.user_name.toLowerCase().includes(t) ||
        r.from_department.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t) ||
        r.to_curriculum.toLowerCase().includes(t)
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortCol] as string;
        const bVal = (b as any)[sortCol] as string;
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [data, filterDept, searchTerm, sortCol, sortDir]);

  const totalEntries = processed.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const paginated = processed.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleDelete = (id: number) => {
    const updated = data.filter(r => r.id !== id);
    save(updated);
    toast.success("Mentor mapping removed.");
  };

  const usersForDept = formDept ? (USERS_BY_DEPT[formDept] || []) : [];

  const validateForm = () => {
    const errs: typeof formErrors = {};
    if (!formDept) errs.dept = "Department is required";
    if (!formUser) errs.user = "User is required";
    if (!formCurriculum) errs.curriculum = "Curriculum is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const selectedUser = usersForDept.find(u => u.name === formUser);
    const newEntry: MentorFromOtherDept = {
      id: data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1,
      user_name: formUser,
      from_department: formDept,
      email: selectedUser?.email ?? "",
      to_curriculum: formCurriculum,
    };
    save([...data, newEntry]);
    setFormDept("");
    setFormUser("");
    setFormCurriculum("");
    setFormErrors({});
    toast.success("Mentor added successfully!");
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none bg-gray-50";

  return (
    <div className="space-y-5">


      {/* Filter */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Filter by Department:
        </label>
        <select
          value={filterDept}
          onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
          className="w-64 px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option value="">Select Department</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search..."
            className="w-56 px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Datatable */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className={thClass + " w-16"} onClick={() => handleSort("id")}>
                Sl No. <SortIcon col="id" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("user_name")}>
                User Name <SortIcon col="user_name" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("from_department")}>
                From Department <SortIcon col="from_department" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("email")}>
                Email <SortIcon col="email" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("to_curriculum")}>
                To Curriculum <SortIcon col="to_curriculum" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.length > 0 ? (
              paginated.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-500 font-medium">
                    {(currentPage - 1) * entriesPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.user_name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.from_department}</td>
                  <td className="px-4 py-3 text-gray-600">{row.email}</td>
                  <td className="px-4 py-3 text-gray-600">{row.to_curriculum}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                      title="Remove mapping"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        entriesPerPage={entriesPerPage}
        onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
        onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      />

      {/* ─── Add Mentor Form ─── */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mt-6">
        {/* Form Banner */}
        <div className="bg-slate-800 px-6 py-3.5 flex items-center">
          <h3 className="text-base font-semibold text-white tracking-wide">
            Add mentor from another department
          </h3>
        </div>

        <form onSubmit={handleSave} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Department: <span className="text-red-500">*</span>
              </label>
              <select
                value={formDept}
                onChange={e => { setFormDept(e.target.value); setFormUser(""); setFormErrors(prev => ({ ...prev, dept: undefined })); }}
                className={`w-full px-3 py-2 border rounded bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-500 ${formErrors.dept ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                  }`}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.dept && <p className="mt-1 text-xs text-red-500">{formErrors.dept}</p>}
            </div>

            {/* User */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                User: <span className="text-red-500">*</span>
              </label>
              <select
                value={formUser}
                onChange={e => { setFormUser(e.target.value); setFormErrors(prev => ({ ...prev, user: undefined })); }}
                disabled={!formDept}
                className={`w-full px-3 py-2 border rounded bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${formErrors.user ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                  }`}
              >
                <option value="">
                  {!formDept ? "Select department first" : usersForDept.length === 0 ? "No users found!" : "Select User"}
                </option>
                {usersForDept.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
              </select>
              {formErrors.user && <p className="mt-1 text-xs text-red-500">{formErrors.user}</p>}
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Curriculum: <span className="text-red-500">*</span>
              </label>
              <select
                value={formCurriculum}
                onChange={e => { setFormCurriculum(e.target.value); setFormErrors(prev => ({ ...prev, curriculum: undefined })); }}
                className={`w-full px-3 py-2 border rounded bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-500 ${formErrors.curriculum ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                  }`}
              >
                <option value="">Select Curriculum</option>
                {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.curriculum && <p className="mt-1 text-xs text-red-500">{formErrors.curriculum}</p>}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded shadow transition cursor-pointer"
            >
              <FaSave size={13} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Tab 2: Mentors TO Other Departments
// ─────────────────────────────────────────────
const MentorsToTab: React.FC = () => {
  const [data, setData] = useState<MentorToOtherDept[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const stored = localStorage.getItem(LS_TO_KEY);
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { setData(INITIAL_TO); }
    } else {
      setData(INITIAL_TO);
      localStorage.setItem(LS_TO_KEY, JSON.stringify(INITIAL_TO));
    }
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const processed = useMemo(() => {
    let result = [...data];
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.user_name.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t) ||
        r.from_curriculum.toLowerCase().includes(t) ||
        r.to_department.toLowerCase().includes(t)
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortCol] as string;
        const bVal = (b as any)[sortCol] as string;
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [data, searchTerm, sortCol, sortDir]);

  const totalEntries = processed.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const paginated = processed.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none bg-gray-50";

  return (
    <div className="space-y-5">

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search..."
            className="w-56 px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Datatable */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className={thClass + " w-16"} onClick={() => handleSort("id")}>
                Sl No. <SortIcon col="id" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("user_name")}>
                User Name <SortIcon col="user_name" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("email")}>
                Email <SortIcon col="email" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("from_curriculum")}>
                From Curriculum <SortIcon col="from_curriculum" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("to_department")}>
                To Department <SortIcon col="to_department" sortCol={sortCol} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.length > 0 ? (
              paginated.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-500 font-medium">
                    {(currentPage - 1) * entriesPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.user_name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.email}</td>
                  <td className="px-4 py-3 text-gray-600">{row.from_curriculum}</td>
                  <td className="px-4 py-3 text-gray-600">{row.to_department}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-red-400 font-medium">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        entriesPerPage={entriesPerPage}
        onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
        onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Main DeptConfigurationPage
// ─────────────────────────────────────────────
const DeptConfigurationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"from" | "to">("from");

  return (
    <MentoringPageLayout>
      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Cross-department Users List
          </h2>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-5 gap-1">
            <button
              id="tab-mentors-from"
              onClick={() => setActiveTab("from")}
              className={`px-4 py-2 text-sm font-semibold rounded-t border transition-colors cursor-pointer ${activeTab === "from"
                ? "border-gray-300 border-b-white bg-white text-gray-900 -mb-px"
                : "border-transparent text-blue-600 hover:text-blue-800 bg-transparent"
                }`}
            >
              Mentors from Other Departments
            </button>
            <button
              id="tab-mentors-to"
              onClick={() => setActiveTab("to")}
              className={`px-4 py-2 text-sm font-semibold rounded-t border transition-colors cursor-pointer ${activeTab === "to"
                ? "border-gray-300 border-b-white bg-white text-gray-900 -mb-px"
                : "border-transparent text-blue-600 hover:text-blue-800 bg-transparent"
                }`}
            >
              Mentors to Other Departments
            </button>
          </div>

          {/* Tab Panels */}
          {activeTab === "from" ? <MentorsFromTab /> : <MentorsToTab />}
        </div>
      </div>
    </MentoringPageLayout>
  );
};

export default DeptConfigurationPage;
