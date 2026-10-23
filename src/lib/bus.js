// A tiny event bus so the command palette and tour can talk to widgets
// without prop-drilling. emit('pomodoro', 'toggle') / on('pomodoro', fn).
export const emit = (type, detail) => window.dispatchEvent(new CustomEvent(`devorbit:${type}`, { detail }));
export const on = (type, fn) => {
  const h = (e) => fn(e.detail);
  window.addEventListener(`devorbit:${type}`, h);
  return () => window.removeEventListener(`devorbit:${type}`, h);
};
