/**
 * Bridge between the axios layer (outside React) and AuthProvider.
 * AuthProvider registers its signOut so the interceptor can end the session
 * when a refresh ultimately fails.
 */
type LogoutHandler = () => void;

let onLogout: LogoutHandler | null = null;

export const setLogoutHandler = (fn: LogoutHandler | null) => {
  onLogout = fn;
};

export const triggerLogout = () => {
  onLogout?.();
};
