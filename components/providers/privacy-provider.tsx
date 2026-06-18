"use client"

import * as React from "react"

interface PrivacyContextValue {
  hideValues: boolean
  setHideValues: (value: boolean) => void
}

const PrivacyContext = React.createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({
  initialHideValues = false,
  children,
}: {
  initialHideValues?: boolean
  children: React.ReactNode
}) {
  const [hideValues, setHideValues] = React.useState(initialHideValues)

  React.useEffect(() => {
    setHideValues(initialHideValues)
  }, [initialHideValues])

  return (
    <PrivacyContext.Provider value={{ hideValues, setHideValues }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const value = React.useContext(PrivacyContext)
  if (!value) {
    return { hideValues: false, setHideValues: () => undefined }
  }
  return value
}
