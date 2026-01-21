import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents } from '@/database/drizzle/document-signing-schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { TrashActions } from './components/TrashActions';

export default async function TrashPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Query: Documents that are deleted (have deletedAt timestamp)
  const deletedDocuments = await db
    .select({
      documentId: documents.id,
      documentName: documents.name,
      documentCreatedAt: documents.createdAt,
      deletedAt: documents.deletedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, session.user.id),
        isNotNull(documents.deletedAt)
      )
    )
    .orderBy(desc(documents.deletedAt));

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
      <PageContent title="Trash" description="Deleted documents - these will be permanently removed">
        <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
          <CardContent className="p-0">
            {deletedDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Deleted documents will appear here before permanent removal.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedDocuments.map((doc) => (
                    <TableRow
                      key={doc.documentId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <span className="font-medium text-muted-foreground">{doc.documentName}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(doc.deletedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TrashActions documentId={doc.documentId} documentName={doc.documentName} />
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
