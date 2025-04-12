import PageLayout from '@/components/layout/page-layout';
import PageContent from '@/components/layout/page-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Plus } from 'lucide-react';

// Mock payment methods
const paymentMethods = [
  {
    id: '1',
    type: 'Credit Card',
    last4: '4242',
    expiry: '04/25',
    isDefault: true,
  },
  {
    id: '2',
    type: 'Credit Card',
    last4: '1234',
    expiry: '12/24',
    isDefault: false,
  },
];

// Mock payment history
const paymentHistory = [
  {
    id: '1',
    date: 'Mar 15, 2023',
    description: 'Monthly Subscription',
    amount: 49.99,
  },
  {
    id: '2',
    date: 'Feb 15, 2023',
    description: 'Monthly Subscription',
    amount: 49.99,
  },
  {
    id: '3',
    date: 'Jan 15, 2023',
    description: 'Monthly Subscription',
    amount: 49.99,
  },
];

export default function PaymentsPage() {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <PageLayout>
      <PageContent title='Payments' description='Manage your payment methods and billing'>
        <div className='space-y-6'>
          {/* Payment Methods */}
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-medium text-zinc-900 dark:text-white'>Payment Methods</h2>
              <Button className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                <span>Add Payment Method</span>
              </Button>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {paymentMethods.map((method) => (
                <Card key={method.id} className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='h-5 w-5 text-blue-500' />
                        <CardTitle className='text-base font-medium'>
                          {method.type} ending in {method.last4}
                        </CardTitle>
                      </div>
                      {method.isDefault && (
                        <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                          Default
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-zinc-600 dark:text-zinc-400'>Expires {method.expiry}</span>
                      <div className='flex gap-2'>
                        <Button variant='ghost' size='sm'>
                          Edit
                        </Button>
                        {!method.isDefault && (
                          <Button variant='ghost' size='sm'>
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h2 className='mb-4 text-lg font-medium text-zinc-900 dark:text-white'>Payment History</h2>
            <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
              <CardContent className='divide-y divide-zinc-200 dark:divide-zinc-700'>
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className='py-4 first:pt-2 last:pb-2'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-zinc-900 dark:text-white'>{payment.description}</p>
                        <p className='text-sm text-zinc-600 dark:text-zinc-400'>{payment.date}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-zinc-900 dark:text-white'>{formatCurrency(payment.amount)}</p>
                        <Button variant='link' size='sm' className='h-auto p-0'>
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Billing Summary */}
          <div>
            <h2 className='mb-4 text-lg font-medium text-zinc-900 dark:text-white'>Billing Summary</h2>
            <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5 text-green-500' />
                  <CardTitle className='text-base font-medium'>Current Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='mb-4 flex items-center justify-between'>
                  <div>
                    <h3 className='font-medium text-zinc-900 dark:text-white'>Professional Plan</h3>
                    <p className='text-sm text-zinc-600 dark:text-zinc-400'>Billed monthly</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-zinc-900 dark:text-white'>{formatCurrency(49.99)}/month</p>
                    <p className='text-sm text-zinc-600 dark:text-zinc-400'>Next billing date: Apr 15, 2023</p>
                  </div>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' size='sm'>
                    Change Plan
                  </Button>
                  <Button variant='outline' size='sm'>
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
