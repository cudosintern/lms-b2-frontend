import React, { useState, useEffect, useMemo } from "react";
import { FaFilePdf, FaPlus, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";
import MentoringPageLayout from "./MentoringPageLayout";

// Define the interface for Configuration Type entries
interface ConfigurationType {
  id: number;
  config_type: string;
  min_mentees: number;
  max_mentees: number;
}

// Initial mock data to load if localStorage is empty
const INITIAL_DATA: ConfigurationType[] = [
  {
    id: 1,
    config_type: "CSE Config type 2",
    min_mentees: 1,
    max_mentees: 10,
  },
  {
    id: 2,
    config_type: "CSE Config type -1",
    min_mentees: 1,
    max_mentees: 5,
  },
];

const LOCAL_STORAGE_KEY = "lms_mentoring_config_types";

const ConfigurationTypePage: React.FC = () => {
  // --- State Variables ---
  const [data, setData] = useState<ConfigurationType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<keyof ConfigurationType | "min_max" | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal control states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigurationType | null>(null);
  
  // Form fields state
  const [configTypeInput, setConfigTypeInput] = useState("");
  const [minMenteesInput, setMinMenteesInput] = useState<number | "">("");
  const [maxMenteesInput, setMaxMenteesInput] = useState<number | "">("");
  
  // Validation errors
  const [errors, setErrors] = useState<{
    config_type?: string;
    min_mentees?: string;
    max_mentees?: string;
  }>({});

  // Delete confirmation state
  const [configToDelete, setConfigToDelete] = useState<ConfigurationType | null>(null);

  // --- Load Data on Component Mount ---
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        setData(INITIAL_DATA);
      }
    } else {
      setData(INITIAL_DATA);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    }
  }, []);

  // --- Save Data Helper ---
  const saveToStorage = (updatedData: ConfigurationType[]) => {
    setData(updatedData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
  };

  // --- Sorting Handler ---
  const handleSort = (column: keyof ConfigurationType | "min_max") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // --- Search & Sort Filtering ---
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Search Filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.config_type.toLowerCase().includes(term) ||
          `${item.min_mentees} - ${item.max_mentees}`.includes(term)
      );
    }

    // 2. Sorting
    if (sortColumn !== "") {
      result.sort((a, b) => {
        let valueA: any = "";
        let valueB: any = "";

        if (sortColumn === "min_max") {
          // Compare min_mentees first, then max_mentees
          valueA = a.min_mentees * 1000 + a.max_mentees;
          valueB = b.min_mentees * 1000 + b.max_mentees;
        } else {
          valueA = a[sortColumn as keyof ConfigurationType];
          valueB = b[sortColumn as keyof ConfigurationType];
        }

        if (typeof valueA === "string") {
          return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
        }
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // --- Pagination Slice ---
  const totalEntries = processedData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;

  // Reset page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return processedData.slice(startIndex, startIndex + entriesPerPage);
  }, [processedData, currentPage, entriesPerPage]);

  // --- Checkbox Selection Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedData.map((item) => item.id);
      // Union of currently selected and all IDs on current page
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelectedOnPage = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((item) => selectedIds.includes(item.id));
  }, [paginatedData, selectedIds]);

  // --- Modal Open Handlers ---
  const handleOpenAddModal = () => {
    setEditingConfig(null);
    setConfigTypeInput("");
    setMinMenteesInput("");
    setMaxMenteesInput("");
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (config: ConfigurationType) => {
    setEditingConfig(config);
    setConfigTypeInput(config.config_type);
    setMinMenteesInput(config.min_mentees);
    setMaxMenteesInput(config.max_mentees);
    setErrors({});
    setIsFormModalOpen(true);
  };

  // --- Form Validation Helper ---
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!configTypeInput.trim()) {
      newErrors.config_type = "Configuration Type is required";
    }
    
    if (minMenteesInput === "" || isNaN(Number(minMenteesInput))) {
      newErrors.min_mentees = "Minimum Mentees is required";
    } else if (Number(minMenteesInput) < 1) {
      newErrors.min_mentees = "Minimum Mentees must be at least 1";
    }

    if (maxMenteesInput === "" || isNaN(Number(maxMenteesInput))) {
      newErrors.max_mentees = "Maximum Mentees is required";
    } else if (Number(maxMenteesInput) < 1) {
      newErrors.max_mentees = "Maximum Mentees must be at least 1";
    } else if (
      minMenteesInput !== "" &&
      Number(maxMenteesInput) < Number(minMenteesInput)
    ) {
      newErrors.max_mentees = "Maximum Mentees cannot be less than Minimum Mentees";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Form Submission Handler ---
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingConfig) {
      // Edit mode
      const updated = data.map((item) =>
        item.id === editingConfig.id
          ? {
              ...item,
              config_type: configTypeInput.trim(),
              min_mentees: Number(minMenteesInput),
              max_mentees: Number(maxMenteesInput),
            }
          : item
      );
      saveToStorage(updated);
      toast.success("Configuration type updated successfully!");
    } else {
      // Add mode
      const newId = data.length > 0 ? Math.max(...data.map((item) => item.id)) + 1 : 1;
      const newConfig: ConfigurationType = {
        id: newId,
        config_type: configTypeInput.trim(),
        min_mentees: Number(minMenteesInput),
        max_mentees: Number(maxMenteesInput),
      };
      saveToStorage([...data, newConfig]);
      toast.success("Configuration type added successfully!");
    }

    setIsFormModalOpen(false);
  };

  // --- Delete Handler ---
  const handleDeleteClick = (config: ConfigurationType) => {
    setConfigToDelete(config);
  };

  const confirmDelete = () => {
    if (configToDelete) {
      const updated = data.filter((item) => item.id !== configToDelete.id);
      saveToStorage(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== configToDelete.id));
      toast.success("Configuration type deleted successfully!");
      setConfigToDelete(null);
    }
  };

  // --- PDF Export Handler ---
  const handleExportPDF = () => {
    // Determine which records to export (selected ones, or all if none selected)
    const recordsToExport =
      selectedIds.length > 0
        ? data.filter((item) => selectedIds.includes(item.id))
        : data;

    if (recordsToExport.length === 0) {
      toast.warning("No records to export.");
      return;
    }

    const doc = new jsPDF();

    // Set title and layout
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55); // slate-800
    doc.text("Mentoring Configuration Type List", 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(
      selectedIds.length > 0
        ? `Exporting ${recordsToExport.length} selected entries`
        : `Exporting all ${recordsToExport.length} entries`,
      14,
      31
    );

    // Prepare table data
    const tableHeaders = [["Sl No.", "Configuration Type", "Min & Max Mentees per Mentor"]];
    const tableRows = recordsToExport.map((item, index) => [
      index + 1,
      item.config_type,
      `${item.min_mentees} - ${item.max_mentees}`,
    ]);

    // Render table
    (doc as any).autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 38,
      theme: "grid",
      headStyles: {
        fillColor: [67, 120, 128], // #437880 panel theme color
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 100 },
        2: { cellWidth: 70, halign: "center" },
      },
    });

    doc.save(`Configuration_Types_List_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("PDF exported successfully!");
  };

  // --- Sort Icon Helper ---
  const renderSortIcon = (column: keyof ConfigurationType | "min_max") => {
    if (sortColumn !== column) return <FaSort className="inline ml-1 text-gray-400 text-xs" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="inline ml-1 text-gray-800 text-sm" />
    ) : (
      <FaSortDown className="inline ml-1 text-gray-800 text-sm" />
    );
  };

  return (
    <MentoringPageLayout>
      
      {/* Configuration Type Container Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Banner Title */}
        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wide">Configuration Type</h2>
        </div>

        <div className="p-6">
          
          {/* Action Buttons Row */}
          <div className="flex justify-end items-center gap-3 mb-6">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-white font-semibold text-sm rounded shadow transition duration-150 cursor-pointer"
            >
              <FaFilePdf size={14} />
              Export
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded shadow transition duration-150 cursor-pointer"
            >
              <FaPlus size={14} />
              Add
            </button>
          </div>

          {/* Table Controls (Search and Entries count) */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            
            {/* Show Entries Dropdown */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search configurations..."
                className="w-full md:w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase font-semibold">
                <tr>
                  
                  {/* Select All Checkbox Column */}
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelectedOnPage}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>

                  {/* Sl No. Column */}
                  <th className="px-4 py-3 text-center w-20 cursor-pointer select-none" onClick={() => handleSort("id")}>
                    <div className="flex items-center justify-center">
                      Sl No.
                      {renderSortIcon("id")}
                    </div>
                  </th>

                  {/* Configuration Type Column */}
                  <th className="px-6 py-3 cursor-pointer select-none" onClick={() => handleSort("config_type")}>
                    <div className="flex items-center">
                      Configuration Type
                      {renderSortIcon("config_type")}
                    </div>
                  </th>

                  {/* Min & Max Mentees Column */}
                  <th className="px-6 py-3 cursor-pointer select-none" onClick={() => handleSort("min_max")}>
                    <div className="flex items-center">
                      Min & Max Mentees per Mentor
                      {renderSortIcon("min_max")}
                    </div>
                  </th>

                  {/* Action Column */}
                  <th className="px-4 py-3 text-center w-24 select-none">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => {
                    const slNo = (currentPage - 1) * entriesPerPage + index + 1;
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition duration-150 ${
                          isSelected ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        
                        {/* Checkbox Cell */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(item.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Sl No. Cell */}
                        <td className="px-4 py-3 text-center font-medium">
                          {slNo}
                        </td>

                        {/* Configuration Type Cell */}
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                          {item.config_type}
                        </td>

                        {/* Min/Max Cell */}
                        <td className="px-6 py-3">
                          {item.min_mentees} - {item.max_mentees}
                        </td>

                        {/* Action Icons Cell */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition cursor-pointer"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      No configuration types found. Click "Add" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer (Pagination & Entry status) */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-6">
            
            {/* Show Entries Count Info */}
            <div className="text-sm text-gray-500 dark:text-gray-450">
              {totalEntries > 0 ? (
                <span>
                  Showing {Math.min((currentPage - 1) * entriesPerPage + 1, totalEntries)} to{" "}
                  {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
                </span>
              ) : (
                <span>Showing 0 to 0 of 0 entries</span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center -space-x-px text-sm">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-2 ml-0 rounded-l-md border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border cursor-pointer ${
                      currentPage === page
                        ? "z-10 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- ADD / EDIT FORM MODAL --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
          <div className="fixed inset-0 bg-black opacity-55 transition-opacity" onClick={() => setIsFormModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md mx-auto my-6 z-50">
            <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 rounded-t bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingConfig ? "Edit Configuration Type" : "Add Configuration Type"}
                </h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 float-right text-3xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  <span className="text-gray-400 block h-6 w-6 text-2xl outline-none focus:outline-none">×</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit}>
                <div className="relative p-6 flex-auto space-y-4">
                  
                  {/* Configuration Type Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Configuration Type Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configTypeInput}
                      onChange={(e) => setConfigTypeInput(e.target.value)}
                      placeholder="e.g. CSE Config type 3"
                      className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-750 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.config_type ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {errors.config_type && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">{errors.config_type}</p>
                    )}
                  </div>

                  {/* Min and Max Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Minimum Mentees Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Mentees <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={minMenteesInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMinMenteesInput(val === "" ? "" : Number(val));
                        }}
                        placeholder="e.g. 1"
                        className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-750 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors.min_mentees ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      {errors.min_mentees && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.min_mentees}</p>
                      )}
                    </div>

                    {/* Maximum Mentees Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum Mentees <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxMenteesInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMaxMenteesInput(val === "" ? "" : Number(val));
                        }}
                        placeholder="e.g. 10"
                        className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-750 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors.max_mentees ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      {errors.max_mentees && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.max_mentees}</p>
                      )}
                    </div>

                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 rounded-b bg-gray-50 dark:bg-gray-700/30 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE DIALOG --- */}
      {configToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
          <div className="fixed inset-0 bg-black opacity-55 transition-opacity" onClick={() => setConfigToDelete(null)}></div>
          
          <div className="relative w-full max-w-sm mx-auto my-6 z-50">
            <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-solid border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                <h3 className="text-md font-bold">Confirm Delete</h3>
              </div>

              {/* Message */}
              <div className="p-5">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete the configuration type{" "}
                  <strong className="text-gray-900 dark:text-white">
                    "{configToDelete.config_type}"
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 gap-2">
                <button
                  type="button"
                  onClick={() => setConfigToDelete(null)}
                  className="px-3.5 py-1.5 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                >
                  Delete
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </MentoringPageLayout>
  );
};

export default ConfigurationTypePage;
