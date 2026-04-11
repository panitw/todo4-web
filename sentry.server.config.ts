import * as Sentry from '@sentry/nextjs'

const HEADER_KEYS_TO_SCRUB = new Set(['authorization', 'cookie', 'set-cookie'])
const FIELD_KEYS_TO_SCRUB = new Set([
  'authorization',
  'password',
  'token',
  'cookie',
  'set-cookie',
  'secret',
])

function scrubSensitiveFields(value: unknown): void {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      scrubSensitiveFields(item)
    }
    return
  }

  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (FIELD_KEYS_TO_SCRUB.has(key.toLowerCase())) {
      delete record[key]
      continue
    }
    scrubSensitiveFields(record[key])
  }
}

function scrubRequestHeaders(headers: Record<string, unknown>): void {
  for (const key of Object.keys(headers)) {
    if (HEADER_KEYS_TO_SCRUB.has(key.toLowerCase())) {
      delete headers[key]
    }
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_GIT_SHA ?? undefined,
  tracesSampleRate: parseFloat(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
      (process.env.NODE_ENV === 'production' ? '0.2' : '1.0'),
  ),
  debug: false,
  initialScope: {
    tags: { service: 'todo-web' },
  },
  beforeSend(event) {
    if (event.request?.headers) {
      scrubRequestHeaders(event.request.headers as Record<string, unknown>)
    }
    scrubSensitiveFields(event.request?.data)
    scrubSensitiveFields(event.extra)
    scrubSensitiveFields(event.contexts)
    return event
  },
})
