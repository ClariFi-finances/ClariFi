import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/config/api'
import { useAuth } from '@/context/useAuth'
import { Trash2, Plus } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import type { EmojiClickData } from 'emoji-picker-react'
import './CategorySettingsModal.css'

export interface Category {
  id: number
  name: string
  icon?: string
  color?: string
}

interface CategorySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategorySettingsModal({ isOpen, onClose }: CategorySettingsModalProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newEmoji, setNewEmoji] = useState('🏷️')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/categories`)
      if (!response.ok) throw new Error('Falha ao carregar categorias')
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}/remove`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Falha ao excluir categoria')
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return

    setIsAdding(true)
    setError(null)

    const finalName = newEmoji.trim() ? `${newEmoji.trim()} ${newName.trim()}` : newName.trim()

    try {
      const response = await fetch(`${API_BASE_URL}/categories/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          userId: user.id
        })
      })

      if (!response.ok) throw new Error('Falha ao adicionar categoria')
      const newCat = await response.json()
      setCategories(prev => [...prev, newCat])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setIsAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card category-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="modal-tag">FINANÇAS</p>
            <h2 className="modal-title">Gerenciar Categorias</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="category-list">
          {isLoading ? (
            <p className="loading-text">Carregando...</p>
          ) : categories.length === 0 ? (
            <p className="empty-text">Nenhuma categoria encontrada.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="category-item">
                <span className="category-name">{cat.name}</span>
                <button 
                  type="button" 
                  className="icon-btn delete-btn"
                  onClick={() => handleDelete(cat.id)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <form className="add-category-form" onSubmit={handleAdd}>
          <div className="emoji-picker-container">
            <button 
              type="button" 
              className="emoji-btn" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isAdding}
              title="Escolha um emoji"
            >
              {newEmoji}
            </button>
            
            {showEmojiPicker && (
              <div className="emoji-picker-dropdown">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData: EmojiClickData) => {
                    setNewEmoji(emojiData.emoji)
                    setShowEmojiPicker(false)
                  }} 
                />
              </div>
            )}
          </div>
          <input
            type="text"
            className="name-input"
            placeholder="Nova categoria..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isAdding}
            required
          />
          <button type="submit" className="primary-btn add-btn" disabled={isAdding || !newName.trim()}>
            <Plus size={18} />
            Adicionar
          </button>
        </form>
      </div>
    </div>
  )
}
