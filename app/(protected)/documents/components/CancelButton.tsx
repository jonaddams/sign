'use client';

import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface CancelButtonProps {
  documentId: string;
  documentName: string;
  disabled?: boolean;
}

export function CancelButton({ documentId, documentName, disabled }: CancelButtonProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel "${documentName}"?\n\nThis will:\n- Cancel all pending signature requests\n- Notify recipients that the document was cancelled\n\nThis action cannot be undone.`)) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel document');
      }

      toast({
        title: 'Document Cancelled',
        description: `${data.cancelledSignatureRequests} pending signature request(s) cancelled. ${data.emailsSent} notification(s) sent.`,
      });

      router.refresh();
    } catch (error) {
      console.error('Error cancelling document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel document',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="cursor-pointer text-orange-600 hover:text-orange-700"
      onClick={handleCancel}
      disabled={isCancelling || disabled}
      title={disabled ? 'Cannot cancel this document' : 'Cancel document and notify recipients'}
    >
      <XCircle className="h-4 w-4" />
    </Button>
  );
}
