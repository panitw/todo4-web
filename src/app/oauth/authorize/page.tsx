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

    const params = new URLSearchParams({
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    });

    const fetchUrl = `${apiUrl()}/oauth/authorize?${params.toString()}`;
    let res: Response;
    try {
      res = await fetch(fetchUrl, {
        redirect: 'manual',
        cache: 'no-store',
      });
    } catch (err) {
      console.error('[oauth/authorize] fetch failed:', fetchUrl, err);
      return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Authorization Error</h1>
            <p className="text-muted-foreground">Could not reach the authorization server.</p>
          </div>
        </main>
      );
    }

    // With redirect:'manual', redirects come back as status 302 (Node) or 0/opaqueredirect (browser)
    const location = res.headers.get('location');
    if ((res.status >= 300 && res.status < 400) || res.type === 'opaqueredirect') {
      if (location) {
        // Extract params_sig from the redirect URL
        try {
          const redirectUrl = new URL(location);
          const sigFromApi = redirectUrl.searchParams.get('params_sig');
          if (sigFromApi) {
            params.set('params_sig', sigFromApi);
            redirect(`/oauth/authorize?${params.toString()}`);
          }
        } catch {
          console.error('[oauth/authorize] Failed to parse redirect URL:', location);
        }
      }
    }

    // If todo-api returned an error, show it
    const errorBody = await res.text();
    console.error('[oauth/authorize] API error:', res.status, errorBody);
    let errorMessage = 'Authorization request failed.';
    try {
      const parsed = JSON.parse(errorBody) as { message?: string; error?: { message?: string } };
      // NestJS wraps errors in {error: {message: "..."}}
      if (parsed.error?.message) errorMessage = parsed.error.message;
      else if (parsed.message) errorMessage = parsed.message;
    } catch {
      // ignore parse errors
    }

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

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-1 text-center">Authorize Agent</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          <span className="font-medium text-foreground">{clientName}</span> wants to access your todo4 account.
        </p>

        <div className="rounded-lg border border-border bg-muted/50 p-4 mb-6">
          <p className="text-sm font-medium text-foreground mb-1">Requested permissions</p>
          <p className="text-sm text-muted-foreground">{scopeLabel}</p>
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
      </div>
    </main>
  );
}
