export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('mora_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mora_device_id', id);
  }
  return id;
}
