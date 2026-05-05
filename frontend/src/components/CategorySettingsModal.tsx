import { useState, useEffect, useMemo } from 'react'
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { API_BASE_URL, getAuthHeaders } from '@/config/api'
import { useAuth } from '@/context/useAuth'
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
  const { user, token } = useAuth()
  const { t } = useI18n()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newEmoji, setNewEmoji] = useState('🏷️')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  useEffect(() => {
    if (!isOpen) return

    let isActive = true
    const loadCategories = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url = user ? `/categories?userId=${user.id}` : '/categories'
        const data = await apiRequest<Category[]>(url)
        if (!isActive) return
        setCategories(data)
      } catch (err) {
        if (!isActive) return
        setError(getErrorMessage(err, t('categoryModal.unknownError', 'Erro desconhecido')))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

  const fetchCategories = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, { headers })
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    loadCategories()

    return () => {
      isActive = false
    }
  }, [isOpen])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('categoryModal.confirmDelete', 'Tem certeza que deseja excluir esta categoria?'))) return

    setIsDeleting(id)
    
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}/remove`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) throw new Error('Falha ao excluir categoria')
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setIsDeleting(null)
      await apiRequest<void>(`/categories/${id}/remove`, { method: 'DELETE' })
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, t('categoryModal.deleteError', 'Erro ao excluir')))
    }
  }

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      const isEditing = !!editingCategory
      const url = isEditing 
        ? `${API_BASE_URL}/categories/${editingCategory.id}/update` 
        : `${API_BASE_URL}/categories/add`
        
      const payload = isEditing 
        ? {
            name: newName.trim(),
            icon: newEmoji.trim(),
            color: editingCategory.color,
          }
        : {
            name: newName.trim(),
            icon: newEmoji.trim(),
            color: newEmoji.trim(),
            userId: user.id,
          }

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) throw new Error('Falha ao adicionar/editar categoria')
      const updatedCat = await response.json()
      setCategories(prev => {
        if (isEditing) {
          return prev.map(cat => cat.id === updatedCat.id ? updatedCat : cat)
        }
        return [...prev, updatedCat]
      })
      const newCat = await apiRequest<Category>('/categories/add', {
        method: 'POST',
        body: {
          name: finalName,
          userId: user.id,
        },
      })
      setCategories(prev => [...prev, newCat])
      setNewName('')
      setNewEmoji('🏷️')
      setEditingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar/editar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card category-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="modal-tag">{t('categoryModal.tag', 'FINANÇAS')}</p>
            <h2 className="modal-title">{t('categoryModal.title', 'Gerenciar Categorias')}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="category-list">
          {isLoading ? (
            <p className="loading-text">{t('common.loading', 'Carregando...')}</p>
          ) : categories.length === 0 ? (
            <p className="empty-text">{t('categoryModal.empty', 'Nenhuma categoria encontrada.')}</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="category-item">
                <span className="category-name">{cat.name}</span>
                <div className="category-actions">
                  <button 
                    type="button" 
                    className="icon-btn edit-btn"
                    onClick={() => {
                      setEditingCategory(cat)
                      setNewName(cat.name)
                      setNewEmoji(cat.icon || '🏷️')
                      setIsFormOpen(true)
                    }}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(cat.id)}
                    title="Excluir"
                    disabled={isDeleting === cat.id}
                  >
                    {isDeleting === cat.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
                <button 
                  type="button" 
                  className="icon-btn delete-btn"
                  onClick={() => handleDelete(cat.id)}
                  title={t('categoryModal.deleteTooltip', 'Excluir')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {isFormOpen && (
          <form className="add-category-form" onSubmit={handleAddEditSubmit}>
            <div className="emoji-picker-container">
              <button 
                type="button" 
                className="emoji-btn" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
            />
            <button type="submit" className="primary-btn add-btn" disabled={isSubmitting || !newName.trim()}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {editingCategory ? 'Salvar' : 'Adicionar'}
            </button>
            <button 
              type="button" 
              className="secondary-btn cancel-btn"
              onClick={() => setIsFormOpen(false)}
            >
              <X size={16} />
              Cancelar
            </button>
          </form>
        )}
            
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
            placeholder={t('categoryModal.newCategoryPlaceholder', 'Nova categoria...')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isAdding}
            required
          />
          <button type="submit" className="primary-btn add-btn" disabled={isAdding || !newName.trim()}>
            <Plus size={18} />
            {t('categoryModal.addBtn', 'Adicionar')}
          </button>
        </form>
      </div>
    </div>
  )
}
