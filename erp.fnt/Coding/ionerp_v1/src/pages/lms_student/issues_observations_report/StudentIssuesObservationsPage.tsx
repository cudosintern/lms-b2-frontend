import React from 'react';
import StudentIssuesObservationsReport from './StudentIssuesObservationsReport';
import { positiveId, studentReportsApi } from './studentReportsService';
import './studentIssuesObservations.css';

interface Props { studentId?: number }

// ERP studentId takes precedence. Demo defaults to 3348; the environment can override it.
export default function StudentIssuesObservationsPage({ studentId }: Props) {
  let resolvedId: number | null = null;
  try { resolvedId = positiveId(studentId ?? (process.env.REACT_APP_DEMO_STUDENT_ID || 3348)); }
  catch { /* Show the report screen without requesting data for an unknown student. */ }
  return <div className="student-issues-module">
    <StudentIssuesObservationsReport studentId={resolvedId} api={studentReportsApi}/>
  </div>;
}
