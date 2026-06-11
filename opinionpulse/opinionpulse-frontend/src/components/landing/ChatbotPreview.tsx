import { Bot, User } from "lucide-react"
import { chatbotMock } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function ChatbotPreview() {
  return (
    <section id="demo" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="AI Opinion Assistant"
          title="Ask questions in plain language"
          description="Get instant summaries of what people are saying — powered by your tracked data and NLP insights."
        />
        <Card className={cn("mx-auto max-w-2xl", cardSurface)}>
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">Opinion Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Mock conversation preview</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                {chatbotMock.userMessage}
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground">
                {chatbotMock.assistantMessage}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
