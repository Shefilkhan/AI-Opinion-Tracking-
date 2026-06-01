import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { inputSurface } from "@/lib/ui-classes"

type PasswordInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  autoComplete?: string
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
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(inputSurface, "pr-11")}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
