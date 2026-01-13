import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth-js';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
