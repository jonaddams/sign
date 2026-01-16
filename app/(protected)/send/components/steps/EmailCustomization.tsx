'use client';

import { Eye, Info, Mail } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocumentFlow } from '../../context/DocumentFlowContext';

export default function EmailCustomization() {
  const { state, dispatch } = useDocumentFlow();
  const _isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>('compose');

  // Initialize local state with values from context
  const [emailSubject, setEmailSubject] = useState(state.email.subject);
  const [emailMessage, setEmailMessage] = useState(state.email.message);

  // Update context when form values change
  useEffect(() => {
    const isValid = emailSubject.trim() !== '' && emailMessage.trim() !== '';

    dispatch({
      type: 'SET_EMAIL',
      payload: {
        subject: emailSubject,
        message: emailMessage,
      },
    });

    dispatch({
      type: 'VALIDATE_STEP',
      payload: { step: 'step4Valid', isValid },
    });
  }, [emailSubject, emailMessage, dispatch]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSubject(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailMessage(e.target.value);
  };

  // Reset to default values
  const handleResetDefaults = () => {
    setEmailSubject('Please sign this document');
    setEmailMessage('I have sent you a document to sign. Please review and sign at your earliest convenience.');
  };

  // Email preview component
  const EmailPreview = () => {
    const documentTitle = state.document.title || 'Document';
    const senderName = 'Your Name'; // This would come from user profile in a real app

    return (
      <div className="border rounded-md p-4 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">From:</div>
          <div>{senderName} &lt;your.email@example.com&gt;</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">To:</div>
          <div className="flex flex-wrap gap-1">
            {state.recipients.map((recipient) => (
              <Badge key={recipient.id} variant="outline" className="bg-zinc-100 dark:bg-zinc-800">
                {recipient.name} &lt;{recipient.email}&gt;
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Subject:</div>
          <div className="font-medium">{emailSubject}</div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="whitespace-pre-wrap">{emailMessage}</div>

          <div className="mt-6 pt-4 border-t">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 text-center">
              <Button variant="default" className="pointer-events-none w-full sm:w-auto px-6">
                View and Sign Document
              </Button>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {documentTitle} | Expires:{' '}
                {state.document.expiresAt
                  ? new Date(state.document.expiresAt).toLocaleDateString()
                  : 'No expiration date'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Email Customization</h2>
          <Badge variant="outline" className="ml-2">
            Step 4 of 5
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Customize the email that will be sent to all recipients when you send the document.
        </p>
      </div>

      <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose" className="flex items-center gap-2 cursor-pointer">
            <Mail className="h-4 w-4" />
            <span>Compose</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2 cursor-pointer">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Email Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={handleSubjectChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-message">Email Message</Label>
                  <Textarea
                    id="email-message"
                    placeholder="Enter your message to recipients"
                    value={emailMessage}
                    onChange={handleMessageChange}
                    rows={8}
                    className="min-h-[200px] resize-y"
                  />
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={handleResetDefaults} className="text-xs">
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong>Tips:</strong> Personalize your message to increase response rates. Include your contact
                information in case recipients have questions. Be clear about what action you're requesting from
                recipients.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Email Preview</h3>
              <EmailPreview />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                This is how your email will appear to recipients. The actual email may vary slightly depending on the
                recipient's email client. All recipients will receive a similar email with a secure link to view and
                sign the document.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
