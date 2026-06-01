import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  /** Fired when all 6 digits are filled (paste or typing the last digit). */
  onComplete?: (code: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

const LENGTH = 6

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: OtpInputProps) {
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

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  function updateDigits(next: string[]) {
    setDigits(next)
    const joined = next.join("").slice(0, LENGTH)
    onChange(joined)
    if (joined.length === LENGTH && onComplete) {
      onComplete(joined)
    }
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
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of 6`}
          className={cn(
            "h-14 w-12 rounded-lg border border-gray-200 bg-white text-center text-2xl font-semibold text-foreground",
            "transition-colors duration-150 hover:bg-gray-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}
