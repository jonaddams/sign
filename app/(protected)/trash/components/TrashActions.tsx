'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface TrashActionsProps {
  documentId: string;
  documentName: string;
}

export function TrashActions({ documentId, documentName }: TrashActionsProps) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore document');
      }

      toast({
        title: 'Document Restored',
        description: 'Document has been moved back to Sent',
      });

      router.refresh();
    } catch (error) {
      console.error('Error restoring document:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore document',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${documentName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/permanent-delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete document');
      }

      toast({
        title: 'Document Deleted',
        description: 'Document has been permanently removed',
      });

      router.refresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to permanently delete document',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer"
        onClick={handleRestore}
        disabled={isRestoring || isDeleting}
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        Restore
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="cursor-pointer"
        onClick={handlePermanentDelete}
        disabled={isRestoring || isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete Forever
      </Button>
    </div>
  );
}
