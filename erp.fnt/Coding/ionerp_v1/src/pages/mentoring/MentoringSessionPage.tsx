import React, { useState } from "react";
import MentoringPageLayout from "./MentoringPageLayout";
import { FaRegCalendarAlt, FaRegPlusSquare, FaPlus, FaChevronRight } from "react-icons/fa";
import { MdClose, MdSave } from "react-icons/md";
import { FiClock } from "react-icons/fi";

const MentoringSessionPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");

  const handleCreateSession = () => {
    setIsCreating(true);
  };

  const handleClose = () => {
    setIsCreating(false);
  };

  return (
    <MentoringPageLayout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Banner Title */}
        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-2.5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white tracking-wide">
            {isCreating ? "Add Mentoring Session" : "Mentoring Session"}
          </h2>
        </div>

        {!isCreating ? (
          // --- First Screen ---
          <div className="p-6">
            <div className="flex flex-wrap items-end gap-8">
              
              {/* Curriculum Field */}
              <div className="flex flex-col gap-1 w-72">
                <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                  Curriculum: <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] text-gray-700 bg-white border border-blue-300 rounded focus:outline-none focus:border-blue-400 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <option value="">Select Curriculum</option>
                  <option value="B. E in BT 2015-2019">B. E in BT 2015-2019</option>
                  <option value="B. E in CSE 2015-2019">B. E in CSE 2015-2019</option>
                </select>
              </div>

              {/* Month Field */}
              <div className="flex flex-col gap-1 w-56">
                <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                  Month: <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  disabled={!selectedCurriculum}
                  className={`h-[32px] w-full px-3 py-1 text-[13px] border rounded focus:outline-none focus:border-blue-400 shadow-sm
                    ${selectedCurriculum
                      ? 'text-gray-700 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 cursor-pointer'
                      : 'text-gray-400 bg-[#f3f4f6] border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'}`
                  }
                />
              </div>

              {/* Create Session Button */}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleCreateSession}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-[#8cc896] rounded shadow-sm hover:bg-[#7bb585] transition-colors"
                >
                  <FaRegPlusSquare size={14} />
                  Create Session
                </button>
              </div>

            </div>
          </div>
        ) : (
          // --- Second Screen (Add Mentoring Session) ---
          <div className="flex flex-col flex-grow">
            <div className="p-6 flex-grow">
              
              {/* Selected Curriculum Label */}
              <div className="mb-6">
                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                  Curriculum: <span className="font-normal text-gray-600 dark:text-gray-400">{selectedCurriculum || "B. E in BT 2015-2019"}</span>
                </p>
              </div>

              {/* Mentoring Group and Term */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-1 w-full max-w-[400px]">
                  <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                    Mentoring Group: <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-1.5 text-[13px] text-gray-500 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                    <option value="">Select Mentoring Group</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-full max-w-[400px]">
                  <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                    Term: <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-1.5 text-[13px] text-gray-500 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                    <option value="">Select Term</option>
                  </select>
                </div>
              </div>

              {/* Session Agenda */}
              <div className="flex flex-col gap-1 mb-6">
                <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                  Session Agenda:
                </label>
                <textarea 
                  rows={2}
                  placeholder="Enter session agenda"
                  className="w-full max-w-[824px] px-3 py-2 text-[13px] text-gray-700 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 shadow-sm resize-y dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                ></textarea>
              </div>

              {/* Sub-group Tab & Container */}
              <div className="mt-4">
                {/* Tab Handle */}
                <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t shadow-[0_-2px_4px_rgba(0,0,0,0.02)] relative z-10 text-[13px] text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                  Sub-group Name
                </div>
                {/* Container */}
                <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-b rounded-tr relative -top-[1px] bg-white dark:bg-gray-800/50">
                  
                  {/* Start Date, End Date, Add More */}
                  <div className="flex flex-wrap items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1 w-64">
                      <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                        Start Date: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-[32px]">
                        <input
                          type="text"
                          placeholder="DD-MM-YYYY"
                          className="w-full px-3 py-1.5 text-[13px] text-gray-400 bg-white border border-gray-300 border-r-0 rounded-l focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                        />
                        <button className="flex items-center justify-center px-3 border border-gray-300 rounded-r bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                          <FaRegCalendarAlt size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-64">
                      <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                        End Date: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-[32px]">
                        <input
                          type="text"
                          placeholder="DD-MM-YYYY"
                          className="w-full px-3 py-1.5 text-[13px] text-gray-400 bg-white border border-gray-300 border-r-0 rounded-l focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                        />
                        <button className="flex items-center justify-center px-3 border border-gray-300 rounded-r bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                          <FaRegCalendarAlt size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="ml-auto md:ml-20">
                      <button className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#337ab7] rounded hover:bg-[#286090] transition-colors shadow-sm">
                        Add More
                      </button>
                    </div>
                  </div>

                  {/* Start Time, End Time */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col gap-1 w-64">
                      <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                        Start Time: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-[32px]">
                        <input
                          type="text"
                          placeholder="HH:MM"
                          className="w-full px-3 py-1.5 text-[13px] text-gray-400 bg-white border border-gray-300 border-r-0 rounded-l focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                        />
                        <button className="flex items-center justify-center px-3 border border-gray-300 rounded-r bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                          <FiClock size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-64">
                      <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                        End Time: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-[32px]">
                        <input
                          type="text"
                          placeholder="HH:MM"
                          className="w-full px-3 py-1.5 text-[13px] text-gray-400 bg-white border border-gray-300 border-r-0 rounded-l focus:outline-none focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                        />
                        <button className="flex items-center justify-center px-3 border border-gray-300 rounded-r bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                          <FiClock size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="ml-2 mt-5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer text-lg font-bold">
                      <FaPlus size={14} />
                    </div>
                  </div>

                  {/* Register Mentees Row */}
                  <div className="flex items-center justify-between px-4 py-2 bg-[#f8f9fa] dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 mb-6 w-full max-w-[536px]">
                    <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Register Mentees</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Count: 0</span>
                      <FaChevronRight size={12} className="text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>

                  {/* Location / URL */}
                  <div className="flex flex-col gap-1 w-full max-w-[536px]">
                    <label className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                      Location / URL: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 text-[13px] text-gray-700 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end p-4 bg-[#f8f9fa] dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 gap-2 mt-auto">
              <button 
                onClick={handleClose}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-[#d9534f] rounded hover:bg-[#c9302c] shadow-sm transition-colors"
              >
                <MdClose size={16} />
                Close
              </button>
              <button className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-[#337ab7] rounded hover:bg-[#286090] shadow-sm transition-colors">
                <MdSave size={16} />
                Save
              </button>
            </div>
          </div>
        )}

      </div>
    </MentoringPageLayout>
  );
};

export default MentoringSessionPage;

