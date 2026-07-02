import { create } from 'zustand';

interface UserInfo {
  id?: number;
  username: string;
  realName?: string;
  role?: string;
  unit?: string;
  avatar?: string;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  setUserInfo: (userInfo: UserInfo) => void;
}

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getInitialUserInfo = (): UserInfo | null => {
  try {
    const info = localStorage.getItem('userInfo');
    return info ? JSON.parse(info) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  userInfo: getInitialUserInfo(),
  login: (token: string, userInfo: UserInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ token, userInfo });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    set({ token: null, userInfo: null });
  },
  setUserInfo: (userInfo: UserInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ userInfo });
  },
}));

export { useAuthStore };
export type { UserInfo, AuthState };
export default useAuthStore;
