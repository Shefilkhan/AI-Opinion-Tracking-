export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs text-white">
        ⚡
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-2 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className="ml-2 text-xs text-gray-400">Pulse AI is analyzing...</span>
      </div>
    </div>
  )
}
