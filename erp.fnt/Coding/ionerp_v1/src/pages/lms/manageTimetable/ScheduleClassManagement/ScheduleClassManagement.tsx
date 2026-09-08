import React, { useState, useMemo, useEffect, useCallback } from 'react';
import DataTable from '../../../../components/Table/DataTable';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import ScheduleClassForm from './ScheduleClassForm';
import {
  getCourseNameById,
  getSectionNameById,
  getTopicNameById
} from '../scheduleConstants';
import { scheduleClassApi } from '../scheduleClassApi';
import { toast } from 'react-toastify';

interface ScheduledClass {
  id: string;
  idX: string;
  date: string;
  time: string;
  courseType: string;
  course: string;
  section: string;
  topic: string;
  location: string;
  [key: string]: any;
}

const ScheduleClassManagement: React.FC = () => {
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  /**
   * Ultra-robust normalization to match the API layer.
   * Removes all non-alphanumeric characters for comparison.
   */
  const normalize = (val: any) => {
    if (val === null || val === undefined) return "";
    return String(val).toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  };

  /**
   * Generates a unique content fingerprint.
   * Treats "Room 101" and "room-101" as identical.
   */
  const generateFingerprint = useCallback((item: any) => {
    const rawDate = item.date || item.classDate || '';
    const startTime = item.startTime;
    const endTime = item.endTime;
    const rawTime = item.time || (startTime && endTime ? `${startTime}-${endTime}` : '');

    const date = normalize(rawDate);
    const time = normalize(rawTime);
    const course = normalize(item.course || (item.courseId ? getCourseNameById(Number(item.courseId)) : ''));
    const section = normalize(item.section || (item.sectionId ? getSectionNameById(Number(item.sectionId)) : ''));
    const topic = normalize(item.topic || (item.topicId ? getTopicNameById(Number(item.topicId)) : ''));
    const location = normalize(item.location);

    return `${date}|${time}|${course}|${section}|${topic}|${location}`;
  }, []);

  const transformClassData = useCallback((item: any): ScheduledClass => {
    const fingerprint = generateFingerprint(item);

    return {
      ...item,
      id: String(item.id || fingerprint),
      idX: fingerprint,
      date: item.date || item.classDate || '-',
      time: item.time || (item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : '-'),
      courseType: item.courseType || (item.courseTypeId === 1 ? 'Theory' : 'Practical'),
      course: item.course || (item.courseId ? getCourseNameById(Number(item.courseId)) : '-'),
      section: item.section || (item.sectionId ? getSectionNameById(Number(item.sectionId)) : '-'),
      topic: item.topic || (item.topicId ? getTopicNameById(Number(item.topicId)) : '-'),
      location: item.location || '-'
    };
  }, [generateFingerprint]);

  const loadScheduledClasses = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await scheduleClassApi.getAll();

      let rawData = [];
      if (response && response.success && response.data) {
        rawData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        rawData = response;
      }

      const formattedData = rawData.map(transformClassData);

      // FINAL DEDUPLICATION GUARD
      const uniqueMap = new Map();
      formattedData.forEach((item: ScheduledClass) => {
        if (!uniqueMap.has(item.idX)) {
          uniqueMap.set(item.idX, item);
        }
      });

      const finalResult = Array.from(uniqueMap.values());
      console.log(`[Sync] Found ${formattedData.length} total entries, showing ${finalResult.length} unique records.`);
      setScheduledClasses(finalResult);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [transformClassData]);

  useEffect(() => {
    loadScheduledClasses();
  }, [loadScheduledClasses]);

  const columnDefs = useMemo(() => [
    { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
    { headerName: 'Time', field: 'time', flex: 1.2, sortable: true, filter: true },
    {
      headerName: 'Type',
      field: 'courseType',
      flex: 0.8,
      cellRenderer: (params: any) => {
        const type = params.value || 'Theory';
        const isTheory = type.toLowerCase().includes('theory');
        const color = isTheory ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700';
        return (
          <div className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border inline-block ${color}`}>
            {type}
          </div>
        );
      }
    },
    { headerName: 'Course', field: 'course', flex: 1.2, sortable: true, filter: true },
    { headerName: 'Section', field: 'section', flex: 0.8, sortable: true, filter: true },
    { headerName: 'Topic', field: 'topic', flex: 1.2, sortable: true, filter: true },
    { headerName: 'Location', field: 'location', flex: 1, sortable: true, filter: true },
    {
      headerName: 'Actions',
      field: 'id',
      flex: 0.8,
      cellRenderer: (params: any) => {
        const handleDelete = async () => {
          if (window.confirm('Delete this record and all duplicates?')) {
            try {
              const res = await scheduleClassApi.delete(params.data.idX);
              if (res && res.success) {
                toast.success('Deleted Successfully');
                loadScheduledClasses();
              }
            } catch (err) {
              toast.error('Deletion error');
            }
          }
        };
        return (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase underline cursor-pointer">
            [REMOVE]
          </button>
        );
      }
    }
  ], [loadScheduledClasses]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#1f4e5f] uppercase tracking-tighter">Scheduled Classes</h1>
        </div>
        <div className="flex gap-2">
          <UIButton
            onClick={() => setShowForm(true)}
            className="bg-[#1f4e5f] hover:bg-[#1a404e] text-white px-5 h-9 rounded text-[10px] font-black uppercase tracking-widest"
          >
            + New Schedule
          </UIButton>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 uppercase text-[9px] tracking-[4px]">Synchronizing...</div>
        ) : (
          <DataTable
            columnDefs={columnDefs}
            rowData={scheduledClasses}
            pagination={true}
            pageSize={10}
          />
        )}
      </div>

      {showForm && (
        <ScheduleClassForm
          onClose={() => setShowForm(false)}
          onSave={loadScheduledClasses}
        />
      )}
    </div>
  );
};

export default ScheduleClassManagement;
