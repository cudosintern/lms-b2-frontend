import axios from "axios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

// Base URL — matches utils/api.ts in the project
const BASE = "http://127.0.0.1:8000";

function api(path: string): string {
  return `${BASE}/${path}`.replace(/([^:])\/\//g, "$1/");
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DropdownOption {
  id: number;
  name: string;
}

export interface ReportRequest {
  start_date: string;  // "YYYY-MM-DD"
  end_date: string;
  department_ids?: number[] | null;
  program_ids?: number[] | null;
  curriculum_ids?: number[] | null;
  semester_ids?: number[] | null;
  section_ids?: number[] | null;
}

export interface ReportRow {
  department: string;
  term: string;
  course: string;
  course_code?: string;
  section: string;
  absent_count: number;
  course_id?: number;
  section_id?: number;
}

export interface DrilldownRequest {
  course_id: number;
  section_id: number;
  start_date: string;
  end_date: string;
}

export interface DrilldownRow {
  attendance_date: string;
  student_name: string;
  usno: string;
  student_contact?: string;
  parent_contact?: string;
  mobile?: string;
}

// ── Dropdown APIs ──────────────────────────────────────────────────────────────

export const getDepartments = async (): Promise<DropdownOption[]> => {
  const res = await axios.get<DropdownOption[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.departments)
  );
  return res.data;
};

export const getPrograms = async (departmentId: number): Promise<DropdownOption[]> => {
  const res = await axios.get<DropdownOption[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.programs(departmentId))
  );
  return res.data;
};

export const getCurriculumList = async (programId: number): Promise<DropdownOption[]> => {
  const res = await axios.get<DropdownOption[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.curriculum(programId))
  );
  return res.data;
};

export const getTermList = async (curriculumId: number): Promise<DropdownOption[]> => {
  const res = await axios.get<DropdownOption[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.terms(curriculumId))
  );
  return res.data;
};

export const getSectionList = async (semesterId: number): Promise<DropdownOption[]> => {
  const res = await axios.get<DropdownOption[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.sections(semesterId))
  );
  return res.data;
};

// ── Date Info ──────────────────────────────────────────────────────────────────

export const getDateInfo = async (): Promise<{
  latest_attendance_date: string | null;
  scheduled_dates: string[];
}> => {
  const res = await axios.get<{
    latest_attendance_date: string | null;
    scheduled_dates: string[];
  }>(api(ApiEndpoint.consolidatedAbsenteesReport.dateInfo));
  return res.data;
};

// ── Main Report ────────────────────────────────────────────────────────────────

export const generateReport = async (payload: ReportRequest): Promise<ReportRow[]> => {
  const res = await axios.post<ReportRow[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.report),
    payload
  );
  return res.data;
};

// ── Drilldown ──────────────────────────────────────────────────────────────────

export const getDrilldown = async (payload: DrilldownRequest): Promise<DrilldownRow[]> => {
  const res = await axios.post<DrilldownRow[]>(
    api(ApiEndpoint.consolidatedAbsenteesReport.drilldown),
    payload
  );
  return res.data;
};

// ── Export PDF (FIXED) ───────────────────────────────────────────────
export const exportPDF = async (payload: any) => {
  return axios.post(
    api(ApiEndpoint.consolidatedAbsenteesReport.exportPdf),
    payload,
    {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

// ── Export XLS (FIXED) ───────────────────────────────────────────────
export const exportExcel = async (payload: any) => {
  return axios.post(
    api(ApiEndpoint.consolidatedAbsenteesReport.exportXls),
    payload,
    {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

