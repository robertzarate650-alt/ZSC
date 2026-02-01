import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 text-green-600">
          🌿 GardenGo
        </h1>
        <p className="text-2xl mb-8 text-gray-700 dark:text-gray-300">
          On-Demand Gardening Services
        </p>
        <p className="text-lg mb-12 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Professional lawn mowing, weeding, tree trimming, mulching, and more.
          Book a gardener in minutes and transform your outdoor space.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">🏡 Homeowners</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Book services, track gardeners, and pay in-app
            </p>
            <Link
              href="/booking"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Book Now
            </Link>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">🌱 Gardeners</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Accept jobs, manage availability, and earn money
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">⚙️ Admin</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage users, pricing, and platform operations
            </p>
            <Link
              href="/admin"
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-500">
          <Link href="/auth/signin" className="hover:underline">
            Sign In
          </Link>
          {' | '}
          <Link href="/auth/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
