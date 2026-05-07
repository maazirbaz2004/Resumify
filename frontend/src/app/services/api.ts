/**
 * Resumify API service — centralized HTTP client for all backend calls.
 */

const API_BASE = "http://localhost:5000/api";

// ── Token management ──
export function getToken(): string | null {
  return localStorage.getItem("resumify_token");
}

export function setToken(token: string): void {
  localStorage.setItem("resumify_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("resumify_token");
  localStorage.removeItem("resumify_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("resumify_user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: any) {
  localStorage.setItem("resumify_user", JSON.stringify(user));
}

// ── Base fetch wrapper ──
async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// ══════════════════════════════════════
//  AUTH
// ══════════════════════════════════════

export const auth = {
  register: (body: { email: string; password: string; full_name: string; role: string; company_name?: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => request("/auth/me"),
};

// ══════════════════════════════════════
//  CANDIDATE
// ══════════════════════════════════════

export const candidate = {
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    return request("/candidate/upload-resume", { method: "POST", body: formData });
  },

  dashboard: () => request("/candidate/dashboard"),
  discardResume: () => request("/candidate/resume", { method: "DELETE" }),

  atsCheck: (jdText?: string) =>
    request(`/candidate/ats-check${jdText ? `?jd_text=${encodeURIComponent(jdText)}` : ""}`),

  skillGap: (requiredSkills: string[]) =>
    request("/candidate/skill-gap", { method: "POST", body: JSON.stringify({ required_skills: requiredSkills }) }),

  careerPath: () => request("/candidate/career-path"),

  jobMatches: () => request("/candidate/job-matches"),

  apply: (jobId: number) =>
    request("/candidate/apply", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),

  applications: () => request("/candidate/applications"),

  history: () => request("/candidate/history"),
};

// ══════════════════════════════════════
//  RECRUITER
// ══════════════════════════════════════

export const recruiter = {
  dashboard: () => request("/recruiter/dashboard"),

  createJob: (job: any) =>
    request("/recruiter/jobs", { method: "POST", body: JSON.stringify(job) }),

  listJobs: () => request("/recruiter/jobs"),

  parseJD: (jobId: number) =>
    request(`/recruiter/jobs/${jobId}/parse-jd`, { method: "POST" }),

  getCandidates: (jobId: number) =>
    request(`/recruiter/jobs/${jobId}/candidates`),

  getCandidateProfile: (candidateId: number, jobId?: number) =>
    request(`/recruiter/candidates/${candidateId}${jobId ? `?job_id=${jobId}` : ""}`),

  shortlist: (candidateId: number, jobId: number) =>
    request(`/recruiter/candidates/${candidateId}/shortlist`, {
      method: "POST", body: JSON.stringify({ job_id: jobId }),
    }),

  reject: (candidateId: number, jobId: number) =>
    request(`/recruiter/candidates/${candidateId}/reject`, {
      method: "POST", body: JSON.stringify({ job_id: jobId }),
    }),

  analytics: () => request("/recruiter/analytics"),
};

// ══════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════

export const admin = {
  dashboard: () => request("/admin/dashboard"),

  getUsers: () => request("/admin/users"),

  updateUserStatus: (userId: number, action: "activate" | "suspend" | "delete") =>
    request(`/admin/users/${userId}/status`, { method: "PUT", body: JSON.stringify({ action }) }),

  getJobs: () => request("/admin/jobs"),

  updateJobStatus: (jobId: number, status: string) =>
    request(`/admin/jobs/${jobId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  stats: () => request("/admin/stats"),

  auditLog: () => request("/admin/audit-log"),
};
