'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmail } from '@/server/auth/sign-in';

interface EmailAuthFormProps {
  mode: 'login' | 'signup';
  callbackUrl?: string;
}

export function EmailAuthForm({ mode, callbackUrl = '/dashboard' }: EmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // The function might return before redirect or might redirect automatically
      await signInWithEmail(email, callbackUrl);

      // If we reach this point, show success message
      setIsSent(true);
      toast.success('Check your email for a login link', {
        description: 'We&apos;ve sent you an email with a link to sign in',
      });
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'We couldn&apos;t send the login link. Please try again.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium">Check your email</h3>
        <p>We&apos;ve sent a login link to {email}</p>
        <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button className="w-full cursor-pointer" type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="h-5 w-5 mr-2 animate-spin rounded-full border-t-2 border-gray-500 dark:border-gray-300" />
            <span>Sending...</span>
          </>
        ) : mode === 'login' ? (
          'Log in'
        ) : (
          'Continue with Email'
        )}
      </Button>
    </form>
  );
}
