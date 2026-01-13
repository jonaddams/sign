'use client';

import { Github } from 'lucide-react';
import { useState } from 'react';
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

  const handleGithubSignIn = async () => {
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
          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <span className="mr-2 font-bold text-blue-500 dark:text-blue-400">G</span>
        )}
        <span>Continue with Google</span>
      </Button>

      {/* GitHub Button - Updated to match Google's dark mode style */}
      <Button
        type="button"
        className="flex h-11 items-center justify-center border border-transparent bg-[#2F2F33] text-white hover:bg-[#24292F]/90 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        onClick={handleGithubSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" />
        ) : (
          <Github className="mr-2 h-5 w-5" />
        )}
        <span>Continue with GitHub</span>
      </Button>

      {/* Microsoft Button - Updated to match Google's dark mode style */}
      <Button
        type="button"
        className="flex h-11 items-center justify-center border border-transparent bg-[#0078d4] text-white hover:bg-[#0078d4]/90 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        onClick={handleMicrosoftSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" />
        ) : (
          <span className="mr-2 font-bold">M</span>
        )}
        <span>Continue with Microsoft</span>
      </Button>
    </div>
  );
}
