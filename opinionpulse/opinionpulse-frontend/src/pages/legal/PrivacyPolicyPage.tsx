import { LegalPageLayout } from "@/components/legal/LegalPageLayout"

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="May 28, 2026">
      <section>
        <h2>1. Overview</h2>
        <p>
          OpinionPulse (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This policy
          explains what information we collect, how we use it, and the choices you have when
          using our opinion tracking and sentiment analysis platform.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password (stored hashed),
            and plan preferences
          </li>
          <li>
            <strong>Usage data:</strong> search queries, feature usage, alerts, and
            interaction logs needed to operate the service
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser type, device information,
            and cookies or local storage used for authentication and preferences
          </li>
          <li>
            <strong>Public content:</strong> posts and articles retrieved from third-party
            sources when you run searches — we do not claim ownership of this content
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Provide search, sentiment analysis, dashboards, and AI features</li>
          <li>Authenticate users and enforce plan limits</li>
          <li>Improve reliability, security, and product experience</li>
          <li>Send account-related emails (verification, password reset, alerts you enable)</li>
        </ul>
      </section>

      <section>
        <h2>4. AI processing</h2>
        <p>
          Selected text may be sent to third-party AI providers (such as Groq) to generate
          summaries and sentiment insights. We do not sell your personal data to AI vendors.
          Prompts are used solely to deliver features you request.
        </p>
      </section>

      <section>
        <h2>5. Sharing and disclosure</h2>
        <p>We may share information:</p>
        <ul>
          <li>With service providers that host infrastructure or deliver email/AI services</li>
          <li>When required by law or to protect rights, safety, and platform integrity</li>
          <li>With your consent or at your direction</li>
        </ul>
        <p>We do not sell personal information to advertisers.</p>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          We retain account and search history according to your plan (e.g. 7–30 days or
          longer on higher tiers). You may request deletion of your account data by
          contacting us.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We use industry-standard measures including encrypted connections, hashed
          passwords, and access controls. No method of transmission over the internet is
          100% secure.
        </p>
      </section>

      <section>
        <h2>8. Your choices</h2>
        <ul>
          <li>Update profile information in account settings</li>
          <li>Manage notification and privacy preferences in settings</li>
          <li>Clear local preferences stored in your browser</li>
          <li>Request access or deletion by emailing us</li>
        </ul>
      </section>

      <section>
        <h2>9. Cookies and local storage</h2>
        <p>
          We use cookies and local storage for session tokens, theme preferences, and
          recent searches. You can disable cookies in your browser, but some features may
          not work correctly.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          OpinionPulse is not directed at children under 16. We do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section>
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will revise the
          &ldquo;Last updated&rdquo; date when changes are posted. Continued use after
          changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          Privacy questions or requests:{" "}
          <a href="mailto:shefilpathan@gmail.com" className="le-auth-link">
            shefilpathan@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  )
}
