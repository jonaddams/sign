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
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';

export default async function InboxPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Query: Documents that need to be signed by the current user
  const documentsToSign = await db
    .select({
      documentId: documents.id,
      documentName: documents.name,
      documentCreatedAt: documents.createdAt,
      documentExpiresAt: documents.expiresAt,
      ownerId: documents.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      participantId: documentParticipants.id,
      signatureRequestId: signatureRequests.id,
      signatureStatus: signatureRequests.status,
      requestedAt: signatureRequests.requestedAt,
      accessToken: signatureRequests.accessToken,
      signingOrder: documentParticipants.signingOrder,
    })
    .from(documentParticipants)
    .innerJoin(documents, eq(documentParticipants.documentId, documents.id))
    .leftJoin(users, eq(documents.ownerId, users.id))
    .innerJoin(signatureRequests, eq(signatureRequests.participantId, documentParticipants.id))
    .where(
      and(
        eq(documentParticipants.userId, session.user.id),
        eq(signatureRequests.status, 'PENDING')
      )
    )
    .orderBy(desc(signatureRequests.requestedAt));

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

  // Check if document is expiring soon (within 3 days)
  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const daysUntilExpiry = Math.floor(diff / 86400000);
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  };

  // Check if document is expired
  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  };

  return (
    <PageLayout>
      <PageContent title="Inbox" description="Documents awaiting your signature">
        <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
          <CardContent className="p-0">
            {documentsToSign.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending signatures</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You don&apos;t have any documents waiting for your signature at the moment.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsToSign.map((item) => (
                    <TableRow
                      key={item.signatureRequestId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.documentName}</span>
                          {item.signingOrder !== null && item.signingOrder > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Signing order: {item.signingOrder}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{item.ownerName || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{item.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(item.requestedAt)}
                      </TableCell>
                      <TableCell>
                        {isExpired(item.documentExpiresAt) ? (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        ) : isExpiringSoon(item.documentExpiresAt) ? (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                            Urgent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isExpired(item.documentExpiresAt) ? (
                          <Button variant="ghost" size="sm" disabled>
                            Expired
                          </Button>
                        ) : item.accessToken ? (
                          <Link href={`/sign/${item.accessToken}`}>
                            <Button size="sm" variant="default" className="cursor-pointer">
                              Sign Document
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            No Access
                          </Button>
                        )}
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
