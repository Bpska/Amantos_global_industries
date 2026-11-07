import type { Role } from '../types';

export const panelHome = (role: Role): string => role === 'ADMIN' ? '/admin' : '/staff';

export const canAccessPanel = (role: Role, panel: Role): boolean => role === panel;
