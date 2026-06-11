import React, { useState } from "react";
import MentoringPageLayout from "./MentoringPageLayout";

interface Session {
  id: number;
  curriculum: string;
  term: string;
  date: string;
  time: string;
  topic: string;
  mentor: string;
}

const MOCK_SESSIONS: Session[] = [
  { id: 1, curriculum: "B.Tech CSE 2024", term: "Fall 2024", date: "2024-09-10", time: "10:00 AM", topic: "Intro to Algorithms", mentor: "Dr. Smith" },
  { id: 2, curriculum: "B.Tech ECE 2024", term: "Fall 2024", date: "2024-09-12", time: "11:00 AM", topic: "Circuit Design", mentor: "Prof. Johnson" },
];

const MentorListPage: React.FC = () => {
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [term, setTerm] = useState("");

  const [sessions] = useState<Session[]>(MOCK_SESSIONS);

  const filteredSessions = sessions.filter(session => {
    let match = true;
    if (curriculum && session.curriculum !== curriculum) match = false;
    if (term && session.term !== term) match = false;
    return match;
  });

  return (
    <MentoringPageLayout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4">
          <h2 className="text-xl font-bold text-white tracking-wide">Mentor List</h2>
        </div>

        <div className="p-6">
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Department: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={department} onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Program: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={program} onChange={(e) => setProgram(e.target.value)}
              >
                <option value="">Select Program</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Curriculum: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={curriculum} onChange={(e) => setCurriculum(e.target.value)}
              >
                <option value="">Select Curriculum</option>
                <option value="B.Tech CSE 2024">B.Tech CSE 2024</option>
                <option value="B.Tech ECE 2024">B.Tech ECE 2024</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Term: <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={term} onChange={(e) => setTerm(e.target.value)}
              >
                <option value="">Select Term</option>
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2025">Spring 2025</option>
              </select>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Sl No.</th>
                  <th className="px-4 py-3 text-left">Curriculum</th>
                  <th className="px-4 py-3 text-left">Term</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Topic</th>
                  <th className="px-4 py-3 text-left">Mentor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-gray-800 text-sm">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session, index) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{session.curriculum}</td>
                      <td className="px-4 py-3">{session.term}</td>
                      <td className="px-4 py-3">{session.date} {session.time}</td>
                      <td className="px-4 py-3">{session.topic}</td>
                      <td className="px-4 py-3">{session.mentor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No sessions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MentoringPageLayout>
  );
};

export default MentorListPage;
