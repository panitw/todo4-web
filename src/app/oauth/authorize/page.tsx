import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { OAuthConsentForm } from './consent-form';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

interface SearchParams {
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  params_sig?: string;
}

export default async function OAuthAuthorizePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    params_sig,
  } = searchParams;

  // Check if user is logged in
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('access_token');

  if (!hasSession) {
    const currentUrl = `/oauth/authorize?${new URLSearchParams(searchParams as Record<string, string>).toString()}`;
    redirect(`/login?next=${encodeURIComponent(currentUrl)}`);
  }

  // If params_sig is missing, call todo-api to validate and get the signature
  if (!params_sig) {
    if (!client_id || !redirect_uri || !scope || !state || !code_challenge || !code_challenge_method) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Invalid Request</h1>
            <p className="text-muted-foreground">Missing required OAuth parameters.</p>
          </div>
        </main>
      );
    }

    // Call the API to validate params and get the HMAC signature
    const validateUrl = `${apiUrl()}/oauth/authorize/validate`;
    let res: Response;
    try {
      res = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          redirect_uri,
          scope,
          state,
          code_challenge,
          code_challenge_method,
        }),
        cache: 'no-store',
      });
    } catch (err) {
      console.error('[oauth/authorize] fetch failed:', validateUrl, err);
      return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Authorization Error</h1>
            <p className="text-muted-foreground">Could not reach the authorization server.</p>
          </div>
        </main>
      );
    }

    const body = await res.json() as { params_sig?: string; scope?: string; error?: { message?: string }; message?: string };

    if (res.ok && body.params_sig) {
      const resolvedScope = body.scope || scope || 'full-access';
      const params = new URLSearchParams({
        client_id,
        redirect_uri,
        scope: resolvedScope,
        state,
        code_challenge,
        code_challenge_method,
        params_sig: body.params_sig,
      });
      redirect(`/oauth/authorize?${params.toString()}`);
    }

    // Validation failed — show error
    const errorMessage = body.error?.message || body.message || 'Authorization request failed.';
    console.error('[oauth/authorize] API error:', res.status, JSON.stringify(body));

    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Authorization Error</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
      </main>
    );
  }

  // We have params_sig — render the consent form
  const clientName = client_id === 'claude-desktop' ? 'Claude Desktop'
    : client_id === 'chatgpt' ? 'ChatGPT'
    : client_id === 'openclaw' ? 'OpenClaw'
    : client_id || 'Unknown Agent';

  const scopeLabel = scope === 'full-access' ? 'Full Access (read & write)' : 'Read Only';
  const scopeDetails = scope === 'full-access'
    ? ['View your tasks and lists', 'Create, edit, and delete tasks', 'Manage subtasks and comments']
    : ['View your tasks and lists'];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-1 text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Authorize Agent</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{clientName}</span> wants to access your todo4 account.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4 mb-6">
          <p className="text-sm font-medium text-foreground mb-2">{scopeLabel}</p>
          <ul className="space-y-1">
            {scopeDetails.map((detail) => (
              <li key={detail} className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-primary">
                  <path d="M13.25 4.75L6 12 2.75 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {detail}
              </li>
            ))}
          </ul>
        </div>

        <OAuthConsentForm
          clientId={client_id!}
          redirectUri={redirect_uri!}
          scope={scope!}
          state={state!}
          codeChallenge={code_challenge!}
          codeChallengeMethod={code_challenge_method!}
          paramsSig={params_sig}
          clientName={clientName}
        />

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can revoke access anytime in Settings.
        </p>
      </div>
    </main>
  );
}
