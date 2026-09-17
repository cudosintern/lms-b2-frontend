import client from "../../../utils/api";
import { ConfigurationInput, Course, Option, Options, Summary } from "./types";

const base = "/api/v1/course-registration-configuration";
const termPath = (batch: number, term: number) => `${base}/curricula/${batch}/terms/${term}`;
// The project loads old @types/axios alongside Axios 1.x. A structurally typed
// config retains AbortSignal at runtime and is compatible with both declarations.
const readConfig = (signal?: AbortSignal) => ({ signal, timeout: 10000 });
export const registrationApi = {
  options: async (signal?: AbortSignal) => (await client.get<Options>(`${base}/options`, readConfig(signal))).data,
  terms: async (batch: number, signal?: AbortSignal) => (await client.get<Option[]>(`${base}/curricula/${batch}/terms`, readConfig(signal))).data,
  summary: async (batch: number, term: number, signal?: AbortSignal) => (await client.get<Summary>(termPath(batch, term), readConfig(signal))).data,
  save: async (batch: number, term: number, payload: ConfigurationInput) => client.put(termPath(batch, term), payload),
  courses: async (batch: number, term: number, type: number, signal?: AbortSignal) =>
    (await client.get<Course[]>(`${termPath(batch, term)}/types/${type}/courses`, readConfig(signal))).data,
  saveCourses: async (batch: number, term: number, type: number, courses: Pick<Course, "course_id" | "capacity" | "start" | "end">[]) =>
    client.put(`${termPath(batch, term)}/types/${type}/courses`, { courses }),
  pdf: async (batch: number, term: number) => {
    const { data } = await client.get<Blob>(`${termPath(batch, term)}/export.pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url; link.download = `course-registration-${batch}-${term}.pdf`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
export async function errorMessage(error: unknown): Promise<string> {
  if (isRecord(error) && error.isAxiosError === true) {
    let data: unknown = isRecord(error.response) ? error.response.data : undefined;
    if (data instanceof Blob) {
      try { data = JSON.parse(await data.text()); } catch { return "Could not export PDF."; }
    }
    if (isRecord(data)) {
      if (Array.isArray(data.detail)) {
        const messages = data.detail.filter(isRecord).map(item => {
          const location = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
          const message = typeof item.msg === "string" ? item.msg : "Invalid value";
          return location ? `${location}: ${message}` : message;
        });
        if (messages.length) return messages.join(" ");
      }
      if (typeof data.detail === "string") return data.detail;
      if (typeof data.message === "string") return data.message;
    }
    return typeof error.message === "string" ? error.message : "Request failed. Please try again.";
  }
  return error instanceof Error ? error.message : "Request failed. Please try again.";
}
