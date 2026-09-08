export interface ScheduleClassFormData {
  courseTypeId: string;
  courseId: string;
  sectionId: string;
  topicId: string;
  classDate: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface ValidationError {
  [key: string]: string;
}

export const validateScheduleClass = (data: ScheduleClassFormData): ValidationError => {
  const errors: ValidationError = {};

  // Course Type validation
  if (!data.courseTypeId) {
    errors.courseTypeId = "Course Type required";
  }

  // Course validation
  if (!data.courseId) {
    errors.courseId = "Course required";
  }

  // Section validation
  if (!data.sectionId) {
    errors.sectionId = "Section required";
  }

  // Topic validation
  if (!data.topicId) {
    errors.topicId = "Topic required";
  }

  // Date validation
  if (!data.classDate) {
    errors.classDate = "Date required";
  }

  // Start time validation
  if (!data.startTime) {
    errors.startTime = "Start time required";
  }

  // End time validation
  if (!data.endTime) {
    errors.endTime = "End time required";
  } else if (data.startTime && data.endTime <= data.startTime) {
    errors.endTime = "End time must be after start time";
  }

  return errors;
};

export const hasValidationErrors = (errors: ValidationError): boolean => {
  return Object.keys(errors).length > 0;
};
