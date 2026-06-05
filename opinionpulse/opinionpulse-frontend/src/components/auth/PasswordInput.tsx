import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { authInputClass } from "@/lib/auth/authUi"
import { cn } from "@/lib/utils"

type PasswordInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  autoComplete?: string
  success?: boolean
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  autoComplete,
  success,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(authInputClass({ error: ariaInvalid, success }), "pr-11")}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
