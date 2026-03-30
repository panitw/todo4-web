'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEP_NAMES = ['Select Platform', 'Configure', 'Verify'] as const

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mx-auto w-full max-w-xs" role="list" aria-label="Wizard progress">
      {/* Circles + lines row */}
      <div className="flex items-center justify-between">
        {STEP_NAMES.map((name, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <div key={stepNum} className="contents" role="listitem">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary text-primary-foreground',
                  !isCompleted && !isCurrent && 'border border-border bg-background text-muted-foreground'
                )}
                aria-label={`Step ${stepNum} of 3: ${name}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="size-4" /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={cn(
                    'h-px flex-1 mx-2',
                    stepNum < currentStep ? 'bg-green-500' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      {/* Labels row — each label centered under its circle */}
      <div className="mt-1.5 flex justify-between">
        {STEP_NAMES.map((name, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3
          const isCurrent = stepNum === currentStep
          return (
            <div key={stepNum} className="relative flex w-8 justify-center">
              <span
                className={cn(
                  'absolute text-xs whitespace-nowrap',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
