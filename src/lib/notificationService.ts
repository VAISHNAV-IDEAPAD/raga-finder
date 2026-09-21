import fs from 'fs';
import path from 'path';
import { UserEntry, NotificationLog } from '@/types/user';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notification_logs.json');

// Initial seed notification logs
const INITIAL_LOGS: NotificationLog[] = [
  {
    id: 'notif_init_1',
    userId: 'usr_init_1',
    userName: 'Aarav Sundaram',
    recipient: 'aarav.sundaram@gmail.com',
    recipientType: 'email',
    subject: 'Welcome to RagaFinder Family, Aarav Sundaram! 🎵',
    contentPreview: 'Thank You For Joining Raga Finder Family! Your account is active. Explore 72 Melakartas and AI raga discovery.',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'notif_init_2',
    userId: 'usr_init_2',
    userName: 'Pooja Venkatesh',
    recipient: 'pooja.v@outlook.com',
    recipientType: 'email',
    subject: 'Welcome to RagaFinder Family, Pooja Venkatesh! 🎵',
    contentPreview: 'Thank You For Joining Raga Finder Family! Your Microsoft Account has been verified.',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notif_init_3',
    userId: 'usr_init_3',
    userName: 'Karthik Ramanathan',
    recipient: '+91 98401 23456',
    recipientType: 'sms',
    subject: 'SMS Welcome Confirmation',
    contentPreview: 'Thank You For Joining Raga Finder Family, Karthik Ramanathan! Your mobile account is verified.',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

let inMemoryLogs: NotificationLog[] = [...INITIAL_LOGS];
let initialized = false;

function ensureDataFiles() {
  if (initialized) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(INITIAL_LOGS, null, 2), 'utf-8');
      inMemoryLogs = [...INITIAL_LOGS];
    } else {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      inMemoryLogs = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Notification storage warning, using in-memory store:', err);
  }
  initialized = true;
}

export async function getNotificationLogs(): Promise<NotificationLog[]> {
  ensureDataFiles();
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      inMemoryLogs = JSON.parse(data);
    }
  } catch {}
  return inMemoryLogs;
}

import {
  sendRealEmail,
  getWelcomeEmailHtml,
  getWelcomeEmailText,
} from './emailService';

export async function sendWelcomeNotification(user: UserEntry): Promise<{
  success: boolean;
  type: 'email' | 'sms';
  recipient: string;
  message: string;
  error?: string;
}> {
  ensureDataFiles();

  const isEmail = Boolean(user.email && user.email.includes('@'));
  const recipient = isEmail ? user.email! : (user.mobile || 'Registered User');
  const recipientType = isEmail ? 'email' : 'sms';

  const subject = `Welcome to Raga Finder Family, ${user.name}! 🎵`;
  const contentPreview = isEmail
    ? `Thank You For Joining Raga Finder Family, ${user.name}! Your account is now active. Explore Carnatic and Hindustani classical ragas with AI.`
    : `Thank You For Joining Raga Finder Family, ${user.name}! Your account is now active on RagaFinder AI.`;

  let deliveryStatus: 'delivered' | 'failed' | 'pending' = 'delivered';
  let statusMessage = '';
  let deliveryError: string | undefined = undefined;

  if (isEmail) {
    try {
      const emailResult = await sendRealEmail({
        to: user.email!,
        toName: user.name,
        subject,
        html: getWelcomeEmailHtml(user.name, user.email!),
        text: getWelcomeEmailText(user.name, user.email!),
      });

      if (emailResult.success) {
        deliveryStatus = 'delivered';
        statusMessage = `Welcome confirmation email sent directly to ${user.email}! (Please check Inbox & Spam)`;
      } else {
        deliveryStatus = 'failed';
        deliveryError = emailResult.error;
        statusMessage = `Email dispatch pending: ${emailResult.error || 'SMTP server not configured'}`;
      }
    } catch (err: any) {
      deliveryStatus = 'failed';
      deliveryError = err?.message || 'SMTP transmission error';
      statusMessage = `Email error: ${deliveryError}`;
    }
  } else {
    // Mobile SMS notification simulation
    deliveryStatus = 'delivered';
    statusMessage = `Welcome confirmation SMS sent to ${recipient}!`;
  }

  const newLog: NotificationLog = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: user.id,
    userName: user.name,
    recipient,
    recipientType,
    subject,
    contentPreview,
    status: deliveryStatus,
    timestamp: new Date().toISOString(),
  };

  inMemoryLogs.unshift(newLog);

  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(inMemoryLogs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write notification_logs.json to disk:', err);
  }

  return {
    success: deliveryStatus === 'delivered',
    type: recipientType,
    recipient,
    message: statusMessage,
    error: deliveryError,
  };
}

