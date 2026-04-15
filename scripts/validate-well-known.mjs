#!/usr/bin/env node
/**
 * Validates the shape of the two .well-known files used for iOS Universal
 * Links and Android App Links verification. CI runs this on every PR so
 * schema regressions don't ship.
 *
 * Only checks shape, not value correctness — the placeholder Apple TEAM_ID
 * and SHA-256 fingerprints are still valid *strings*. See
 * `public/.well-known/README.md` for the review gate that catches
 * placeholders before a production mobile build ships.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const wellKnownDir = resolve(here, '..', 'public', '.well-known')

const failures = []

function fail(file, msg) {
  failures.push(`[${file}] ${msg}`)
}

async function parseOrFail(path, file) {
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    fail(file, `unable to read: ${err.message}`)
    return null
  }
  try {
    return JSON.parse(raw)
  } catch (err) {
    fail(file, `not valid JSON: ${err.message}`)
    return null
  }
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0
}

async function validateAasa() {
  const file = 'apple-app-site-association'
  const data = await parseOrFail(resolve(wellKnownDir, file), file)
  if (data == null) return

  const applinks = data.applinks
  if (!applinks || typeof applinks !== 'object') {
    fail(file, `missing top-level "applinks" object`)
    return
  }
  const details = applinks.details
  if (!Array.isArray(details) || details.length === 0) {
    fail(file, `"applinks.details" must be a non-empty array`)
    return
  }
  const first = details[0]
  if (!isNonEmptyString(first?.appID)) {
    fail(file, `"applinks.details[0].appID" must be a non-empty string`)
  }
  if (!Array.isArray(first?.paths) || first.paths.length === 0) {
    fail(file, `"applinks.details[0].paths" must be a non-empty array`)
  } else if (!first.paths.includes('/app/*')) {
    fail(file, `"applinks.details[0].paths" must include "/app/*"`)
  }
}

async function validateAssetlinks() {
  const file = 'assetlinks.json'
  const data = await parseOrFail(resolve(wellKnownDir, file), file)
  if (data == null) return

  if (!Array.isArray(data) || data.length === 0) {
    fail(file, `top-level must be a non-empty array`)
    return
  }
  const hit = data.some((entry) => {
    const target = entry?.target
    if (!target || target.namespace !== 'android_app') return false
    if (target.package_name !== 'io.todo4.mobile') return false
    const fps = target.sha256_cert_fingerprints
    if (!Array.isArray(fps) || fps.length === 0) return false
    return fps.every(isNonEmptyString)
  })
  if (!hit) {
    fail(
      file,
      `no entry with target.package_name === "io.todo4.mobile" and a non-empty sha256_cert_fingerprints string array`,
    )
  }
}

await validateAasa()
await validateAssetlinks()

if (failures.length > 0) {
  console.error('.well-known validation failed:\n')
  for (const f of failures) console.error('  - ' + f)
  console.error('\nSee public/.well-known/README.md for the expected shapes.')
  process.exit(1)
}

console.log('✓ apple-app-site-association: shape OK')
console.log('✓ assetlinks.json: shape OK')
