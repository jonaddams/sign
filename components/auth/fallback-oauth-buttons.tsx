'use client';

import { useState } from 'react';
import { GoogleIcon, MicrosoftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface FallbackOAuthButtonsProps {
  callbackUrl?: string;
}

export function FallbackOAuthButtons({ callbackUrl = '/dashboard' }: FallbackOAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.location.href = callbackUrl;
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.location.href = callbackUrl;
  };

  return (
    <div className="flex w-full flex-col space-y-3">
      {/* Google Button */}
      <Button
        type="button"
        variant="outline"
        className="flex h-11 items-center justify-center border border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        <span>Continue with Google</span>
      </Button>

      {/* Microsoft Button */}
      <Button
        type="button"
        className="flex h-11 items-center justify-center border border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        onClick={handleMicrosoftSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <MicrosoftIcon className="mr-2 h-5 w-5" />
        )}
        <span>Continue with Microsoft</span>
      </Button>
    </div>
  );
}
