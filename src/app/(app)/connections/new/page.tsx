'use client'

import { useRouter } from 'next/navigation'
import { ConnectionWizard } from '@/components/connections/connection-wizard'

export default function ConnectionWizardPage() {
  const router = useRouter()
  return <ConnectionWizard onDone={() => router.push('/connections')} />
}
