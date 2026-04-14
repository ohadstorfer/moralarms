function detectLang(): 'es' | 'en' {
  let raw = '';
  if (typeof navigator !== 'undefined') {
    raw = (navigator.language || (navigator as any).userLanguage || '').toString();
  }
  if (!raw) {
    try {
      raw = Intl.DateTimeFormat().resolvedOptions().locale || '';
    } catch {
      raw = '';
    }
  }
  // return raw.toLowerCase().startsWith('es') ? 'es' : 'en';
  // return  'es' ;
  return raw.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export const lang: 'es' | 'en' = detectLang();

type Dict = Record<string, string>;

const en: Dict = {
  // auth
  'auth.signin': 'Sign in',
  'auth.signup': 'Sign up',
  'auth.create_account': 'Create an account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.email_placeholder': 'you@example.com',
  'auth.required': 'Email and password are required.',
  'auth.generic_error': 'Something went wrong',
  'auth.toggle_to_signup': "Don't have an account? Sign up",
  'auth.toggle_to_signin': 'Already have an account? Sign in',

  // home
  'home.title': 'Todo',
  'home.completed': 'Completed',
  'home.clear': 'Clear',
  'home.enable_notifications': 'Enable notifications',
  'home.notif_denied': 'Notifications permission denied.',
  'home.push_unsupported': 'Push not supported in this browser. Add to Home Screen on iOS 16.4+.',
  'home.sign_out': 'Sign out',

  // task form shared
  'task.new_title': 'New Task',
  'task.edit_title': 'Edit Task',
  'task.new_reminder': 'New reminder',
  'task.edit_reminder': 'Edit reminder',
  'task.title': 'Title',
  'task.note': 'Note',
  'task.name': 'Name',
  'task.name_placeholder': 'e.g. Stretching',
  'task.notif_message': 'Notification message',
  'task.notif_placeholder': "e.g. Don't forget to do your yoga!",
  'task.start_time': 'Start time',
  'task.start_time_hint': 'Start time (HH:MM, 24h)',
  'task.repeat_on': 'Repeat on',
  'task.every_day': 'Every day',
  'task.custom': 'Custom',
  'task.repeat_every': 'Repeat every',
  'task.min': 'min',
  'task.hr': 'hr',
  'task.save': 'Save',
  'task.saving': 'Saving…',
  'task.cancel': 'Cancel',
  'task.delete': 'Delete',
  'task.delete_confirm': 'Delete this task?',
  'task.invalid_interval': 'Invalid interval',
  'task.save_failed': 'Failed',
};

const es: Dict = {
  // auth
  'auth.signin': 'Iniciar sesión',
  'auth.signup': 'Registrarse',
  'auth.create_account': 'Crear una cuenta',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.email_placeholder': 'tu@ejemplo.com',
  'auth.required': 'Correo y contraseña son obligatorios.',
  'auth.generic_error': 'Algo salió mal',
  'auth.toggle_to_signup': '¿No tienes cuenta? Regístrate',
  'auth.toggle_to_signin': '¿Ya tienes cuenta? Inicia sesión',

  // home
  'home.title': 'Tareas',
  'home.completed': 'Completadas',
  'home.clear': 'Limpiar',
  'home.enable_notifications': 'Activar notificaciones',
  'home.notif_denied': 'Permiso de notificaciones denegado.',
  'home.push_unsupported': 'Las notificaciones push no son compatibles con este navegador. Añade a la pantalla de inicio en iOS 16.4+.',
  'home.sign_out': 'Cerrar sesión',

  // task form shared
  'task.new_title': 'Nueva tarea',
  'task.edit_title': 'Editar tarea',
  'task.new_reminder': 'Nuevo recordatorio',
  'task.edit_reminder': 'Editar recordatorio',
  'task.title': 'Título',
  'task.note': 'Nota',
  'task.name': 'Nombre',
  'task.name_placeholder': 'p. ej. Estiramientos',
  'task.notif_message': 'Mensaje de notificación',
  'task.notif_placeholder': 'p. ej. ¡No olvides hacer yoga!',
  'task.start_time': 'Hora de inicio',
  'task.start_time_hint': 'Hora de inicio (HH:MM, 24h)',
  'task.repeat_on': 'Repetir los',
  'task.every_day': 'Todos los días',
  'task.custom': 'Personalizado',
  'task.repeat_every': 'Repetir cada',
  'task.min': 'min',
  'task.hr': 'h',
  'task.save': 'Guardar',
  'task.saving': 'Guardando…',
  'task.cancel': 'Cancelar',
  'task.delete': 'Eliminar',
  'task.delete_confirm': '¿Eliminar esta tarea?',
  'task.invalid_interval': 'Intervalo inválido',
  'task.save_failed': 'Error',
};

const dict: Dict = lang === 'es' ? es : en;

export function t(key: keyof typeof en): string {
  return dict[key] ?? en[key] ?? key;
}

// Full weekday name in the detected locale, 0 = Sunday … 6 = Saturday.
export function weekdayName(weekday: number): string {
  const base = new Date(2024, 0, 7); // Sunday
  const d = new Date(base);
  d.setDate(base.getDate() + weekday);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en', { weekday: 'long' }).format(d);
}

// Single-letter weekday abbreviation (Sun..Sat), locale-aware.
export function weekdayShort(weekday: number): string {
  const base = new Date(2024, 0, 7);
  const d = new Date(base);
  d.setDate(base.getDate() + weekday);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en', { weekday: 'narrow' }).format(d);
}
