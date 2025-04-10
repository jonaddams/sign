import Layout from "@/components/layout";
import PageContent from "@/components/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, SendHorizontal, Users } from "lucide-react";

export default function SendPage() {
  return (
    <Layout>
      <PageContent
        title="Send"
        description="Send documents for signature or review"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base font-medium">
                  Upload Document
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Upload a document from your computer to send for signature.
              </p>
              <Button variant="outline" className="w-full">
                Select File
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <CardTitle className="text-base font-medium">
                  Add Recipients
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Choose who needs to sign or receive a copy of your document.
              </p>
              <Button variant="outline" className="w-full">
                Select Recipients
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 shadow-sm dark:border-zinc-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <SendHorizontal className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base font-medium">
                  Send for Signature
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Review and send your document for electronic signature.
              </p>
              <Button variant="outline" className="w-full">
                Review & Send
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Layout>
  );
}
