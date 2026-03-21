import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  output: 'standalone', // required for minimal Docker image
}

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
