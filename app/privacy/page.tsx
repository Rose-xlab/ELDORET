'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-gray-300">Last Updated: January 8, 2025</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardContent className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mt-0">Introduction</h2>
            <p>
              Corruption Free Kenya is committed to protecting the privacy of our users while advancing our mission of exposing corruption in Kenya. This Privacy Policy explains how we collect, use, and safeguard your information.
            </p>

            <h2 className="text-2xl font-semibold">Information We Collect</h2>
            <h3 className="text-xl font-semibold">1. Information You Provide</h3>
            <ul>
              <li>Account information (name, email, password)</li>
              <li>Report submissions including evidence and documentation</li>
              <li>Ratings and reviews of officials and institutions</li>
              <li>Profile information</li>
              <li>Communications with us</li>
            </ul>

            <h3 className="text-xl font-semibold">2. Automatically Collected Information</h3>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data and interaction with our platform</li>
              <li>Cookies and similar technologies</li>
            </ul>

            <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Facilitate corruption reporting and tracking</li>
              <li>Verify and validate submitted reports</li>
              <li>Improve our platform and services</li>
              <li>Ensure platform security and prevent abuse</li>
              <li>Communicate with users about their submissions</li>
              <li>Generate anonymized corruption statistics and trends</li>
            </ul>

            <h2 className="text-2xl font-semibold">Protection of Whistleblowers</h2>
            <p>
              We take extraordinary measures to protect the identity of whistleblowers and those who submit corruption reports. This includes:
            </p>
            <ul>
              <li>End-to-end encryption of sensitive data</li>
              <li>Option for anonymous submissions</li>
              <li>Strict access controls and data compartmentalization</li>
              <li>Regular security audits and updates</li>
            </ul>

            <h2 className="text-2xl font-semibold">Data Sharing and Disclosure</h2>
            <p>We may share information:</p>
            <ul>
              <li>With law enforcement agencies when legally required</li>
              <li>With trusted partners who assist in platform operations</li>
              <li>In anonymized form for research and statistical purposes</li>
              <li>When necessary to protect rights or safety</li>
            </ul>

            <h2 className="text-2xl font-semibold">Data Security</h2>
            <p>
              We implement robust security measures to protect your data, including encryption, secure servers, regular security assessments, and strict access controls. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-semibold">Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request data deletion</li>
              <li>Object to data processing</li>
              <li>Request data portability</li>
            </ul>

            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p>
              For privacy-related concerns or to exercise your rights, contact us at:
              <br />
              Email: privacy@corruptionfree.co.ke
              <br />
              Address: [Your Physical Address]
            </p>

            <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify users of significant changes via email or platform notifications. Continued use of our platform after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}