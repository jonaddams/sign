import { Activity, Calendar, Clock, Download, FileText, Mail, User, Users } from 'lucide-react';
import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents, documentParticipants, signatureRequests, documentAuditLog, documentAnnotations } from '@/database/drizzle/document-signing-schema';
import { users } from '@/database/drizzle/auth-schema';
import { eq, and, desc } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Query: Document details
  const documentResult = await db
    .select({
      id: documents.id,
      name: documents.name,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      expiresAt: documents.expiresAt,
      documentFilePath: documents.documentFilePath,
      size: documents.size,
      ownerId: documents.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(documents)
    .leftJoin(users, eq(documents.ownerId, users.id))
    .where(eq(documents.id, id))
    .limit(1);

  if (documentResult.length === 0) {
    notFound();
  }

  const document = documentResult[0];

  // Check if user has access to this document
  const hasAccess = document.ownerId === session.user.id;

  if (!hasAccess) {
    // Check if user is a participant
    const participantResult = await db
      .select()
      .from(documentParticipants)
      .where(
        and(
          eq(documentParticipants.documentId, id),
          eq(documentParticipants.userId, session.user.id)
        )
      )
      .limit(1);

    if (participantResult.length === 0) {
      redirect('/dashboard');
    }
  }

  // Query: Recipients with signature status
  const recipients = await db
    .select({
      id: documentParticipants.id,
      userId: documentParticipants.userId,
      userName: users.name,
      userEmail: users.email,
      accessLevel: documentParticipants.accessLevel,
      signingOrder: documentParticipants.signingOrder,
      isRequired: documentParticipants.isRequired,
      signatureRequestId: signatureRequests.id,
      signatureStatus: signatureRequests.status,
      signedAt: signatureRequests.signedAt,
    })
    .from(documentParticipants)
    .leftJoin(users, eq(documentParticipants.userId, users.id))
    .leftJoin(signatureRequests, eq(signatureRequests.participantId, documentParticipants.id))
    .where(eq(documentParticipants.documentId, id))
    .orderBy(documentParticipants.signingOrder);

  // Query: Field annotations
  const annotations = await db
    .select()
    .from(documentAnnotations)
    .where(eq(documentAnnotations.documentId, id))
    .limit(1);

  const fields = annotations[0]?.annotationData as { fields: any[] } | null;
  const fieldCount = fields?.fields?.length || 0;

  // Query: Audit log
  const auditLog = await db
    .select({
      id: documentAuditLog.id,
      action: documentAuditLog.action,
      details: documentAuditLog.details,
      createdAt: documentAuditLog.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(documentAuditLog)
    .leftJoin(users, eq(documentAuditLog.userId, users.id))
    .where(eq(documentAuditLog.documentId, id))
    .orderBy(desc(documentAuditLog.createdAt))
    .limit(10);

  // Format relative time
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Format audit action
  const formatAuditAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'DOCUMENT_CREATED': 'Document Created',
      'DOCUMENT_SENT': 'Document Sent',
      'DOCUMENT_VIEWED': 'Document Viewed',
      'DOCUMENT_SIGNED': 'Document Signed',
      'DOCUMENT_DECLINED': 'Document Declined',
      'DOCUMENT_COMPLETED': 'Document Completed',
      'DOCUMENT_EXPIRED': 'Document Expired',
      'DOCUMENT_DELETED': 'Document Deleted',
      'RECIPIENT_ADDED': 'Recipient Added',
      'RECIPIENT_REMOVED': 'Recipient Removed',
      'FIELD_ADDED': 'Field Added',
      'FIELD_UPDATED': 'Field Updated',
      'FIELD_REMOVED': 'Field Removed',
      'EMAIL_SENT': 'Email Sent',
      'REMINDER_SENT': 'Reminder Sent',
    };

    return actionMap[action] || action.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Calculate signature status
  const totalSigners = recipients.filter(r => r.accessLevel === 'SIGNER').length;
  const signedCount = recipients.filter(r => r.signatureStatus === 'SIGNED').length;
  const pendingCount = recipients.filter(r => r.signatureStatus === 'PENDING').length;

  return (
    <PageLayout>
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <span>Document Details</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{document.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {document.id.slice(0, 8)}...
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Resend
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Name
                  </p>
                  <p className="text-sm text-muted-foreground">{document.name}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Owner
                  </p>
                  <p className="text-sm text-muted-foreground">{document.ownerName || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{document.ownerEmail}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {document.createdAt?.toLocaleDateString()} at {document.createdAt?.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {document.expiresAt && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Expires
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {document.expiresAt.toLocaleDateString()} at {document.expiresAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {document.size && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">File Size</p>
                      <p className="text-sm text-muted-foreground">
                        {(document.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Signature Status */}
          <Card>
            <CardHeader>
              <CardTitle>Signature Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{signedCount} / {totalSigners}</p>
                  <p className="text-sm text-muted-foreground">Signatures completed</p>
                </div>
                <div className="flex gap-2">
                  {signedCount === totalSigners && totalSigners > 0 ? (
                    <Badge variant="default" className="bg-green-600">Completed</Badge>
                  ) : pendingCount > 0 ? (
                    <Badge variant="outline">In Progress</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients ({recipients.length})
                </p>
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recipient.userName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{recipient.userEmail}</p>
                      {recipient.signingOrder !== null && recipient.signingOrder > 0 && (
                        <p className="text-xs text-muted-foreground">Order: {recipient.signingOrder}</p>
                      )}
                    </div>
                    <div className="ml-2">
                      {recipient.signatureStatus === 'SIGNED' ? (
                        <Badge variant="default" className="text-xs bg-green-600">Signed</Badge>
                      ) : recipient.signatureStatus === 'DECLINED' ? (
                        <Badge variant="destructive" className="text-xs">Declined</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Information */}
          <Card>
            <CardHeader>
              <CardTitle>Field Placements</CardTitle>
              <CardDescription>Signature fields placed on the document</CardDescription>
            </CardHeader>
            <CardContent>
              {fieldCount === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No fields placed</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{fieldCount}</p>
                  <p className="text-sm text-muted-foreground">Total fields placed</p>

                  {fields?.fields && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(
                        fields.fields.reduce((acc: Record<string, number>, field: any) => {
                          const type = field.type === 'initial' ? 'initials' : field.type;
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Activity history for this document</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
                        <Activity className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium">{formatAuditAction(log.action)}</p>
                        {log.userName && (
                          <p className="text-xs text-muted-foreground">by {log.userName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
