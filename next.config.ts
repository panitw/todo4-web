import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const mcpUrl = process.env.MCP_URL || 'http://localhost:3002'

const nextConfig: NextConfig = {
  output: 'standalone', // required for minimal Docker image
  async rewrites() {
    return [
      {
        source: '/mcp',
        destination: `${mcpUrl}/mcp`,
      },
      {
        source: '/mcp/:path*',
        destination: `${mcpUrl}/mcp/:path*`,
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
