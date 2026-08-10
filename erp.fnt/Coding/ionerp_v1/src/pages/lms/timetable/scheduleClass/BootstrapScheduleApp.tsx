import { useState, useEffect } from "react";
import ReactHookFormModal from "./ReactHookFormModal";
import { courseTypes, courses, sections, topics, scheduledClasses as mockScheduledClasses } from "./mockData";
import { scheduleClassApi } from "../scheduleClassApi";
import "bootstrap/dist/css/bootstrap.min.css";

function BootstrapScheduleApp() {
  const [open, setOpen] = useState(false);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const transformData = (data: any[]) => {
    return data.map((cls: any) => ({
      ...cls,
      courseTypeName: courseTypes.find((ct) => ct.id === parseInt(cls.courseTypeId))?.name || cls.courseTypeName,
      courseName: courses.find((c) => c.id === parseInt(cls.courseId))?.name || cls.courseName,
      sectionName: sections.find((s) => s.id === parseInt(cls.sectionId))?.name || cls.sectionName,
      topicName: topics.find((t) => t.id === parseInt(cls.topicId))?.name || cls.topicName,
    }));
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      // Try to get data from localStorage first
      const response = await scheduleClassApi.getAll();
      const localData = response.data;

      if (localData && localData.length > 0) {
        setScheduledClasses(transformData(localData));
      } else {
        // Fall back to mock data from mockData.ts
        setScheduledClasses(transformData(mockScheduledClasses));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fall back to mock data on error
      setScheduledClasses(transformData(mockScheduledClasses));
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this scheduled class?")) {
      try {
        await scheduleClassApi.delete(id);
        setScheduledClasses(scheduledClasses.filter((cls) => cls.id !== id));
      } catch (error) {
        console.error("Error deleting class:", error);
        // Still update UI even if API fails
        setScheduledClasses(scheduledClasses.filter((cls) => cls.id !== id));
      }
    }
  };

  const handleSaveClass = (data: any) => {
    // Add new class to list (mock - in real app, API call)
    const newClass = {
      id: scheduledClasses.length + 1,
      ...data,
      courseTypeName: courseTypes.find((ct) => ct.id === parseInt(data.courseTypeId))?.name,
      courseName: courses.find((c) => c.id === parseInt(data.courseId))?.name,
      sectionName: sections.find((s) => s.id === parseInt(data.sectionId))?.name,
      topicName: topics.find((t) => t.id === parseInt(data.topicId))?.name,
    };
    setScheduledClasses([...scheduledClasses, newClass]);
    refreshData();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Schedule Class Management</h1>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => {
              if (window.confirm("Reset all scheduled classes to mock data?")) {
                localStorage.removeItem("scheduled_classes");
                refreshData();
              }
            }}
          >
            Reset to Mock Data
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setOpen(true)}
          >
            + Schedule New Class
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Scheduled Classes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : scheduledClasses.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No classes scheduled yet.</p>
              <button
                className="btn btn-outline-primary"
                onClick={() => setOpen(true)}
              >
                Schedule Your First Class
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Course Type</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Topic</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledClasses.map((cls) => (
                    <tr key={cls.id}>
                      <td>{cls.classDate}</td>
                      <td>{cls.startTime} - {cls.endTime}</td>
                      <td>
                        <span className={`badge ${cls.courseTypeName === 'Theory' ? 'bg-primary' : 'bg-success'}`}>
                          {cls.courseTypeName}
                        </span>
                      </td>
                      <td>{cls.courseName}</td>
                      <td>{cls.sectionName}</td>
                      <td>{cls.topicName}</td>
                      <td>{cls.location || '-'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(cls.id)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ReactHookFormModal
        open={open}
        onClose={() => setOpen(false)}
        refreshData={refreshData}
      />
    </div>
  );
}

export default BootstrapScheduleApp;
