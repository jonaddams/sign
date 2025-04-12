import PageLayout from '@/components/layout/page-layout';
import PageContent from '@/components/layout/page-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter } from 'lucide-react';

// Mock transactions data
const transactions = [
  {
    id: '1',
    date: 'Mar 15, 2023',
    description: 'Invoice #1234 - Acme Corp',
    amount: 1250.0,
    status: 'Completed',
  },
  {
    id: '2',
    date: 'Mar 10, 2023',
    description: 'Invoice #1233 - XYZ Inc',
    amount: 850.75,
    status: 'Completed',
  },
  {
    id: '3',
    date: 'Mar 5, 2023',
    description: 'Invoice #1232 - ABC Ltd',
    amount: 2340.5,
    status: 'Pending',
  },
  {
    id: '4',
    date: 'Feb 28, 2023',
    description: 'Invoice #1231 - Smith & Co',
    amount: 1100.25,
    status: 'Completed',
  },
  {
    id: '5',
    date: 'Feb 20, 2023',
    description: 'Invoice #1230 - Johnson LLC',
    amount: 750.0,
    status: 'Failed',
  },
];

export default function TransactionsPage() {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <PageLayout>
      <PageContent title='Transactions' description='View and manage your financial transactions'>
        <div className='mb-4 flex items-center justify-between'>
          <Button variant='outline' className='flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            <span>Filter</span>
          </Button>
          <Button className='flex items-center gap-2'>
            <Download className='h-4 w-4' />
            <span>Export</span>
          </Button>
        </div>

        <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className='cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          transaction.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : transaction.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {transaction.status}
                      </span>
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
