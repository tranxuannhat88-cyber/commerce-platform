export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'LOCKED_SECURITY';

export type AuthMethodType = 'PHONE_OTP' | 'PASSKEY' | 'EMAIL' | 'GOOGLE' | 'APPLE';

export interface UserIdentity {
  id: string; // e.g. "usr_1029384756"
  user_code: string;
  full_name: string;
  primary_phone: string; // E.164 e.g. "+84988123456"
  primary_email?: string;
  avatar_url?: string;
  status: UserStatus;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAuthMethod {
  id: string;
  user_id: string;
  method_type: AuthMethodType;
  identifier: string; // Phone number or credential ID
  verified_at: string;
  status: 'ACTIVE' | 'REVOKED';
  last_used_at?: string;
  created_at: string;
}

export interface PasskeyCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string; // "iPhone 15 Pro", "Windows Hello", "MacBook Pro"
  device_type: 'apple' | 'android' | 'windows' | 'security_key' | 'generic';
  authenticator_type?: 'platform' | 'cross-platform';
  transports?: string[];
  created_at: string;
  last_used_at: string;
  revoked_at?: string;
}

export type OTPPurpose = 
  | 'REGISTER_OR_LOGIN'
  | 'CLAIM_ACCOUNT'
  | 'CHANGE_PHONE'
  | 'STEP_UP'
  | 'RECOVERY';

export interface OTPChallenge {
  id: string;
  phone_normalized: string;
  otp_hash: string;
  purpose: OTPPurpose;
  attempts: number;
  max_attempts: number;
  expires_at: number; // timestamp ms
  created_at: number;
}

export interface AuthSession {
  id: string;
  user_id: string;
  user: UserIdentity;
  device_name: string;
  ip_address?: string;
  session_token: string;
  last_active_at: string;
  step_up_authenticated_at?: string;
  expires_at: string;
}

export interface StepUpVerificationResult {
  verified: boolean;
  method_used: AuthMethodType;
  verified_at: string;
  expires_at: string;
}
