'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StepIndicator } from './step-indicator'
import { PlatformCard, type Platform } from './platform-card'
import { ConfigStep } from './config-step'
import { VerifyStep } from './verify-step'

type WizardStep = 1 | 2 | 3

const ALL_PLATFORMS: Platform[] = ['claude', 'chatgpt', 'gemini', 'openclaw']
const DISABLED_PLATFORMS = new Set<Platform>(['gemini'])

interface ConnectionWizardProps {
  onDone?: () => void
}

export function ConnectionWizard({ onDone }: ConnectionWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)

  // Focus management: focus first interactive element when step changes
  useEffect(() => {
    const container = stepContentRef.current
    if (!container) return
    const timer = setTimeout(() => {
      const focusable = container.querySelector<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [step])

  const handlePlatformSelect = useCallback((p: Platform) => {
    setPlatform(p)
    setStep(2)
  }, [])

  const goToStep = useCallback((s: WizardStep) => {
    setStep(s)
  }, [])

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-page-title font-semibold">Connect Your AI Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow these steps to connect your AI agent to todo4
        </p>
      </div>

      <div className="mb-8">
        <StepIndicator currentStep={step} />
      </div>

      <div ref={stepContentRef}>
        {step === 1 && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {ALL_PLATFORMS.map((p) => (
              <PlatformCard
                key={p}
                platform={p}
                selected={platform === p}
                disabled={DISABLED_PLATFORMS.has(p)}
                onSelect={handlePlatformSelect}
              />
            ))}
          </div>
        )}

        {step === 2 && platform && (
          <ConfigStep
            platform={platform}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}

        {step === 3 && platform && (
          <VerifyStep
            platform={platform}
            onBack={() => goToStep(2)}
            onDone={onDone}
          />
        )}
      </div>
    </div>
  )
}
