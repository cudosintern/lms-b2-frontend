import React, { useEffect, useMemo, useState } from "react";
import {
  StudentAttendanceDaywiseRow,
  StudentAttendanceFilters,
  StudentAttendanceOption,
  StudentAttendanceSummaryRow,
  getAttendanceCurriculums,
  getAttendanceDaywise,
  getAttendanceSummary,
  getAttendanceTerms,
} from "./studentAttendanceService";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const initialFilters: StudentAttendanceFilters = {
  curriculumId: "",
  termId: "",
  fromMonth: "",
  toMonth: "",
};

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);
};

const formatAttendanceDate = (value: string) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MyAttendancePage: React.FC = () => {
  const [filters, setFilters] = useState<StudentAttendanceFilters>(initialFilters);
  const [curriculums, setCurriculums] = useState<StudentAttendanceOption[]>([]);
  const [terms, setTerms] = useState<StudentAttendanceOption[]>([]);
  const [summaryRows, setSummaryRows] = useState<StudentAttendanceSummaryRow[]>([]);
  const [daywiseRows, setDaywiseRows] = useState<StudentAttendanceDaywiseRow[]>([]);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [summaryPageSize, setSummaryPageSize] = useState(10);
  const [summaryPage, setSummaryPage] = useState(1);
  const [summarySearch, setSummarySearch] = useState("");
  const [daywisePageSize, setDaywisePageSize] = useState(10);
  const [daywisePage, setDaywisePage] = useState(1);
  const [daywiseSearch, setDaywiseSearch] = useState("");

  useEffect(() => {
    const loadCurriculums = async () => {
      try {
        setLoadingCurriculums(true);
        setErrorMessage("");
        const response = await getAttendanceCurriculums();
        setCurriculums(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load curriculums";
        setErrorMessage(message);
      } finally {
        setLoadingCurriculums(false);
      }
    };

    loadCurriculums();
  }, []);

  useEffect(() => {
    if (!filters.curriculumId) {
      setTerms([]);
      return;
    }

    const loadTerms = async () => {
      try {
        setLoadingTerms(true);
        setErrorMessage("");
        const response = await getAttendanceTerms(filters.curriculumId);
        setTerms(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load terms";
        setErrorMessage(message);
      } finally {
        setLoadingTerms(false);
      }
    };

    loadTerms();
  }, [filters.curriculumId]);

  const canLoadTables = Boolean(
    filters.curriculumId && filters.termId && filters.fromMonth && filters.toMonth
  );

  useEffect(() => {
    if (!canLoadTables) {
      setSummaryRows([]);
      setDaywiseRows([]);
      return;
    }

    const loadTables = async () => {
      try {
        setLoadingTables(true);
        setErrorMessage("");
        const [summary, daywise] = await Promise.all([
          getAttendanceSummary(filters),
          getAttendanceDaywise(filters),
        ]);
        setSummaryRows(summary);
        setDaywiseRows(daywise);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load attendance data";
        setErrorMessage(message);
        setSummaryRows([]);
        setDaywiseRows([]);
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, [canLoadTables, filters]);

  useEffect(() => {
    setSummaryPage(1);
  }, [summarySearch, summaryPageSize, summaryRows]);

  useEffect(() => {
    setDaywisePage(1);
  }, [daywiseSearch, daywisePageSize, daywiseRows]);

  const filteredSummaryRows = useMemo(() => {
    const normalizedSearch = summarySearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return summaryRows;
    }

    return summaryRows.filter((row) =>
      `${row.course} ${row.present} ${row.totalClasses} ${row.percentage}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [summaryRows, summarySearch]);

  const filteredDaywiseRows = useMemo(() => {
    const normalizedSearch = daywiseSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return daywiseRows;
    }

    return daywiseRows.filter((row) =>
      [
        row.course,
        row.attendance,
        row.attendanceDocument,
        row.documentStatus,
        formatAttendanceDate(row.attendanceDate),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [daywiseRows, daywiseSearch]);

  const summaryTotalPages = Math.max(1, Math.ceil(filteredSummaryRows.length / summaryPageSize));
  const daywiseTotalPages = Math.max(1, Math.ceil(filteredDaywiseRows.length / daywisePageSize));

  const pagedSummaryRows = filteredSummaryRows.slice(
    (summaryPage - 1) * summaryPageSize,
    summaryPage * summaryPageSize
  );
  const pagedDaywiseRows = filteredDaywiseRows.slice(
    (daywisePage - 1) * daywisePageSize,
    daywisePage * daywisePageSize
  );

  const handleFilterChange = (field: keyof StudentAttendanceFilters, value: string) => {
    setErrorMessage("");
    setFilters((current) => {
      if (field === "curriculumId") {
        return {
          curriculumId: value,
          termId: "",
          fromMonth: "",
          toMonth: "",
        };
      }

      if (field === "termId") {
        return {
          ...current,
          termId: value,
          fromMonth: "",
          toMonth: "",
        };
      }

      const updated = { ...current, [field]: value };
      if (
        (field === "fromMonth" || field === "toMonth") &&
        updated.fromMonth &&
        updated.toMonth &&
        updated.fromMonth > updated.toMonth
      ) {
        return {
          ...updated,
          ...(field === "fromMonth" ? { toMonth: value } : { fromMonth: value }),
        };
      }

      return updated;
    });
  };

  const renderTableToolbar = (
    pageSize: number,
    setPageSize: React.Dispatch<React.SetStateAction<number>>,
    search: string,
    setSearch: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>entries</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Search:</span>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-56"
        />
      </div>
    </div>
  );

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalRows: number,
    pageSize: number,
    setPage: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const startEntry = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endEntry = Math.min(currentPage * pageSize, totalRows);

    return (
      <div className="flex flex-wrap justify-between items-center gap-3 mt-3 text-sm text-gray-600">
        <span>
          Showing {startEntry} to {endEntry} of {totalRows} entries
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Attendance List</h1>
        </div>

        <div className="p-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Curriculum <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.curriculumId}
                onChange={(event) => handleFilterChange("curriculumId", event.target.value)}
                disabled={loadingCurriculums}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:opacity-60"
              >
                <option value="">
                  {loadingCurriculums ? "Loading curriculums..." : "Select Curriculum"}
                </option>
                {curriculums.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.termId}
                onChange={(event) => handleFilterChange("termId", event.target.value)}
                disabled={!filters.curriculumId || loadingTerms}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:opacity-60"
              >
                <option value="">{loadingTerms ? "Loading terms..." : "Select Term"}</option>
                {terms.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={filters.fromMonth}
                onChange={(event) => handleFilterChange("fromMonth", event.target.value)}
                disabled={!filters.termId}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={filters.toMonth}
                min={filters.fromMonth || undefined}
                onChange={(event) => handleFilterChange("toMonth", event.target.value)}
                disabled={!filters.termId}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:opacity-60"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="border border-red-200 bg-red-50 text-red-600 rounded px-3 py-2 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-[#e9eef2] px-4 py-2 text-sm font-semibold text-[#1f3a4f]">
              Course Summary List
            </div>
            <div className="p-4">
              {renderTableToolbar(
                summaryPageSize,
                setSummaryPageSize,
                summarySearch,
                setSummarySearch
              )}

              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#d6dde3] text-gray-700">
                    <tr>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Present / Total class</th>
                      <th className="px-3 py-2">Total percentage(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingTables ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                          Loading attendance summary...
                        </td>
                      </tr>
                    ) : pagedSummaryRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      pagedSummaryRows.map((row) => (
                        <tr key={`${row.course}-${row.totalClasses}`} className="hover:bg-gray-50">
                          <td className="px-3 py-3">{row.course}</td>
                          <td className="px-3 py-3">{`${row.present} / ${row.totalClasses}`}</td>
                          <td className="px-3 py-3">{formatPercentage(row.percentage)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination(
                summaryPage,
                summaryTotalPages,
                filteredSummaryRows.length,
                summaryPageSize,
                setSummaryPage
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-[#e9eef2] px-4 py-2 text-sm font-semibold text-[#1f3a4f]">
              Daywise Course List
            </div>
            <div className="p-4">
              {renderTableToolbar(
                daywisePageSize,
                setDaywisePageSize,
                daywiseSearch,
                setDaywiseSearch
              )}

              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#d6dde3] text-gray-700">
                    <tr>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Attendance</th>
                      <th className="px-3 py-2">Attendance document</th>
                      <th className="px-3 py-2">Document status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingTables ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                          Loading daywise attendance...
                        </td>
                      </tr>
                    ) : pagedDaywiseRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      pagedDaywiseRows.map((row, index) => (
                        <tr
                          key={`${row.course}-${row.attendanceDate}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-3">
                            <div>{row.course}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatAttendanceDate(row.attendanceDate)}
                            </div>
                          </td>
                          <td className="px-3 py-3">{row.attendance}</td>
                          <td className="px-3 py-3">
                            {row.attendanceDocumentUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    row.attendanceDocumentUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                className="text-blue-600 hover:underline"
                              >
                                {row.attendanceDocument || "View File"}
                              </button>
                            ) : (
                              ""
                            )}
                          </td>
                          <td className="px-3 py-3">{row.documentStatus}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination(
                daywisePage,
                daywiseTotalPages,
                filteredDaywiseRows.length,
                daywisePageSize,
                setDaywisePage
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendancePage;
