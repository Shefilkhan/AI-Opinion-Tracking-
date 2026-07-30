type UserMessageProps = {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="chat-user-bubble max-w-[70%] rounded-[18px_18px_4px_18px] px-4 py-3 text-sm leading-relaxed text-white">
        {content}
      </div>
    </div>
  )
}
