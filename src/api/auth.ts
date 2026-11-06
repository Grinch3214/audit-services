import { http } from './http'
import type { LoginBody, User } from './types'

export const authApi = {
  login: (body: LoginBody) => http.post<User>('/auth/login', body, { skipAuthHandler: true }),

  logout: () => http.post<void>('/auth/logout', undefined, { skipAuthHandler: true }),

  me: (signal?: AbortSignal) => http.get<User>('/auth/me', { signal, skipAuthHandler: true }),
}
