"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const mobileQuery = "(max-width: 767px)"

function subscribeMobile(callback: () => void) {
  const mq = window.matchMedia(mobileQuery)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery).matches
}

function getMobileServerSnapshot() {
  return false // Assume desktop during SSR
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "bottom-center" : "bottom-right"}
      visibleToasts={2}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
