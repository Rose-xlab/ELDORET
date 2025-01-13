'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Terms of Use</h1>
          <p className="mt-2 text-gray-300">Last Updated: January 8, 2025</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardContent className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mt-0">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CorruptionFreeKenya org platform , you agree to be bound by these Terms of Use. If you disagree with any part of these terms, please do not use our platform.
            </p>

            <h2 className="text-2xl font-semibold">2. Platform Purpose</h2>
            <p>
              Corruption Free Kenya is a platform dedicated to exposing and combating corruption in Kenya through citizen reporting and transparent metrics. Users can submit reports, rate officials and institutions, and access corruption-related data.
            </p>

            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
            <h3 className="text-xl font-semibold">3.1 Account Creation</h3>
            <p>
              Users must:
            </p>
            <ul>
              <li>Provide accurate registration information</li>
              <li>Maintain account security</li>
              <li>Not share account credentials</li>
              <li>Notify us of unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold">3.2 Content Submission</h3>
            <p>
              When submitting reports or content, users must:
            </p>
            <ul>
              <li>Provide truthful and accurate information</li>
              <li>Include verifiable evidence when possible</li>
              <li>Not submit false or malicious reports</li>
              <li>Respect privacy and confidentiality laws</li>
              <li>Not use the platform for personal vendettas</li>
            </ul>

            <h2 className="text-2xl font-semibold">4. Prohibited Activities</h2>
            <p>Users must not:</p>
            <ul>
              <li>Submit false or misleading information</li>
              <li>Harass or defame others</li>
              <li>Violate any applicable laws</li>
              <li>Attempt to compromise platform security</li>
              <li>Use the platform for commercial purposes</li>
              <li>Interfere with platform operations</li>
            </ul>

            <h2 className="text-2xl font-semibold">5. Content Moderation</h2>
            <p>
              We reserve the right to:
            </p>
            <ul>
              <li>Review and verify submitted content</li>
              <li>Remove content that violates our terms</li>
              <li>Suspend or terminate accounts</li>
              <li>Cooperate with law enforcement when required</li>
            </ul>

            <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
            <p>
              All platform content and features are owned by Corruption Free Kenya. Users retain rights to their submitted content but grant us a license to use, modify, and display it on our platform.
            </p>

            <h2 className="text-2xl font-semibold">7. Liability and Disclaimers</h2>
            <p>
              We strive for accuracy but cannot guarantee the completeness or accuracy of user-submitted content. We are not liable for:
            </p>
            <ul>
              <li>Accuracy of user-submitted content</li>
              <li>Actions taken based on platform information</li>
              <li>Technical issues or service interruptions</li>
              <li>Consequential damages or losses</li>
            </ul>

            <h2 className="text-2xl font-semibold">8. Legal Compliance</h2>
            <p>
              Users must comply with all applicable laws and regulations. The platform is intended for use in Kenya and operates under Kenyan law.
            </p>

            <h2 className="text-2xl font-semibold">9. Amendments</h2>
            <p>
              We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of modified terms.
            </p>

            <h2 className="text-2xl font-semibold">10. Contact Information</h2>
            <p>
              For questions about these terms, contact us at:
              <br />
              Email: legal@corruptionfree.co.ke
              <br />
              Address: [Your Physical Address]
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}