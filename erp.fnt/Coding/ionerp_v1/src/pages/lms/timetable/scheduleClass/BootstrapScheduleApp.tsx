import { useState, useEffect } from "react";
import ReactHookFormModal from "./ReactHookFormModal";
import { scheduleClassApi } from "../scheduleClassApi";
import "bootstrap/dist/css/bootstrap.min.css";

interface ScheduledClass {
  id: number;
  courseTypeName?: string;
  courseName?: string;
  sectionName?: string;
  topicName?: string;
  classDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  [key: string]: unknown;
}

function BootstrapScheduleApp() {
  const [open, setOpen] = useState(false);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(false);

  const transformData = (data: ScheduledClass[]) => {
    return data.map((cls) => ({
      ...cls,
      courseTypeName: cls.courseTypeName || "-",
      courseName: cls.courseName || "-",
      sectionName: cls.sectionName || "-",
      topicName: cls.topicName || "-",
    }));
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await scheduleClassApi.getAll();
      const localData = response.data;

      setScheduledClasses(
        Array.isArray(localData) ? transformData(localData) : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setScheduledClasses([]);
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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Schedule Class Management</h1>
        <div>
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
