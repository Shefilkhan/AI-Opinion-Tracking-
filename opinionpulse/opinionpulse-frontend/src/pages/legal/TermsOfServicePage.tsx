import { LegalPageLayout } from "@/components/legal/LegalPageLayout"

export function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="May 28, 2026">
      <section>
        <h2>1. Acceptance of terms</h2>
        <p>
          By creating an OpinionPulse account or using our services, you agree to these Terms
          of Service. If you do not agree, do not use the platform.
        </p>
      </section>

      <section>
        <h2>2. About OpinionPulse</h2>
        <p>
          OpinionPulse is an AI-powered opinion tracking platform that aggregates publicly
          available content from third-party sources (such as Reddit, news outlets, GitHub,
          YouTube, and others) and provides sentiment analysis, search, and related insights.
        </p>
      </section>

      <section>
        <h2>3. Accounts and eligibility</h2>
        <p>
          You must provide accurate registration information and keep your credentials secure.
          You are responsible for activity under your account. You must be at least 16 years
          old to use OpinionPulse.
        </p>
      </section>

      <section>
        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for unlawful, harassing, or deceptive purposes</li>
          <li>Attempt to bypass rate limits, access controls, or security measures</li>
          <li>Scrape, resell, or redistribute our data or AI outputs without permission</li>
          <li>Upload malware or interfere with platform operation</li>
        </ul>
      </section>

      <section>
        <h2>5. Subscriptions and billing</h2>
        <p>
          Paid plans, usage limits, and feature access are described on our pricing page.
          During beta, some billing features may be inactive. We may change plan features or
          pricing with reasonable notice before charges apply.
        </p>
      </section>

      <section>
        <h2>6. Third-party content</h2>
        <p>
          Search results and summaries may include content from third-party platforms.
          OpinionPulse does not endorse third-party content and is not responsible for its
          accuracy or availability. Your use of external links is at your own risk.
        </p>
      </section>

      <section>
        <h2>7. AI-generated insights</h2>
        <p>
          Sentiment scores, summaries, and forecasts are generated automatically and may
          contain errors. They are provided for informational purposes only and should not
          be relied on as professional, legal, or financial advice.
        </p>
      </section>

      <section>
        <h2>8. Intellectual property</h2>
        <p>
          OpinionPulse branding, software, and original content remain our property. You
          retain rights to data you submit; you grant us a license to process it to provide
          the service.
        </p>
      </section>

      <section>
        <h2>9. Termination</h2>
        <p>
          You may close your account at any time. We may suspend or terminate access if you
          violate these terms or if required for security or legal reasons.
        </p>
      </section>

      <section>
        <h2>10. Disclaimer and liability</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the
          fullest extent permitted by law, OpinionPulse is not liable for indirect or
          consequential damages arising from use of the platform.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:shefilpathan@gmail.com" className="le-auth-link">
            shefilpathan@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  )
}
