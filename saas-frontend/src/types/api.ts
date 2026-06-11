// ────────────────────────────────────────────────────────────────
// API Types — mirrors backend response shapes
// ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ApiError {
  detail: string
  status_code?: number
  errors?: Record<string, string[]>
}
