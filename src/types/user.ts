export type AuthProvider = 'google' | 'microsoft' | 'mobile' | 'email';

export interface UserEntry {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  provider: AuthProvider;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'active' | 'pending' | 'suspended';
  welcomeNotificationSent: boolean;
  notificationType?: 'email' | 'sms' | 'both';
  notificationDetails?: string;
  emailPayload?: {
    subject: string;
    html: string;
    text?: string;
    sentAt: string;
  };
}

export interface AuthSession {
  user: UserEntry;
  token: string;
  expiresAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  userName: string;
  recipient: string;
  recipientType: 'email' | 'sms';
  subject: string;
  contentPreview: string;
  htmlContent?: string;
  textContent?: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp: string;
}
