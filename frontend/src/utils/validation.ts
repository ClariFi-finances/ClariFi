import Swal from 'sweetalert2'

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.trim()) {
    return { valid: false, error: 'Email é obrigatório' }
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' }
  }
  return { valid: true }
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password.trim()) {
    return { valid: false, error: 'Senha é obrigatória' }
  }
  if (password.length < 6) {
    return { valid: false, error: 'Senha deve ter no mínimo 6 caracteres' }
  }
  return { valid: true }
}

// Password confirmation
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não coincidem' }
  }
  return { valid: true }
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, error: 'Nome é obrigatório' }
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Nome deve ter no mínimo 2 caracteres' }
  }
  return { valid: true }
}

// CPF validation (basic format check)
export function validateCPF(cpf: string): ValidationResult {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (!cleanCPF) {
    return { valid: false, error: 'CPF é obrigatório' }
  }
  if (cleanCPF.length !== 11) {
    return { valid: false, error: 'CPF deve conter 11 dígitos' }
  }
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, error: 'CPF inválido' }
  }
  return { valid: true }
}

// SweetAlert utilities
export function showErrorAlert(title: string, message: string) {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    background: '#121212',
    color: '#FFFFFF',
    confirmButtonColor: '#FFD700',
    confirmButtonText: 'OK',
  })
}

export function showSuccessAlert(title: string, message: string) {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    background: '#121212',
    color: '#FFFFFF',
    confirmButtonColor: '#FFD700',
    confirmButtonText: 'OK',
  })
}

export function showWarningAlert(title: string, message: string) {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    background: '#121212',
    color: '#FFFFFF',
    confirmButtonColor: '#FFD700',
    confirmButtonText: 'OK',
  })
}

export function showInfoAlert(title: string, message: string) {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    background: '#121212',
    color: '#FFFFFF',
    confirmButtonColor: '#FFD700',
    confirmButtonText: 'OK',
  })
}

export function showLoadingAlert(title: string, message: string) {
  return Swal.fire({
    title,
    html: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading()
    },
    background: '#121212',
    color: '#FFFFFF',
  })
}

export function hideAlert() {
  Swal.close()
}

export function showConfirmDialog(
  title: string,
  message: string
): Promise<boolean> {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    background: '#121212',
    color: '#FFFFFF',
    showCancelButton: true,
    confirmButtonColor: '#FFD700',
    cancelButtonColor: '#404040',
    confirmButtonText: 'Sim',
    cancelButtonText: 'Não',
  }).then((result) => result.isConfirmed)
}

