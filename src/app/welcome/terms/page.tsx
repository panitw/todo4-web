import { Suspense } from 'react';
import { WelcomeTermsForm } from '@/components/welcome/welcome-terms-form';

export default function WelcomeTermsPage() {
  return (
    <Suspense>
      <WelcomeTermsForm />
    </Suspense>
  );
}
