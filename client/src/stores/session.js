import { create } from 'zustand';
import { safeUser } from '../lib/utils';

export const useSession = create((set) => ({
  user: null,
  token: null,
  expired: false,
  login: ({ token, ...profile }) =>
    set({ token, user: safeUser(profile), expired: false }),
  updateUser: (profile) => set({ user: safeUser(profile) }),
  expire: () => set({ expired: true }),
  logout: () => set({ user: null, token: null, expired: false }),
}));

let counter = 0;

export const useNotice = create((set) => ({
  notice: null,
  show: (message) => set({ notice: { id: ++counter, message } }),
  dismiss: () => set({ notice: null }),
}));