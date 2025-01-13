import React from 'react';
import { X } from 'lucide-react';

interface SuccessToastProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessToast({ isOpen, onClose }: SuccessToastProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Kenyan Flag Colors Strip */}
          <div className="flex w-full h-2 mb-4">
            <div className="flex-1 bg-black"></div>
            <div className="flex-1 bg-[#cc0000]"></div>
            <div className="flex-1 bg-[#006600]"></div>
          </div>
          
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          {/* Message */}
          <h3 className="text-2xl font-bold text-gray-900">Asante!</h3>
          <p className="text-center text-gray-600">
            Thank you for submitting your vote. Together we can fight corruption in Kenya.
          </p>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-[#006600] text-white rounded-md hover:bg-[#005500] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}