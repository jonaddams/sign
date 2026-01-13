'use client';

import { Github } from 'lucide-react';
import { useState } from 'react';
import { GoogleIcon, MicrosoftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { handleSignin } from '@/server/auth/sign-in';

interface OAuthButtonsProps {
  callbackUrl?: string;
}

export function OAuthButtons({ callbackUrl }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // These functions would normally trigger the AuthJS OAuth flow
  const handleGoogleSignIn = async () => {
    setLoadingProvider('google');
    handleSignin({ provider: 'google' });
  };

  const handleMicrosoftSignIn = async () => {
    setLoadingProvider('microsoft');
    handleSignin({ provider: 'microsoft-entra-id' });
  };

  const handleGithubSignIn = async () => {
    setLoadingProvider('github');
    handleSignin({ provider: 'github' });
  };

  return (
    <div className="flex w-full flex-col space-y-3">
      {/* Google Button */}
      <Button
        type="button"
        variant="outline"
        className="flex h-11 items-center justify-center border border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 cursor-pointer"
        onClick={handleGoogleSignIn}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'google' ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        <span>Continue with Google</span>
      </Button>

      {/* GitHub Button - Updated to match Google's dark mode style */}
      <Button
        type="button"
        className="flex h-11 items-center justify-center border border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 cursor-pointer"
        onClick={handleGithubSignIn}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'github' ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <Github className="mr-2 h-5 w-5" />
        )}
        <span>Continue with GitHub</span>
      </Button>

      {/* Microsoft Button - Updated to match Google's dark mode style */}
      <Button
        type="button"
        className="flex h-11 items-center justify-center border border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 cursor-pointer"
        onClick={handleMicrosoftSignIn}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'microsoft' ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
        ) : (
          <MicrosoftIcon className="mr-2 h-5 w-5" />
        )}
        <span>Continue with Microsoft</span>
      </Button>
    </div>
  );
}
