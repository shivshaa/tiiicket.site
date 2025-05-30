import { supabase } from "./supabase"

export interface AuthUser {
  id: string
  wallet_address: string
  created_at: string
  last_login: string
  is_active: boolean
}

export interface AuthSession {
  user: AuthUser
  token: string
  isValid: boolean
}

/**
 * Check if user is authenticated with valid JWT token
 */
export async function checkAuthStatus(): Promise<AuthSession | null> {
  try {
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (!token || !userData) {
      return null
    }

    // Verify token with Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("auth-middleware", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (error || !data.valid) {
      // Clear invalid session
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      return null
    }

    return {
      user: JSON.parse(userData),
      token,
      isValid: true,
    }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return null
  }
}

/**
 * Sign out user and clear session
 */
export function signOut(): void {
  localStorage.removeItem("auth_token")
  localStorage.removeItem("user_data")
  localStorage.removeItem("userSession")
  window.location.href = "/sign-in"
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const userData = localStorage.getItem("user_data")
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token")
}

/**
 * Make authenticated API request
 */
export async function authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("No authentication token found")
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
}
