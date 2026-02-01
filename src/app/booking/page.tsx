export default function BookingPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Book a Gardening Service</h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="service"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Service Type
            </label>
            <select
              id="service"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option>Lawn Mowing</option>
              <option>Weeding</option>
              <option>Tree Trimming</option>
              <option>Mulching</option>
              <option>Leaf Cleanup</option>
              <option>Plant Installation</option>
              <option>Green Waste Hauling</option>
              <option>Seasonal Yard Cleaning</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Preferred Date
            </label>
            <input
              type="date"
              id="date"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Preferred Time
            </label>
            <input
              type="time"
              id="time"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Service Address
            </label>
            <textarea
              id="address"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Enter your address"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Any special instructions or requirements"
            />
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue to Payment
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            TODO: Implement booking creation with Supabase and Stripe payment
            integration
          </p>
        </div>
      </div>
    </div>
  );
}
