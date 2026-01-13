'use client';
import { ArrowRight, CheckCircle, Clock, FileText, Shield, TabletSmartphone, Users } from 'lucide-react';
import Link from 'next/link';
import { NutrientLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DocumentPreview } from '@/components/ui/document-preview';

// Make sure the component is properly exported
const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <NutrientLogo className="h-6 w-6 text-gray-800 dark:text-gray-200" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Nutrient Sign</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="hidden h-9 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 sm:inline-flex dark:border-gray-600 dark:text-gray-300 dark:hover:border-white dark:hover:text-white"
                >
                  Log in
                </Link>
                <Link href="/signup" className="hidden sm:inline-flex">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-12 md:py-20 dark:bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
                Sign documents securely from anywhere
              </h1>
              <p className="max-w-lg text-lg text-gray-600 dark:text-gray-300">
                Streamline your document workflows with our secure, legally binding electronic signature solution. Save
                time, reduce costs, and improve efficiency.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] overflow-hidden rounded-xl shadow-xl">
              <DocumentPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16 dark:bg-zinc-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Powerful Features for Document Signing</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Everything you need to manage, sign, and track your documents in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
                title: 'Legally Binding Signatures',
                description:
                  'Our electronic signatures are legally binding and compliant with eSignature laws worldwide.',
              },
              {
                icon: <Shield className="h-6 w-6 text-green-500" />,
                title: 'Bank-Level Security',
                description: 'Your documents are protected with enterprise-grade security and 256-bit encryption.',
              },
              {
                icon: <Users className="h-6 w-6 text-purple-500" />,
                title: 'Team Collaboration',
                description: 'Invite team members, assign roles, and collaborate on documents in real-time.',
              },
              {
                icon: <Clock className="h-6 w-6 text-orange-500" />,
                title: 'Automated Workflows',
                description: 'Create custom document workflows to automate your signing processes.',
              },
              {
                icon: <FileText className="h-6 w-6 text-red-500" />,
                title: 'Document Templates',
                description: 'Save time by creating reusable templates for your common documents.',
              },
              {
                icon: <TabletSmartphone className="h-6 w-6 text-indigo-500" />,
                title: 'Mobile Signing',
                description: 'Sign documents on the go from any device with our responsive mobile experience.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 dark:bg-zinc-700">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 dark:bg-blue-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to streamline your document workflows?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
              Join thousands of businesses that trust Sign for their document signing needs.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="ghost" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <NutrientLogo className="h-6 w-6 text-gray-800 dark:text-gray-200" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Nutrient Sign</span>
            </div>
            <p className="mt-4 text-sm text-gray-600 md:mt-0 dark:text-gray-300">
              &copy; {new Date().getFullYear()} Sign. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Use a named export instead of default export
export { LandingPage };
