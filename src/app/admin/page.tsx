export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
            Total Users
          </h3>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
            Active Bookings
          </h3>
          <p className="text-3xl font-bold text-green-600">89</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-blue-600">$52,340</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
            Pending Disputes
          </h3>
          <p className="text-3xl font-bold text-red-600">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View and manage homeowners and gardeners
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            View Users
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Rules</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set service pricing and commission rates
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Manage Pricing
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dispute Resolution</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Handle customer and gardener disputes
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            View Disputes
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payout Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage gardener payouts and schedules
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Manage Payouts
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        TODO: Implement admin functionality with Supabase queries and
        role-based access control
      </p>
    </div>
  );
}
