import { agreementDate } from './agreementDisplay';
import { reportBatches, reportTerms } from './reportFilterOptions';
import { Report, Batch, Semester, HistoryItem, studentReportsApi } from './studentReportsService';
import React, { useEffect, useRef, useState } from 'react';

const date = (value: string | null | undefined) => {
  if (!value) return '—';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[3] + '-' + match[2] + '-' + match[1] : value;
};
const historyTime = (value: string) => {
  const match = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  return String(hour % 12 || 12).padStart(2, '0') + ':' + match[2] + ':' + match[3] + (hour >= 12 ? ' PM' : ' AM');
};
const yesNo = (value: number | boolean) => Number(value) === 1 ? 'Yes' : 'No';

// Pass the ERP-authenticated student's ID here after integration.
export default function StudentIssuesObservationsReport({ studentId, api }: { studentId: number | null; api: typeof studentReportsApi }) {
  // Remount all local state whenever the identity changes.
  return <Reports key={studentId} studentId={studentId} api={api}/>;
}
function Reports({ studentId, api }: { studentId: number | null; api: typeof studentReportsApi }) {
  const [reports, setReports] = useState<Report[]>([]), [batches, setBatches] = useState<Batch[]>([]), [semesters, setSemesters] = useState<Semester[]>([]);
  const [batch, setBatch] = useState(''), [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [filterError, setFilterError] = useState(''), [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<Report | null>(null), [history, setHistory] = useState<HistoryItem[]>([]), [detailLoading, setDetailLoading] = useState(false), [detailError, setDetailError] = useState('');
  const [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
  const detailRequest = useRef<AbortController | null>(null), mounted = useRef(true), saveLock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; detailRequest.current?.abort(); }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (studentId === null) { setLoading(false); setReports([]); setBatches([]); return () => controller.abort(); }
    setLoading(true); setError('');
    (async () => {
      try {
        const [list, batchList] = await Promise.all([api.list({ student_id: studentId }, controller.signal), api.batches({ student_id: studentId }, controller.signal)]);
        // The list API omits batch/semester IDs. Load details in bounded groups for accurate filtering.
        const enriched: Report[] = [];
        for (let i = 0; i < list.length; i += 6) {
          enriched.push(...await Promise.all(list.slice(i, i + 6).map(report => api.detail({ student_id: studentId, lms_isnob_id: report.lms_isnob_id }, controller.signal))));
        }
        if (!controller.signal.aborted) { const options = reportBatches(batchList, enriched); setReports(enriched); setBatches(options); setBatch(current => options.some(b => String(b.academic_batch_id) === current) ? current : String(options[0]?.academic_batch_id ?? '')); }
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to complete request.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [api, studentId, reload]);
  useEffect(() => {
    const controller = new AbortController(); setSemesters([]); setFilterError('');
    if (batch && studentId !== null) api.semesters({ student_id: studentId, academic_batch_id: batch }, controller.signal)
      .then(data => { if (!controller.signal.aborted) { const options = reportTerms(data, reports, batch); setSemesters(options); setSemester(current => options.some(s => String(s.semester_id) === current) ? current : String(options[0]?.semester_id ?? '')); } })
      .catch(err => { if (!controller.signal.aborted) setFilterError(err instanceof Error ? err.message : 'Unable to complete request.'); });
    return () => controller.abort();
  }, [api, studentId, batch, reload, reports]);
  async function open(report: Report) {
    if (studentId === null) return;
    detailRequest.current?.abort(); const controller = new AbortController(); detailRequest.current = controller;
    setSelected(report); setHistory([]);  setDetailLoading(true); setDetailError(''); setNotice('');
    try {
      const [detail, items] = await Promise.all([api.detail({ student_id: studentId, lms_isnob_id: report.lms_isnob_id }, controller.signal), api.history({ student_id: studentId, lms_isnob_id: report.lms_isnob_id }, controller.signal)]);
      if (!controller.signal.aborted) { setSelected(detail); setHistory(items); }
    } catch (err) { if (!controller.signal.aborted) setDetailError(err instanceof Error ? err.message : 'Unable to complete request.'); }
    finally { if (!controller.signal.aborted) setDetailLoading(false); }
  }
  async function agree() {
    if (studentId === null || saveLock.current || !selected?.can_agree) return;
    saveLock.current = true; setSaving(true); setDetailError('');
    try {
      await api.agree({ student_id: studentId, lms_isnob_id: selected.lms_isnob_id });
      if (!mounted.current) return;
      await open({ ...selected, mentee_status: 1, can_agree: false, report_status: 'Finalized' }); if (!mounted.current) return; setNotice('Your agreement was saved successfully.'); setReload(n => n + 1);
    } catch (err) { if (mounted.current) setDetailError(err instanceof Error ? err.message : 'Unable to complete request.'); }
    finally { saveLock.current = false; if (mounted.current) setSaving(false); }
  }
  function clearReport() {
    detailRequest.current?.abort(); setSelected(null); setHistory([]); setDetailLoading(false); setDetailError(''); 
  }
  const visible = reports.filter(r => batch && semester && String(r.academic_batch_id) === batch && String(r.semester_id) === semester);
  return <main className="page student-report-screen">
    <h1 className="report-heading">Issues and Observation Report</h1>
    {notice && <p role="status" className="success">{notice}</p>}
    <section className="filters student-report-filters" aria-label="Report filters">
      <label>Curriculum *<select value={batch} disabled={studentId === null || loading || saving} onChange={e => { clearReport(); setBatch(e.target.value); setSemester(''); }}><option value="">Select Curriculum</option>{batches.map(b => <option key={b.academic_batch_id} value={b.academic_batch_id}>{b.academic_batch_desc || b.academic_batch_code}</option>)}</select></label>
      <label>Term *<select value={semester} disabled={!batch || loading || saving} onChange={e => { clearReport(); setSemester(e.target.value); }}><option value="">Select Term</option>{semesters.map(s => <option key={s.semester_id} value={s.semester_id}>{s.semester}</option>)}</select></label>
      <label>Report *<select value={selected?.lms_isnob_id ?? ''} disabled={loading || saving || !semester || visible.length === 0} onChange={e => { const report = visible.find(r => String(r.lms_isnob_id) === e.target.value); if (report) void open(report); else clearReport(); }}><option value="">Select Report</option>{visible.map(r => <option key={r.lms_isnob_id} value={r.lms_isnob_id}>{r.report_title || 'Untitled report'}</option>)}</select></label>
    </section>
    {filterError && <p role="alert" className="error">Could not load terms: {filterError} <button onClick={() => setReload(n => n + 1)}>Retry</button></p>}
    {loading ? <p className="report-empty" role="status">Loading reports…</p> : error ? <p role="alert" className="error">{error} <button onClick={() => setReload(n => n + 1)}>Retry</button></p> : !selected && <p className="report-empty" role="status">{visible.length === 0 ? 'No data to display.' : 'Select a report to view its details.'}</p>}
    {selected && <section className="report-document" aria-label="Selected report" aria-busy={detailLoading || saving}>
      {detailLoading ? <p role="status">Loading report details…</p> : <>
        <p className={'report-state ' + (selected.report_status === 'Finalized' ? 'finalized' : '')}>{selected.report_status === 'Finalized' ? 'Report Finalized' : 'Report In-progress'}</p>
        <label className="report-title-row"><span>Report Title:</span><input readOnly value={selected.report_title || ''}/></label>
        <table className="report-metadata"><tbody>
          <tr><th>USN:</th><td>{selected.student_usn || '—'}</td><th>Mentor:</th><td>{selected.mentor_name || '—'}</td></tr>
          <tr><th>Counselling Date:</th><td>{date(selected.counselling_date)}</td><th>Term:</th><td>{semesters.find(s => String(s.semester_id) === String(selected.semester_id))?.semester ?? selected.semester_id} - Semester</td></tr>
        </tbody></table>
        <label className="report-text-field">Purpose of meeting / Issue reported:<textarea readOnly rows={4} value={selected.purpose_of_meeting_desc || ''}/></label>
        <label className="report-text-field">Observations and Action Taken:<textarea readOnly rows={4} value={selected.observation_desc || ''}/></label>
        <label className="report-flag"><span>Has the issue been communicated and discussed with parents?</span><input readOnly value={yesNo(selected.comm_parent_flag)}/></label>
        <label className="report-flag"><span>Has the issue been communicated and discussed with higher authorities?</span><input readOnly value={yesNo(selected.comm_high_auth_flag)}/></label>
        <div className="report-signatures">
          <div><p>Mentor Signature with Date</p><div className="signature-box" aria-label="Mentor signature">{selected.mentor_status === 2 ? (agreementDate(history, 'mentor_status', selected.mentor_status) ? 'Agreed on ' + date(agreementDate(history, 'mentor_status', selected.mentor_status)) : 'Agreed (date unavailable)') : ''}</div></div>
          <div><p>Mentee Signature with Date</p><div className="signature-box" aria-label="Mentee signature">{selected.mentee_status === 1 ? (agreementDate(history, 'mentee_status', selected.mentee_status) ? 'Agreed on ' + date(agreementDate(history, 'mentee_status', selected.mentee_status)) : 'Agreed (date unavailable)') : ''}</div></div>
        </div>
        {selected.can_agree && selected.mentor_status === 2 && selected.mentee_status === 0 && !detailError && <div className="student-agree-action"><button className="primary" disabled={saving || detailLoading} onClick={agree}>{saving ? 'Saving…' : 'Agree'}</button></div>}
        <details className="report-history"><summary>History</summary>
          {history.length ? history.map(item => <p className="history-row" key={item.history_id}>
            {item.action_label || (item.action_type === 'insert' ? 'Created' : 'Updated')} by {item.actor_name || 'Unknown user'} on {date(item.action_timestamp)} {historyTime(item.action_timestamp)}
          </p>) : <p className="history-row">No history recorded.</p>}
        </details>
      </>}
      {detailError && <div role="alert" className="error">{detailError} <button disabled={saving} onClick={() => open(selected)}>Reload report</button></div>}
    </section>}
  </main>;
}
