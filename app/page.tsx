import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            NWSL Data Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Access comprehensive National Women&apos;s Soccer League data through our powerful analytics platform
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/query"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Natural Language Query
            </Link>
            <Link
              href="/explore"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
            >
              Explore Data <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Natural Language Queries
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Ask questions in plain English and get instant analytics powered by our AI orchestrator
              </p>
            </div>

            <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Direct SQL Access
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Execute SQL queries directly against our comprehensive NWSL database
              </p>
            </div>

            <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Advanced Analytics
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Spatial analysis, player intelligence, tactical effectiveness, and more
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
