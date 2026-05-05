export const API_BASE_URL = 'http://localhost:5080/api'

export function getAuthHeaders(token: string | null, cognitoId?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (cognitoId) headers['X-Cognito-Id'] = cognitoId
  return headers
}
