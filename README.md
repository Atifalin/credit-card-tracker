# Credit Card Tracker

A modern React Native application for tracking credit card expenses and managing transactions.

## Features

- 💳 Track multiple credit cards and their transactions
- 📊 View total balance and transaction history
- 🔍 Advanced transaction filtering by:
  - Date ranges (Today, Week, Month, Year)
  - Transaction types (Expense/Payment)
  - Categories
  - Cards
- 📈 Comprehensive analytics:
  - Spending trends over time
  - Category-wise breakdown
  - Visual percentage bars
  - Total expenses and payments
- 📱 Beautiful, modern UI with:
  - Clean, intuitive design
  - Smooth animations
  - Visual feedback
  - Responsive layout
- 🔒 Secure authentication with Supabase
- ✨ Real-time updates

## Tech Stack

- React Native
- TypeScript
- Supabase (Backend & Authentication)
- Expo
- React Navigation
- React Native Vector Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/credit-card-tracker.git
cd credit-card-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── constants/      # Theme, colors, categories, and other constants
├── contexts/      # React contexts (Currency, Auth)
├── screens/       # Application screens
│   ├── HomeScreen.tsx           # Dashboard and overview
│   ├── TransactionsScreen.tsx   # Transaction list with filters
│   ├── AnalyticsScreen.tsx      # Spending analytics and charts
│   └── SettingsScreen.tsx       # App settings and preferences
├── services/      # API and service integrations
├── utils/         # Helper functions and utilities
└── types/        # TypeScript type definitions
```

## Features in Detail

### Transaction Management
- Add, edit, and delete transactions
- Categorize expenses
- Attach to specific cards
- Add notes and details

### Analytics
- Time-based analysis (Week/Month/Year)
- Category-wise spending breakdown
- Visual percentage bars
- Total expense and payment summaries

### Filtering
- Multi-select category filters
- Card-specific filtering
- Date range selection
- Transaction type filtering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
