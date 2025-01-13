# Credit Card Tracker

A modern React Native application for tracking credit card expenses and managing transactions.

## Features

- 💳 Track multiple credit cards and their transactions
- 📊 View total balance and transaction history
- 📱 Beautiful, modern UI with gradient designs
- 🔒 Secure authentication with Supabase
- 📈 Analytics for expense tracking
- ✨ Real-time updates

## Tech Stack

- React Native
- TypeScript
- Supabase (Backend & Authentication)
- Expo
- React Navigation

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
├── constants/      # Theme, colors, and other constants
├── screens/        # Application screens
├── services/       # API and service integrations
└── types/         # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
