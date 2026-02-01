export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Gardener Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Today&apos;s Jobs</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">This Week</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-purple-600">$1,250</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pending Job Requests</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">Lawn Mowing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  123 Main St - Tomorrow at 10:00 AM
                </p>
                <p className="text-sm font-medium text-green-600 mt-1">
                  $75.00
                </p>
              </div>
              <div className="space-x-2">
                <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                  Accept
                </button>
                <button className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Availability Calendar</h2>
        <p className="text-gray-600 dark:text-gray-400">
          TODO: Implement availability management with calendar view
        </p>
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        TODO: Connect to Supabase for real-time job data and availability
        management
      </p>
    </div>
  );
}
