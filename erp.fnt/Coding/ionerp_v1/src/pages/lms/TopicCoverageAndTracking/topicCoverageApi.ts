import axios from "axios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

import {
  CurriculumOption,
  TermOption,
  SectionGroup,
  CourseTopicsResponse,
} from "./topicCoverageInterface";

const BASE = "http://127.0.0.1:8000";

function api(path: string): string {
  return `${BASE}/${path}`.replace(/([^:])\/\//g, "$1/");
}

export const getCurriculumList = async (): Promise<CurriculumOption[]> => {
  const res = await axios.get<CurriculumOption[]>(
    api(ApiEndpoint.topicCoverage.curriculum)
  );

  console.log("🔥 Curriculum API:", res.data);   // ✅ ADD

  return res.data;
};

export const getTerms = async (curriculumId: number): Promise<TermOption[]> => {
  const res = await axios.get<TermOption[]>(
    api(ApiEndpoint.topicCoverage.terms(curriculumId))
  );
  return res.data;
};

export const getCourses = async (
  academicBatchId: number,
  semesterId: number
): Promise<SectionGroup[]> => {
  const res = await axios.get<SectionGroup[]>(api(ApiEndpoint.topicCoverage.courses), {
    params: { academic_batch_id: academicBatchId, semester_id: semesterId },
  });
  return res.data;
};

export const getCourseTopics = async (
  courseId: number,
  sectionId: number,
  academicBatchId: number,
  semesterId: number
): Promise<any> => {
  const res = await axios.get(
    api(ApiEndpoint.topicCoverage.courseTopics),
    {
      params: {
        course_id: courseId,
        section_id: sectionId,
        academic_batch_id: academicBatchId,
        semester_id: semesterId
      },
    }
  );

  return res.data;
};

// Triggers a PDF download in the browser
export const exportPdf = async (academicBatchId: number, semesterId: number) => {
  const res = await axios.get<Blob>(
    api(ApiEndpoint.topicCoverage.exportPdf),
    {
      params: {
        academic_batch_id: academicBatchId,
        semester_id: semesterId
      },
      responseType: "blob"
    }
  );

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Topic_Coverage_Report.pdf";
  link.click();

  window.URL.revokeObjectURL(url);
};