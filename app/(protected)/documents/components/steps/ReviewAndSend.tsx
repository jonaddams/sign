'use client';

import { format } from 'date-fns';
import { AlertTriangle, Check, Clock, File, Info, Mail, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useDocumentFlow } from '../../context/DocumentFlowContext';

export default function ReviewAndSend() {
  const { state, dispatch } = useDocumentFlow();
  const _isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  // Set this step as valid on component mount
  useEffect(() => {
    dispatch({
      type: 'VALIDATE_STEP',
      payload: { step: 'step4Valid', isValid: true },
    });
  }, [dispatch]);

  const handleSendDocument = async () => {
    if (!state.document.id) {
      toast({
        title: 'Missing document ID',
        description: 'Cannot send document without an ID. Please make sure the document is saved first.',
        variant: 'destructive',
      });
      return;
    }

    if (state.recipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'You must add at least one recipient before sending the document.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Call the API to send the document
      const response = await fetch(`/api/documents/${state.document.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send document');
      }

      const _data = await response.json();

      toast({
        title: 'Document sent successfully',
        description: `Document "${state.document.title}" has been sent to ${state.recipients.length} recipients.`,
        variant: 'default',
      });

      // Redirect to dashboard after successful send
      router.push('/dashboard');
    } catch (error) {
      console.error('Error sending document:', error);
      toast({
        title: 'Failed to send document',
        description:
          error instanceof Error ? error.message : 'There was an error sending your document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format roles to be more readable
  const formatRole = (role: string) => {
    switch (role) {
      case 'signer':
        return 'Needs to sign';
      case 'viewer':
        return 'Can view only';
      case 'cc':
        return 'Receives a copy';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Review and Send</h2>
          <Badge variant="outline" className="ml-2">
            Step 5 of 5
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">Review your document details and send it to recipients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <File className="h-5 w-5 text-primary" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                <dd className="mt-1">{state.document.title}</dd>
              </div>

              {state.document.saveAsTemplate && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Saved as Template</dt>
                  <dd className="mt-1">{state.document.templateName || state.document.title}</dd>
                </div>
              )}

              {state.document.expiresAt && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expires On
                  </dt>
                  <dd className="mt-1">{format(new Date(state.document.expiresAt), 'MMMM d, yyyy')}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Signing Order</dt>
                <dd className="mt-1 capitalize">{state.signingOrder}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Recipients Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recipients ({state.recipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.recipients.length > 0 ? (
              <ul className="space-y-4">
                {state.recipients.map((recipient, _index) => (
                  <li key={recipient.id} className="flex justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      <Badge variant="outline" className="mt-1">
                        {formatRole(recipient.role)}
                      </Badge>
                      {state.signingOrder === 'sequential' && recipient.role === 'signer' && (
                        <Badge variant="secondary" className="ml-2 mt-1">
                          Order: {recipient.signingOrder}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground text-center py-4">No recipients added</div>
            )}
          </CardContent>
        </Card>

        {/* Email Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Subject</dt>
                <dd className="mt-1">{state.email.subject}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Message</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{state.email.message}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Fields Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Fields Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.fields.length > 0 ? (
              <div>
                <dl className="space-y-4">
                  {['signature', 'initial', 'date', 'text', 'checkbox', 'dropdown'].map((fieldType) => {
                    const count = state.fields.filter((f) => f.type === fieldType).length;
                    if (count === 0) return null;

                    return (
                      <div key={fieldType}>
                        <dt className="text-sm font-medium text-muted-foreground capitalize">{fieldType} Fields</dt>
                        <dd className="mt-1">{count}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                <h3 className="font-medium">No Fields Added</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't added any fields to your document. Recipients won't have specific places to sign or fill
                  in information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information card */}
      <Card className="mt-6">
        <CardContent className="pt-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>What happens next?</strong> When you click Send, your document will be processed and emails will
              be sent to all recipients.
            </p>
            <p>
              {state.signingOrder === 'sequential'
                ? "Since you've chosen sequential signing, recipients will receive emails in the order you specified."
                : "Since you've chosen parallel signing, all recipients will receive emails simultaneously."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button size="lg" onClick={handleSendDocument} className="min-w-[120px]" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Document'}
        </Button>
      </div>
    </div>
  );
}
