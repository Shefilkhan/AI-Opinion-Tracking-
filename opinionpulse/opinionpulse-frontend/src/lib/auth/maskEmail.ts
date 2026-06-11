export function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  const visible = local.length <= 1 ? "*" : `${local[0]}***`
  return `${visible}@${domain}`
}
