# Investment Tracking Updates

## Overview
This document describes the improvements made to the finance tracker app to better handle investment tracking and improve financial visualizations.

## Changes Implemented

### 1. Investment Category Exclusion from Regular Expenses

**Problem:** When adding an expense in an "Investments" category, it was being counted as a regular expense on the main dashboard, which skewed the expense calculations.

**Solution:**
- Added `is_investment_category` boolean field to the `categories` table
- Updated all dashboard calculations to exclude transactions in investment categories from regular expense totals
- This ensures investment-related expenses (like buying stocks) don't count as regular spending

**Migration File:** `supabase/migrations/1762900000_add_investment_category_flag.sql`

**What to do:**
1. Apply the migration to your Supabase database
2. Go to your categories and mark any investment-related categories with the `is_investment_category` flag
3. The migration automatically marks categories with "invest" in their name

### 2. Enhanced Monthly Income vs Expense Graph

**Problem:** The monthly income vs expense graph was basic and didn't provide enough insights.

**Solution:**
- Replaced the area chart with a ComposedChart showing:
  - **Income** as green bars
  - **Expenses** as red bars (excluding investment categories)
  - **Net Savings** as a blue line overlay
- Added rounded corners to bars for better aesthetics
- Graph now clearly shows monthly savings trends at a glance

**Files Modified:** `src/components/Dashboard.tsx`

### 3. Connected Investment Accounts Feature

**Problem:** Users had to manually track their investment accounts (like Boursobank) by entering data manually, with no day-to-day movement tracking.

**Solution:** Created a comprehensive connected accounts system with:

#### New Database Tables:
1. **`connected_accounts`** - Stores connected investment account information
   - Provider name (Boursobank, Interactive Brokers, etc.)
   - Account nickname
   - Account type (stocks, crypto, bonds, etc.)
   - Sync frequency settings
   - Last synced timestamp

2. **`account_holdings`** - Individual positions in connected accounts
   - Symbol/ticker
   - Quantity
   - Average cost
   - Current price
   - Current value
   - Gain/loss tracking

3. **`account_transactions`** - Transaction history for connected accounts
   - Buy/sell/dividend/deposit/withdrawal tracking
   - Complete audit trail

**Migration File:** `supabase/migrations/1762900100_add_connected_investment_accounts.sql`

#### New UI Components:
1. **`ConnectedAccounts.tsx`** - Full-featured component for:
   - Viewing all connected accounts
   - Adding new account connections
   - Manual sync with account providers
   - Viewing holdings with real-time gains/losses
   - Disconnecting accounts

2. **Updated `Investments.tsx`** - Now includes:
   - Tab navigation between "Manual Entries" and "Connected Accounts"
   - Seamless switching between manual and connected investment tracking

## How to Use the New Features

### Setting Up Investment Categories

1. Go to your Categories settings
2. Create or identify categories for investments (e.g., "Stock Purchases", "Crypto Investments")
3. Mark them with `is_investment_category = true` in the database
4. Any transactions in these categories will no longer count as regular expenses

### Connecting an Investment Account

1. Navigate to **Investments** page
2. Click the **"Connected Accounts"** tab
3. Click **"Connect Account"**
4. Fill in the details:
   - **Provider**: Select your broker (Boursobank, Degiro, etc.)
   - **Account Nickname**: Give it a memorable name
   - **Account Type**: Stocks, crypto, bonds, etc.
   - **Sync Frequency**: How often to sync (daily, weekly, manual)
5. Click **"Connect Account"**

### Syncing Your Portfolio

1. In the Connected Accounts view, find your account
2. Click the **Refresh icon** to sync
3. The system will update:
   - Current holdings
   - Prices
   - Gains/losses
   - Last synced timestamp

## Implementation Notes

### For Production Deployment:

The current implementation creates a **framework** for connected accounts. To make it fully functional with real APIs, you'll need to:

1. **API Integration:**
   - Implement OAuth flows for each provider
   - Create Supabase Edge Functions to handle API calls
   - Store encrypted credentials securely (use Supabase Vault)

2. **Automatic Syncing:**
   - Set up scheduled jobs using Supabase Cron
   - Call provider APIs to fetch latest portfolio data
   - Update `account_holdings` and `account_transactions` tables

3. **Supported Providers:**
   - **Boursobank**: Requires their API credentials and OAuth setup
   - **Interactive Brokers**: Has official APIs available
   - **Degiro**: May require third-party API or screen scraping
   - **Manual Entry**: Already works for any provider

4. **Security Considerations:**
   - Never store API credentials in plain text
   - Use Supabase Vault for sensitive data
   - Implement rate limiting on API calls
   - Add 2FA verification for connecting accounts

### Example: Boursobank Integration

For Boursobank specifically, you would:

1. Register for Boursobank API access (if available)
2. Create a Supabase Edge Function at `supabase/functions/sync-boursobank/index.ts`
3. Implement OAuth flow to get user's access token
4. Store encrypted token in `connected_accounts.credentials_encrypted`
5. Periodically call Boursobank API to fetch:
   - Portfolio positions
   - Account balance
   - Recent transactions
   - Current stock prices
6. Update the database tables with the fetched data

### Database Migrations

To apply these changes to your production database:

```bash
# If using Supabase CLI
supabase db push

# Or apply migrations manually via Supabase Dashboard
# Navigate to: Database > Migrations
# Upload and run the migration files
```

## Benefits

1. **Accurate Expense Tracking**: Investment purchases no longer skew your living expenses
2. **Better Insights**: The enhanced graph clearly shows your true savings rate
3. **Automatic Portfolio Tracking**: Once connected, accounts sync automatically
4. **Centralized View**: See all investments (manual + connected) in one place
5. **Day-to-Day Movements**: Track real-time changes in your portfolio value
6. **Historical Data**: Complete transaction history for tax reporting and analysis

## Future Enhancements

Potential additions to consider:

1. **Portfolio Analytics**:
   - Asset allocation pie chart
   - Performance vs benchmarks (S&P 500, etc.)
   - Dividend tracking and projections

2. **Tax Reporting**:
   - Capital gains/losses calculator
   - Export for tax forms
   - Wash sale detection

3. **Alerts & Notifications**:
   - Price alerts for specific stocks
   - Portfolio value milestones
   - Large daily movements

4. **Multi-Currency Support**:
   - Handle international investments
   - Automatic currency conversion
   - Display in user's preferred currency

## Support

For any issues or questions about these features:
- Check the GitHub repository issues
- Review the code comments in the new components
- Test with manual entries first before connecting real accounts
