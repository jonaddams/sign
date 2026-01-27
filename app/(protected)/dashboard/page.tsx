import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { Activity, Clock, FileText, PenLine } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import {
  documentAuditLog,
  documentParticipants,
  documents,
  signatureRequests,
} from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';

// Hoist static helper functions outside component for better performance
function formatRelativeTime(date: Date | null) {
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
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

function formatExpiration(date: Date | null) {
  if (!date) return null;
  const now = new Date();

  if (date < now) {
    return { text: 'Expired', variant: 'destructive' as const, expired: true };
  }

  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 24) {
    return {
      text: `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`,
      variant: 'destructive' as const,
      expired: false,
    };
  }

  if (days <= 3) {
    return {
      text: `Expires in ${days} day${days !== 1 ? 's' : ''}`,
      variant: 'outline' as const,
      expired: false,
    };
  }

  return {
    text: `Expires ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)}`,
    variant: 'outline' as const,
    expired: false,
  };
}

function formatAuditAction(action: string) {
  const actionMap: Record<string, string> = {
    DOCUMENT_CREATED: 'Document Created',
    DOCUMENT_SENT: 'Document Sent',
    DOCUMENT_VIEWED: 'Document Viewed',
    DOCUMENT_SIGNED: 'Document Signed',
    DOCUMENT_DECLINED: 'Document Declined',
    DOCUMENT_COMPLETED: 'Document Completed',
    DOCUMENT_EXPIRED: 'Document Expired',
    DOCUMENT_DELETED: 'Document Deleted',
    RECIPIENT_ADDED: 'Recipient Added',
    RECIPIENT_REMOVED: 'Recipient Removed',
    FIELD_ADDED: 'Field Added',
    FIELD_UPDATED: 'Field Updated',
    FIELD_REMOVED: 'Field Removed',
    EMAIL_SENT: 'Email Sent',
    REMINDER_SENT: 'Reminder Sent',
  };

  return (
    actionMap[action] ||
    action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Start all independent queries in parallel for 2-5× performance improvement
  const userDocumentsPromise = db
    .select({
      id: documents.id,
      name: documents.name,
      createdAt: documents.createdAt,
      expiresAt: documents.expiresAt,
    })
    .from(documents)
    .where(eq(documents.ownerId, session.user.id))
    .orderBy(desc(documents.updatedAt))
    .limit(10);

  const pendingSignaturesPromise = db
    .select({ count: sql<number>`count(*)::int` })
    .from(signatureRequests)
    .innerJoin(documentParticipants, eq(signatureRequests.participantId, documentParticipants.id))
    .where(and(eq(documentParticipants.userId, session.user.id), eq(signatureRequests.status, 'PENDING')));

  const totalDocumentsPromise = db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(eq(documents.ownerId, session.user.id));

  const completedSignaturesPromise = db
    .select({ count: sql<number>`count(*)::int` })
    .from(signatureRequests)
    .innerJoin(documentParticipants, eq(signatureRequests.participantId, documentParticipants.id))
    .where(and(eq(documentParticipants.userId, session.user.id), eq(signatureRequests.status, 'SIGNED')));

  const recentActivityPromise = db
    .select({
      id: documentAuditLog.id,
      action: documentAuditLog.action,
      details: documentAuditLog.details,
      createdAt: documentAuditLog.createdAt,
      documentId: documentAuditLog.documentId,
      documentName: documents.name,
    })
    .from(documentAuditLog)
    .leftJoin(documents, eq(documentAuditLog.documentId, documents.id))
    .where(eq(documentAuditLog.userId, session.user.id))
    .orderBy(desc(documentAuditLog.createdAt))
    .limit(5);

  // Await all independent queries in parallel
  const [userDocuments, pendingSignaturesResult, totalDocumentsResult, completedSignaturesResult, recentActivity] =
    await Promise.all([
      userDocumentsPromise,
      pendingSignaturesPromise,
      totalDocumentsPromise,
      completedSignaturesPromise,
      recentActivityPromise,
    ]);

  // Get recipient counts (depends on userDocuments result)
  const documentIds = userDocuments.map((doc) => doc.id);
  const recipientCounts =
    documentIds.length > 0
      ? await db
          .select({
            documentId: documentParticipants.documentId,
            count: sql<number>`count(*)::int`,
          })
          .from(documentParticipants)
          .where(inArray(documentParticipants.documentId, documentIds))
          .groupBy(documentParticipants.documentId)
      : [];

  // Map recipient counts to documents
  const documentsWithCounts = userDocuments.map((doc) => ({
    ...doc,
    recipientCount: recipientCounts.find((rc) => rc.documentId === doc.id)?.count || 0,
  }));

  const pendingSignatures = pendingSignaturesResult[0]?.count || 0;
  const totalDocuments = totalDocumentsResult[0]?.count || 0;
  const completedSignatures = completedSignaturesResult[0]?.count || 0;

  return (
    <PageLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Link href="/send">
              <Badge variant="default" className="cursor-pointer hover:bg-primary/90">
                <PenLine className="h-3.5 w-3.5 mr-1" />
                Send Document
              </Badge>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Documents"
              value={totalDocuments.toString()}
              change=""
              trend="neutral"
              icon={<FileText className="h-5 w-5" />}
              description="documents created"
            />
            <MetricCard
              title="Pending Signatures"
              value={pendingSignatures.toString()}
              change=""
              trend="neutral"
              icon={<Clock className="h-5 w-5" />}
              description="awaiting your signature"
            />
            <MetricCard
              title="Completed Signatures"
              value={completedSignatures.toString()}
              change=""
              trend="neutral"
              icon={<PenLine className="h-5 w-5" />}
              description="documents signed"
            />
            <MetricCard
              title="Recent Documents"
              value={documentsWithCounts.length.toString()}
              change=""
              trend="neutral"
              icon={<Activity className="h-5 w-5" />}
              description="last 10 documents"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your most recently created documents</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsWithCounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">No documents yet</p>
                    <Link href="/send">
                      <Badge variant="default" className="cursor-pointer">
                        Send Your First Document
                      </Badge>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-3">
                    {documentsWithCounts.map((doc) => {
                      const expirationInfo = formatExpiration(doc.expiresAt);
                      return (
                        <Link key={doc.id} href={`/documents/${doc.id}`} className="block mb-4 sm:mb-0">
                          <div className="flex items-start justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Created {formatRelativeTime(doc.createdAt)}
                                </p>
                                {doc.recipientCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.recipientCount} {doc.recipientCount === 1 ? 'recipient' : 'recipients'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                                ID: {doc.id.slice(0, 8)}…
                              </p>
                            </div>
                            {expirationInfo && (
                              <Badge variant={expirationInfo.variant} className="ml-2 text-xs shrink-0">
                                {expirationInfo.text}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Recent actions in your account</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <Activity className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="ml-4 space-y-1 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">{formatAuditAction(activity.action)}</p>
                          <p className="text-muted-foreground text-sm truncate">
                            {activity.documentName || 'Document'}
                          </p>
                          <p className="text-muted-foreground text-xs">{formatRelativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
