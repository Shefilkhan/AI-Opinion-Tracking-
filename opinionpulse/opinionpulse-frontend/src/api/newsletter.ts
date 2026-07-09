import { apiRequest } from "@/api/client"

export type NewsletterJoinResponse = {
  success: boolean
  message: string
  email: string
  email_sent?: boolean
}

export async function joinNewsletter(email: string): Promise<NewsletterJoinResponse> {
  return apiRequest<NewsletterJoinResponse>("/api/newsletter/join", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
  })
}
