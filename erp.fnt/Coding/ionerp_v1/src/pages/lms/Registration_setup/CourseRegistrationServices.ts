import axiosInstance from "../../../utils/api";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await axiosInstance.request({
    url: path,
    method: options.method ?? "GET",
    data: options.body ?? undefined,
    headers: options.headers,
  });
  return response.data as T;
}
