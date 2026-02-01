# GigSync Driver Co-Pilot: Production Blueprint

**Project:** GigSync - The AI Driver Assistant App
**Version:** 1.0 (MVP)
**Target Launch:** Q4 2024
**Launch Market:** Redwood City, CA (Pilot Program)

---

### 1. Vision Statement

To empower gig-economy drivers by transforming their smartphone into an intelligent co-pilot. GigSync will help drivers maximize their earnings, reduce costs, and make smarter decisions on every trip by providing AI-powered analysis of orders, routes, and performance—all without requiring direct integration with delivery platform APIs.

### 2. Target Audience

Primary users are independent contractors driving for app-based food delivery platforms like DoorDash and UberEats. These drivers often "multi-app" (run multiple platforms simultaneously) to maximize their income opportunities.

-   **Demographics:** Age 20-55, tech-savvy, often working part-time or as a primary source of income.
-   **Motivations:** Financial independence, flexible work hours.
-   **Pain Points:**
    -   Difficulty quickly assessing if a delivery offer is profitable.
    -   Stress from managing multiple orders from different apps.
    -   Inefficient routing leading to wasted time and fuel.
    -   Uncertainty about the best times and locations to drive.
    -   The burden of tracking mileage and earnings for tax purposes.

### 3. The GigSync Solution: "No-API" Intelligence

GigSync operates independently of delivery platforms, which is our core strategic advantage. Instead of relying on brittle, unofficial APIs, we leverage the device's camera and our powerful AI backend. Drivers provide a screenshot of an offer, and our system instantly provides the critical data they need. This makes our service robust and platform-agnostic.

### 4. Core Features (MVP for Redwood City Launch)

The MVP is focused on the highest-impact features that directly increase a driver's hourly rate.

#### **Feature 1: The Offer Analyzer (Instant Profit Score)**

-   **Core Function:** Provides an instant "Go/No-Go" recommendation on any delivery offer.
-   **User Flow:**
    1.  A driver receives an offer from DoorDash/UberEats.
    2.  The driver takes a screenshot.
    3.  The driver taps the GigSync "Scan Screenshot" button.
    4.  Our AI (powered by Gemini Vision) reads the image, extracting the **Restaurant**, **Pay**, **Distance**, and **Drop-off Area**.
    5.  It then calculates a `profitScore` (1-10) based on pay-per-mile, estimated time, and restaurant wait-time data.
-   **Technical Implementation:** Leverages `parseOfferScreenshot` from `services/geminiService.ts` and the UI in `components/ActiveShiftView.tsx`.

#### **Feature 2: The Smart Stacker (Multi-App Route Optimizer)**

-   **Core Function:** Calculates the most efficient pickup and drop-off sequence for multiple active orders, even across different apps.
-   **User Flow:**
    1.  A driver has accepted multiple orders (entered via the Offer Analyzer or manually).
    2.  The driver taps the "Optimize Route" button in their active stack.
    3.  Our AI analyzes the job locations and real-time traffic indicators to provide a simple, ordered list of stops.
-   **Technical Implementation:** Utilizes the `optimizeRouteStack` and `analyzeStackBundle` functions, integrated within `components/ActiveShiftView.tsx`.

#### **Feature 3: The Earnings Dashboard & Mileage Tracker**

-   **Core Function:** Provides a clear, real-time overview of shift performance and automates mileage tracking for tax deductions.
-   **User Flow:**
    1.  Mileage tracking starts automatically when the user is in "Driver App" mode.
    2.  The dashboard displays total earnings, total miles driven, jobs completed, and crucial efficiency metrics like average $/mile.
-   **Technical Implementation:** Powered by `components/DashboardView.tsx` and the live GPS tracking logic within `App.tsx`.

#### **Feature 4: The AI Co-Pilot (On-Demand Advice)**

-   **Core Function:** An expert assistant drivers can ask for advice on tax write-offs, handling difficult delivery situations, or identifying potentially busy areas.
-   **User Flow:** The driver opens the "Co-Pilot" tab and types or speaks a question. The AI provides a grounded, helpful response.
-   **Technical Implementation:** `components/ChatView.tsx` and `components/LiveView.tsx` provide the interface, backed by the Gemini API with Google Search grounding for real-time information.

### 5. Go-to-Market Strategy (Redwood City Pilot)

1.  **Grassroots Marketing:** Engage with local drivers in Redwood City-area Facebook Groups, Reddit communities (e.g., r/doordash_drivers), and at popular driver waiting spots.
2.  **Freemium Model:** Offer a free tier with a limited number of screenshot analyses per day. A "Pro" subscription will unlock unlimited analyses, route optimization, and advanced analytics.
3.  **Feedback Loop:** Establish a direct line of communication with pilot users to rapidly iterate on the `profitScore` algorithm and gather feature requests.

### 6. Future Roadmap (Post-Launch)

-   **Predictive Hotspots:** Aggregate anonymized trip data to forecast which areas of the city will be busiest at specific times, helping drivers position themselves for high-value orders.
-   **Advanced Voice Integration:** Enhance the "Voice Mode" to allow for fully hands-free operation, including scanning offers and managing stacks via voice commands.
-   **Tax Center:** Integrate tools to help drivers estimate quarterly tax payments and prepare end-of-year summaries based on their tracked income and mileage.
-   **Community Features:** Allow drivers to share tips, report on restaurant wait times, and alert others to traffic or local events.
### 7. API Structure (Node.js / Express)

All routes are prefixed with `/api/v1`. Authenticated routes require a `Bearer` token (JWT) in the `Authorization` header.

#### **Auth**
- `POST /auth/register` - Create a new user account.
  - Body: `{ email, password }`
- `POST /auth/login` - Authenticate a user and receive a JWT.
  - Body: `{ email, password }`
- `GET /auth/me` - (Protected) Get profile information for the currently logged-in user.

#### **Shifts**
- `POST /shifts/start` - (Protected) Start a new shift.
  - Body: `{ startTime }`
- `POST /shifts/end` - (Protected) End the currently active shift.
  - Body: `{ endTime }`
- `GET /shifts/active` - (Protected) Get the current active shift details.
- `GET /shifts/history` - (Protected) Get a list of all completed shifts for the current user.
- `GET /shifts/:id` - (Protected) Get details for a specific shift from history.

#### **Orders**
- `POST /orders/analyze` - (Protected) Analyzes a potential order's profitability before acceptance.
  - Body: `{ pay, distance, estimatedTime }`
- `GET /orders/stats` - (Protected) Get aggregate statistics for completed orders.
  - Query Params: `?period=week` (e.g., day, week, month)
- `GET /orders` - (Protected) Get all orders for the current user, possibly filtered by shift.
  - Query Params: `?shiftId=<uuid>`
- `POST /orders` - (Protected) Add a new order to the current active shift.
  - Body: `{ shiftId, platform, payout, distance, duration, profitScore }`
- `GET /orders/:id` - (Protected) Get a single order.
- `PUT /orders/:id` - (Protected) Update an order.
- `DELETE /orders/:id` - (Protected) Delete an order.

#### **Mileage Logs**
- `POST /mileage/start` - (Protected) Starts a new mileage tracking session.
  - Body: `{ startLocation, timestamp }`
- `POST /mileage/stop` - (Protected) Stops the current session and logs the trip.
  - Body: `{ endLocation, distance, timestamp }`
- `GET /mileage/report` - (Protected) Get a mileage report for a specified period.
  - Query Params: `?period=week` (e.g., week, month, year)

#### **Payments & Subscriptions**
- `POST /subscribe` - (Protected) Create a checkout session to start a new subscription.
- `POST /cancel` - (Protected) Cancel the user's active subscription.
- `GET /billing/status` - (Protected) Get the current user's subscription and billing status.
- `GET /subscriptions/plans` - Get available subscription plans.
- `POST /subscriptions/webhook` - Webhook endpoint for payment providers to send updates (e.g., successful payment, cancellation).

#### **AI Services (Server-Side Proxy)**
These routes proxy requests to the Gemini API, keeping the API key secure.
- `POST /ai/analyze-offer` - (Protected) Analyzes a delivery offer screenshot.
  - Body: `{ image: <base64_string> }`
- `POST /ai/optimize-route` - (Protected) Optimizes the route for a stack of orders.
  - Body: `{ orders: [...] }`
- `POST /ai/analyze-earnings` - (Protected) Generates insights from completed jobs.
  - Body: `{ jobs: [...] }`

### 8. Legal & Compliance

-   **Company Structure:** GigSync will be established as a Limited Liability Company (LLC) in the state of California.
-   **Terms of Service:** A clear `TERMS_OF_SERVICE.md` document will govern the use of the app, including a disclaimer that GigSync is not affiliated with DoorDash, Uber, or any other delivery platforms.
-   **Privacy Policy:** A comprehensive `PRIVACY_POLICY.md` will be provided to users, outlining data collection, usage, and protection practices in compliance with relevant regulations.
