'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface OAuthConsentFormProps {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  paramsSig: string;
  clientName: string;
}

export function OAuthConsentForm({
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod,
  paramsSig,
  clientName,
}: OAuthConsentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const decisionRef = useRef<HTMLInputElement>(null);

  function handleConsent(decision: 'approve' | 'deny') {
    setSubmitting(true);
    if (decisionRef.current) {
      decisionRef.current.value = decision;
    }
    formRef.current?.submit();
  }

  return (
    <form ref={formRef} method="POST" action="/oauth/consent">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="redirect_uri" value={redirectUri} />
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="code_challenge" value={codeChallenge} />
      <input
        type="hidden"
        name="code_challenge_method"
        value={codeChallengeMethod}
      />
      <input type="hidden" name="params_sig" value={paramsSig} />
      <input type="hidden" name="agent_name" value={clientName} />
      <input type="hidden" name="decision" ref={decisionRef} value="approve" />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={submitting}
          onClick={() => handleConsent('deny')}
        >
          Deny
        </Button>
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="flex-1"
          disabled={submitting}
          onClick={() => handleConsent('approve')}
        >
          {submitting ? 'Authorizing...' : 'Approve'}
        </Button>
      </div>
    </form>
  );
}
