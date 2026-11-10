import api from './client';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  googleAuth: (idToken: string) =>
    api.post('/auth/google', { idToken }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ── Posts ─────────────────────────────────────────────────────
export const postsApi = {
  getFeed: (page = 1, limit = 20) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getTrending: () => api.get('/posts/trending'),
  search: (q: string, page = 1) => api.get(`/posts/search?q=${encodeURIComponent(q)}&page=${page}`),
  create: (formData: FormData) => api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, content: string) => api.put(`/posts/${id}`, { content }),
  delete: (id: string) => api.delete(`/posts/${id}`),
  toggleLike: (id: string) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id: string) => api.post(`/posts/${id}/bookmark`),
  getBookmarks: (page = 1) => api.get(`/posts/bookmarks?page=${page}`),
  getComments: (postId: string, page = 1) => api.get(`/posts/${postId}/comments?page=${page}`),
  addComment: (postId: string, content: string, parentId?: string) =>
    api.post(`/posts/${postId}/comments`, { content, parentId }),
  deleteComment: (postId: string, commentId: string) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
};

// ── Doctors ───────────────────────────────────────────────────
export const doctorsApi = {
  list: (params?: { page?: number; search?: string; specialty?: string; minRating?: number }) =>
    api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getMyProfile: () => api.get('/doctors/my-profile'),
  register: (data: object) => api.post('/doctors/register', data),
  update: (data: object) => api.put('/doctors/profile', data),
  setAvailability: (availability: object[]) => api.put('/doctors/availability', { availability }),
  addReview: (id: string, rating: number, comment?: string) =>
    api.post(`/doctors/${id}/reviews`, { rating, comment }),
  verify: (id: string, approved: boolean, notes?: string) =>
    api.put(`/doctors/${id}/verify`, { approved, notes }),
};

// ── Appointments ──────────────────────────────────────────────
export const appointmentsApi = {
  book: (data: object) => api.post('/appointments', data),
  list: (status?: string) => api.get('/appointments', { params: { status } }),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put(`/appointments/${id}/status`, { status, notes }),
};

// ── Children ──────────────────────────────────────────────────
export const childrenApi = {
  list: () => api.get('/children'),
  get: (id: string) => api.get(`/children/${id}`),
  create: (data: object) => api.post('/children', data),
  update: (id: string, data: object) => api.put(`/children/${id}`, data),
  delete: (id: string) => api.delete(`/children/${id}`),
  getGrowth: (id: string) => api.get(`/children/${id}/growth`),
  addGrowth: (id: string, data: object) => api.post(`/children/${id}/growth`, data),
  getMilestones: (id: string) => api.get(`/children/${id}/milestones`),
  toggleMilestone: (childId: string, milestoneId: string) =>
    api.patch(`/children/${childId}/milestones/${milestoneId}`),
  getVaccinations: (id: string) => api.get(`/children/${id}/vaccinations`),
  addVaccination: (id: string, data: object) => api.post(`/children/${id}/vaccinations`, data),
};

// ── User ──────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: object) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteAccount: () => api.delete('/users/account'),
  search: (q: string, page = 1) => api.get(`/users/search?q=${encodeURIComponent(q)}&page=${page}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  summary: (childId: string) => api.get(`/ai/summary/${childId}`),
  status: () => api.get('/ai/status'),
  // Note: chat uses SSE, not axios — see useAiChat hook
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  getPendingDoctors: (page = 1) => api.get(`/admin/doctors/pending?page=${page}`),
  getReports: (page = 1) => api.get(`/admin/reports?page=${page}`),
  resolveReport: (id: string, action: string) => api.put(`/admin/reports/${id}`, { action }),
  getAuditLogs: (page = 1) => api.get(`/admin/audit-logs?page=${page}`),
};
