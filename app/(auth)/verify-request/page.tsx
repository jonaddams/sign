import { PenTool } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyRequestPage() {
  return (
    <>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-900 dark:bg-zinc-100">
          <PenTool className="w-5 h-5 text-white dark:text-zinc-900" />
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">Sign</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">A sign in link has been sent to your email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you don&apos;t see it, check your spam folder. If you still don&apos;t see it, try again or use another
            sign in method.
          </p>
          <div className="pt-4">
            <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Return to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
