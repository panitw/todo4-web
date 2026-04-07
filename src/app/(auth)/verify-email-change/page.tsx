import { Suspense } from 'react';
import { VerifyEmailChangeForm } from '@/components/auth/verify-email-change-form';

export default function VerifyEmailChangePage() {
  return (
    <Suspense>
      <VerifyEmailChangeForm />
    </Suspense>
  );
}
