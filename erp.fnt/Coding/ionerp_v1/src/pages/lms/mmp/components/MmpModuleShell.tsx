import React from "react";

interface MmpModuleShellProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const MmpModuleShell: React.FC<MmpModuleShellProps> = ({
  title,
  children,
  action,
}) => (
  <section className="min-h-[590px] w-full min-w-0 overflow-x-hidden rounded-md border border-gray-200 bg-white p-4 shadow-md md:p-6">
    <div className="mb-4 flex items-center justify-between rounded-tl-[22px] rounded-tr-none rounded-br-[22px] rounded-bl-none bg-slate-800 px-5 py-2 text-white">
      <h2 className="text-xl font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export default MmpModuleShell;
