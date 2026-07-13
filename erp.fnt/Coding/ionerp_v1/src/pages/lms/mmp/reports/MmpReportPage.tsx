import React from "react";
import MmpModuleShell from "../components/MmpModuleShell";

const MmpReportPage: React.FC = () => (
  <MmpModuleShell title="MMP Report">
    <div className="w-[356px]">
      <label className="mb-2 block text-sm font-semibold">
        Curriculum: <span className="text-red-500">*</span>
      </label>
      <select className="w-full rounded border border-gray-300 px-5 py-2">
        <option>Select Curriculum</option>
      </select>
    </div>
    <p className="mt-5 text-sm">No data to display</p>
  </MmpModuleShell>
);

export default MmpReportPage;
