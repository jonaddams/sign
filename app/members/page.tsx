import PageLayout from '@/components/layout/page-layout';
import PageContent from '@/components/layout/page-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Plus } from 'lucide-react';
import Image from 'next/image';

// Mock team members data
const members = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active',
    avatar: '/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Editor',
    status: 'Active',
    avatar: '/avatar-02-albo9B0tWOSLXCVZh9rX9KFxXIVWMr.png',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'Viewer',
    status: 'Invited',
    avatar: '/avatar-03-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png',
  },
];

export default function MembersPage() {
  return (
    <PageLayout>
      <PageContent title='Team Members' description='Manage your team members and their access'>
        <div className='mb-4 flex items-center justify-between'>
          <Button className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            <span>Invite Member</span>
          </Button>
        </div>

        <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className='cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Image src={member.avatar || '/placeholder.svg'} alt={member.name} width={32} height={32} className='rounded-full' />
                        <span className='font-medium'>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                        <span className='sr-only'>More</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
