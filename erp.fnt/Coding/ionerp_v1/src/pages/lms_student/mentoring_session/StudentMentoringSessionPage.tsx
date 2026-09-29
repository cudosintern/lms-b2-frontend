import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Batch, MentoringSession, mentoringApi, resolveStudentId } from './mentoringService';
import GuidanceDialog from './GuidanceDialog';
import QuestionnairePage from './QuestionnairePage';
import './studentMentoring.css';

export default function StudentMentoringSessionPage({ studentId }: { studentId?: number }) {
  const location = useLocation();
  let id: number;
  try { id = resolveStudentId(studentId); }
  catch (error) { return <p role="alert">{(error as Error).message}</p>; }
  // One registered route supports direct loads and independent questionnaire tabs.
  return <div className="student-mentoring">{new URLSearchParams(location.search).has('schedule_id')
    ? <QuestionnairePage studentId={id} /> : <SessionList studentId={id} />}</div>;
}

function SessionList({ studentId }: { studentId: number }) {
  const location = useLocation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batch, setBatch] = useState('');
  const [month, setMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; });
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [batchRetry, setBatchRetry] = useState(0);
  const [guidance, setGuidance] = useState<{ session: MentoringSession; kind: 'group' | 'individual' } | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setBatchLoading(true); setError(''); setBatches([]); setBatch('');
    mentoringApi.batches(studentId, controller.signal).then(rows => {
      if (!controller.signal.aborted) { setBatches(rows); setBatch(String(rows[0]?.academic_batch_id || '')); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setBatchLoading(false); });
    return () => controller.abort();
  }, [studentId, batchRetry]);
  useEffect(() => {
    if (!batch || !month) { setSessions([]); return; }
    const controller = new AbortController(); setLoading(true); setError(''); setSessions([]);
    mentoringApi.sessions(studentId, Number(batch), month, controller.signal).then(rows => {
      if (!controller.signal.aborted) setSessions(rows);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [studentId, batch, month, refresh]);
  useEffect(() => {
    const reload = () => setRefresh(v => v + 1);
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, []);
  useEffect(() => setPage(1), [batch, month, search, size]);
  const filtered = useMemo(() => sessions.filter(s => `${s.group_name} ${s.sub_group_name} ${s.semester_name} ${s.mentor_names.join(' ')} ${s.location} ${s.session_agenda}`.toLowerCase().includes(search.toLowerCase())), [sessions, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pages);
  const shown = filtered.slice((currentPage - 1) * size, currentPage * size);
  const groups = shown.reduce<Record<string, MentoringSession[]>>((all, row) => {
    const key = `${row.mentors_group_id}-${row.schedule_id}`;
    (all[key] ||= []).push(row); return all;
  }, {});
  return <section className="sm-panel">
    <h1>Mentoring Session</h1>
    <div className="sm-filters">
      <label>Curriculum: <span className="sm-required">*</span><select value={batch} disabled={batchLoading} onChange={e => setBatch(e.target.value)}>
        <option value="">{batchLoading ? 'Loading curricula…' : 'Select curriculum'}</option>
        {batches.map(b => <option key={b.academic_batch_id} value={b.academic_batch_id}>{b.academic_batch_desc || b.academic_batch_code}</option>)}
      </select></label>
      <label>Month: <span className="sm-required">*</span><input type="month" required value={month} onChange={e => setMonth(e.target.value)} /></label>
    </div>
    {error && <p role="alert" className="sm-error">{error} <button onClick={() => batches.length ? setRefresh(v => v + 1) : setBatchRetry(v => v + 1)}>Retry</button></p>}
    <div className="sm-toolbar"><label>Show <select value={size} onChange={e => setSize(Number(e.target.value))}>{[10, 25, 50].map(n => <option key={n}>{n}</option>)}</select> entries</label>
      <label>Search: <input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
    {loading || batchLoading ? <p role="status">Loading mentoring sessions…</p> : <>
      {!filtered.length && !error && <p className="sm-empty">{!batches.length ? 'No curricula are mapped to this student.' : !month ? 'Select a month.' : 'No mentoring sessions found for these filters.'}</p>}
      {Object.entries(groups).map(([key, rows]) => { const first = rows[0]; return <div className="sm-group" key={key}>
        <header><div><h2>{first.group_name}</h2><p>{first.mentor_names.join(', ') || 'No mentors listed'}</p></div>
          {!!first.questionnaire_id && <a target="_blank" rel="noopener noreferrer" href={`${location.pathname}?schedule_id=${first.schedule_id}&sub_group_date_id=${first.sub_group_date_id}`}>{first.questionnaire_status === 'Submitted' ? 'View / edit questionnaire' : 'Answer questionnaires'}</a>}</header>
        <div className="sm-semester">{first.semester_name || 'Semester not specified'}</div>
        <div className="sm-table-scroll"><table><thead className="sm-visually-hidden"><tr><th>Subgroup</th><th>Date and time</th><th>Location / agenda</th><th>Guidance</th><th>Status</th></tr></thead><tbody>
          {rows.map(row => <tr key={row.sub_group_date_id}><td>{row.sub_group_name}</td><td>{formatDate(row.start_date)} to {formatDate(row.end_date)}<br />{formatTime(row.start_time)} to {formatTime(row.end_time)}</td>
            <td>{row.location || '—'}{row.session_agenda && <p className="sm-agenda">{row.session_agenda}</p>}</td>
            <td><button className="sm-link" aria-label={`Individual guidance for ${row.sub_group_name}`} onClick={() => setGuidance({ session: row, kind: 'individual' })}>Individual guidance</button><span aria-hidden="true"> | </span><button className="sm-link" onClick={() => setGuidance({ session: row, kind: 'group' })}>General Guidance</button></td>
            <td>{({ 0: 'Yet to start', 1: 'Complete', 2: 'In-progress' } as Record<number, string>)[row.status] || 'Unknown'}</td></tr>)}
        </tbody></table></div>
      </div>; })}
    </>}
    <div className="sm-toolbar"><span>Showing {filtered.length ? (currentPage - 1) * size + 1 : 0} to {Math.min(currentPage * size, filtered.length)} of {filtered.length} entries</span>
      <nav aria-label="Session pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span> {currentPage} / {pages} </span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav></div>
    {guidance && <GuidanceDialog key={`${guidance.session.schedule_id}-${guidance.kind}`} studentId={studentId} session={guidance.session} kind={guidance.kind} onClose={() => setGuidance(null)} />}
  </section>;
}
function formatDate(value: string) { return value ? value.slice(0, 10).split('-').reverse().join('-') : '—'; }
function formatTime(value: string) {
  if (!value) return '—'; const [hour, minute] = value.split(':'); const n = Number(hour);
  return `${n % 12 || 12}:${minute} ${n < 12 ? 'AM' : 'PM'}`;
}
