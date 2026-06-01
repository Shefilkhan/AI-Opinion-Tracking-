import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  isSettingsSectionId,
  type SettingsSectionId,
} from "@/components/settings/settingsNav"

function parseHash(hash: string): SettingsSectionId {
  const id = hash.replace(/^#/, "").toLowerCase()
  if (isSettingsSectionId(id)) return id
  return "profile"
}

export function useSettingsSection() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() =>
    parseHash(location.hash)
  )

  useEffect(() => {
    setActiveSection(parseHash(location.hash))
  }, [location.hash])

  useEffect(() => {
    if (!location.hash) {
      navigate("/settings#profile", { replace: true })
    }
  }, [location.hash, navigate])

  const setSection = useCallback(
    (section: SettingsSectionId) => {
      setActiveSection(section)
      navigate(`/settings#${section}`, { replace: true })
    },
    [navigate]
  )

  return { activeSection, setSection }
}
