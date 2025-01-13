'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Award, TrendingUp } from 'lucide-react';
import Link from "next/link";
//import Image from "next/image";

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">About Our Mission</h1>
            <p className="text-xl text-gray-300">
              Fighting corruption in Kenya through transparency, accountability, and community action.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Who We Are</h2>
          <p className="text-gray-600 mb-8">
            We are a community-driven platform dedicated to exposing and combating corruption in Kenya. Our mission is to empower citizens with the tools and platform they need to report, track, and expose corrupt practices at all levels of government and institutions.
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Approach</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
                <p className="text-gray-600">
                  We believe in the power of collective action. Our platform brings together thousands of citizens working to create a corruption-free Kenya through transparent reporting and accountability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Evidence Based</h3>
                <p className="text-gray-600">
                  Every report on our platform is backed by verifiable evidence. We maintain high standards of documentation to ensure the integrity and credibility of all corruption reports.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real Impact</h3>
                <p className="text-gray-600">
                  Our platform has helped identify and expose numerous cases of corruption, leading to real investigations and changes in both public and private institutions.
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="space-y-6 text-gray-600 mb-12">
            <p>
              Our platform enables citizens to submit detailed reports about corruption, complete with evidence and documentation. These reports are then verified and made public, creating a transparent record of corrupt practices and officials.
            </p>
            <p>
              Users can:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit evidence-based corruption reports</li>
              <li>Rate and review corrupt officials and institutions</li>
              <li>Track corruption cases and their progress</li>
              <li>Access detailed metrics and analytics about corruption in Kenya</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-6">Join the Fight Against Corruption</h2>
          <p className="text-gray-600 mb-8">
            We invite all Kenyan citizens to join our platform and contribute to the fight against corruption. Together, we can build a more transparent and accountable society for future generations.
          </p>

          <div className="flex justify-center mt-12">
            <Link 
              href="/submit"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              Start Reporting Corruption
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}