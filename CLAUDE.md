# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack personal finance tracking application built with React, TypeScript, and Supabase. Features include transaction management, investment tracking, AI-powered insights, voice input, and monthly PDF reports. The app is a Progressive Web App (PWA) with offline capabilities.

**Production URL**: https://finance-trackerv1.vercel.app/

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server with HMR
pnpm dev

# Run linter
pnpm lint

# Build for development (includes source identifiers)
pnpm build

# Build for production (no source identifiers)
pnpm build:prod

# Preview production build
pnpm preview

# Clean install (removes node_modules and reinstalls)
pnpm clean && pnpm install
```

## Architecture Overview

### Authentication & User Data Isolation

The application uses **Supabase Auth** for user management with Row Level Security (RLS) policies ensuring complete data isolation between users. All database tables include a `user_id` foreign key with RLS policies.

- **AuthContext** (`src/contexts/AuthContext.tsx`): Provides centralized authentication state and methods (`signIn`, `signUp`, `signOut`, `resetPassword`, `updateProfile`)
- **ProtectedRoute** component: Wraps all authenticated routes to enforce access control
- Email verification is required before users can access the application
- All data operations automatically filter by the authenticated user's `user_id`

### Database Schema

Managed through Supabase with the following tables (all include `user_id` for RLS):

- `user_profiles` - User account information
- `categories` - User-defined expense/income categories with budgets
- `transactions` - Financial transactions (income/expense)
- `investments` - Investment portfolio tracking
- `monthly_reports` - Generated monthly financial reports with PDF URLs
- `user_settings` - User preferences and settings
- `accounts` - User bank/financial accounts (checking, savings, credit card, loan)
- `net_worth_history` - Historical net worth snapshots
- `goals` - User financial goals with target amounts and deadlines
- `connected_accounts` - External account connections with sync metadata
- `account_holdings` - Investment holdings per connected account
- `account_transactions` - Transactions from connected accounts

### Supabase Integration

The Supabase client is configured in `src/lib/supabase.ts`:
- Connection URL and anon key are hardcoded (secure for client-side use)
- TypeScript interfaces for all database tables are exported
- All components use the authenticated user's ID to filter queries

### Application Routing

Routes are defined in `src/App.tsx`:

**Public Routes:**
- `/login` - User login
- `/register` - New user registration
- `/auth/callback` - Email verification callback

**Protected Routes (require authentication):**
- `/` - Dashboard (redirects to login if unauthenticated)
- `/accounts` - Bank/financial accounts management
- `/goals` - Financial goals tracking
- `/transactions` - Transaction management
- `/subscriptions` - Recurring subscriptions management
- `/investments` - Investment portfolio
- `/reports` - Monthly reports with PDF generation
- `/input` - Smart data input (AI parsing, voice input, file upload)
- `/profile` - User account management

### Core Components

**Dashboard** (`src/components/Dashboard.tsx`):
- Main landing page showing financial overview
- Displays total income, expenses, savings, and net worth
- Charts: spending trends, category breakdown, recent transactions
- AI-powered financial insights (fetched from Supabase Edge Function)

**DataInput** (`src/components/DataInput.tsx`):
- Smart input interface with three methods:
  1. Text parsing via AI (natural language to transactions)
  2. Voice input (speech-to-text then AI parsing)
  3. CSV/bank statement file upload
- Uses Supabase Edge Function for AI parsing
- Auto-categorizes transactions based on merchant/description

**Transactions** (`src/components/Transactions.tsx`):
- Full CRUD for transactions
- Filtering by date, category, type (income/expense)
- Swipeable rows on mobile for quick delete

**Analytics** (`src/components/Analytics.tsx`):
- Advanced visualizations using Recharts
- Spending trends, budget tracking, category analysis
- Customizable date ranges

**Investments** (`src/components/Investments.tsx`):
- Track investment portfolio (stocks, crypto, real estate, etc.)
- Shows current value, gains/losses, performance over time

**Reports** (`src/components/Reports.tsx`):
- Generates and displays monthly financial reports
- Triggers Supabase Edge Function to generate PDF reports
- Downloads PDF with comprehensive financial summary

**Accounts** (`src/components/Accounts.tsx`):
- Manage bank and financial accounts
- Track balances across checking, savings, credit cards, and loans
- Net worth calculation based on assets vs liabilities

**Goals** (`src/components/Goals.tsx`):
- Create and track financial goals
- Progress visualization with target amounts and deadlines

**Subscriptions** (`src/components/Subscriptions.tsx`):
- Manage recurring transactions and subscriptions
- Track monthly recurring expenses

### Supabase Edge Functions

The application relies on several Edge Functions (serverless functions):

1. **AI Insights** - Analyzes financial data and provides personalized insights
2. **Text Parsing** - Converts natural language input to structured transaction data
3. **PDF Generation** - Creates monthly financial reports as PDFs
4. **Report Cron** - Automated monthly report generation (scheduled job)

These are called via `supabase.functions.invoke()` from the frontend.

### Theme System

**ThemeContext** (`src/contexts/ThemeContext.tsx`):
- Supports light, dark, and system modes
- Uses `next-themes` library
- Theme toggle available in navigation bar
- Dark mode styling via Tailwind's `dark:` prefix

### State Management

- React Context for global state (Auth, Theme)
- Local component state with React hooks
- Real-time updates via Supabase subscriptions (where applicable)
- No external state management library (Redux, Zustand, etc.)

### UI Component Library

- Custom components built with Radix UI primitives
- Styled with Tailwind CSS
- Follows shadcn/ui patterns (components imported via `@/` alias)
- Responsive design with mobile-first approach

### PWA Features

- Service Worker registered in `public/sw.js`
- Manifest file at `public/manifest.json`
- Offline caching for core assets
- Install prompt for mobile devices

## Important Development Notes

### TypeScript Configuration

- `@ts-nocheck` is used in several component files to bypass strict type checking for chart libraries
- Path alias `@/` maps to `./src/` (configured in `vite.config.ts`)

### Seeding Default Categories

When a new user signs up, default categories are automatically seeded via `seedDefaultCategories()` utility in `src/lib/utils.ts`. This ensures users have a starting set of expense/income categories.

### Real-time Data Flow

Most components follow this pattern:
1. Check if user is authenticated via `useAuth()`
2. Load data filtered by `user.id`
3. Subscribe to auth state changes
4. Clear data on logout

### Voice Input

`VoiceInput` component uses the Web Speech API (browser-native):
- Only works in HTTPS or localhost
- Requires microphone permissions
- Transcribes speech to text, then sends to AI parsing

### Chart Theming

Charts use dynamic colors based on theme via `getChartColors()` helper in `ChartComponents.tsx`. This ensures visualizations adapt to light/dark mode.

### Build Notes

- Development builds include `vite-plugin-source-identifier` for debugging
- Production builds (`build:prod`) exclude source identifiers
- Build uses manual chunking strategy:
  - `vendor`: react, react-dom, react-router-dom
  - `charts`: recharts
  - `ui`: Radix UI components

## Testing & Deployment

The application has been fully tested with 13/13 tests passing (see `AUTHENTICATION_COMPLETE.md` for details). All authentication flows, protected routes, UI/UX, and security measures have been validated.

Deployment is via Vite build output to a static hosting service. The Supabase backend is managed separately with database migrations applied through the Supabase dashboard or CLI.
