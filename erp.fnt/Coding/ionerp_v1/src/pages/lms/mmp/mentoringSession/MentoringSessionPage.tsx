import React from "react";
import MmpModuleShell from "../components/MmpModuleShell";

const curriculumOptions = [
  "B. E in BT 2015-2019",
  "B. E in CSE 2018-2022",
  "B. E in CSE 2022-2026",
];

const MentoringSessionPage: React.FC = () => (
  <MmpModuleShell title="Mentoring Session">
    <div className="grid grid-cols-[356px_225px_1fr_auto] items-end gap-9">
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Curriculum: <span className="text-red-500">*</span>
        </label>
        <select className="w-full rounded border border-gray-300 px-5 py-2">
          <option>Select Curriculum</option>
          {curriculumOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Month: <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full rounded border border-gray-300 px-5 py-2"
          type="month"
        />
      </div>
      <div />
      <button className="rounded bg-green-500 px-4 py-2 text-sm text-white">
        + Create Session
      </button>
    </div>
  </MmpModuleShell>
);

export default MentoringSessionPage;
