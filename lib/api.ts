import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com"

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) => api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getProfile: () => api.get("/auth/profile"),

  updateProfile: (data: Partial<{ name: string; phone: string; email: string }>) => api.put("/auth/profile", data),

  changePassword: (data: { current_password: string; new_password: string }) => api.put("/auth/change-password", data),

  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),

  resetPassword: (data: { token: string; password: string }) => api.post("/auth/reset-password", data),
}

// Users API
export const usersApi = {
  getUsers: (params?: { page?: number; per_page?: number; q?: string }) => api.get("/users", { params }),

  createUser: (data: { name: string; email: string; password: string; role_id: number; phone?: string }) =>
    api.post("/users", data),

  getUser: (id: number) => api.get(`/users/${id}`),

  updateUser: (id: number, data: Partial<{ name: string; email: string; phone: string; status: string }>) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}`),

  searchUsers: (q: string) => api.get("/users/search", { params: { q } }),
}

// Plans API
export const plansApi = {
  getPlans: () => api.get("/plans"),

  createPlan: (data: { name: string; duration_days: number; price: number }) => api.post("/plans", data),

  updatePlan: (id: number, data: Partial<{ name: string; duration_days: number; price: number }>) =>
    api.put(`/plans/${id}`, data),

  deletePlan: (id: number) => api.delete(`/plans/${id}`),
}

// Subscribers API
export const subscribersApi = {
  getSubscribers: (params?: { page?: number; per_page?: number; q?: string }) => api.get("/subscribers", { params }),

  createSubscriber: (data: {
    user_id: number
    plan_id: number
    start_date: string
    end_date: string
    status: string
  }) => api.post("/subscribers", data),

  getSubscriber: (id: number) => api.get(`/subscribers/${id}`),

  updateSubscriber: (id: number, data: any) => api.put(`/subscribers/${id}`, data),

  deleteSubscriber: (id: number) => api.delete(`/subscribers/${id}`),

  changePlan: (id: number, data: { plan_id: number; start_date: string; end_date: string }) =>
    api.put(`/subscribers/${id}/plan`, data),
}

// Workspaces API
export const workspacesApi = {
  getWorkspaces: () => api.get("/workspaces"),

  createWorkspace: (data: { name: string; location: string; capacity: number }) => api.post("/workspaces", data),

  getWorkspace: (id: number) => api.get(`/workspaces/${id}`),

  updateWorkspace: (id: number, data: Partial<{ name: string; location: string; capacity: number }>) =>
    api.put(`/workspaces/${id}`, data),

  deleteWorkspace: (id: number) => api.delete(`/workspaces/${id}`),
}

// Bookings API
export const bookingsApi = {
  getBookings: (params?: {
    user_id?: number
    workspace_id?: number
    status?: string
    from?: string
    to?: string
    page?: number
    per_page?: number
  }) => api.get("/bookings", { params }),

  createBooking: (data: {
    workspace_id: number
    user_id: number
    start_time: string
    end_time: string
    deposit: number
    total_price: number
  }) => api.post("/bookings", data),

  getBooking: (id: number) => api.get(`/bookings/${id}`),

  updateBooking: (id: number, data: any) => api.put(`/bookings/${id}`, data),

  deleteBooking: (id: number) => api.delete(`/bookings/${id}`),

  updateBookingStatus: (id: number, data: { status: "pending" | "confirmed" | "cancelled" }) =>
    api.put(`/bookings/${id}/status`, data),

  checkAvailability: (params: { workspace_id: number; start_time: string; end_time: string }) =>
    api.get("/bookings/availability", { params }),
}

// Products API
export const productsApi = {
  getProducts: () => api.get("/products"),

  createProduct: (data: { name: string; price: number; stock: number }) => api.post("/products", data),

  getProduct: (id: number) => api.get(`/products/${id}`),

  updateProduct: (id: number, data: Partial<{ name: string; price: number; stock: number }>) =>
    api.put(`/products/${id}`, data),

  deleteProduct: (id: number) => api.delete(`/products/${id}`),

  sellProduct: (data: { product_id: number; user_id: number; quantity: number }) => api.post("/products/sell", data),

  consumeProduct: (data: { product_id: number; subscriber_id: number; quantity: number }) =>
    api.post("/products/consume", data),

  updateStock: (id: number, data: { stock: number }) => api.put(`/products/${id}/stock`, data),
}

// Transactions API
export const transactionsApi = {
  getTransactions: (params?: { user_id?: number; type?: string; from?: string; to?: string; page?: number }) =>
    api.get("/transactions", { params }),

  createTransaction: (data: { user_id: number; type: "payment" | "withdrawal"; amount: number; description: string }) =>
    api.post("/transactions", data),

  getTransaction: (id: number) => api.get(`/transactions/${id}`),

  deleteTransaction: (id: number) => api.delete(`/transactions/${id}`),

  getTransactionReport: (params: { from: string; to: string; group_by: "day" | "month" }) =>
    api.get("/transactions/report", { params }),
}

// Expenses API
export const expensesApi = {
  getExpenses: () => api.get("/expenses"),

  createExpense: (data: { name: string; amount: number; description: string }) => api.post("/expenses", data),

  getExpense: (id: number) => api.get(`/expenses/${id}`),

  deleteExpense: (id: number) => api.delete(`/expenses/${id}`),

  getExpenseReport: () => api.get("/expenses/report"),
}

// Attendance API
export const attendanceApi = {
  getAttendance: (params?: { employee_id?: number; from?: string; to?: string }) => api.get("/attendance", { params }),

  checkIn: (data: { employee_id: number; check_in: string }) => api.post("/attendance/check-in", data),

  checkOut: (data: { employee_id: number; check_out: string }) => api.post("/attendance/check-out", data),

  getEmployeeAttendance: (employee_id: number) => api.get(`/attendance/${employee_id}`),

  getAttendanceReport: () => api.get("/attendance/report"),
}

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),

  getFinancialReport: (params: { from: string; to: string }) => api.get("/dashboard/financial", { params }),

  getUsageReport: (params: { workspace_id?: number; from: string; to: string }) =>
    api.get("/dashboard/usage", { params }),
}
