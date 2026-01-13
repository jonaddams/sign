'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getSession } from '@/server/auth/get-session';
import Profile, { DEFAULT_AVATAR } from './profile';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function TopNav() {
  const pathname = usePathname();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user session data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          setAvatar(session.user.image ? session.user.image : null);
          setUserName(session.user.name ? session.user.name : session.user.email);
          setUserEmail(session.user.email || null);
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
      }
    };

    fetchUserData();
  }, []);

  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);

    // Always start with Sign as the root
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Sign', href: '/dashboard' }];

    // Add current page
    if (paths.length > 0) {
      const currentPage = paths[paths.length - 1];
      // Replace specific paths with proper display names
      let displayName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

      // Special case handling for specific routes
      if (currentPage === 'templates') displayName = 'Templates';

      breadcrumbs.push({
        label: displayName,
        href: pathname,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex h-full items-center justify-between border-gray-200 bg-white px-3 sm:px-6 dark:border-[#1F1F23] dark:bg-[#0F0F12]">
      {/* Breadcrumbs section */}
      <div className="hidden max-w-[300px] items-center space-x-1 truncate text-sm font-medium sm:flex">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-500 dark:text-gray-400" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            {avatar ? (
              <Image
                src={avatar}
                alt={`${userName || 'User'}'s avatar`}
                width={28}
                height={28}
                className="cursor-pointer rounded-full ring-2 ring-gray-200 sm:h-8 sm:w-8 dark:ring-[#2B2B30]"
              />
            ) : (
              <Image
                src={DEFAULT_AVATAR}
                alt="Default avatar"
                width={28}
                height={28}
                className="cursor-pointer rounded-full ring-2 ring-gray-200 sm:h-8 sm:w-8 dark:ring-[#2B2B30]"
              />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] rounded-lg shadow-lg sm:w-80 bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]"
          >
            <Profile avatar={avatar || DEFAULT_AVATAR} name={userName || undefined} email={userEmail || undefined} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
