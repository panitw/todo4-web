import { apiFetch } from './client';

export interface LoginResult {
  /** The API sets an httpOnly access_token cookie on success — no token in body */
  userId: string;
}

export interface RegisterResult {
  message: string;
}

export interface ConfirmEmailChangeResult {
  redirectUrl: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  return apiFetch<RegisterResult>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/logout', {
    method: 'POST',
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function requestLoginOtp(email: string): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/login-otp-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyLoginOtp(
  email: string,
  code: string,
): Promise<LoginResult> {
  return apiFetch<LoginResult>('/api/v1/auth/login-otp-verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function confirmEmailChange(
  token: string,
): Promise<ConfirmEmailChangeResult> {
  return apiFetch<ConfirmEmailChangeResult>('/api/v1/auth/verify-email-change/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
