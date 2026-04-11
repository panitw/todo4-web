import { toast, type ExternalToast } from 'sonner';

/**
 * Standardized toast helpers per UX-DR13:
 * - Success: 3s auto-dismiss (Sonner default)
 * - Error: persistent until dismissed
 * - Info: 3s auto-dismiss
 * - Warning (quota): 8s
 */
export function showError(message: string, opts?: ExternalToast) {
  return toast.error(message, { ...opts, duration: Infinity });
}

export function showSuccess(message: string, opts?: ExternalToast) {
  return toast.success(message, opts);
}

export function showInfo(message: string, opts?: ExternalToast) {
  return toast.info(message, opts);
}

export function showWarning(message: string, opts?: ExternalToast) {
  return toast.warning(message, { ...opts, duration: 8000 });
}
