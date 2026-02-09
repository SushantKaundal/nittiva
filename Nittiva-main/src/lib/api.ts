// API Configuration
// const API_BASE_URL = "https://taskify.softcofrnds.com/api/v1";

// Development mode flag
// const isDevelopment =
//   import.meta.env.DEV || import.meta.env.MODE === "development";

// export const API_BASE_URL = "https://api.nittiva.com/api";

export const API_BASE_URL = "http://127.0.0.1:8000/api";

export const isDevelopment =
  import.meta.env.DEV || import.meta.env.MODE === "development";

// HYBRID MODE - Try real API first, fallback to mock in development
// const shouldUseMockData = isDevelopment;

// Log development mode status
// console.log(
//   `🔧 Development Mode: ${isDevelopment}, Mock Data Fallback: ${shouldUseMockData}`,
// );


export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK ?? "false").toString().toLowerCase() === "true";

console.log(`🔧 DEV: ${isDevelopment} • USE_MOCK: ${USE_MOCK}`);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// New API response format
export interface ActualApiResponse<T = any> {
  error: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: T;
  workspace?: any;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  status: boolean;
  email_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  photo_url: string;
  // Keep legacy fields for backwards compatibility
  email_verified_at?: string;
  role_id?: number;
  workspace_id?: number;
  guard?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  username?: string; // Support username for login
}

export interface RegisterCredentials {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  company?: string;
  type?: string; // 'member' or 'client'
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordCredentials {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export interface SocialLoginCredentials {
  provider: "google" | "linkedin" | "apple";
  token: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface SocialAuthResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

// Additional interfaces for API
export interface Task {
  id: number;
  title: string;
  description?: string;
  status_id?: number;
  priority_id?: number;
  project_id?: number;
  assigned_to?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  task_id?: number;
  start_time: string;
  end_time?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  task_id?: number;
  project_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

// ---- Django task shape + normalizer ----
type BackendTask = {
  id: number;
  project: number;                  // FK id
  title: string;
  description: string | null;
  status: "to-do" | "in-progress" | "completed" | "review";
  priority: "low" | "medium" | "high";
  progress: number;
  due_date: string | null;
  time_tracked_seconds: number;
  custom_fields: Record<string, any>;
  assignees: Array<{ id: number; email: string; name?: string }>;
  created_at: string;
  updated_at: string;
};

export function normalizeTask(t: BackendTask) {
  return {
    id: t.id,
    projectId: t.project,
    name: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    progress: t.progress ?? 0,
    dueDate: t.due_date ?? "",
    timeTracked: t.time_tracked_seconds ?? 0,
    customFields: t.custom_fields ?? {},
    assigneeIds: (t.assignees ?? []).map((u) => String(u.id)), // UI uses string ids
  };
}


class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      workspace_id: "1", // Required workspace_id header
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Mock responses for development when API is not available
  private getMockResponse<T>(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<ApiResponse<T>> {
    console.log(`🎭 Mock API: ${method} ${endpoint}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (
          (endpoint === "/authenticate" ||
            endpoint === "/users/authenticate" ||
            endpoint === "/login" ||
            endpoint === "/users/login" ||
            endpoint === "/auth/login") &&
          method === "POST"
        ) {
          const credentials = JSON.parse(body || "{}");
          if (
            credentials.email === "demo@example.com" &&
            credentials.password === "password"
          ) {
            resolve({
              success: true,
              data: {
                                user: {
                  id: 1,
                  first_name: "Demo",
                  last_name: "User",
                  full_name: "Demo User",
                  email: "demo@example.com",
                  phone: "1234567890",
                  address: null,
                  city: null,
                  state: null,
                  country: null,
                  zip: null,
                  status: true,
                  email_verified: true,
                  role: "admin",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                  // Legacy fields for compatibility
                  role_id: 1,
                  email_verified_at: new Date().toISOString(),
                  workspace_id: 1,
                  guard: "web",
                },
                token: "mock-jwt-token-" + Date.now(),
              } as any,
            });
          } else {
            resolve({
              success: false,
              message:
                "Invalid credentials. Use demo@example.com / password for mock login.",
            });
          }
                } else if (
          (endpoint === "/signup/create_account" ||
            endpoint === "/signup" ||
            endpoint === "/register" ||
            endpoint === "/users/signup" ||
            endpoint === "/users/register" ||
            endpoint === "/auth/register" ||
            endpoint === "/users/store") &&
          method === "POST"
        ) {
          const registrationData = JSON.parse(body || "{}");
          resolve({
            success: true,
            data: {
              user: {
                id: Date.now(),
                first_name: registrationData.first_name || "Demo",
                last_name: registrationData.last_name || "User",
                full_name: `${registrationData.first_name || "Demo"} ${registrationData.last_name || "User"}`,
                email: registrationData.email || "demo@example.com",
                                phone: registrationData.phone || "+1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: false,
                role: registrationData.type || "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
              },
              access_token: "mock-registration-token-" + Date.now(),
              message: "User registered successfully",
            },
            message: "User registered successfully",
          });
        } else if (
          (endpoint === "/password/reset-request" ||
            endpoint === "/password/email") &&
          method === "POST"
        ) {
          resolve({
            success: true,
            message:
              "Verification email sent! Please check your inbox and spam folder.",
          });
        } else if (endpoint === "/email/verify" && method === "POST") {
          resolve({
            success: true,
            message: "Email verified successfully! You can now log in.",
                        data: {
              user: {
                id: 1,
                first_name: "Demo",
                last_name: "User",
                full_name: "Demo User",
                email: "demo@example.com",
                phone: "1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: true,
                role: "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                // Legacy fields for compatibility
                role_id: 2,
                email_verified_at: new Date().toISOString(),
                workspace_id: 1,
                guard: "web",
              },
            },
          });
        } else if (endpoint === "/user" && method === "GET") {
          resolve({
            success: true,
                        data: {
              id: 1,
              first_name: "Demo",
              last_name: "User",
              full_name: "Demo User",
              email: "demo@example.com",
              phone: "1234567890",
              address: null,
              city: null,
              state: null,
              country: null,
              zip: null,
              status: true,
              email_verified: true,
              role: "admin",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
              // Legacy fields for compatibility
              role_id: 1,
              email_verified_at: new Date().toISOString(),
              workspace_id: 1,
              guard: "web",
            } as any,
          });
        } else if (
          (endpoint === "/auth/social/google" ||
            endpoint === "/auth/social/linkedin" ||
            endpoint === "/auth/social/apple" ||
            endpoint === "/social/auth") &&
          method === "POST"
        ) {
          const socialCredentials = JSON.parse(body || "{}");
          const providerName =
            socialCredentials.provider || endpoint.split("/").pop();

          // Demo social login - always succeed with mock user data
          resolve({
            success: true,
            data: {
                            user: {
                id: Date.now(), // Unique ID based on timestamp
                first_name: `${providerName.charAt(0).toUpperCase()}${providerName.slice(1)}`,
                last_name: "User",
                full_name: `${providerName.charAt(0).toUpperCase()}${providerName.slice(1)} User`,
                email: `demo@${providerName}.com`,
                phone: "1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: true,
                role: "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                // Legacy fields for compatibility
                role_id: 2,
                email_verified_at: new Date().toISOString(),
                workspace_id: 1,
                guard: "web",
              },
              token: `mock-${providerName}-token-${Date.now()}`,
              isNewUser: Math.random() > 0.5, // Randomly simulate new vs existing user
            } as any,
          });
        } else if (endpoint === "/dashboard/statistics" && method === "GET") {
          resolve({
            success: true,
            data: {
              totalProjects: 12,
              activeTasks: 28,
              completedTasks: 45,
              totalUsers: 8,
            } as any,
          });
        } else if (endpoint === "/projects" && method === "GET") {
          resolve({
            success: true,
            data: [
              {
                id: 1,
                name: "Website Redesign",
                description: "Complete redesign of company website",
                status: "active",
                start_date: "2024-01-15",
                end_date: "2024-03-15",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                name: "Mobile App Development",
                description: "Native iOS and Android app",
                status: "planning",
                start_date: "2024-02-01",
                end_date: "2024-06-01",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ] as any,
          });
        } else if (endpoint === "/tasks" && method === "GET") {
          resolve({
            success: true,
            data: [
              {
                id: 1,
                title: "Design homepage mockup",
                description:
                  "Create wireframes and mockups for the new homepage",
                status_id: 1,
                priority_id: 2,
                project_id: 1,
                assigned_to: 1,
                due_date: "2024-02-15",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                title: "Set up project repository",
                description:
                  "Initialize Git repository and set up CI/CD pipeline",
                status_id: 2,
                priority_id: 1,
                project_id: 1,
                assigned_to: 1,
                due_date: "2024-02-10",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ] as any,
          });
        } else {
          resolve({
            success: true,
            data: [] as any,
          });
        }
      }, 300); // Simulate network delay (shorter for better UX)
    });
  }

private async makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // If mock is explicitly enabled, serve mock and stop here
  if (USE_MOCK) {
    return this.getMockResponse<T>(
      endpoint,
      (options.method as string) || "GET",
      options.body,
    );
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    if (isDevelopment) {
      console.log("🌐 API Request:", {
        method: options.method || "GET",
        url,
        headers: this.getAuthHeaders(),
        body: options.body,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timeout"), 15000);

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try { errorData = await response.json(); } catch {}
      return {
        success: false,
        message:
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        errors: errorData?.errors,
      };
    }

    const data = await response.json().catch(() => null);
    if (data == null) {
      return { success: false, message: "Invalid JSON response from server" };
    }

    return { success: true, data: data.data ?? data, message: data.message };
  } catch (error: any) {
    console.error("🚨 API Error:", error);
    return {
      success: false,
      message:
        error?.name === "AbortError"
          ? "Request timeout"
          : error?.message || "Network error occurred",
    };
  }
}


  // Authentication endpoints
async login(
  credentials: LoginCredentials,
): Promise<ApiResponse<{ user: User | null; token: string }>> {
  // Never mock here unless USE_MOCK=true
  if (USE_MOCK) {
    return this.getMockResponse<{ user: User; token: string }>(
      "/auth/login",
      "POST",
      JSON.stringify(credentials),
    );
  }

  const endpoint = "/auth/login";
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        message: err?.message || `HTTP ${res.status}: ${res.statusText}`,
        errors: err?.errors,
      };
    }

    const raw = await res.json();

    // normalize tokens
    const access =
      raw?.data?.access ?? raw?.access ?? raw?.token ?? raw?.access_token ?? null;
    const refresh =
      raw?.data?.refresh ?? raw?.refresh ?? raw?.refresh_token ?? null;

    if (!access) {
      return { success: false, message: "Login failed - no access token returned" };
    }

    // store tokens
    localStorage.setItem("auth_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);

    // fetch profile right away so refresh doesn’t flip you back to Demo
    const profile = await this.getProfile();
    if (profile.success && profile.data) {
      localStorage.setItem("user", JSON.stringify(profile.data));
    }

    return {
      success: true,
      data: { user: (profile.success && profile.data) || null, token: access },
      message: raw?.message || "Login successful",
    };
  } catch (e: any) {
    return { success: false, message: e?.message || "Network error" };
  }
}




// Returns: ApiResponse<{ user: User; access_token: string }>
async register(
  credentials: RegisterCredentials
): Promise<ApiResponse<{ user: User; access_token: string }>> {
  const endpoint = "/auth/register"; // Django: .../api/auth/register

  try {
    console.log(`📝 Using registration endpoint: ${endpoint}`);

    // Send only what your Django RegisterSerializer expects
    // Adjust if your serializer uses `name` instead of first/last,
    // or if phone field is named differently.
    const registrationData = {
      first_name: credentials.first_name || "",
      last_name: credentials.last_name || "",
      phone_number: credentials.phone || (credentials as any).phone_number || "",
      company: credentials.company || "",
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.password_confirmation,
      // role: credentials.role, // ← include only if your serializer accepts it
    };

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      // Do NOT send Authorization for register; just JSON
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      return {
        success: false,
        message: errorData.message || "Registration failed",
        errors: errorData.errors,
      };
    }

    // Parse once
    const raw: any = await response.json();
    console.log("🧾 Register response:", raw);

    // Normalize shapes:
    // { success, data: { user, access_token, refresh_token } }
    // or { user, access_token } or { data: { access } }
    const user: User | null = raw?.data?.user ?? raw?.user ?? null;

    const access_token: string | null =
      raw?.data?.access_token ??
      raw?.access_token ??
      raw?.data?.access ??
      raw?.access ??
      null;

    const refresh_token: string | null =
      raw?.data?.refresh_token ?? raw?.refresh_token ?? raw?.data?.refresh ?? raw?.refresh ?? null;

    if (!user || !access_token) {
      return {
        success: false,
        message:
          raw?.message ||
          "Registration failed - invalid response (missing user or access token)",
        errors: raw?.errors,
      };
    }

    // Persist session
    localStorage.setItem("auth_token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      success: true,
      data: { user, access_token },
      message: raw?.message || "Registration successful",
    };
  } catch (error: any) {
    console.log(`⚠️ Registration endpoint ${endpoint} failed:`, error?.message);
  }

  // Dev fallback
  if (isDevelopment) {
    console.warn("🔄 Registration API failed, using emergency mock fallback");
    return this.getMockResponse<{ user: User; access_token: string; message: string }>(
      "/users/signup",
      "POST",
      JSON.stringify(credentials)
    );
  }

  return {
    success: false,
    message:
      "Registration failed - unable to connect to registration service. Please contact support.",
  };
}

  async requestPasswordReset(
    email: ResetPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/email", {
      method: "POST",
      body: JSON.stringify(email),
    });
  }

  async resendEmailVerification(
    email: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(
    token: string,
  ): Promise<ApiResponse<{ message: string; user?: User }>> {
    return this.makeRequest<{ message: string; user?: User }>("/email/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(
    credentials: ResetPasswordCredentials,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/reset", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

async getProfile(): Promise<ApiResponse<User>> {
  if (USE_MOCK) return this.getMockResponse<User>("/user", "GET");
  return this.makeRequest<User>("/user");
}

  // User Management - matching documentation
async getUsers(): Promise<ApiResponse<User[]>> {
  return this.makeRequest<User[]>("/users/");        // <-- add trailing slash
}

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${id}`);
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/dashboard/statistics");
  }

  async getTasks(params?: { project?: number }): Promise<ApiResponse<BackendTask[]>> {
  const qs = params?.project ? `?project=${params.project}` : "";
  return this.makeRequest<BackendTask[]>(`/tasks/${qs}`);
}

  // Task Management - matching documentation
async createTask(task: Partial<Task> & {
  // allowing UI-friendly fields if they’re passed
  projectId?: number;
  name?: string;
  assigneeIds?: string[];
  customFields?: Record<string, any>;
}): Promise<ApiResponse<BackendTask>> {
  // map UI -> backend
  const body: any = {
    project: task.project_id ?? task.projectId,                   // accept either
    title: task.title ?? task.name,
    description: task.description ?? "",
    status: task.status_id ? undefined : (task as any).status || "to-do",
    priority: task.priority_id ? undefined : (task as any).priority || "medium",
    progress: (task as any).progress ?? 0,
    due_date: task.due_date ?? (task as any).dueDate ?? null,
    custom_fields: task.customFields ?? {},
  };

  // only include if provided
  const uiAssignees = (task as any).assigneeIds as string[] | undefined;
  if (uiAssignees) {
    body.assignee_ids = uiAssignees.map((s) => Number(s)).filter(Number.isFinite);
  }

  return this.makeRequest<BackendTask>("/tasks/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}


async updateTask(
  id: number,
  patch: Partial<{
    projectId: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    dueDate: string | null;
    assigneeIds: string[];
    customFields: Record<string, any>;
  } & Task>
): Promise<ApiResponse<BackendTask>> {
  const body: any = {};

  if (patch.projectId !== undefined) body.project = patch.projectId;
  if ((patch as any).project_id !== undefined) body.project = (patch as any).project_id;
  if (patch.name !== undefined) body.title = patch.name;
  if ((patch as any).title !== undefined) body.title = (patch as any).title;
  if (patch.description !== undefined) body.description = patch.description;
  if ((patch as any).status !== undefined) body.status = (patch as any).status;
  if ((patch as any).priority !== undefined) body.priority = (patch as any).priority;
  if ((patch as any).progress !== undefined) body.progress = (patch as any).progress;
  if (patch.dueDate !== undefined) body.due_date = patch.dueDate;
  if ((patch as any).due_date !== undefined) body.due_date = (patch as any).due_date;
  if (patch.customFields !== undefined) body.custom_fields = patch.customFields;

  if (patch.assigneeIds !== undefined) {
    body.assignee_ids = patch.assigneeIds.map((s) => Number(s)).filter(Number.isFinite);
  }

  return this.makeRequest<BackendTask>(`/tasks/${id}/`, {
    method: "PATCH",                          // <-- PATCH not PUT
    body: JSON.stringify(body),
  });
}


  async deleteTask(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // Task Media
  async getTaskMedia(taskId: number): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/tasks/get-media?task_id=${taskId}`);
  }

  async uploadTaskMedia(taskId: number, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("task_id", taskId.toString());

    return this.makeRequest<any>("/tasks/upload-media", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
  }

  // Project Management
 async getProjects(): Promise<ApiResponse<Project[]>> {
  return this.makeRequest<Project[]>("/projects/");  // <-- add trailing slash
}

  async createProject(
    project: Partial<Project>,
  ): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(project),
    });
  }

  async updateProject(
    id: number,
    project: Partial<Project>,
  ): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>("/projects/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...project }),
    });
  }

async deleteProject(id: number): Promise<ApiResponse<any>> {
  // note the id in the path and trailing slash, no body needed
  return this.makeRequest<any>(`/projects/${id}/`, {
    method: "DELETE",
  });
}

  // Status Management
  async getStatuses(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/statuses");
  }

  async createStatus(status: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/status/store", {
      method: "POST",
      body: JSON.stringify(status),
    });
  }

  // Priority Management
  async getPriorities(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/priorities");
  }

  async createPriority(priority: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/priority/store", {
      method: "POST",
      body: JSON.stringify(priority),
    });
  }

  // Notes Management
  async getNotes(): Promise<ApiResponse<Note[]>> {
    return this.makeRequest<Note[]>("/notes");
  }

  async createNote(note: Partial<Note>): Promise<ApiResponse<Note>> {
    return this.makeRequest<Note>("/notes/store", {
      method: "POST",
      body: JSON.stringify(note),
    });
  }

  async updateNote(
    id: number,
    note: Partial<Note>,
  ): Promise<ApiResponse<Note>> {
    return this.makeRequest<Note>("/notes/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...note }),
    });
  }

  async deleteNote(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/notes/destroy", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Meetings Management
  async getMeetings(): Promise<ApiResponse<Meeting[]>> {
    return this.makeRequest<Meeting[]>("/meetings");
  }

  async createMeeting(
    meeting: Partial<Meeting>,
  ): Promise<ApiResponse<Meeting>> {
    return this.makeRequest<Meeting>("/meetings/store", {
      method: "POST",
      body: JSON.stringify(meeting),
    });
  }

  async updateMeeting(
    id: number,
    meeting: Partial<Meeting>,
  ): Promise<ApiResponse<Meeting>> {
    return this.makeRequest<Meeting>("/meetings/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...meeting }),
    });
  }

  async deleteMeeting(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/meetings/destroy", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Todos Management - matching documentation
  async getTodos(): Promise<ApiResponse<Todo[]>> {
    return this.makeRequest<Todo[]>("/todos");
  }

  async createTodo(todo: Partial<Todo>): Promise<ApiResponse<Todo>> {
    return this.makeRequest<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(id: number, todo: Partial<Todo>): Promise<ApiResponse<Todo>> {
    return this.makeRequest<Todo>("/todos", {
      method: "PUT",
      body: JSON.stringify({ id, ...todo }),
    });
  }

  async deleteTodo(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/todos/${id}`, {
      method: "DELETE",
    });
  }

  // Time Tracker - as per documentation
  async startTimeTracker(data?: { task_id?: number; description?: string }): Promise<ApiResponse<TimeEntry>> {
    return this.makeRequest<TimeEntry>("/time-tracker/start", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }

  async stopTimeTracker(id: number): Promise<ApiResponse<TimeEntry>> {
    return this.makeRequest<TimeEntry>(`/time-tracker/${id}/stop`, {
      method: "POST",
    });
  }

  async getTimeEntries(): Promise<ApiResponse<TimeEntry[]>> {
    return this.makeRequest<TimeEntry[]>("/time-tracker");
  }

  async deleteTimeEntry(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/time-tracker/${id}`, {
      method: "DELETE",
    });
  }

  // Tags Management - as per documentation
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.makeRequest<Tag[]>("/tags");
  }

  async createTag(tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.makeRequest<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify(tag),
    });
  }

  async updateTag(id: number, tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.makeRequest<Tag>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(tag),
    });
  }

  async deleteTag(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/tags/${id}`, {
      method: "DELETE",
    });
  }

  // Support Tickets - as per documentation
  async getTickets(): Promise<ApiResponse<SupportTicket[]>> {
    return this.makeRequest<SupportTicket[]>("/tickets");
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    return this.makeRequest<SupportTicket>("/tickets", {
      method: "POST",
      body: JSON.stringify(ticket),
    });
  }

  async getTicket(id: number): Promise<ApiResponse<SupportTicket>> {
    return this.makeRequest<SupportTicket>(`/tickets/${id}`);
  }

  // Leave Requests
  async getLeaveRequests(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/leave-requests");
  }

  async createLeaveRequest(request: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/leave-requests/store", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateLeaveRequest(
    id: number,
    request: any,
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/leave-requests/update", {
      method: "POST",
      body: JSON.stringify({ id, ...request }),
    });
  }

  async deleteLeaveRequest(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/leave-requests/destroy/${id}`, {
      method: "DELETE",
    });
  }

  // Workspaces
  async getWorkspaces(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/workspaces");
  }

  async createWorkspace(workspace: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/workspaces/store", {
      method: "POST",
      body: JSON.stringify(workspace),
    });
  }

 // Notifications Service Methods
async getNotificationTypes(): Promise<ApiResponse<any[]>> {
  return this.makeRequest<any[]>("/notifications/types");
}

async listNotifications(): Promise<ApiResponse<any[]>> {
  return this.makeRequest<any[]>("/notifications");
}

async getUnreadNotificationsCount(): Promise<ApiResponse<{ count: number }>> {
  return this.makeRequest<{ count: number }>("/unread-notifications");
}

async getNotificationUrl(id: number): Promise<ApiResponse<{ url: string }>> {
  return this.makeRequest<{ url: string }>(`/notifications/${id}/url`);
}

async markAllAsRead(): Promise<ApiResponse<any>> {
  return this.makeRequest<any>("/notifications/mark-as-read", {
    method: "POST",
  });
}

async updateNotificationStatus(
  id: number,
  status: string
): Promise<ApiResponse<any>> {
  return this.makeRequest<any>(`/notifications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

async deleteNotification(id: number): Promise<ApiResponse<any>> {
  return this.makeRequest<any>(`/notifications/destroy/${id}`, {
    method: "DELETE",
  });
}

async deleteMultipleNotifications(ids: number[]): Promise<ApiResponse<any>> {
  return this.makeRequest<any>("/notifications", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}
  // Clients
  async getClients(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/clients");
  }

  async createClient(client: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/clients/store", {
      method: "POST",
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/clients/update", {
      method: "POST",
      body: JSON.stringify({ id, ...client }),
    });
  }

  async deleteClient(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/clients/destroy/${id}`, {
      method: "DELETE",
    });
  }

  // Settings
  async getSettings(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/settings/general_settings");
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/settings/update", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // User Management
  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async createUser(userData: any): Promise<ApiResponse<User>> {
    return this.makeRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Test API connectivity
  // Social Authentication
  async socialLogin(
    credentials: SocialLoginCredentials,
  ): Promise<ApiResponse<SocialAuthResponse>> {
    // Try multiple possible social auth endpoints
    const endpoints = [
      `/auth/google`, // Google OAuth endpoint
      `/auth/social/${credentials.provider}`, // RESTful pattern
      "/social/auth", // Generic social auth endpoint
      "/auth/social", // Alternative pattern
      `/login/${credentials.provider}`, // Simple pattern
    ];

    for (const endpoint of endpoints) {
      try {
        if (isDevelopment) {
          console.log(`🔐 Trying social login endpoint: ${endpoint}`);
        }

        // For Google auth endpoint, send just the token
        const requestBody = endpoint === '/auth/google' 
          ? JSON.stringify({ token: credentials.token })
          : JSON.stringify({
              ...credentials,
              isApi: true,
            });

        const response = await this.makeRequest<SocialAuthResponse>(endpoint, {
          method: "POST",
          body: requestBody,
        });

        if (response.success && response.data) {
          // Handle different response formats
          const accessToken = (response.data as any).access_token || (response.data as any).token;
          const user = (response.data as any).user;
          
          if (accessToken && user) {
            localStorage.setItem("auth_token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            
            // Update response data format
            response.data = {
              user: user,
              token: accessToken,
            } as SocialAuthResponse;
            
            if (isDevelopment) {
              console.log(
                `✅ Social login successful with endpoint: ${endpoint}`,
              );
            }
            return response;
          }
        } else if (response.success === false) {
          // Check if this is a routing error vs authentication error
          if (
            response.message?.includes("404") ||
            response.message?.includes("Method Not Allowed") ||
            response.message?.includes("not supported") ||
            response.message?.toLowerCase().includes("route")
          ) {
            if (isDevelopment) {
              console.log(
                `⚠️ Endpoint ${endpoint} not available, trying next...`,
              );
            }
            // Continue to next endpoint
          } else {
            // This is a real authentication error, return it
            console.log(
              `❌ Social login failed with valid endpoint ${endpoint}:`,
              response.message,
            );
            return response;
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Endpoint ${endpoint} failed:`, error.message);
        // Continue to next endpoint
      }
    }

    // If all endpoints fail in development, try mock response as emergency fallback
    if (isDevelopment) {
      console.warn(
        "🔄 All social login endpoints failed, using emergency mock fallback",
      );
      return this.getMockResponse<SocialAuthResponse>(
        `/auth/social/${credentials.provider}`,
        "POST",
        JSON.stringify(credentials),
      );
    }

    // In production, return detailed error
    return {
      success: false,
      message:
        "Social login failed - unable to find working authentication endpoint. Tried: " +
        endpoints.join(", ") +
        ". Please contact support.",
    };
  }

  async assignUsersToTask(taskId: number, userIds: number[]) {
    return this.makeRequest<any>(`/tasks/${taskId}/assign_users/`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds }),
    });
  }


  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log("🔍 Testing API connectivity...");

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort("Request timeout");
      }
    }, 5000);

    try {
      // Try a simple GET request to test connectivity
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          message:
            "✅ API connection successful! Server is reachable and responding.",
        };
      } else {
        return {
          success: false,
          message: `⚠️ API responded with status ${response.status}: ${response.statusText}. Check server configuration.`,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("🚨 API connectivity test failed:", error);

      let errorMessage = "🔌 Connection failed: ";

      if (error.name === "AbortError") {
        errorMessage +=
          "Request timeout (5s) - server is not responding in time. This is normal during development.";
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage +=
          "Network error - server may be down or CORS not configured.";
      } else if (error.message && error.message.includes("CORS")) {
        errorMessage +=
          "CORS policy blocking request - check server CORS settings.";
      } else {
        errorMessage += error.message || "Unknown network error";
      }

      if (isDevelopment) {
        errorMessage +=
          "\n\n🔧 Development Mode: Mock data is available with credentials:\n📧 Email: demo@example.com\n🔒 Password: password";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export const apiService = new ApiService();
