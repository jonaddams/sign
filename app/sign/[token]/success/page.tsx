'use client';

import { CheckCircle, Download, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SignSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
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
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
              <Button variant="default" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download Copy
              </Button>
            </div>

            {/* Footer Note */}
            <p className="mt-8 text-xs text-gray-500">
              This signing session is now complete. You may close this window.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
