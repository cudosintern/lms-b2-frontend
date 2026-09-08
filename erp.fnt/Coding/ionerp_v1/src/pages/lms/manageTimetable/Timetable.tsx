import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTimetable } from './hooks/useTimetable';
import './Timetable.css';

interface TimetableProps {
  orgId?: number;
}

interface ScheduleFormData {
  tt_detail_id: number;
  days: Record<string, { enabled: boolean; start_time: string; end_time: string }>;
  crs_mode: number[];
  crs_id: number[];
  batch: string[];
}

interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface CheckboxMultiSelectProps {
  placeholder: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const CheckboxMultiSelect: React.FC<CheckboxMultiSelectProps> = ({
  placeholder,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
}) => {
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((selected) => selected !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div className="checkbox-multiselect">
      <button
        type="button"
        className="checkbox-multiselect-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{selectedLabels.length ? selectedLabels.join(', ') : placeholder}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="checkbox-multiselect-menu">
          {options.length ? options.map((option) => (
            <React.Fragment key={option.value}>
              {option.group && option.group !== options[options.indexOf(option) - 1]?.group && (
                <div className="checkbox-multiselect-group">{option.group}</div>
              )}
              <label className="checkbox-multiselect-option">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            </React.Fragment>
          )) : <span className="checkbox-multiselect-empty">No options available</span>}
        </div>
      )}
    </div>
  );
};

const getTodayInputDate = (): string => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
};

const toInputDate = (value: string): string => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};

const fromInputDate = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};

const getNextAvailableTimetableDate = (
  options: Array<{ tt_detail_id: number | null; label: string }> = [],
): string => {
  const latestEndDate = options.reduce<Date | null>((latest, option) => {
    if (!option.tt_detail_id) return latest;

    const dates = option.label.match(/(\d{2})-(\d{2})-(\d{4})/g);
    const endDate = dates?.[1];
    if (!endDate) return latest;

    const [day, month, year] = endDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return !latest || parsedDate > latest ? parsedDate : latest;
  }, null);

  if (!latestEndDate) return getTodayInputDate();

  latestEndDate.setDate(latestEndDate.getDate() + 1);
  const nextDate = [
    latestEndDate.getFullYear(),
    String(latestEndDate.getMonth() + 1).padStart(2, '0'),
    String(latestEndDate.getDate()).padStart(2, '0'),
  ].join('-');

  return nextDate > getTodayInputDate() ? nextDate : getTodayInputDate();
};

const toInputTime = (value: string): string => {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';

  let hours = Number(match[1]);
  if (match[3].toUpperCase() === 'AM') hours = hours === 12 ? 0 : hours;
  if (match[3].toUpperCase() === 'PM') hours = hours === 12 ? 12 : hours + 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
};

const fromInputTime = (value: string): string => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return '';

  const hours = Number(match[1]);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${match[2]} ${period}`;
};

const getTimeInMinutes = (value: string): number | null => {
  const inputTime = toInputTime(value);
  const match = inputTime.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getTimeHour = (value: string): string => toInputTime(value).slice(0, 2);

const getFiveMinuteTimeOptions = (
  startTime: string,
  endTime: string,
): string[] => {
  const start = getTimeInMinutes(startTime);
  const end = getTimeInMinutes(endTime);
  if (start === null || end === null || end < start) return [];

  const options: string[] = [];
  for (let minutes = start; minutes <= end; minutes += 5) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    options.push(fromInputTime(time));
  }
  return options;
};

const WEEKDAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const Timetable: React.FC<TimetableProps> = ({ orgId }) => {
  const {
    loading,
    timetable,
    curriculums,
    terms,
    sections,
    courses,
    batches,
    formState,
    setFormState,
    fetchCurriculums,
    fetchTerms,
    fetchSections,
    fetchCourses,
    fetchBatches,
    generateTimetable,
    loadTimetable,
    saveClasses,
    deleteClass,
    updateClass,
    deleteTimetable,
    resetTimetableDate,
    checkOverlap,
    compensateClass,
    downloadTemplate,
    exportTimetable,
    exportTimetablePdf,
    viewTimetable,
    resetForm,
    clearTimetable,
  } = useTimetable();

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCompensateModal, setShowCompensateModal] = useState(false);
  const [showCompensateDateModal, setShowCompensateDateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetDateModal, setShowResetDateModal] = useState(false);
  const [resetEndDate, setResetEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [viewContent, setViewContent] = useState<string>('');
  const [editFormData, setEditFormData] = useState<any>({});
  const [scheduleFormData, setScheduleFormData] =
  useState<ScheduleFormData>({
    tt_detail_id: 0,
    days: {},
    crs_mode: [],
    crs_id: [],
    batch: [],
  });
  const [compensateFormData, setCompensateFormData] = useState<any>({
    from_val: 0,
    to_val: 0,
    confirm: 0
  });
  const [compensateDateFormData, setCompensateDateFormData] = useState<any>({
    from_date: '',
    to_date: '',
    confirm_date: 0
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [openMultiSelect, setOpenMultiSelect] = useState<string | null>(null);
  const [newTimetableMinDate, setNewTimetableMinDate] = useState(getTodayInputDate);
  const fetchCurriculumsRef = useRef(fetchCurriculums);

  // The service object is recreated by the hook, so keep the most recent action
  // in a ref. This prevents the initial-load effect from running after every
  // loading-state update.
  fetchCurriculumsRef.current = fetchCurriculums;

  // Handle curriculum change
  const handleCurriculumChange = (crclmId: number) => {
    setNewTimetableMinDate(getTodayInputDate());
    setFormState((prev: any) => ({
      ...prev,
      curriculum: crclmId,
      term: 0,
      section: 0,
      timetable: 0,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    }));

    if (crclmId) {
      fetchTerms(crclmId);
    }
  };

  // Handle term change
  const handleTermChange = (termId: number) => {
    setNewTimetableMinDate(getTodayInputDate());
    setFormState(prev => ({
      ...prev,
      term: termId,
      section: 0,
      timetable: 0,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    }));
    if (formState.curriculum && termId) {
      fetchSections(formState.curriculum, termId);
    }
  };

  // Handle section change
  const handleSectionChange = (secId: number) => {
    setNewTimetableMinDate(getTodayInputDate());
    setFormState(prev => ({
      ...prev,
      section: secId,
      timetable: 0,
    }));
    if (formState.curriculum && formState.term && secId) {
      loadTimetable({
        // Send the current API contract and legacy keys while timetable APIs
        // are being migrated. FastAPI ignores the unused compatibility keys.
        academic_batch_id: formState.curriculum,
        semester_id: formState.term,
        section_id: secId,
        crclm_id: formState.curriculum,
        term_id: formState.term,
        sec_id: secId,
      });
    }
  };

  // Handle timetable selection
  const handleTimetableChange = (ttId: number) => {
    if (!ttId) {
      setNewTimetableMinDate(getNextAvailableTimetableDate(timetable?.tt_options));
      clearTimetable();
      setFormState(prev => ({
        ...prev,
        timetable: 0,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        lmsRegBypFlag: 0,
      }));
      return;
    }

    setFormState(prev => ({ ...prev, timetable: ttId }));
    loadTimetable({ tt_detail_id: ttId });
  };

  // Handle generate timetable
  const handleGenerateTimetable = async () => {
    const startDate = toInputDate(formState.startDate);
    const endDate = toInputDate(formState.endDate);
    const minimumStartDate = newTimetableMinDate;

    if (startDate && startDate < minimumStartDate) {
      alert('Start date must be after the latest timetable end date');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      alert('End date cannot be earlier than the start date');
      return;
    }

    const startTime = getTimeInMinutes(formState.startTime);
    const endTime = getTimeInMinutes(formState.endTime);
    if (startTime !== null && endTime !== null && endTime <= startTime) {
      alert('End time must be later than the start time');
      return;
    }

    try {
      await generateTimetable();
    } catch (error: any) {
      alert(error.message || 'Failed to generate timetable');
    }
  };

  // Handle edit class
  const handleEditClass = (classData: any) => {
    setSelectedClass(classData);
    setEditFormData({
      time_table_id: classData.time_table_id,
      tt_detail_id: classData.tt_detail_id,
      crs_id: classData.crs_id,
      old_crs_id: classData.crs_id,
      class_start_time: classData.class_start_time,
      class_end_time: classData.class_end_time,
      day: classData.week_day_name,
    });
    setShowEditModal(true);
  };

  // Handle delete class
  const handleDeleteClass = async (timeTableId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(timeTableId);
      } catch (error: any) {
        alert(error.message || 'Failed to delete class');
      }
    }
  };

  // Handle delete timetable
  const handleDeleteTimetable = async (password: string) => {
    if (!timetable?.tt_detail_id) return;
    try {
      await deleteTimetable(timetable.tt_detail_id, password);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      alert(error.message || 'Failed to delete timetable');
    }
  };

  // Handle view timetable
  const handleViewTimetable = async () => {
    if (!timetable?.tt_detail_id) return;
    try {
      const response = await viewTimetable(timetable.tt_detail_id);
      if (response.success && response.data) {
        setViewContent(response.data.table_vw);
        setShowViewModal(true);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to view timetable');
    }
  };

  // Handle export timetable
  const handleExportTimetable = async () => {
    if (!timetable?.tt_detail_id) return;
    try {
      await exportTimetable(timetable.tt_detail_id);
      toast.success('Timetable exported successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to export timetable');
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    if (!timetable?.tt_detail_id) return;
    try {
      await downloadTemplate(timetable.tt_detail_id);
    } catch (error: any) {
      alert(error.message || 'Failed to download template');
    }
  };

  // Handle schedule class save
  const handleScheduleClassSave = async () => {
    const selectedDays = Object.entries(scheduleFormData.days)
      .filter(([, details]) => details.enabled);

    if (!scheduleFormData.crs_mode.length || !scheduleFormData.crs_id.length) {
      alert('Select at least one course type and course');
      return;
    }

    if (!selectedDays.length) {
      alert('Select at least one day');
      return;
    }

    const invalidDay = selectedDays.find(([, details]) => {
      const startTime = getTimeInMinutes(details.start_time);
      const endTime = getTimeInMinutes(details.end_time);
      return startTime === null || endTime === null || endTime <= startTime;
    });

    if (invalidDay) {
      alert(`Enter a valid end time later than the start time for ${invalidDay[0]}`);
      return;
    }

    try {
      await saveClasses(scheduleFormData);
      setShowScheduleModal(false);
      setScheduleFormData({
        tt_detail_id: 0,
        days: {},
        crs_mode: [],
        crs_id: [],
        batch: [],
      });
    } catch (error: any) {
      alert(error.message || 'Failed to schedule class');
    }
  };

  // Handle edit class update
  const handleEditClassUpdate = async () => {
    try {
      await updateClass(editFormData);
      setShowEditModal(false);
      setSelectedClass(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update class');
    }
  };

  // Handle compensate class
  const handleCompensateClass = async () => {
    const { from_val, to_val, confirm } = compensateFormData;
    if (!from_val || !to_val) {
      alert('Select both the source and destination day');
      return;
    }

    if (from_val === to_val) {
      alert('Source and destination day must be different');
      return;
    }

    try {
      const data = {
        comp_tt_detail_id: timetable?.tt_detail_id || 0,
        from_val,
        to_val,
        term: formState.term,
        section: formState.section,
        confirm,
      };
      const response = await compensateClass(data);

      if (response.success && response.data?.popup) {
        const shouldOverwrite = window.confirm(
          response.data.message || 'Classes already exist for the selected day. Continue?',
        );
        if (shouldOverwrite) {
          const confirmedResponse = await compensateClass({ ...data, confirm: 1 });
          if (confirmedResponse.success && confirmedResponse.data?.status) {
            toast.success('Classes copied successfully');
          }
          setShowCompensateModal(false);
          setCompensateFormData({ from_val: 0, to_val: 0, confirm: 0 });
          return;
        }
      }

      if (response.success && response.data?.status) {
        toast.success('Classes copied successfully');
        setShowCompensateModal(false);
        setCompensateFormData({ from_val: 0, to_val: 0, confirm: 0 });
      }
    } catch (error: any) {
      alert(error.message || 'Failed to compensate class');
    }
  };

  // Get curriculum name
  const getCurriculumName = () => {
    return timetable?.tt_details?.crclm_name || '';
  };

  const getTermName = () => {
    return timetable?.tt_details?.term_name || '';
  };

  const getSectionName = () => {
    return timetable?.tt_details?.mt_details_name || '';
  };

  const closeScheduleModal = () => {
    setOpenMultiSelect(null);
    setScheduleFormData((previous) => ({
      ...previous,
      crs_mode: [],
      crs_id: [],
      batch: [],
    }));
    setShowScheduleModal(false);
  };

  const handleExportTimetablePdf = async () => {
    if (!timetable?.tt_detail_id) return;

    try {
      await exportTimetablePdf({
        expo_tt_detail_id: timetable.tt_detail_id,
      });
      toast.success('Timetable PDF exported successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to export timetable PDF');
    }
  };

  const handleResetTimetableDate = async () => {
    if (!timetable?.tt_detail_id) return;

    const startDate = toInputDate(timetable.tt_start_date || '');
    const endDate = toInputDate(resetEndDate);
    if (!endDate || (startDate && endDate < startDate)) {
      alert('End date cannot be earlier than the timetable start date');
      return;
    }

    try {
      const response = await resetTimetableDate(
        timetable.tt_detail_id,
        resetEndDate,
      );
      if (response.success) {
        toast.success('Timetable dates reset successfully');
        setShowResetDateModal(false);
        setResetEndDate('');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to reset timetable dates');
    }
  };

  const isExistingTimetable = Boolean(formState.timetable);
  const orderedWeekDays = [...(timetable?.week_days || [])].sort(
    (first, second) => WEEKDAY_ORDER.indexOf(first) - WEEKDAY_ORDER.indexOf(second),
  );
  const hourlyTimeSlots = (timetable?.time_slots || []).filter(
    (slot, index, slots) => index === 0 || getTimeHour(slot) !== getTimeHour(slots[index - 1]),
  );
  const isTheorySelected = scheduleFormData.crs_mode.includes(0);
  const scheduleTimeOptions = getFiveMinuteTimeOptions(
    timetable?.tt_start_time || formState.startTime,
    timetable?.tt_end_time || formState.endTime,
  );
  const scheduleStartTimeOptions = scheduleTimeOptions.slice(0, -1);
  const getAvailableEndTimeOptions = (startTime: string): string[] => {
    const startMinutes = getTimeInMinutes(startTime);
    return startMinutes === null
      ? scheduleTimeOptions
      : scheduleTimeOptions.filter((time) => (getTimeInMinutes(time) || 0) > startMinutes);
  };

  // Initialize page data
  useEffect(() => {
    fetchCurriculumsRef.current(orgId);
  }, [orgId]);

  // Initialize schedule days
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    if (timetable?.week_days) {
      const days: any = {};
      timetable.week_days.forEach((day: string) => {
        days[day] = {
          enabled: true,
          start_time: '',
          end_time: '',
        };
      });
    //   setScheduleFormData(prev => ({ ...prev, days, tt_detail_id: timetable.tt_detail_id || 0 }));
    setScheduleFormData((prev: ScheduleFormData) => ({ ...prev, days, tt_detail_id: timetable?.tt_detail_id || 0 }));
    }
  }, [timetable]);

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h2>Manage Timetable</h2>
        <div className="header-actions">
          <button
            className="btn btn-warning"
            onClick={handleExportTimetablePdf}
            disabled={!timetable?.tt_detail_id}
          >
            <i className="fas fa-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="timetable-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Curriculum <span className="required">*</span></label>
            <select
              className="form-control"
              value={formState.curriculum}
              onChange={(e) => handleCurriculumChange(Number(e.target.value))}
            >
              <option value={0}>Select Curriculum</option>
              {curriculums.map((curriculum) => (
                <option key={curriculum.academic_batch_id} value={curriculum.academic_batch_id}>
                  {curriculum.academic_batch_desc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Term <span className="required">*</span></label>
            <select
              className="form-control"
              value={formState.term}
              onChange={(e) => handleTermChange(Number(e.target.value))}
              disabled={!formState.curriculum}
            >
              <option value={0}>Select Term</option>
              {terms.map((term) => (
                <option key={term.crclm_term_id} value={term.crclm_term_id}>
                  {term.term_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Section <span className="required">*</span></label>
            <select
              className="form-control"
              value={formState.section}
              onChange={(e) => handleSectionChange(Number(e.target.value))}
              disabled={!formState.term}
            >
              <option value={0}>Select Section</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  {section.section_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Timetable</label>
            <select
              className="form-control"
              value={formState.timetable}
              onChange={(e) => handleTimetableChange(Number(e.target.value))}
              disabled={!formState.section}
            >
              <option value={0}>New Timetable</option>
              {timetable?.tt_options?.map((opt) => (
                <option key={opt.tt_detail_id || 'new'} value={opt.tt_detail_id || 0}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date <span className="required">*</span></label>
            <input
              type="date"
              className="form-control"
              min={newTimetableMinDate}
              value={toInputDate(formState.startDate)}
              disabled={isExistingTimetable}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                startDate: fromInputDate(e.target.value),
                endDate: toInputDate(prev.endDate) < e.target.value ? '' : prev.endDate,
              }))}
            />
          </div>

          <div className="filter-group">
            <label>End Date <span className="required">*</span></label>
            <input
              type="date"
              className="form-control"
              min={toInputDate(formState.startDate) || newTimetableMinDate}
              value={toInputDate(formState.endDate)}
              disabled={isExistingTimetable}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                endDate: fromInputDate(e.target.value),
              }))}
            />
          </div>

          <div className="filter-group">
            <label>Start Time <span className="required">*</span></label>
            <input
              type="time"
              className="form-control"
              value={toInputTime(formState.startTime)}
              disabled={isExistingTimetable}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                startTime: fromInputTime(e.target.value),
              }))}
            />
          </div>

          <div className="filter-group">
            <label>End Time <span className="required">*</span></label>
            <input
              type="time"
              className="form-control"
              value={toInputTime(formState.endTime)}
              disabled={isExistingTimetable}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                endTime: fromInputTime(e.target.value),
              }))}
            />
          </div>

          <div className="filter-group">
            <label>Method</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="regBypFlag"
                  value={0}
                  checked={formState.lmsRegBypFlag === 0}
                  onChange={() => setFormState(prev => ({ ...prev, lmsRegBypFlag: 0 }))}
                />
                Regular
              </label>
              <label>
                <input
                  type="radio"
                  name="regBypFlag"
                  value={1}
                  checked={formState.lmsRegBypFlag === 1}
                  onChange={() => setFormState(prev => ({ ...prev, lmsRegBypFlag: 1 }))}
                />
                Bypass
              </label>
            </div>
          </div>

          <div className="filter-group filter-actions">
            <button
              className="btn btn-primary"
              onClick={handleGenerateTimetable}
              disabled={loading || isExistingTimetable}
              title={isExistingTimetable ? 'Select New Timetable to generate another timetable' : undefined}
            >
              {loading ? 'Generating...' : 'Generate Timetable'}
              <i className="fas fa-table"></i>
            </button>
          </div>
        </div>

        {/* Timetable Info */}
        {timetable && timetable.tt_detail_id && (
          <div className="timetable-info">
            <div className="info-actions">
              <button
                className="btn btn-sm btn-success"
                onClick={() => setShowCompensateModal(true)}
              >
                Copy Class Day
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => {
                  setResetEndDate(timetable.tt_end_date || '');
                  setShowResetDateModal(true);
                }}
              >
                Reset Dates
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Timetable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      {timetable && timetable.classes && (
        <div className="timetable-grid-wrapper">
          <div className="grid-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setOpenMultiSelect(null);
                setShowScheduleModal(true);
              }}
            >
              <i className="fas fa-plus"></i> Schedule Class
            </button>
          </div>
          
          <div className="timetable-grid">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}></th>
                  {orderedWeekDays.map((day) => (
                    <th key={day} className="text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourlyTimeSlots.map((slot) => {
                  return (
                    <tr key={slot}>
                      <td className="time-slot-cell">{slot}</td>
                      {orderedWeekDays.map((day) => {
                        const classesForHour = timetable.classes.filter(
                          (classItem) => (
                            classItem.week_day_name === day
                            && getTimeHour(classItem.class_start_time) === getTimeHour(slot)
                          ),
                        );
                        return (
                          <td key={`${day}-${slot}`}>
                            {classesForHour.map((classData) => (
                              <div
                                key={classData.time_table_id}
                                className="class-cell"
                                title={`${classData.crs_code} - ${classData.class_start_time} to ${classData.class_end_time}`}
                              >
                                <div className="class-code">{classData.crs_code}</div>
                                <div className="class-time">
                                  {classData.class_start_time} - {classData.class_end_time}
                                </div>
                                {classData.batch_names && classData.batch_names.length > 0 && (
                                  <div className="class-batch">
                                    {classData.batch_names.join(', ')}
                                  </div>
                                )}
                                {classData.course_instructor && (
                                  <div className="class-person">
                                    <span>Instructor:</span> {classData.course_instructor}
                                  </div>
                                )}
                                {classData.crs_owner && (
                                  <div className="class-person">
                                    <span>Owner:</span> {classData.crs_owner}
                                  </div>
                                )}
                                {classData.extra_class_flag === 2 && (
                                  <div className="class-copy-badge">Copy</div>
                                )}
                                <div className="class-actions">
                                  <button
                                    className="icon-action"
                                    onClick={() => handleEditClass(classData)}
                                    disabled={classData.attendance_taken === 1}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="icon-action icon-action-danger"
                                    onClick={() => handleDeleteClass(classData.time_table_id)}
                                    disabled={classData.attendance_taken === 1}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================
          SCHEDULE CLASS MODAL
          ================================================================ */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg schedule-class-modal">
            <div className="modal-header">
              <h3>Schedule Class</h3>
              <button className="close-btn" onClick={closeScheduleModal}>×</button>
            </div>
            <div className="modal-body schedule-class-body">
              <form>
                <div className={`schedule-course-grid ${isTheorySelected ? 'schedule-course-grid--without-batch' : ''}`}>
                  <div className="form-group">
                    <label>Course Type <span className="required">*</span></label>
                    <CheckboxMultiSelect
                      placeholder="Select course type"
                      isOpen={openMultiSelect === 'courseType'}
                      onToggle={() => setOpenMultiSelect((open) => open === 'courseType' ? null : 'courseType')}
                      value={scheduleFormData.crs_mode.map(String)}
                      options={[
                        { value: '0', label: 'Theory' },
                        { value: '1', label: 'Lab / Project Work / Others' },
                        { value: '2', label: 'Theory with Lab' },
                        { value: '3', label: 'Theory with Tutorial' },
                      ]}
                      onChange={(values) => {
                        // Only one course type can be scheduled at a time.
                        const modes = values.length ? [Number(values[values.length - 1])] : [];
                        setScheduleFormData((prev) => ({ ...prev, crs_mode: modes, crs_id: [], batch: [] }));
                        if (modes.length) fetchCourses(formState.term, modes);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Course <span className="required">*</span></label>
                    <CheckboxMultiSelect
                      placeholder="Select course"
                      isOpen={openMultiSelect === 'course'}
                      onToggle={() => setOpenMultiSelect((open) => open === 'course' ? null : 'course')}
                      value={scheduleFormData.crs_id.map(String)}
                      options={(scheduleFormData.crs_mode.length ? courses : []).map((course) => ({
                        value: String(course.crs_id),
                        label: `${course.crs_code} - ${course.crs_title.substring(0, 50)}`,
                      }))}
                      onChange={(values) => {
                        const courseIds = values.map(Number);
                        setScheduleFormData((prev) => ({ ...prev, crs_id: courseIds, batch: [] }));
                        if (courseIds.length && formState.section) {
                          fetchBatches(formState.curriculum, courseIds, formState.section);
                        }
                      }}
                    />
                  </div>
                  {!isTheorySelected && scheduleFormData.crs_id.length > 0 && (
                    <div className="form-group">
                      <label>Batch</label>
                      <CheckboxMultiSelect
                        placeholder="Select batch"
                        isOpen={openMultiSelect === 'batch'}
                        onToggle={() => setOpenMultiSelect((open) => open === 'batch' ? null : 'batch')}
                        value={scheduleFormData.batch}
                        options={batches.map((batch) => ({
                          value: `${batch.crs_id}|${batch.batch_id}`,
                          label: batch.batch_name,
                          group: batch.crs_code,
                        }))}
                        onChange={(values) => setScheduleFormData((prev) => ({ ...prev, batch: values }))}
                      />
                    </div>
                  )}
                </div>

                <div className="schedule-days">
                  <div className="days-header">
                    <div className="col-md-1">Day</div>
                    <div className="col-md-2">Start Time</div>
                    <div className="col-md-2">End Time</div>
                  </div>
                  {weekDays.map((day) => (
                    <div className="day-row" key={day}>
                      <div className="col-md-1">
                        <input
                          type="checkbox"
                          checked={scheduleFormData.days[day]?.enabled || false}
                          onChange={(e) => {
                            setScheduleFormData(prev => ({
                              ...prev,
                              days: {
                                ...prev.days,
                                [day]: {
                                  ...prev.days[day],
                                  enabled: e.target.checked,
                                  start_time: e.target.checked ? prev.days[day]?.start_time || '' : '',
                                  end_time: e.target.checked ? prev.days[day]?.end_time || '' : '',
                                }
                              }
                            }));
                          }}
                          disabled={!timetable?.week_days?.includes(day)}
                        />
                      </div>
                      <div className="col-md-1">{day}</div>
                      <div className="col-md-2">
                        <select
                          className="form-control"
                          value={scheduleFormData.days[day]?.start_time || ''}
                          onChange={(e) => {
                            const startTime = e.target.value;
                            setScheduleFormData(prev => ({
                              ...prev,
                              days: {
                                ...prev.days,
                                [day]: {
                                  ...prev.days[day],
                                  start_time: startTime,
                                  end_time: (getTimeInMinutes(prev.days[day]?.end_time || '') || 0)
                                    <= (getTimeInMinutes(startTime) || 0)
                                    ? ''
                                    : prev.days[day]?.end_time || '',
                                }
                              }
                            }));
                          }}
                          disabled={!scheduleFormData.days[day]?.enabled}
                        >
                          <option value="">Select time</option>
                          {scheduleStartTimeOptions.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <select
                          className="form-control"
                          value={scheduleFormData.days[day]?.end_time || ''}
                          onChange={(e) => {
                            setScheduleFormData(prev => ({
                              ...prev,
                              days: {
                                ...prev.days,
                                [day]: {
                                  ...prev.days[day],
                                  end_time: e.target.value,
                                }
                              }
                            }));
                          }}
                          disabled={!scheduleFormData.days[day]?.enabled}
                        >
                          <option value="">Select time</option>
                          {getAvailableEndTimeOptions(scheduleFormData.days[day]?.start_time || '').map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={closeScheduleModal}>Close</button>
              <button className="btn btn-primary" onClick={handleScheduleClassSave}>
                <i className="fas fa-save"></i> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          EDIT CLASS MODAL
          ================================================================ */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Class</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label>Class: <span style={{ color: 'blue' }}>{editFormData.day}</span></label>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Start Time <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control timepicker"
                      placeholder="HH:MM AM/PM"
                      value={editFormData.class_start_time}
                      onChange={(e) => setEditFormData((prev: any) => ({ ...prev, class_start_time: e.target.value }))}
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>End Time <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control timepicker"
                      placeholder="HH:MM AM/PM"
                      value={editFormData.class_end_time}
                      onChange={(e) => setEditFormData((prev: any) => ({ ...prev, class_end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Course <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editFormData.crs_id}
                    onChange={(e) => setEditFormData((prev: any) => ({ ...prev, crs_id: Number(e.target.value) }))}
                  >
                    <option value={0}>Break</option>
                    {courses.map((course) => (
                      <option key={course.crs_id} value={course.crs_id}>
                        {course.crs_code} - {course.crs_title.substring(0, 50)}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setShowEditModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={handleEditClassUpdate}>
                <i className="fas fa-save"></i> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          IMPORT TIMETABLE MODAL
          ================================================================ */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Import Timetable</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="import-info">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th>Curriculum:</th>
                      <td>{getCurriculumName()}</td>
                      <th>Term:</th>
                      <td>{getTermName()}</td>
                      <th>Section:</th>
                      <td>{getSectionName()}</td>
                    </tr>
                    <tr>
                      <th>Start Date:</th>
                      <td>{timetable?.tt_start_date}</td>
                      <th>End Date:</th>
                      <td>{timetable?.tt_end_date}</td>
                      <th>Start Time:</th>
                      <td>{timetable?.tt_start_time}</td>
                      <th>End Time:</th>
                      <td>{timetable?.tt_end_time}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="import-steps">
                <h5>Steps to upload timetable:</h5>
                <ol>
                  <li>
                    Click here to 
                    <button className="btn btn-link" onClick={handleDownloadTemplate}>
                      <b>Download Template</b>
                    </button>
                    <span className="text-muted">. To download template select Curriculum, Term and Section.</span>
                  </li>
                  <li>
                    Click on <b>Upload</b> button to upload the .xls file. Make sure that the 
                    <b>filename</b> and <b>file headers</b> are not altered.
                    <br />
                    (Note: <b>Discard previous downloaded file</b> before downloading new file)
                  </li>
                  <li>
                    <b>Start Time, End Time and Week Day</b> fields are Mandatory and cannot be left blank.
                  </li>
                  <li>
                    Click on <b>Accept</b> button to save the timetable data and return back to list page. 
                    Make sure that all the <b>remarks are resolved</b> before proceeding.
                  </li>
                  <li>
                    Click on <b>Cancel</b> button to discard (if any file has been uploaded) and return back to list page.
                  </li>
                </ol>
              </div>

              <div className="import-upload">
                <input
                  type="file"
                  id="importFile"
                  accept=".xls,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                />
                <button
                  className="btn btn-success"
                  onClick={() => document.getElementById('importFile')?.click()}
                >
                  <i className="fas fa-upload"></i> Upload .xls
                </button>
                {importFile && (
                  <span className="file-name">{importFile.name}</span>
                )}
                <button
                  className="btn btn-primary"
                  disabled={!importFile}
                  onClick={() => setShowImportConfirm(true)}
                >
                  <i className="fas fa-check"></i> Accept
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setImportFile(null);
                    setImportData(null);
                    setShowImportConfirm(false);
                  }}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>

              {importData && (
                <div className="import-preview">
                  <h5>Preview Data</h5>
                  <div dangerouslySetInnerHTML={{ __html: importData }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          COMPENSATE CLASS MODAL (Copy Class Day)
          ================================================================ */}
      {showCompensateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Copy Class Schedule</h3>
              <button className="close-btn" onClick={() => setShowCompensateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Copy Class Schedule:</strong> Use this feature to duplicate an entire day's class 
                structure from your master timetable template (e.g., all classes scheduled on a Tuesday) 
                directly onto a specific calendar date.
              </p>
              <em>
                This is useful if regular classes were missed due to unexpected events and you need to 
                replicate that day's scheduled sessions on a chosen target date.
              </em>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>From day <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={compensateFormData.from_val}
                    onChange={(e) => setCompensateFormData((prev: any) => ({ ...prev, from_val: Number(e.target.value) }))}
                  >
                    <option value={0}>Select Day...</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={7}>Sunday</option>
                  </select>
                </div>
                <div className="form-group col-md-6">
                  <label>To day <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={compensateFormData.to_val}
                    onChange={(e) => setCompensateFormData((prev: any) => ({ ...prev, to_val: Number(e.target.value) }))}
                  >
                    <option value={0}>Select Day...</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={7}>Sunday</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setShowCompensateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCompensateClass}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          COMPENSATE CLASS BY DATE MODAL
          ================================================================ */}
      {showCompensateDateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Copy Class Schedule by Date</h3>
              <button className="close-btn" onClick={() => setShowCompensateDateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Copy Class By Date –</strong> Duplicate a full day's class structure onto a specific 
                target calendar date.
              </p>
              <em>
                Note: Use this to quickly recreate missing class sessions caused by events like college fests 
                or strikes onto an alternate date.
              </em>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>From Date <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control datepicker"
                    placeholder="DD-MM-YYYY"
                    value={compensateDateFormData.from_date}
                    onChange={(e) => setCompensateDateFormData((prev: any) => ({ ...prev, from_date: e.target.value }))}
                  />
                </div>
                <div className="form-group col-md-6">
                  <label>To Date <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control datepicker"
                    placeholder="DD-MM-YYYY"
                    value={compensateDateFormData.to_date}
                    onChange={(e) => setCompensateDateFormData((prev: any) => ({ ...prev, to_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setShowCompensateDateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                // Handle compensate by date
                const data = {
                  comp_date_tt_detail_id: timetable?.tt_detail_id || 0,
                  from_date: compensateDateFormData.from_date,
                  to_date: compensateDateFormData.to_date,
                  term: formState.term,
                  section: formState.section,
                  confirm_date: compensateDateFormData.confirm_date,
                };
                compensateClass(data);
                setShowCompensateDateModal(false);
              }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          VIEW TIMETABLE MODAL
          ================================================================ */}
      {showViewModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>View Timetable</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div dangerouslySetInnerHTML={{ __html: viewContent }} />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={handleExportTimetablePdf}
              >
                <i className="fas fa-file-pdf"></i> Export PDF
              </button>
              <button className="btn btn-danger" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          DELETE TIMETABLE CONFIRMATION MODAL
          ================================================================ */}
      {showResetDateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reset Timetable Dates</h3>
              <button className="close-btn" onClick={() => setShowResetDateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Extending the end date creates dated class entries for matching weekly classes.
                Reducing it removes dated entries after the selected end date.
              </p>
              <div className="form-group">
                <label>New End Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  min={toInputDate(timetable?.tt_start_date || '')}
                  value={toInputDate(resetEndDate)}
                  onChange={(e) => setResetEndDate(fromInputDate(e.target.value))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setShowResetDateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetTimetableDate}>Reset Dates</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Timetable</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Warning: This action will permanently delete:</p>
              <ul>
                <li>All Scheduled Classes and mappings</li>
                <li>Topic Portions and lesson progress</li>
                <li>Finalized Attendance records</li>
                <li>Draft/Saved Attendance entries</li>
              </ul>
              <p><strong>This action cannot be undone. Are you sure you want to proceed?</strong></p>
              <div className="form-group">
                <label>Enter Login Password:</label>
                <input
                  type="password"
                  className="form-control"
                  id="delete-password"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  const password = (document.getElementById('delete-password') as HTMLInputElement)?.value;
                  if (password) {
                    handleDeleteTimetable(password);
                  } else {
                    alert('Please enter your password');
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          LOADING OVERLAY
          ================================================================ */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default Timetable;
