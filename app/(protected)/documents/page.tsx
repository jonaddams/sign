import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents, documentParticipants, signatureRequests } from '@/database/drizzle/document-signing-schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { CancelButton } from './components/CancelButton';
import { DeleteButton } from './components/DeleteButton';

export default async function SentDocumentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Query: Documents created/sent by the current user (not deleted)
  const sentDocuments = await db
    .select({
      documentId: documents.id,
      documentName: documents.name,
      documentCreatedAt: documents.createdAt,
      documentExpiresAt: documents.expiresAt,
      documentStatus: documents.status,
      // Count total participants
      totalParticipants: sql<number>`COUNT(DISTINCT ${documentParticipants.id})`,
      // Count signed participants
      signedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${signatureRequests.status} = 'SIGNED' THEN ${documentParticipants.id} END)`,
    })
    .from(documents)
    .leftJoin(documentParticipants, eq(documentParticipants.documentId, documents.id))
    .leftJoin(signatureRequests, eq(signatureRequests.participantId, documentParticipants.id))
    .where(
      and(
        eq(documents.ownerId, session.user.id),
        isNull(documents.deletedAt) // Not deleted
      )
    )
    .groupBy(documents.id, documents.name, documents.createdAt, documents.expiresAt, documents.status)
    .orderBy(desc(documents.createdAt));

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

  // Get status display info
  const getStatusInfo = (totalParticipants: number, signedCount: number, documentStatus: string | null) => {
    // Check for cancelled status first
    if (documentStatus === 'CANCELLED') {
      return { label: 'Cancelled', variant: 'destructive' as const, canCancel: false };
    }
    if (totalParticipants === 0) {
      return { label: 'Draft', variant: 'outline' as const, canCancel: false };
    }
    if (signedCount === totalParticipants) {
      return { label: 'Completed', variant: 'default' as const, canCancel: false };
    }
    if (signedCount > 0) {
      return { label: `${signedCount}/${totalParticipants} Signed`, variant: 'outline' as const, canCancel: true };
    }
    return { label: 'Pending', variant: 'outline' as const, canCancel: true };
  };

  return (
    <PageLayout>
      <PageContent title="Sent Documents" description="Documents you've sent for signature">
        <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
          <CardContent className="p-0">
            {sentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sent documents</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Documents you send for signature will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentDocuments.map((doc) => {
                    const statusInfo = getStatusInfo(doc.totalParticipants, doc.signedCount, doc.documentStatus);
                    return (
                      <TableRow
                        key={doc.documentId}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{doc.documentName}</span>
                            <span className="text-xs text-muted-foreground">
                              {doc.totalParticipants} recipient{doc.totalParticipants !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(doc.documentCreatedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/documents/${doc.documentId}`}>
                              <Button size="sm" variant="outline" className="cursor-pointer">
                                View
                              </Button>
                            </Link>
                            {statusInfo.canCancel && (
                              <CancelButton documentId={doc.documentId} documentName={doc.documentName} />
                            )}
                            <DeleteButton documentId={doc.documentId} documentName={doc.documentName} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
