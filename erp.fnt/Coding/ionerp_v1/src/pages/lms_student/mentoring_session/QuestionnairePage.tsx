import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Answer, flag, mentoringApi, positiveId, Questionnaire, validateAnswers } from './mentoringService';

export default function QuestionnairePage({ studentId }: { studentId: number }) {
  const location = useLocation();
  const [data, setData] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setData(null); setSaved(false);
    try {
      const params = new URLSearchParams(location.search);
      const scheduleId = positiveId(params.get('schedule_id'));
      positiveId(params.get('sub_group_date_id'));
      mentoringApi.questionnaire(studentId, scheduleId, controller.signal).then(result => {
        if (controller.signal.aborted) return;
        setData(result); setAnswers(result.questions.map(q => ({ questionnaire_que_id: q.question_id,
          selected_option_ids: q.options.filter(o => o.selected).map(o => o.option_id),
          text_answer: q.text_answer || '', specifications: Object.fromEntries(q.options.filter(o => o.selected && flag(o.specify_flag)).map(o => [o.option_id, o.specification || ''])) })));
      }).catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    } catch (e) { setError((e as Error).message); setLoading(false); }
    return () => controller.abort();
  }, [studentId, location.search, retry]);
  function update(id: number, patch: Partial<Answer>) {
    setAnswers(current => current.map(a => a.questionnaire_que_id === id ? { ...a, ...patch } : a)); setSaved(false);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!data || saving) return;
    const validation = validateAnswers(data.questions, answers);
    if (validation) { setError(validation); return; }
    setSaving(true); setError('');
    try {
      const dateId = positiveId(new URLSearchParams(location.search).get('sub_group_date_id'));
      await mentoringApi.saveAnswers(studentId, data.schedule_id, dateId, answers.map(a => ({ ...a, text_answer: a.text_answer?.trim() || null })));
      setSaved(true); setData({ ...data, is_submitted: true });
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  return <section className="sm-panel"><h1>Questionnaire Response</h1>
    {loading && <p role="status">Loading questionnaire…</p>}
    {error && <p role="alert" className="sm-error">{error} {!data && <button onClick={() => setRetry(v => v + 1)}>Retry</button>}</p>}
    {saved && <p role="status" className="sm-success">Questionnaire saved successfully. You may close this tab.</p>}
    {data && <form onSubmit={submit} noValidate><p><strong>Questionnaire Type:</strong><br />{data.questionnaire_name}</p>
      <p className="sm-preserve"><strong>Message to Mentees:</strong><br />{data.message_to_mentees || '—'}</p>
      {data.is_submitted && !saved && <p>Your saved answers are shown below. You can update and submit them again.</p>}
      {!data.questions.length && <p>No questions are available.</p>}
      <fieldset disabled={saving}><legend className="sm-visually-hidden">Questionnaire answers</legend>
      {data.questions.map(q => { const answer = answers.find(a => a.questionnaire_que_id === q.question_id)!; return <fieldset className="sm-question" key={q.question_id}>
        <legend>{q.question_no}. {q.question} {flag(q.mandatory) && <span className="sm-required" aria-label="Required">*</span>}</legend>
        {q.que_type_id === 3 ? <textarea aria-label={`Answer to Question ${q.question_no}`} rows={4} value={answer.text_answer || ''} onChange={e => update(q.question_id, { text_answer: e.target.value })} />
          : [1, 2].includes(q.que_type_id) ? q.options.map(option => {
            const selected = answer.selected_option_ids.includes(option.option_id);
            return <div className="sm-option" key={option.option_id}><label><input type={q.que_type_id === 1 ? 'radio' : 'checkbox'} name={`question-${q.question_id}`} checked={selected}
              onChange={e => {
                const ids = q.que_type_id === 1 ? [option.option_id] : e.target.checked ? [...answer.selected_option_ids, option.option_id] : answer.selected_option_ids.filter(id => id !== option.option_id);
                update(q.question_id, { selected_option_ids: ids, specifications: Object.fromEntries(Object.entries(answer.specifications).filter(([id]) => ids.includes(Number(id)))) });
              }} /> {option.option}</label>
              {selected && flag(option.specify_flag) && <label className="sm-specify">Please specify<textarea rows={2} value={answer.specifications[option.option_id] || ''} onChange={e => update(q.question_id, { specifications: { ...answer.specifications, [option.option_id]: e.target.value } })} /></label>}
            </div>;
          }) : <p role="alert">Unsupported question type. Please contact your mentor.</p>}
      </fieldset>; })}</fieldset>
      <div className="sm-actions"><button className="sm-primary" type="submit" disabled={saving || saved || !data.questions.length}>{saving ? 'Saving…' : data.is_submitted ? 'Update response' : 'Submit'}</button>
        <a className="sm-button" href={location.pathname}>Back to sessions</a></div>
    </form>}
  </section>;
}
