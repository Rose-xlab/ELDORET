"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Shield, FileUp } from 'lucide-react';

// Replace this URL with your actual Google Form URL
const EVIDENCE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdYo5iyEc7jJgFGQ5d3hM66uVd_s_59JlPReY3szX86TEHXuA/viewform?usp=sharing';

export default function ContactPage() {
  const handleSubmitEvidence = () => {
    window.open(EVIDENCE_FORM_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-gray-300">
              Have questions or concerns? We are here to help.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Mail className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Email</h3>
                  <a href="mailto:info@corruption.co.ke" className="text-blue-600 hover:underline">
                  report@corruptionfreekenya.org

                  </a>
                </div>
              </div>

              
        
            </CardContent>
          </Card>

          {/* Report Corruption Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="w-6 h-6 text-red-600" />
                Report Corruption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                Help us fight corruption in Kenya. Submit evidence or report corrupt activities anonymously.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Your identity will be protected</span>
              </div>

              <div className="space-y-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  onClick={handleSubmitEvidence}
                >
                  <FileUp className="w-5 h-5 mr-2" />
                  Submit
                </Button>

                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}