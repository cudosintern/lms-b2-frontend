import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import MmpModuleShell from "../components/MmpModuleShell";

type TabKey = "from" | "to";

interface SelectOption {
  label: string;
  value: number | string;
}

const normalizeOptions = (
  items: any[],
  labelKeys: string[],
  valueKeys: string[],
): SelectOption[] =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    label:
      labelKeys.map((key) => item?.[key]).find(Boolean) ??
      item?.label ??
      `Option ${index + 1}`,
    value:
      valueKeys.map((key) => item?.[key]).find((value) => value != null) ??
      item?.value ??
      index,
  }));

const DeptConfigurationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("from");
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [users, setUsers] = useState<SelectOption[]>([]);
  const [curricula, setCurricula] = useState<SelectOption[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");

  useEffect(() => {
    const loadDepartmentOptions = async () => {
      const response = await axiosInstance.get<any>(ApiEndpoint.common_api.deportment_list);
      setDepartments(
        normalizeOptions(
          response.data.data?.departments || [],
          ["dept_name", "department_name", "label"],
          ["department_id", "value"],
        ),
      );
    };

    const loadMmpOptions = async () => {
      const dropdownResponse = await axiosInstance.get<any>(ApiEndpoint.mentorMentee.dropdowns);
        const dropdowns = dropdownResponse.data.data || {};
      setUsers(
        normalizeOptions(
          dropdowns.mentors || [],
          ["mentor_name", "user_name", "label"],
          ["mentor_id", "user_id", "value"],
        ),
      );
      setCurricula(
        normalizeOptions(
          dropdowns.academic_batches || [],
          ["academic_batch_code", "curriculum_name", "label"],
          ["academic_batch_id", "curriculum_id", "value"],
        ),
      );
    };

    loadDepartmentOptions().catch(() => undefined);
    loadMmpOptions().catch(() => undefined);
  }, []);

  const tableColumns = useMemo(
    () =>
      activeTab === "from"
        ? ["Sl No.", "User Name", "From Department", "Email", "To Curriculum", "Action"]
        : ["Sl No.", "User Name", "Email", "From Curriculum", "To Department"],
    [activeTab],
  );

  return (
    <MmpModuleShell title="Cross-department Users List">
      <div className="mb-5 flex border-b border-gray-200">
        <button
          type="button"
          className={`px-5 py-3 text-sm ${
            activeTab === "from"
              ? "border border-b-0 border-gray-200 bg-white text-gray-900"
              : "text-blue-600"
          }`}
          onClick={() => setActiveTab("from")}
        >
          Mentors from Other Departments
        </button>
        <button
          type="button"
          className={`px-5 py-3 text-sm ${
            activeTab === "to"
              ? "border border-b-0 border-gray-200 bg-white text-gray-900"
              : "text-blue-600"
          }`}
          onClick={() => setActiveTab("to")}
        >
          Mentors to Other Departments
        </button>
      </div>

      <p className="mb-4 text-sm leading-5">
        {activeTab === "from" ? (
          <>
            Note: Faculty from "General Department" are already mentors by default. You do
            not need to import them.
            <br />
            You only need to import faculty from other departments to act as mentors.
          </>
        ) : (
          <>Note: Faculty from "General Department" are mentors for other departments.</>
        )}
      </p>

      {activeTab === "from" && (
        <div className="mb-5 w-full max-w-[350px]">
          <label className="mb-2 block text-sm font-semibold">Filter by Department:</label>
          <select
            className="w-full rounded border border-gray-300 px-5 py-2"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-1 text-sm">
          Show
          <select
            className="rounded border border-gray-300 px-3 py-2"
            value={pageSize}
            onChange={(event) => setPageSize(event.target.value)}
          >
            {[10, 25, 50].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
          entries
        </label>
        <label className="flex items-center gap-2 text-sm">
          Search:
          <input
            className="min-w-0 rounded border border-gray-300 px-3 py-2"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse border text-sm">
          <thead>
            <tr className="bg-gray-50">
              {tableColumns.map((column) => (
                <th key={column} className="border p-3 text-left">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 text-center" colSpan={tableColumns.length}>
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>Showing 0 to 0 of 0 entries</span>
        <div>
          <button className="rounded-l border border-gray-300 px-4 py-2 text-gray-500">
            Previous
          </button>
          <button className="rounded-r border border-l-0 border-gray-300 px-4 py-2 text-gray-500">
            Next
          </button>
        </div>
      </div>

      {activeTab === "from" && (
        <>
          <div className="my-6 rounded-br-3xl bg-slate-800 px-5 py-2 text-xl font-semibold text-white">
            Add mentor from another department
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1.4fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Department: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded border border-gray-300 px-5 py-2"
                value={selectedDepartment}
                onChange={(event) => setSelectedDepartment(event.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">
                User: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded border border-gray-300 px-5 py-2"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
              >
                <option value="">{users.length ? "Select User" : "No users found!"}</option>
                {users.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Curriculum: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded border border-gray-300 px-5 py-2"
                value={selectedCurriculum}
                onChange={(event) => setSelectedCurriculum(event.target.value)}
              >
                <option value="">Select Curriculum</option>
                {curricula.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={!selectedDepartment || !selectedUser || !selectedCurriculum}
              title="Cross-department save API is not available in the current frontend service"
            >
              Save
            </button>
          </div>
        </>
      )}
    </MmpModuleShell>
  );
};

export default DeptConfigurationPage;
