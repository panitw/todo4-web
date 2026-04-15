import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  output: 'standalone', // required for minimal Docker image
  async headers() {
    // iOS Universal Links (Story 18.8): the AASA file has no extension, so
    // Next's default MIME detection can't infer JSON. Apple requires
    // Content-Type: application/json exactly. Do NOT add a redirect on this
    // path — iOS silently drops the domain claim if AASA 3xxs.
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
