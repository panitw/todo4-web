'use client';

import { useState } from 'react';
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

  async function handleConsent(decision: 'approve' | 'deny') {
    setSubmitting(true);

    const res = await fetch('/oauth/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      redirect: 'manual',
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        params_sig: paramsSig,
        agent_name: clientName,
        decision,
      }),
    });

    // The consent endpoint returns a 302 redirect to the client's callback
    if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 0) {
      // For opaque redirects (redirect: 'manual' in browser), we need to re-submit
      // without manual redirect to let the browser follow it
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/oauth/consent';

      const fields: Record<string, string> = {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        params_sig: paramsSig,
        agent_name: clientName,
        decision,
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      return;
    }

    // If we get here, something unexpected happened
    setSubmitting(false);
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1"
        disabled={submitting}
        onClick={() => handleConsent('deny')}
      >
        Deny
      </Button>
      <Button
        className="flex-1"
        disabled={submitting}
        onClick={() => handleConsent('approve')}
      >
        {submitting ? 'Authorizing...' : 'Approve'}
      </Button>
    </div>
  );
}
