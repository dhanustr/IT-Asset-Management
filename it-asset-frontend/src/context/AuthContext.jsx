
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

// Mendukung response yang mengembalikan data secara langsung
// maupun melalui properti "data".
function extractUser(responseData) {
  return (
    responseData?.user ??
    responseData?.data?.user ??
    responseData?.data ??
    responseData
  )
}

function extractToken(responseData) {
  return (
    responseData?.token ??
    responseData?.data?.token ??
    responseData?.data?.data?.token ??
    null
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = localStorage.getItem('token')

      if (!token) {
        if (active) setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        const profile = extractUser(response.data)

        if (!profile?.id || !profile?.role) {
          throw new Error('Respons profil pengguna tidak valid.')
        }

        if (active) setUser(profile)
      } catch {
        localStorage.removeItem('token')

        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  async function login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })

    const token = extractToken(response.data)

    if (!token) {
      throw new Error(
        'Token tidak ditemukan dalam respons login. Periksa format respons API.',
      )
    }

    localStorage.setItem('token', token)

    try {
      const profileResponse = await api.get('/auth/me')
      const profile = extractUser(profileResponse.data)

      if (!profile?.id || !profile?.role) {
        throw new Error('Data profil pengguna tidak valid.')
      }

      if (!['ADMIN', 'USER'].includes(profile.role)) {
        throw new Error('Role pengguna tidak dikenali.')
      }

      setUser(profile)
      return profile
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }

  return context
}
