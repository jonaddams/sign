import { AuthDivider } from '@/components/auth/auth-divider';
import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { ErrorBoundary } from '@/components/auth/error-boundary';
import { FallbackOAuthButtons } from '@/components/auth/fallback-oauth-buttons';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { NutrientLogo } from '@/components/icons';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <>
      <Link href='/' className='mb-8 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-md dark:bg-zinc-900'>
          <NutrientLogo className='h-10 w-10 text-gray-800 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' />
        </div>
        <span className='text-4xl font-bold text-gray-900 dark:text-white'>Nutrient Sign</span>
      </Link>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-center text-2xl font-bold'>Create an account</CardTitle>
          <CardDescription className='text-center'>Choose your preferred sign up method</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <ErrorBoundary fallback={<FallbackOAuthButtons callbackUrl='/dashboard' />}>
            <OAuthButtons callbackUrl='/dashboard' />
          </ErrorBoundary>

          <AuthDivider />

          <EmailAuthForm mode='signup' callbackUrl='/dashboard' />
        </CardContent>
        <CardFooter className='flex flex-col space-y-4'>
          <div className='text-center text-sm'>
            Already have an account?{' '}
            <Link href='/login' className='text-blue-600 hover:underline dark:text-blue-400'>
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
