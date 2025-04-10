'use client';

import type React from 'react';

import {
  CreditCard,
  FileText,
  Files,
  HelpCircle,
  Inbox,
  Menu,
  MessagesSquare,
  PenTool,
  Receipt,
  SendHorizontal,
  Settings,
  Shield,
  Users2,
  Video,
  Wallet,
} from 'lucide-react';

import { Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  function NavItem({
    href,
    icon: Icon,
    children,
    highlight = false,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    highlight?: boolean;
  }) {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#1F1F23] dark:hover:text-white'
        }`}
      >
        <Icon className='mr-3 h-4 w-4 flex-shrink-0' />
        {children}
        {highlight && !isActive && (
          <span className='ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white'>3</span>
        )}
      </Link>
    );
  }

  return (
    <>
      <button
        type='button'
        className='fixed left-4 top-4 z-[70] rounded-lg bg-white p-2 shadow-md lg:hidden dark:bg-[#0F0F12]'
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className='h-5 w-5 text-gray-600 dark:text-gray-300' />
      </button>
      <nav
        className={`fixed inset-y-0 left-0 z-[70] w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:w-64 lg:translate-x-0 dark:border-[#1F1F23] dark:bg-[#0F0F12] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
        <div className='flex h-full flex-col'>
          <Link href='/' className='flex h-16 items-center border-gray-200 px-6 dark:border-[#1F1F23]'>
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100'>
                <PenTool className='h-5 w-5 text-white dark:text-zinc-900' />
              </div>
              <span className='text-lg font-semibold text-gray-900 hover:cursor-pointer dark:text-white'>Sign</span>
            </div>
          </Link>

          <div className='flex-1 overflow-y-auto px-4 py-4'>
            <div className='space-y-6'>
              <div>
                <div className='space-y-1'>
                  <NavItem href='/dashboard' icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href='/inbox' icon={Inbox} highlight={true}>
                    Inbox
                  </NavItem>
                  <NavItem href='/send' icon={SendHorizontal}>
                    Send
                  </NavItem>
                  <NavItem href='/documents' icon={FileText}>
                    Documents
                  </NavItem>
                  <NavItem href='/templates' icon={Files}>
                    Templates
                  </NavItem>
                </div>
              </div>

              <div>
                <div className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>Finance</div>
                <div className='space-y-1'>
                  <NavItem href='/transactions' icon={Wallet}>
                    Transactions
                  </NavItem>
                  <NavItem href='/invoices' icon={Receipt}>
                    Invoices
                  </NavItem>
                  <NavItem href='/payments' icon={CreditCard}>
                    Payments
                  </NavItem>
                </div>
              </div>

              <div>
                <div className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>Team</div>
                <div className='space-y-1'>
                  <NavItem href='/members' icon={Users2}>
                    Members
                  </NavItem>
                  <NavItem href='/permissions' icon={Shield}>
                    Permissions
                  </NavItem>
                  <NavItem href='/chat' icon={MessagesSquare}>
                    Chat
                  </NavItem>
                  <NavItem href='/meetings' icon={Video}>
                    Meetings
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-gray-200 px-4 py-4 dark:border-[#1F1F23]'>
            <div className='space-y-1'>
              <NavItem href='/settings' icon={Settings}>
                Settings
              </NavItem>
              <NavItem href='/help' icon={HelpCircle}>
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && <div className='fixed inset-0 z-[65] bg-black bg-opacity-50 lg:hidden' onClick={() => setIsMobileMenuOpen(false)} />}
    </>
  );
}
