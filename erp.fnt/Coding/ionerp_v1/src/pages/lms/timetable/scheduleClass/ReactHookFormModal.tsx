import { useState, useEffect } from "react";
import { useForm, FieldError, Merge, FieldErrorsImpl } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { scheduleClassSchema } from "../scheduleClassSchema";
import { courseTypes, courses, sections, topicsByCourse } from "./mockData";
import { scheduleClassApi } from "../scheduleClassApi";
import "bootstrap/dist/css/bootstrap.min.css";

// Helper function to get error message
const getErrorMessage = (error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined): string => {
  if (!error) return "";
  return (error as FieldError)?.message as string || "";
};

interface ScheduleClassModalProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ open, onClose, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(scheduleClassSchema),
  });

  // Watch for course changes to filter topics
  const watchCourseId = watch("courseId", "");

  useEffect(() => {
    if (watchCourseId) {
      setSelectedCourseId(watchCourseId);
    }
  }, [watchCourseId]);

  // Get topics for selected course
  const availableTopics = selectedCourseId ? topicsByCourse[selectedCourseId as unknown as keyof typeof topicsByCourse] || [] : [];

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await scheduleClassApi.saveSchedule(data);
      setSuccess("Class scheduled successfully!");
      reset();
      setSelectedCourseId("");
      if (refreshData) refreshData();
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to schedule class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="modal d-block" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => (e.target as HTMLElement).className === "modal d-block" && onClose()}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Schedule Class</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Course Type</label>
                  <select 
                    className={`form-select ${errors.courseTypeId ? "is-invalid" : ""}`}
                    {...register("courseTypeId")}
                  >
                    <option value="">Select Course Type</option>
                    {courseTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                  {errors.courseTypeId && (
                    <div className="invalid-feedback">
                     {errors.courseTypeId?.message as string}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Course</label>
                  <select 
                    className={`form-select ${errors.courseId ? "is-invalid" : ""}`}
                    {...register("courseId")}
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.courseId && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.courseId)}
                    </div>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Section</label>
                  <select 
                    className={`form-select ${errors.sectionId ? "is-invalid" : ""}`}
                    {...register("sectionId")}
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.sectionId && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.sectionId)}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Topic</label>
                  <select 
                    className={`form-select ${errors.topicId ? "is-invalid" : ""}`}
                    {...register("topicId")}
                    disabled={!selectedCourseId}
                  >
                    <option value="">
                      {selectedCourseId ? "Select Topic" : "Select Course First"}
                    </option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {errors.topicId && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.topicId)}
                    </div>
                  )}
                  {!selectedCourseId && (
                    <div className="form-text text-muted">
                      Please select a course first to see available topics.
                    </div>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Class Date</label>
                  <input 
                    type="date" 
                    className={`form-control ${errors.classDate ? "is-invalid" : ""}`}
                    {...register("classDate")}
                  />
                  {errors.classDate && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.classDate)}
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Start Time</label>
                  <input 
                    type="time" 
                    className={`form-control ${errors.startTime ? "is-invalid" : ""}`}
                    {...register("startTime")}
                  />
                  {errors.startTime && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.startTime)}
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">End Time</label>
                  <input 
                    type="time" 
                    className={`form-control ${errors.endTime ? "is-invalid" : ""}`}
                    {...register("endTime")}
                  />
                  {errors.endTime && (
                    <div className="invalid-feedback">
                      {getErrorMessage(errors.endTime)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Classroom/Location</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.location ? "is-invalid" : ""}`}
                  placeholder="e.g., Room 201, Lab A, Online"
                  {...register("location")}
                />
                {errors.location && (
                  <div className="invalid-feedback">
                    {getErrorMessage(errors.location)}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleClassModal;
