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
  return  'es' ;
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
  'task.name': 'Name',
  'task.name_placeholder': 'e.g., Stretching',
  'task.notif_message': 'Notification message',
  'task.notif_placeholder': "e.g., Don't forget to do your yoga!",
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
  'auth.create_account': 'Crear cuenta',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.email_placeholder': 'tu@ejemplo.com',
  'auth.required': 'Introduce el correo y la contraseña.',
  'auth.generic_error': 'Ha ocurrido un error',
  'auth.toggle_to_signup': '¿No tienes una cuenta? Regístrate',
  'auth.toggle_to_signin': '¿Ya tienes una cuenta? Inicia sesión',

  // home
  'home.title': 'Tareas',
  'home.completed': 'Completadas',
  'home.clear': 'Borrar',
  'home.enable_notifications': 'Activar notificaciones',
  'home.notif_denied': 'Se denegó el permiso para las notificaciones.',
  'home.push_unsupported':
    'Las notificaciones push no son compatibles con este navegador. Añade la app a la pantalla de inicio en iOS 16.4 o posterior.',
  'home.sign_out': 'Cerrar sesión',

  // task form shared
  'task.new_title': 'Nueva tarea',
  'task.edit_title': 'Editar tarea',
  'task.name': 'Nombre',
  'task.name_placeholder': 'P. ej., Estiramientos',
  'task.notif_message': 'Mensaje de notificación',
  'task.notif_placeholder': 'P. ej., ¡No olvides hacer yoga!',
  'task.start_time': 'Hora de inicio',
  'task.start_time_hint': 'Hora de inicio (HH:MM, 24 h)',
  'task.repeat_on': 'Repetir',
  'task.every_day': 'Todos los días',
  'task.custom': 'Personalizado',
  'task.repeat_every': 'Repetir cada',
  'task.min': 'min',
  'task.hr': 'h',
  'task.save': 'Guardar',
  'task.saving': 'Guardando…',
  'task.cancel': 'Cancelar',
  'task.delete': 'Eliminar',
  'task.delete_confirm': '¿Seguro que quieres eliminar esta tarea?',
  'task.invalid_interval': 'Intervalo no válido',
  'task.save_failed': 'No se pudo guardar',
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
