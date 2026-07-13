import React from "react";
import MmpModuleShell from "../components/MmpModuleShell";

const MmpConfigurationPage: React.FC = () => (
  <MmpModuleShell title="Configuration">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {["Questionnaires", "Department Configuration", "Map Mentor Mentee"].map((item) => (
        <div key={item} className="rounded border border-gray-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">{item}</h3>
          <p className="mt-2 text-sm text-gray-600">Configured for local LMS MMP demonstration.</p>
        </div>
      ))}
    </div>
  </MmpModuleShell>
);

export default MmpConfigurationPage;
