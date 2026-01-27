'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
import { DocumentViewer } from '@/components/document-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SignatureStatus {
  participantId: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'CANCELLED';
  participantName: string;
  participantEmail: string;
}

interface DocumentPreviewDialogProps {
  documentName: string;
  documentFilePath: string;
  annotations: any;
  signatureStatuses: SignatureStatus[];
  signedCount: number;
  totalSigners: number;
}

export function DocumentPreviewDialog({
  documentName,
  documentFilePath,
  annotations,
  signatureStatuses,
  signedCount,
  totalSigners,
}: DocumentPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="h-4 w-4" />
        Preview Document
        <span className="ml-auto">
          {signedCount === totalSigners && totalSigners > 0 ? (
            <Badge variant="default" className="bg-green-600">
              All Signed
            </Badge>
          ) : (
            <Badge variant="outline">
              {signedCount}/{totalSigners} Signed
            </Badge>
          )}
        </span>
      </Button>

      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {documentName}
              </DialogTitle>
              <DialogDescription>Read-only preview with signature status</DialogDescription>
            </div>
            <div>
              {signedCount === totalSigners && totalSigners > 0 ? (
                <Badge variant="default" className="bg-green-600">
                  All Signed
                </Badge>
              ) : (
                <Badge variant="outline">
                  {signedCount}/{totalSigners} Signed
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isOpen && (
            <DocumentViewer
              documentFilePath={documentFilePath}
              annotations={annotations}
              signatureStatuses={signatureStatuses}
              height="100%"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
