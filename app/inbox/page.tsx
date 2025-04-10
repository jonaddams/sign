import Layout from "@/components/layout";
import PageContent from "@/components/page-content";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock inbox data
const inboxItems = [
  {
    id: "1",
    sender: "John Doe",
    subject: "Contract Review Request",
    date: "Today, 10:30 AM",
    status: "Urgent",
  },
  {
    id: "2",
    sender: "Jane Smith",
    subject: "Partnership Agreement",
    date: "Yesterday, 3:45 PM",
    status: "New",
  },
  {
    id: "3",
    sender: "Acme Corp",
    subject: "Vendor Agreement",
    date: "Mar 15, 2023",
    status: "Pending",
  },
];

export default function InboxPage() {
  return (
    <Layout>
      <PageContent
        title="Inbox"
        description="Manage your incoming documents and requests"
      >
        <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inboxItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium">{item.sender}</TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "Urgent"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : item.status === "New"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </Layout>
  );
}
