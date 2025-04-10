import Layout from "@/components/layout";

export default function ArchivePage() {
  return (
    <Layout>
      <div className="space-y-4">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Archive
          </h1>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-gray-500 dark:text-gray-400">
            Archived documents will appear here.
          </p>
        </div>
      </div>
    </Layout>
  );
}
