import { Activity, ArrowUpRight, CreditCard, DollarSign, Download, Users } from 'lucide-react';
import PageLayout from '@/components/layout/page-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart } from '@/components/ui/bar-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { MetricCard } from '@/components/ui/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  return (
    <PageLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="sm" className="h-8 gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Reports</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm">
                Reports
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value="$45,231.89"
                change="+20.1%"
                trend="up"
                icon={<DollarSign className="h-5 w-5" />}
                description="from last month"
              />
              <MetricCard
                title="Subscriptions"
                value="+2,350"
                change="+180.1%"
                trend="up"
                icon={<Users className="h-5 w-5" />}
                description="from last month"
              />
              <MetricCard
                title="Sales"
                value="+12,234"
                change="+19%"
                trend="up"
                icon={<CreditCard className="h-5 w-5" />}
                description="from last month"
              />
              <MetricCard
                title="Active Now"
                value="+573"
                change="+201"
                trend="up"
                icon={<Activity className="h-5 w-5" />}
                description="since last hour"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart />
                </CardContent>
              </Card>
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        name: 'Olivia Martin',
                        email: 'olivia.martin@email.com',
                        amount: '+$1,999.00',
                      },
                      {
                        name: 'Jackson Lee',
                        email: 'jackson.lee@email.com',
                        amount: '+$39.00',
                      },
                      {
                        name: 'Isabella Nguyen',
                        email: 'isabella.nguyen@email.com',
                        amount: '+$299.00',
                      },
                      {
                        name: 'William Kim',
                        email: 'will@email.com',
                        amount: '+$99.00',
                      },
                      {
                        name: 'Sofia Davis',
                        email: 'sofia.davis@email.com',
                        amount: '+$39.00',
                      },
                    ].map((sale, index) => (
                      <div key={index} className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt="Avatar" />
                          <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{sale.name}</p>
                          <p className="text-muted-foreground text-sm">{sale.email}</p>
                        </div>
                        <div className="ml-auto font-medium">{sale.amount}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart />
                </CardContent>
              </Card>
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Recent actions performed in your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Document Signed',
                        description: 'Contract #1234 was signed by John Doe',
                        time: '2 hours ago',
                      },
                      {
                        title: 'New Comment',
                        description: 'Jane Smith commented on Project X',
                        time: '5 hours ago',
                      },
                      {
                        title: 'Invoice Paid',
                        description: 'Invoice #5678 was paid by Acme Corp',
                        time: 'Yesterday',
                      },
                      {
                        title: 'New Team Member',
                        description: 'Bob Johnson joined the team',
                        time: '2 days ago',
                      },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <Activity className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{activity.title}</p>
                          <p className="text-muted-foreground text-sm">{activity.description}</p>
                          <p className="text-muted-foreground text-xs">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View detailed analytics about your business performance.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[300px] items-center justify-center border-t">
                <p className="text-muted-foreground text-sm">Analytics content coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Access and download your business reports.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[300px] items-center justify-center border-t">
                <p className="text-muted-foreground text-sm">Reports content coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[300px] items-center justify-center border-t">
                <p className="text-muted-foreground text-sm">Notifications content coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
