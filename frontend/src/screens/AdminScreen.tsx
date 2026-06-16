import { useState, useEffect } from 'react'
import { useAuth } from '@/context/useAuth'
import { User } from '@/context/AuthContext'
import { API_BASE_URL } from '@/config/api'
import './AdminScreen.css'

interface AdminUser extends User {
  isAdmin: boolean;
}

export function AdminScreen() {
  const { logout, token } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleAdmin = async (userId: number | string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        // Refresh users list
        await fetchUsers()
      } else {
        console.error('Failed to toggle admin status')
      }
    } catch (error) {
      console.error('Error toggling admin status', error)
    }
  }

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="users-table-container">
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.cpf}</td>
                  <td>
                    {u.isAdmin ? (
                      <span className="admin-badge">Admin</span>
                    ) : (
                      <span className="user-badge">User</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className={`toggle-admin-button ${u.isAdmin ? 'revoke' : ''}`}
                      onClick={() => handleToggleAdmin(u.id)}
                    >
                      {u.isAdmin ? 'Revogar Admin' : 'Tornar Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
