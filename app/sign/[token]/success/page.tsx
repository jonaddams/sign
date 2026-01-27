'use client';

import { CheckCircle, Download, Home } from 'lucide-react';
import Link from 'next/link';
import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SignSuccessPage() {
  return (
    <PageLayout>
      <PageContent title="Document Signed" description="Your signature has been successfully recorded">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-lg border-green-200 shadow-lg dark:border-green-800">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center">
                {/* Success Icon */}
                <div className="mb-6 rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>

                {/* Success Message */}
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Successfully Signed!</h1>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Your signature has been recorded and all parties have been notified.
                </p>

                {/* Additional Info */}
                <div className="mb-8 w-full rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You will receive a confirmation email with a copy of the signed document.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    href="/"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-transparent px-4 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-zinc-800"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Home
                  </Link>
                  <Button variant="default" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
}
