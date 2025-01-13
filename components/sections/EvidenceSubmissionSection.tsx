// components/sections/EvidenceSubmissionSection.tsx
import { FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/AuthModal';
import { FileUp } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface EvidenceSubmissionProps {
  type: 'nominee' | 'institution';
  entityId: number;
  onSuccess?: () => void;
}

export function EvidenceSubmissionSection({ type, entityId }: EvidenceSubmissionProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First upload the file if it exists
      let fileUrl = '';
      if (form.file) {
        const formData = new FormData();
        formData.append('file', form.file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
      }

      // Create the evidence
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          fileUrl,
          [type === 'nominee' ? 'nomineeId' : 'institutionId']: entityId,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit evidence');

      toast({
        title: "Success",
        description: "Your evidence has been submitted for review. Thank you for helping fight corruption in Kenya.",
      });

      // Reset form
      setForm({
        title: '',
        description: '',
        file: null,
      });

    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit evidence. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const submissionForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title of Evidence</label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          placeholder="Brief title describing your evidence"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          placeholder="Detailed description of your evidence. Please be specific and include relevant details."
          className="min-h-[120px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Supporting Documents</label>
        <Input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <p className="text-xs text-gray-500 mt-1">
          Accepted formats: PDF, Word documents, Images (JPG, PNG)
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#006600] hover:bg-[#005500]"
      >
        {loading ? (
          <>
            <FileCheck className="w-4 h-4 mr-2" />
            Submitting...
          </>
        ) : (
          <>
            <FileUp className="w-4 h-4 mr-2" />
            Submit Evidence
          </>
        )}
      </Button>
    </form>
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <FileUp className="w-6 h-6 text-[#cc0000]" />
        Submit Evidence
      </h2>

      <p className="text-gray-600 mb-6">
        Help fight corruption in Kenya by submitting evidence. Your submission will be reviewed and verified before being made public. Your identity will be protected.
      </p>

      {isAuthenticated ? (
        submissionForm
      ) : (
        <AuthModal
          trigger={
            <Button className="w-full bg-[#006600] hover:bg-[#005500]">
              Sign in to Submit Evidence
            </Button>
          }
          mode="evidence"
        />
      )}
    </Card>
  );
}