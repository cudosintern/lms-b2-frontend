import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useManageQuizService } from './manageQuizService';
import { toast } from "react-toastify";

export default function ManageStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const service = useManageQuizService();

  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

  // ✅ LOAD DATA
  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const details = await service.getQuizDetails(Number(id));
      setQuizDetails(details);

      const studentList: any = await service.getStudents(Number(id));

      const arr = Array.isArray(studentList)
        ? studentList
        : studentList?.data || studentList?.items || [];

      setStudents(arr);
      setSelectedStudents(new Set());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [id]);

  // ✅ SEARCH FILTER (WORKING)
  const filteredStudents = students.filter((s: any) =>
    (s.usn || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ TOGGLE SINGLE (WORKING)
  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);

      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }

      return newSet;
    });
  };

  // ✅ SELECT ALL (WORKING)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredStudents.map(s => s.student_id);
      setSelectedStudents(new Set(allIds));
    } else {
      setSelectedStudents(new Set());
    }
  };

  // ✅ SAVE (VALIDATION FIXED)
  const handleSave = async () => {
    if (selectedStudents.size === 0) {
      toast.warning("Please select at least one student");
      return;
    }

    try {
      await service.assignStudents({
        quiz_id: Number(id),
        students: Array.from(selectedStudents)
      });

      toast.success("Students assigned successfully");
      navigate("/ems/manageQuiz");

    } catch (e) {
      console.error(e);
      toast.error("Error assigning students");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const quiz = quizDetails?.quiz;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-[#1f4e5f] text-white px-6 py-3 flex justify-between">
          <h2>Manage Student Information</h2>
          <button onClick={() => navigate('/ems/manageQuiz')}>✕</button>
        </div>

        <div className="p-6">

          {/* QUIZ INFO */}
          <div className="grid grid-cols-2 gap-4 text-sm border p-4 rounded mb-6 bg-gray-50">
            <div><b>Curriculum:</b> {quiz?.academic_batch_id}</div>
            <div><b>Term:</b> {quiz?.semester_id}</div>
            <div><b>Course:</b> {quiz?.crs_id}</div>
            <div><b>Quiz Title:</b> {quiz?.quiz_title}</div>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search by USN or Student Name"
            className="border px-3 py-2 w-full rounded mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* TABLE */}
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      filteredStudents.every(s =>
                        selectedStudents.has(s.student_id)
                      )
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>USN</th>
                <th>Name</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((s, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s.student_id)}
                      onChange={() => toggleStudent(s.student_id)}
                    />
                  </td>
                  <td>{s.usn}</td>
                  <td>{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 flex justify-end gap-3 border-t">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-5 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => navigate('/ems/manageQuiz')}
            className="border px-5 py-2 rounded"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}