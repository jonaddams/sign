'use client';

import { PenTool } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'An unknown error occurred';

  return (
    <>
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100">
          <PenTool className="h-5 w-5 text-white dark:text-zinc-900" />
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">Sign</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription className="text-center">There was a problem signing you in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Try Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
