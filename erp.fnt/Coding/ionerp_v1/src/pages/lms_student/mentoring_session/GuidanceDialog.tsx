import React, { useEffect, useRef, useState } from 'react';
import { attachmentUrl, Comment, CommentKind, mentoringApi, MentoringSession } from './mentoringService';

export default function GuidanceDialog({ studentId, session, kind, onClose }: {
  studentId: number; session: MentoringSession; kind: CommentKind; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    mentoringApi.comments(kind, studentId, session.schedule_id, controller.signal).then(rows => { if (!controller.signal.aborted) setComments(rows); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, studentId, session.schedule_id, refresh]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving) return;
    if (!text.trim() && !file) { setError('Enter a comment or select an attachment.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      await mentoringApi.saveComment(kind, studentId, session.schedule_id, text, file);
      setText(''); setFile(null); if (fileInput.current) fileInput.current.value = '';
      setNotice('Comment saved.'); setRefresh(v => v + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function remove(comment: Comment) {
    if (!comment.generic_comment_id || saving || !window.confirm('Remove this attachment?')) return;
    setSaving(true); setError('');
    try { await mentoringApi.removeAttachment(studentId, session.schedule_id, comment.generic_comment_id); setRefresh(v => v + 1); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  return <dialog ref={dialog} className="sm-dialog" aria-labelledby="sm-guidance-title" onCancel={e => { e.preventDefault(); if (!saving) onClose(); }}>
    <h2 id="sm-guidance-title">{kind === 'group' ? 'General Guidance' : 'Individual Guidance'}</h2>
    <p><strong>{session.group_name}</strong><br />{session.mentor_names.join(', ')}<br />{session.semester_name}</p>
    {error && <p className="sm-error" role="alert">{error} <button disabled={saving} onClick={() => setRefresh(v => v + 1)}>Refresh comments</button></p>}
    {notice && <p className="sm-success" role="status">{notice}</p>}
    <div className="sm-comments" aria-label="Guidance conversation">
      {loading ? <p role="status">Loading guidance…</p> : !comments.length ? <p>No guidance has been posted yet.</p> : comments.map((c, index) => <article key={c.generic_comment_id ?? c.individual_comment_id ?? index}>
        <header><strong>{c.posted_by_name || c.posted_by_type} ({c.posted_by_type})</strong><time>{c.created_date?.replace('T', ' ')}</time></header>
        {c.comment && <p className="sm-preserve">{c.comment}</p>}
        {c.attachment && <div><a href={attachmentUrl(c.attachment)} target="_blank" rel="noopener noreferrer">View attachment</a>
          {kind === 'group' && c.posted_by_type === 'Mentee' && c.posted_by_id === studentId && <button disabled={saving} className="sm-link" onClick={() => remove(c)}>Remove attachment</button>}</div>}
      </article>)}
    </div>
    <form onSubmit={submit}><fieldset disabled={saving}><legend className="sm-visually-hidden">Add guidance comment</legend>
      <label>Comment<textarea rows={3} maxLength={2000} value={text} onChange={e => setText(e.target.value)} /></label>
      <label>Attachment<input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={e => {
        const selected = e.target.files?.[0] || null;
        if (selected && (selected.size > 2 * 1024 * 1024 || !/\.(pdf|docx?|xlsx?|jpe?g|png)$/i.test(selected.name))) {
          setFile(null); e.target.value = ''; setError('Use PDF, Word, Excel, JPG or PNG files up to 2 MB.');
        } else { setFile(selected); setError(''); }
      }} /></label><small>PDF, Word, Excel, JPG or PNG. Maximum 2 MB.</small>
    </fieldset><div className="sm-actions"><button type="submit" className="sm-primary" disabled={saving}>{saving ? 'Saving…' : 'Send'}</button><button type="button" disabled={saving} onClick={onClose}>Close</button></div></form>
  </dialog>;
}
