import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents, documentParticipants, signatureRequests } from '@/database/drizzle/document-signing-schema';
import { users } from '@/database/drizzle/auth-schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { DeleteButton } from '../documents/components/DeleteButton';

export default async function SignedDocumentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Query: Documents that the current user has signed (as a participant, not owner)
  const signedDocuments = await db
    .select({
      documentId: documents.id,
      documentName: documents.name,
      documentCreatedAt: documents.createdAt,
      ownerId: documents.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      signatureRequestId: signatureRequests.id,
      signedAt: signatureRequests.signedAt,
    })
    .from(documentParticipants)
    .innerJoin(documents, eq(documentParticipants.documentId, documents.id))
    .leftJoin(users, eq(documents.ownerId, users.id))
    .innerJoin(signatureRequests, eq(signatureRequests.participantId, documentParticipants.id))
    .where(
      and(
        eq(documentParticipants.userId, session.user.id),
        eq(signatureRequests.status, 'SIGNED'),
        isNull(documents.deletedAt) // Not deleted
      )
    )
    .orderBy(desc(signatureRequests.signedAt));

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

  return (
    <PageLayout>
      <PageContent title="Signed Documents" description="Documents you've signed as a recipient">
        <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
          <CardContent className="p-0">
            {signedDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No signed documents</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Documents you sign will appear here for your records.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signedDocuments.map((doc) => (
                    <TableRow
                      key={doc.signatureRequestId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <span className="font-medium">{doc.documentName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{doc.ownerName || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{doc.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(doc.signedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Signed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/documents/${doc.documentId}`}>
                            <Button size="sm" variant="outline" className="cursor-pointer">
                              View
                            </Button>
                          </Link>
                          <DeleteButton documentId={doc.documentId} documentName={doc.documentName} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
