import { useCallback, useEffect, useRef, useState } from "react"
import { useSettingsUnsaved } from "@/components/settings/SettingsUnsavedContext"

export function useSectionDirty<T>(
  initial: T,
  equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
) {
  const savedRef = useRef(initial)
  const [draft, setDraft] = useState<T>(initial)
  const dirty = !equals(draft, savedRef.current)

  const commitSaved = useCallback((next: T) => {
    savedRef.current = next
    setDraft(next)
  }, [])

  const discard = useCallback(() => {
    setDraft(savedRef.current)
  }, [])

  return { draft, setDraft, dirty, commitSaved, discard, saved: savedRef.current }
}

export function useRegisterSectionSave(
  sectionId: string,
  dirty: boolean,
  onSave: () => void | Promise<void>,
  onDiscard: () => void
) {
  const { registerUnsaved } = useSettingsUnsaved()

  useEffect(() => {
    if (dirty) {
      registerUnsaved({ sectionId, onSave, onDiscard })
    } else {
      registerUnsaved(null)
    }
    return () => registerUnsaved(null)
  }, [dirty, sectionId, onSave, onDiscard, registerUnsaved])
}
