# GardenGo 🌿

On-demand gardening services marketplace built with Next.js, Supabase, and Stripe.

## Features

- 🏡 **Homeowner Portal**: Book gardening services, track appointments, and manage payments
- 🌱 **Gardener Dashboard**: Accept jobs, manage availability, and track earnings
- ⚙️ **Admin Panel**: User management, pricing rules, dispute resolution, and payout management
- 🔐 **Authentication**: Email/password and Google OAuth via Supabase Auth
- 💳 **Payments**: Secure payment processing with Stripe
- 📱 **Responsive Design**: Mobile-first UI with Tailwind CSS

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Hosting**: Vercel-ready
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ZSC
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables template:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

#### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard > Developers > API keys
3. For webhooks, use the Stripe CLI or Dashboard to set up webhook endpoints

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**⚠️ Important**: Use test mode keys during development. Never commit real secrets to version control.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Required Supabase Tables

Create the following tables in your Supabase project:

#### `users` (extends auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('homeowner', 'gardener', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### `bookings`
```sql
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES auth.users NOT NULL,
  gardener_id UUID REFERENCES auth.users,
  service_type TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'requested',
  payment_intent_id TEXT,
  amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Homeowners can view their own bookings
CREATE POLICY "Homeowners can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = homeowner_id);

-- Gardeners can view bookings assigned to them
CREATE POLICY "Gardeners can view assigned bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = gardener_id);
```

#### `payments`
```sql
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```

#### `reviews`
```sql
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings NOT NULL,
  gardener_id UUID REFERENCES auth.users NOT NULL,
  homeowner_id UUID REFERENCES auth.users NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

### Row Level Security (RLS)

All tables have RLS enabled. Make sure to configure appropriate policies based on your security requirements. The examples above show basic policies - expand them as needed for your use case.

## Google OAuth Setup

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Follow the instructions to create OAuth credentials in Google Cloud Console
4. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

## Stripe Webhooks

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

For production, set up a webhook endpoint in the Stripe Dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard pages
│   ├── auth/           # Authentication pages (signin, signup, callback)
│   ├── booking/        # Booking pages
│   ├── dashboard/      # Gardener dashboard
│   ├── api/            # API routes
│   │   ├── bookings/   # Booking endpoints
│   │   ├── payments/   # Payment intent creation
│   │   └── webhooks/   # Stripe webhook handlers
│   ├── layout.tsx      # Root layout with navigation
│   └── page.tsx        # Landing page
├── components/         # Reusable React components
│   ├── Navigation.tsx  # Main navigation component
│   └── PaymentForm.tsx # Stripe payment form
└── lib/                # Utility functions
    ├── supabase-client.ts    # Supabase client for browser
    ├── supabase-server.ts    # Supabase client for server
    └── supabase-middleware.ts # Supabase middleware
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables from `.env.example` in your Vercel project settings.

## TODO

This is a starter scaffold with placeholders. The following features need implementation:

- [ ] Complete Stripe Elements integration for card input
- [ ] Implement actual Supabase queries in API routes
- [ ] Add protected route middleware
- [ ] Implement real-time booking updates
- [ ] Add email notifications
- [ ] Implement availability calendar for gardeners
- [ ] Add image upload for before/after photos
- [ ] Implement review and rating system
- [ ] Add admin analytics dashboard
- [ ] Implement payout automation
- [ ] Add in-app chat between homeowners and gardeners

## Security Notes

- Never commit real API keys or secrets to version control
- Always use environment variables for sensitive data
- Enable Row Level Security (RLS) on all Supabase tables
- Validate all user inputs on the server side
- Use Stripe's test mode during development
- Implement proper authentication checks on protected routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checking
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
