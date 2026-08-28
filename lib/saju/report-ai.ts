export { SAJU_REPORT_MODEL } from "@/lib/saju/report-model";

const DEFAULT_SAJU_REPORT_API_URL = "https://ferfecday.vercel.app/api/saju-report";

export function getSajuReportEndpoint() {
  return process.env.NEXT_PUBLIC_SAJU_REPORT_API_URL?.trim() || DEFAULT_SAJU_REPORT_API_URL;
}

export async function requestSajuReport<T>(
  payload: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const endpoint = getSajuReportEndpoint();
  if (!endpoint) throw new Error("Saju report API is not configured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal,
  });

  if (!response.ok) throw new Error(`Saju report API ${response.status}`);
  return response.json() as Promise<T>;
}
