// components/sections/EvidenceSubmissionSection.tsx
import { FileUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/AuthModal';

export interface EvidenceSubmissionProps {
  type: 'nominee' | 'institution';
  entityId: number;
}

// Replace this URL with your actual Google Form or JotForm URL
const EVIDENCE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdYo5iyEc7jJgFGQ5d3hM66uVd_s_59JlPReY3szX86TEHXuA/viewform?usp=sharing';

export function EvidenceSubmissionSection({ type, entityId }: EvidenceSubmissionProps) {
  const { isAuthenticated } = useAuth();

  const handleSubmitClick = () => {
    const formUrl = new URL(EVIDENCE_FORM_URL);
    formUrl.searchParams.append('entityId', entityId.toString());
    formUrl.searchParams.append('type', type);
    window.open(formUrl.toString(), '_blank');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileUp className="w-6 h-6 text-[#cc0000]" />
          Submit Evidence
        </h2>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          100% Anonymous Submission
        </div>

        <div className="flex justify-start">
          {isAuthenticated ? (
            <Button 
              onClick={handleSubmitClick}
              className="bg-[#006600] hover:bg-[#005500] px-6"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Submit Evidence
            </Button>
          ) : (
            <AuthModal
              trigger={
                <Button className="bg-[#006600] hover:bg-[#005500] px-6">
                  <FileUp className="w-4 h-4 mr-2" />
                  Submit Evidence
                </Button>
              }
              mode="evidence"
            />
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Verified Evidence
        </h2>
        <div className="text-sm text-gray-500">
          No verified evidence yet
        </div>
      </Card>
    </div>
  );
}