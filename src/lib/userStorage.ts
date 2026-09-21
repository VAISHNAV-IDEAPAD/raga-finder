import fs from 'fs';
import path from 'path';
import { UserEntry } from '@/types/user';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initial seed members to illustrate full fidelity in admin view
const SEED_USERS: UserEntry[] = [
  {
    id: 'usr_init_1',
    name: 'Aarav Sundaram',
    email: 'aarav.sundaram@gmail.com',
    provider: 'google',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'active',
    welcomeNotificationSent: true,
    notificationType: 'email',
    notificationDetails: 'Welcome email delivered to aarav.sundaram@gmail.com',
  },
  {
    id: 'usr_init_2',
    name: 'Pooja Venkatesh',
    email: 'pooja.v@outlook.com',
    provider: 'microsoft',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'active',
    welcomeNotificationSent: true,
    notificationType: 'email',
    notificationDetails: 'Welcome email delivered to pooja.v@outlook.com',
  },
  {
    id: 'usr_init_3',
    name: 'Karthik Ramanathan',
    mobile: '+91 98401 23456',
    provider: 'mobile',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: 'active',
    welcomeNotificationSent: true,
    notificationType: 'sms',
    notificationDetails: 'SMS welcome notification delivered to +91 98401 23456',
  }
];

let inMemoryUsers: UserEntry[] = [...SEED_USERS];
let initialized = false;

function ensureDataFiles() {
  if (initialized) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(SEED_USERS, null, 2), 'utf-8');
      inMemoryUsers = [...SEED_USERS];
    } else {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      inMemoryUsers = JSON.parse(data);
    }
  } catch (err) {
    console.warn('User storage warning: filesystem access error, falling back to memory:', err);
  }
  initialized = true;
}

export async function getUsers(): Promise<UserEntry[]> {
  ensureDataFiles();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      inMemoryUsers = JSON.parse(data);
    }
  } catch {}
  return inMemoryUsers;
}

export const getAllUsers = getUsers;

export async function findUserByIdentifier(identifier: string): Promise<UserEntry | null> {
  const users = await getUsers();
  const clean = identifier.trim().toLowerCase();
  return users.find(u =>
    (u.email && u.email.toLowerCase() === clean) ||
    (u.mobile && u.mobile.replace(/[^0-9+]/g, '') === identifier.replace(/[^0-9+]/g, ''))
  ) || null;
}

export async function saveUser(user: UserEntry): Promise<UserEntry> {
  ensureDataFiles();
  const existingIdx = inMemoryUsers.findIndex(u => u.id === user.id);
  if (existingIdx >= 0) {
    inMemoryUsers[existingIdx] = user;
  } else {
    inMemoryUsers.unshift(user);
  }

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(inMemoryUsers, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write users.json to disk:', err);
  }

  return user;
}

export async function deleteUser(id: string): Promise<boolean> {
  ensureDataFiles();
  inMemoryUsers = inMemoryUsers.filter(u => u.id !== id);
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(inMemoryUsers, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not update users.json after deletion:', err);
  }
  return true;
}

export async function updateUser(id: string, updates: Partial<UserEntry>): Promise<UserEntry | null> {
  ensureDataFiles();
  const idx = inMemoryUsers.findIndex(u => u.id === id);
  if (idx === -1) return null;

  inMemoryUsers[idx] = {
    ...inMemoryUsers[idx],
    ...updates,
  };

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(inMemoryUsers, null, 2), 'utf-8');
  } catch (err) {}

  return inMemoryUsers[idx];
}
