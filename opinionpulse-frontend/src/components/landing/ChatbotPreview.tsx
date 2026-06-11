import { Bot, User } from "lucide-react"
import { chatbotMock } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ChatbotPreview() {
  return (
    <section id="demo" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="AI Opinion Assistant"
          title="Ask questions in plain language"
          description="Get instant summaries of what people are saying — powered by your tracked data and NLP insights."
        />
        <Card className="mx-auto max-w-2xl border-slate-800/60 bg-slate-900/70 shadow-2xl">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-800">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <Bot className="size-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-white">Opinion Assistant</CardTitle>
              <p className="text-xs text-slate-500">Mock conversation preview</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600/20 px-4 py-3 text-sm text-slate-200">
                {chatbotMock.userMessage}
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
                <User className="size-4 text-slate-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
                <Bot className="size-4 text-white" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm leading-relaxed text-slate-300">
                {chatbotMock.assistantMessage}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
