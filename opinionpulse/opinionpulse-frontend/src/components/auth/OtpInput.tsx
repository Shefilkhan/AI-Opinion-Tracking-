import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { inputSurface } from "@/lib/ui-classes"

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const LENGTH = 6

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [digits, setDigits] = useState<string[]>(
    Array(LENGTH)
      .fill("")
      .map((_, i) => value[i] ?? "")
  )

  useEffect(() => {
    const next = Array(LENGTH)
      .fill("")
      .map((_, i) => value[i] ?? "")
    setDigits(next)
  }, [value])

  function updateDigits(next: string[]) {
    setDigits(next)
    onChange(next.join("").slice(0, LENGTH))
  }

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = digit
    updateDigits(next)
    if (digit && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH)
    const next = Array(LENGTH)
      .fill("")
      .map((_, i) => pasted[i] ?? "")
    updateDigits(next)
    const focusIndex = Math.min(pasted.length, LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div
      className="flex justify-center gap-2"
      role="group"
      aria-label="6-digit verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            "size-11 rounded-lg text-center text-lg font-semibold text-foreground sm:size-12",
            inputSurface
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}
