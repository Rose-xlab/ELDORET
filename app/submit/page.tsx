"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mail, Phone, Shield, AlertTriangle, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Replace with your actual form URL
const EVIDENCE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdYo5iyEc7jJgFGQ5d3hM66uVd_s_59JlPReY3szX86TEHXuA/viewform?usp=sharing';

export default function SubmitPage() {
  const handleSubmitClick = () => {
    window.open(EVIDENCE_FORM_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              Report Corruption
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Help us fight corruption by reporting incidents. Your identity will be protected.
            </p>
            <Button 
              onClick={handleSubmitClick}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-lg flex items-center gap-2"
            >
              <FileUp className="w-6 h-6" />
              Report Coruption
              <Shield className="w-5 h-5 ml-2 opacity-75" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Contact Us Securely
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Mail className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Email</h3>
                  <p className="text-gray-600 mb-2">Send detailed reports with attachments</p>
                  <a href="mailto:report@corruption.co.ke" className="text-blue-600 hover:underline">
                    report@corruption.co.ke
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Phone className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Hotline</h3>
                  <p className="text-gray-600 mb-2">Available 24/7 for urgent reports</p>
                  <a href="tel:+254700000000" className="text-blue-600 hover:underline">
                    +254 700 000 000
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Reporting Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray-600">
                <li className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <p>Provide specific details about the corrupt activity, including dates, locations, and names of individuals involved.</p>
                </li>
                <li className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <p>Include any supporting evidence you may have (documents, photos, videos, etc.).</p>
                </li>
                <li className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <p>Your identity will be kept confidential. We use secure channels for all communications.</p>
                </li>
                <li className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <p>We may contact you for additional information if needed, but only through your preferred contact method.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}