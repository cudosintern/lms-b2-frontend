import React, { useState } from "react";
import MmpModuleShell from "../components/MmpModuleShell";

const departmentOptions = [
  "Architecture",
  "ASQ - Sunway University",
  "Computer Science & Engineering",
  "Department of Automobile Engineering",
  "Department of BioTechnology",
  "Department of Electrical and Electronics",
  "Department of Instrumentation Engineering",
  "Electronics Engineering",
  "Freshman Engineering Program",
  "Master of Business Administration",
  "Mechanical Engineering",
  "Testing QA Build",
];

const MentorListPage: React.FC = () => {
  const [showExport, setShowExport] = useState(false);

  return (
    <MmpModuleShell title="Mentor List">
      <div className="grid grid-cols-[1.2fr_0.8fr_1.2fr_0.8fr_auto] gap-9">
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Department: <span className="text-red-500">*</span>
          </label>
          <select className="w-full rounded border border-gray-300 px-5 py-2">
            <option>Select Department</option>
            {departmentOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Program: <span className="text-red-500">*</span>
          </label>
          <select className="w-full rounded border border-gray-300 px-5 py-2">
            <option>Select Program</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Curriculum: <span className="text-red-500">*</span>
          </label>
          <select className="w-full rounded border border-gray-300 px-5 py-2">
            <option>Select Curriculum</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Term: <span className="text-red-500">*</span>
          </label>
          <select className="w-full rounded border border-gray-300 px-5 py-2">
            <option>Select Term</option>
          </select>
        </div>
        <div className="relative pt-8">
          <button
            className="rounded bg-green-500 px-4 py-2 text-sm text-white"
            onClick={() => setShowExport(!showExport)}
          >
            Export v
          </button>
          {showExport && (
            <div className="absolute right-0 top-20 rounded border bg-white px-4 py-3 text-sm shadow">
              .pdf
            </div>
          )}
        </div>
      </div>
    </MmpModuleShell>
  );
};

export default MentorListPage;
