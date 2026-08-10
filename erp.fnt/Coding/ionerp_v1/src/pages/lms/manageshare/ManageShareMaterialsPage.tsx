import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';
import { LocalStorageHelper } from '../../../utils/localStorageHelper';
const MATERIAL_API = '/api/v1/material';

interface Curriculum { academic_batch_id: number; academic_batch_desc: string; academic_batch_code: string; academic_year?: string; }
interface Term { semester_id: number; semester: number; semester_desc: string; }
interface Course { crs_id: number; crs_code: string; crs_title: string; }
interface Section { section_id: number; section: string; }
interface Material {
  mat_id: number; document_name: string; file_name: string;
  description: string;
  // topic can come in multiple field names from backend
  topic?: string; topic_title?: string; topic_name?: string; topic_ids?: string;
  section_ids?: string;
  // license field
  license?: string;
  // date can come as created_date or share_date
  created_date?: string; share_date?: string;
  // URL type support
  url?: string; doc_type?: string; material_type?: string; docment_url?: string;
}
interface MappedStudent { student_usn: string; student_name: string; }
interface ShareStudent { student_id: number; usno: string; name?: string; first_name: string; last_name: string; }

// Helper: pick topic text from whatever field the backend uses
const getTopicLabel = (m: Material) => m.topic_title || m.topic_name || m.topic || '—';
// Helper: pick share date from whatever field the backend uses
const getShareDate = (m: Material) => {
  const raw = m.share_date || m.created_date;
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-GB');
};
// Helper: detect if a material is a URL type — backend now stores doc_type
const isUrlMaterial = (m: Material) =>
  m.doc_type === 'url' || m.material_type === 'url' || (!!m.url && !m.file_name) || (!!m.docment_url && !m.file_name);

type ModalMode = 'add' | 'edit' | 'viewStudents' | 'share' | null;

const QUIZ_META = '/api/v1/manage-quiz';



const ManageShareMaterialsPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<any>('auth_state');
  const userId: number = (authState as any)?.user_id ?? 1;

  // Dropdown state
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);

  // Data state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [formUrl, setFormUrl] = useState('');
  const [docType, setDocType] = useState<'document' | 'url'>('document');
  const [formSection, setFormSection] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formTopics, setFormTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [notifyType, setNotifyType] = useState<'pre' | 'post'>('pre');
  const [license, setLicense] = useState({ proprietary: false, paid: false, public: false });
  const [saving, setSaving] = useState(false);
  const [mappedStudents, setMappedStudents] = useState<MappedStudent[]>([]);

  // Share state
  const [shareStudents, setShareStudents] = useState<ShareStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [sharedStudentUsns, setSharedStudentUsns] = useState<Set<string>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Derived: selected curriculum/term/course labels for info bar
  const selBatchLabel = curriculums.find(c => String(c.academic_batch_id) === selectedBatch);
  const selTermLabel  = terms.find(t => String(t.semester_id) === selectedTerm);
  const selCourseLabel = courses.find(c => String(c.crs_id) === selectedCourse);

  // Load topics helper — used by both Add and Edit
  const loadTopics = useCallback((batchId: string, termId: string, courseId: string) => {
    if (!batchId || !termId || !courseId) { setFormTopics([]); return; }
    setLoadingTopics(true);
    axiosInstance.get(`${QUIZ_META}/meta/topics`, {
      params: { academic_batch_id: Number(batchId), semester_id: Number(termId), crs_id: Number(courseId) }
    })
      .then((r: any) => { setFormTopics(Array.isArray(r.data?.data) ? r.data.data : []); setLoadingTopics(false); })
      .catch(() => { setFormTopics([]); setLoadingTopics(false); });
  }, []);

  // Load curriculums on mount
  useEffect(() => {
    setLoadingBatch(true);
    const doneA = () => setLoadingBatch(false);
    axiosInstance.get(`${QUIZ_META}/meta/curriculums`)
      .then((r: any) => { setCurriculums(Array.isArray(r.data?.data) ? r.data.data : []); doneA(); }, doneA);
  }, []);

  // Cascade: batch → terms
  useEffect(() => {
    if (!selectedBatch) { setTerms([]); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); return; }
    setLoadingTerm(true);
    const doneB = () => setLoadingTerm(false);
    axiosInstance.get(`${QUIZ_META}/meta/terms`, { params: { academic_batch_id: selectedBatch } })
      .then((r: any) => { setTerms(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); doneB(); }, doneB);
  }, [selectedBatch]);

  // Cascade: term → courses
  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); return; }
    setLoadingCourse(true);
    const doneC = () => setLoadingCourse(false);
    axiosInstance.get(`${QUIZ_META}/meta/courses`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setCourses(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedCourse(''); setSections([]); setSelectedSection(''); doneC(); }, doneC);
  }, [selectedBatch, selectedTerm]);

  // Cascade: course → sections
  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setSections([]); setSelectedSection(''); return; }
    setLoadingSection(true);
    const doneD = () => setLoadingSection(false);
    axiosInstance.get(`${QUIZ_META}/meta/sections`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setSections(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedSection(''); doneD(); }, doneD);
  }, [selectedBatch, selectedTerm]);

  // Fetch materials when section changes
  useEffect(() => {
    if (!selectedSection) { setMaterials([]); return; }
    setLoading(true);
    const doneE = () => setLoading(false);
    axiosInstance.post('/api/v1/material/material_list', {
      academic_batch_id: Number(selectedBatch) || 0,
      semester_id: Number(selectedTerm) || 0,
      course_id: Number(selectedCourse) || 0,
      section_id: Number(selectedSection),
    }).then((r: any) => {
      const d = r.data?.data ?? r.data;
      const fetched = Array.isArray(d) ? d : [];
      setMaterials(fetched);
      doneE();
    }, () => {
      setMaterials([]);
      doneE();
    });
  }, [selectedSection]);

  const closeModal = () => {
    setModalMode(null); setSelectedMaterial(null);
    setFormTitle(''); setFormDesc(''); setFormFiles([]); setFormUrl('');
    setDocType('document'); setFormSection(''); setFormTopic('');
    setFormTopics([]); setNotifyType('pre');
    setLicense({ proprietary: false, paid: false, public: false });
    setMappedStudents([]);
    setShareStudents([]); setSelectedStudentIds(new Set()); setSharedStudentUsns(new Set()); setStudentSearchTerm('');
  };

  const openAdd = () => {
    if (!selectedCourse) { toast.warn('Please select a Course first.'); return; }
    setFormTitle(''); setFormDesc(''); setFormFiles([]); setFormUrl('');
    setDocType('document'); setFormSection(''); setFormTopic('');
    setFormTopics([]); setNotifyType('pre');
    setLicense({ proprietary: false, paid: false, public: false });
    // Load topics for the selected course
    loadTopics(selectedBatch, selectedTerm, selectedCourse);
    setSelectedMaterial(null); setModalMode('add');
  };

  const openEdit = (row: Material) => {
    setFormTitle(row.document_name);
    setFormDesc(row.description || '');
    setFormFiles([]);
    // Restore URL if material is URL-type
    const isUrl = isUrlMaterial(row);
    setDocType(isUrl ? 'url' : 'document');
    setFormUrl(isUrl ? (row.url || row.docment_url || '') : '');
    setFormSection(row.section_ids?.toString() || '');
    // Pre-select the saved topic if available
    setFormTopic(row.topic_ids?.toString() || '');
    setFormTopics([]);
    setNotifyType('pre');
    const lic = (row.license || '').toLowerCase();
    setLicense({ proprietary: lic === 'proprietary', paid: lic === 'paid', public: lic === 'public' });
    setSelectedMaterial(row);
    setModalMode('edit');
    // Load topics for the course so user can see/change them
    loadTopics(selectedBatch, selectedTerm, selectedCourse);
  };

  const handleDelete = async (row: Material) => {
    if (row.mat_id < 0) { toast.info('Demo data cannot be deleted.'); return; }
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await axiosInstance.delete(`/api/v1/material/delete_material/${row.mat_id}`);
      toast.success('Material deleted successfully');
      setMaterials(prev => prev.filter(x => x.mat_id !== row.mat_id));
    } catch {
      toast.error('Failed to delete material');
    }
  };

  const openViewStudents = async (row: Material) => {
    // Don't allow viewing for demo rows
    if (row.mat_id < 0) { toast.info('This is demo data — no real student mappings.'); return; }
    setSelectedMaterial(row); setMappedStudents([]); setModalMode('viewStudents');
    try {
      const r: any = await axiosInstance.post('/api/v1/material/material_mapping_list', { material_id: row.mat_id });
      const d = r.data?.data ?? r.data;
      setMappedStudents(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load student mapping.'); }
  };

  const openShare = async (row: Material) => {
    if (row.mat_id < 0) { toast.info('This is demo data — sharing is disabled.'); return; }
    setSelectedMaterial(row); setShareStudents([]); setSelectedStudentIds(new Set()); setSharedStudentUsns(new Set()); setModalMode('share');
    setStudentSearchTerm('');
    setLoadingStudents(true);
    try {
      const r: any = await axiosInstance.post('/api/v1/material/student_list', {
        section_id: Number(selectedSection),
        academic_batch_id: Number(selectedBatch) || 0,
        semester_id: Number(selectedTerm) || 0,
      });
      const items = r.data?.data ?? r.data;
      setShareStudents(Array.isArray(items) ? items : []);

      // Also fetch already mapped to pre-check them
      const r2: any = await axiosInstance.post('/api/v1/material/material_mapping_list', { material_id: row.mat_id });
      const mapped = r2.data?.data ?? r2.data;
      if (Array.isArray(mapped)) {
        setSharedStudentUsns(new Set(mapped.map((m: any) => m.student_usn)));
      }
    } catch { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const handleShare = async () => {
    if (!selectedMaterial) return;
    if (selectedStudentIds.size === 0) { toast.warning('Select at least one student'); return; }
    setSaving(true);
    try {
      // Resolve USNs from selected student IDs
      const usns = shareStudents
        .filter(s => selectedStudentIds.has(s.student_id))
        .map(s => s.usno)
        .filter(Boolean);
      await axiosInstance.post('/api/v1/material/share_material', {
        material_id: selectedMaterial.mat_id,
        academic_batch_id: Number(selectedBatch),
        section_id: Number(selectedSection),
        student_usns: usns
      });
      toast.success('Successfully shared material');
      closeModal();
    } catch { toast.error('Failed to share material'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error('File/Link name is required.'); return; }
    if (docType === 'document' && modalMode === 'add' && formFiles.length === 0) { toast.error('Please choose at least one file.'); return; }
    if (docType === 'url' && !formUrl.trim()) { toast.error('Please enter a URL.'); return; }
    // For demo rows, just show a toast
    if (selectedMaterial && selectedMaterial.mat_id < 0) {
      toast.info('This is demo data — save is disabled. Add real data via the backend.');
      closeModal(); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formTitle.trim());
      fd.append('description', formDesc);
      fd.append('additional_info', formDesc);
      fd.append('doc_type', docType);
      
      if (docType === 'document') {
        if (modalMode === 'add') {
          formFiles.forEach(file => fd.append('files', file));
        } else if (modalMode === 'edit' && formFiles.length > 0) {
          fd.append('file', formFiles[0]);
        }
      }
      
      if (docType === 'url') fd.append('url', formUrl.trim());
      fd.append('section_id', formSection || selectedSection);
      fd.append('topic_id', formTopic || '');
      const licVal = license.proprietary ? 'Proprietary' : license.paid ? 'Paid' : license.public ? 'Public' : '';
      fd.append('license', licVal);
      fd.append('notify_type', notifyType);
      if (modalMode === 'add') {
        fd.append('academic_batch_id', String(selectedBatch || 0));
        fd.append('semester_id', String(selectedTerm || 0));
        fd.append('course_id', String(selectedCourse || 0));
        fd.append('created_by', String(userId));
        await axiosInstance.post('/api/v1/material/create_material', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Material uploaded successfully!');
      } else if (modalMode === 'edit' && selectedMaterial) {
        await axiosInstance.put(`/api/v1/material/update_material/${selectedMaterial.mat_id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Material updated successfully!');
      }
      // Capture the section before closeModal() resets it
      const effectiveSectionId = formSection || selectedSection;
      closeModal();
      // Sync the page filter and refresh the table
      if (effectiveSectionId) {
        setSelectedSection(effectiveSectionId);
        const r: any = await axiosInstance.post('/api/v1/material/material_list', {
          academic_batch_id: Number(selectedBatch) || 0,
          semester_id: Number(selectedTerm) || 0,
          course_id: Number(selectedCourse) || 0,
          section_id: Number(effectiveSectionId),
        });
        const items = r.data?.data ?? r.data;
        const fetched = Array.isArray(items) ? items : [];
        setMaterials(fetched);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save material.');
    } finally { setSaving(false); }
  };

  const filtered = materials.filter(m =>
    m.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const pageData = filtered.slice((currentPage - 1) * showEntries, currentPage * showEntries);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const end = Math.min(currentPage * showEntries, filtered.length);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Manage Share Materials</h1>
        </div>

        <div className="p-4">
          {/* Filter Row */}
          <div className="grid grid-cols-5 gap-3 mb-1 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Curriculum <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
                disabled={loadingBatch}
              >
                <option value="">{loadingBatch ? 'Loading...' : 'Select Curriculum'}</option>
                {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_desc} {c.academic_year || `(${c.academic_batch_code})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setCurrentPage(1); }}
                disabled={!selectedBatch || loadingTerm}
              >
                <option value="">{loadingTerm ? 'Loading...' : 'Select Term'}</option>
                {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.semester} - {t.semester_desc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setCurrentPage(1); }}
                disabled={!selectedTerm || loadingCourse}
              >
                <option value="">{loadingCourse ? 'Loading...' : 'Select Course'}</option>
                {courses.map(c => <option key={c.crs_id} value={c.crs_id}>{c.crs_title} ({c.crs_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setCurrentPage(1); }}
                disabled={!selectedTerm || loadingSection}
              >
                <option value="">{loadingSection ? 'Loading...' : 'Select Section'}</option>
                {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section}</option>)}
              </select>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={openAdd}
                className="bg-[#1a73e8] text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 whitespace-nowrap"
              >Add Material ⊞</button>
              <button className="text-blue-600 text-xs hover:underline">↓ Import Share Materials</button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex justify-between items-center mb-3 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select className="border border-gray-300 rounded px-2 py-0.5 text-sm" value={showEntries} onChange={e => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Search:</span>
              <input type="text" className="border border-gray-300 rounded px-2 py-0.5 text-sm w-40" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2 w-8"><input type="checkbox" /></th>
                  <th className="px-3 py-2 text-left">Sl No. ⇅</th>
                  <th className="px-3 py-2 text-left">File / Link Name ⇅</th>
                  <th className="px-3 py-2 text-left">Topic(s) ⇅</th>
                  <th className="px-3 py-2 text-left">License ⇅</th>
                  <th className="px-3 py-2 text-left">Share Date ⇅</th>
                  <th className="px-3 py-2 text-left">View Students</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : pageData.length > 0 ? pageData.map((m, idx) => (
                  <tr key={m.mat_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><input type="checkbox" /></td>
                    <td className="px-3 py-2">{(currentPage - 1) * showEntries + idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-blue-700">
                      {/* If URL type, make it a clickable link */}
                      {isUrlMaterial(m) && (m.url || m.docment_url) ? (
                        <a href={m.url || m.docment_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {m.document_name}
                        </a>
                      ) : m.document_name}
                      {isUrlMaterial(m) && <span className="ml-1 text-xs text-teal-600 font-normal">[URL]</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{getTopicLabel(m)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{m.license || '—'}</td>
                    <td className="px-3 py-2 text-xs">{getShareDate(m)}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => openViewStudents(m)} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded hover:bg-teal-200">View</button>
                    </td>
                    <td className="px-3 py-2">
                       <button onClick={() => openEdit(m)} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 mr-1">Edit</button>
                       <button onClick={() => openShare(m)} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 mr-1">Share</button>
                       {m.mat_id > 0 && !isUrlMaterial(m) ? (
                         <button
                           onClick={() => {
                             const baseURL = axiosInstance.defaults.baseURL || "";
                             window.open(`${baseURL}/api/v1/material/download_material/${m.mat_id}`, '_blank');
                           }}
                           className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200 mr-1"
                         >Download</button>
                       ) : m.mat_id > 0 && isUrlMaterial(m) && (m.url || m.docment_url) ? (
                         <a href={m.url || m.docment_url} target="_blank" rel="noopener noreferrer"
                           className="text-xs inline-block bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200 mr-1">Open URL</a>
                       ) : m.mat_id < 0 ? (
                         <span className="text-xs text-gray-300 px-2 py-0.5 mr-1">Demo</span>
                       ) : null}
                       <button onClick={() => handleDelete(m)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No data available in table</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
            <span>Showing {start} to {end} of {filtered.length} entries</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="bg-[#1f3a4f] text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">{modalMode === 'add' ? 'Add materials to share' : 'Edit Material'}</span>
              <button onClick={closeModal} className="text-white text-xl hover:opacity-75">&times;</button>
            </div>

            {/* Info Bar */}
            <div className="bg-gray-100 border-b border-gray-200 px-5 py-2 flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-700">
              <span><span className="font-semibold text-gray-500">Curriculum: </span>
                <span className="text-blue-700 font-medium">{selBatchLabel ? `${selBatchLabel.academic_batch_desc}` : '—'}</span>
              </span>
              <span><span className="font-semibold text-gray-500">Term: </span>
                <span className="text-blue-700 font-medium">{selTermLabel ? `${selTermLabel.semester} - ${selTermLabel.semester_desc}` : '—'}</span>
              </span>
              <span><span className="font-semibold text-gray-500">Course: </span>
                <span className="text-blue-700 font-medium">{selCourseLabel ? `${selCourseLabel.crs_code} - ${selCourseLabel.crs_title}` : '—'}</span>
              </span>
              <span><span className="font-semibold text-gray-500">Section: </span>
                <span className="text-blue-700 font-medium">{sections.find(s => String(s.section_id) === (formSection || selectedSection))?.section || '—'}</span>
              </span>
            </div>

            {/* Document / URL Toggle */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="docType" checked={docType === 'document'} onChange={() => setDocType('document')} className="accent-[#1f3a4f]" />
                Document
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="docType" checked={docType === 'url'} onChange={() => setDocType('url')} className="accent-[#1f3a4f]" />
                Url
              </label>
            </div>

            <div className="p-5 space-y-5">
              {/* Material Basic Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b border-gray-200">Material Basic Details</h3>
                <div className="space-y-4">
                  {/* File/Link Name */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0">File/Link name: <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter Document / URL Name"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                    />
                  </div>

                  {/* File / URL Input */}
                  {docType === 'document' ? (
                    <div className="flex items-start gap-4">
                      <label className="text-sm text-gray-700 w-36 text-right shrink-0 pt-2">Choose File: <span className="text-red-500">*</span></label>
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            placeholder="File Name(s)"
                            value={formFiles.length > 0 ? formFiles.map(f => f.name).join(', ') : (modalMode === 'edit' && selectedMaterial?.file_name) || ''}
                            className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm bg-gray-50"
                          />
                          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-r cursor-pointer whitespace-nowrap">
                            Browse
                            <input type="file" className="hidden"
                              multiple={modalMode === 'add'}
                              accept=".jpeg,.jpg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf"
                              onChange={e => setFormFiles(Array.from(e.target.files || []))}
                            />
                          </label>
                        </div>
                        <div className="mt-2 text-xs text-orange-600 space-y-0.5">
                          <p>Note:</p>
                          <p>1. Only .jpeg, .jpg, .png, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .pdf file formats are allowed.</p>
                          <p>2. Maximum file size is 5MB.</p>
                          <p>3. Maximum no.of files allowed is 3.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-700 w-36 text-right shrink-0">URL: <span className="text-red-500">*</span></label>
                      <input
                        type="url"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://example.com/resource"
                        value={formUrl}
                        onChange={e => setFormUrl(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Section */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0">Section: <span className="text-red-500">*</span></label>
                    <select
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={formSection || selectedSection}
                      onChange={e => setFormSection(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section}</option>)}
                    </select>
                  </div>

                  {/* Topic — loaded dynamically from selected course */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0">Topic:</label>
                    <select
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                      value={formTopic}
                      onChange={e => setFormTopic(e.target.value)}
                      disabled={loadingTopics}
                    >
                      <option value="">{loadingTopics ? 'Loading topics...' : 'Select Topic'}</option>
                      {formTopics.map((t: any) => (
                        <option key={t.topic_id} value={t.topic_id}>{t.topic_title} {t.topic_code ? `(${t.topic_code})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Information */}
                  <div className="flex items-start gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0 pt-2">Addition Information</label>
                    <div className="flex-1">
                      <textarea
                        rows={3}
                        maxLength={3000}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="Description"
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                      />
                      <div className="text-right text-xs text-gray-400 mt-0.5">{formDesc.length} / 3000</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advance Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b border-gray-200">Advance Settings</h3>
                <div className="space-y-4">
                  {/* Notify Students */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0">Notify Students: <span className="text-red-500">*</span></label>
                    <div className="flex rounded overflow-hidden border border-gray-300">
                      <button
                        onClick={() => setNotifyType('pre')}
                        className={`px-4 py-1.5 text-sm font-medium ${notifyType === 'pre' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >Pre-reading</button>
                      <button
                        onClick={() => setNotifyType('post')}
                        className={`px-4 py-1.5 text-sm font-medium border-l border-gray-300 ${notifyType === 'post' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >Post-reading</button>
                    </div>
                  </div>

                  {/* License */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 w-36 text-right shrink-0"> </label>
                    <div className="flex items-center gap-4">
                      {(['proprietary', 'paid', 'public'] as const).map(key => (
                        <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={license[key]}
                            onChange={e => setLicense({ proprietary: false, paid: false, public: false, [key]: e.target.checked })}
                            className="accent-[#1f3a4f] w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-1"
              >
                {saving ? '⟳ Saving...' : '💾 Save'}
              </button>
              <button
                onClick={closeModal}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {modalMode === 'share' && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[60] overflow-y-auto py-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 my-auto">
            <div className="bg-white text-gray-800 px-5 py-3 rounded-t-lg flex justify-between items-center border-b">
              <span className="font-semibold text-[15px]">Manage Student Information</span>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>

            <div className="p-4">
              {/* Info Block */}
              <div className="border border-gray-200 rounded-sm mb-4">
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 text-xs">
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Curriculum:</span>
                    <span className="text-gray-800">{curriculums.find(c => String(c.academic_batch_id) === selectedBatch)?.academic_batch_desc || '—'}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Term:</span>
                    <span className="text-gray-800">{terms.find(t => String(t.semester_id) === selectedTerm)?.semester} - {terms.find(t => String(t.semester_id) === selectedTerm)?.semester_desc}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Material Name:</span>
                    <span className="text-gray-800 font-medium">{selectedMaterial.document_name}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Section:</span>
                    <span className="text-gray-800">{sections.find(s => String(s.section_id) === selectedSection)?.section || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mb-2">
                <input type="text" placeholder="Search by USN or Student Name"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-500"
                  value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)} />
              </div>

              <div className="border border-gray-200 rounded-sm overflow-auto max-h-[50vh]">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 text-gray-700">
                    <tr>
                      <th className="p-2 w-10 border-r border-gray-200">
                        <input type="checkbox" className="accent-[#1f3a4f] mt-1"
                          checked={shareStudents.length > 0 && shareStudents.every(s => selectedStudentIds.has(s.student_id))}
                          onChange={() => {
                            const all = shareStudents.every(s => selectedStudentIds.has(s.student_id));
                            setSelectedStudentIds(all ? new Set() : new Set(shareStudents.map(s => s.student_id)));
                          }} />
                      </th>
                      <th className="p-2 border-r border-gray-200 font-semibold">USN</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Student Name</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingStudents ? (
                      <tr><td colSpan={4} className="p-4 text-gray-500 text-sm">Loading students...</td></tr>
                    ) : shareStudents.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-gray-400 text-sm">No students found for the selected section.</td></tr>
                    ) : shareStudents.filter(s =>
                        (s.usno || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        (s.name || `${s.first_name} ${s.last_name}`).toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).map(s => {
                        const isShared = selectedStudentIds.has(s.student_id);
                        const alreadyMapped = sharedStudentUsns.has(s.usno);
                        const statusText = alreadyMapped ? 'Already Shared' : 'Not Shared';
                        const statusColor = alreadyMapped ? 'text-green-600' : 'text-gray-500';
                        return (
                          <tr key={s.student_id} className="hover:bg-gray-50">
                            <td className="p-2 border-r border-gray-200">
                              <input type="checkbox" className="accent-[#1f3a4f]" checked={isShared}
                                onChange={() => {
                                  const next = new Set(selectedStudentIds);
                                  if (next.has(s.student_id)) next.delete(s.student_id);
                                  else next.add(s.student_id);
                                  setSelectedStudentIds(next);
                                }} />
                            </td>
                            <td className="p-2 border-r border-gray-200 text-gray-600">{s.usno}</td>
                            <td className="p-2 border-r border-gray-200 text-gray-800 text-left pl-3">{s.name || `${s.first_name} ${s.last_name}`.trim()}</td>
                            <td className="p-2 border-r border-gray-200"><span className={statusColor}>{statusText}</span></td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 rounded-b-lg flex justify-end gap-2 text-sm border-t">
              <button onClick={handleShare} disabled={saving} className="bg-[#6b9cce] hover:bg-[#5a8bbd] text-white px-5 py-1.5 rounded">
                {saving ? 'Sharing...' : 'Share'}
              </button>
              <button onClick={closeModal} disabled={saving} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-1.5 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Students Modal */}
      {modalMode === 'viewStudents' && selectedMaterial && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Students — {selectedMaterial.document_name}</span>
              <button onClick={closeModal} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {mappedStudents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No students have been shared this material yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Sl No.</th><th className="px-3 py-2 text-left">USN</th><th className="px-3 py-2 text-left">Name</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {mappedStudents.map((s, i) => <tr key={i} className="hover:bg-gray-50"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{s.student_usn}</td><td className="px-3 py-2">{s.student_name}</td></tr>)}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShareMaterialsPage;
