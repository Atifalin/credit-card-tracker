# Credit Card Expense Manager - Project Instructions

## Project Overview
A cross-platform expense management application built with Expo React Native and Supabase, focusing on credit card expense tracking, analytics, and secure data management.

## Tech Stack
- **Frontend Framework**: Expo React Native
- **Backend/Database**: Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State Management**: React Context + Supabase Realtime

## Project Setup Steps

### 1. Environment Setup
- [ ] Install Node.js and npm
- [ ] Install Expo CLI
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Initialize Git repository

### 2. Project Structure
```
src/
├── assets/
├── components/
├── screens/
├── navigation/
├── services/
├── hooks/
├── utils/
└── constants/
```

### 3. Feature Implementation Phases

#### Phase 1: Foundation & Authentication
- [ ] Project initialization with Expo
- [ ] Supabase configuration
- [ ] Authentication screens (Login/Signup)
- [ ] Gmail OAuth integration
- [ ] Basic navigation setup
- [ ] Theme and styling setup

#### Phase 2: Onboarding & Card Management
- [ ] User onboarding flow
- [ ] Credit card addition interface
- [ ] Card management screens
- [ ] Data validation
- [ ] Card editing and deletion

#### Phase 3: Core Features
- [ ] Dashboard implementation
- [ ] Transaction management
- [ ] Calendar timeline
- [ ] Image upload for receipts
- [ ] Transaction categorization
- [ ] Balance tracking

#### Phase 4: Analytics & Reports
- [ ] Analytics dashboard
- [ ] Expense charts and graphs
- [ ] Spending patterns
- [ ] Category-wise analysis
- [ ] Monthly/yearly reports

#### Phase 5: Data Security & Backup
- [ ] Data encryption
- [ ] Backup system
- [ ] Export functionality
- [ ] Restore functionality

#### Phase 6: Polish & Optimization
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Testing
- [ ] Bug fixes
- [ ] App store preparation

## Database Schema

### Users Table
```sql
users (
  id uuid references auth.users,
  email text,
  created_at timestamp,
  updated_at timestamp
)
```

### Cards Table
```sql
cards (
  id uuid,
  user_id uuid references users,
  last_four text,
  nickname text,
  expiry_year int,
  expiry_month int,
  current_balance decimal,
  statement_date int,
  due_date int,
  created_at timestamp,
  updated_at timestamp
)
```

### Transactions Table
```sql
transactions (
  id uuid,
  user_id uuid references users,
  card_id uuid references cards,
  amount decimal,
  transaction_type text,
  category text,
  notes text,
  receipt_url text,
  transaction_date timestamp,
  created_at timestamp,
  updated_at timestamp
)
```

## UI/UX Guidelines
- Modern, clean interface
- Gradient color schemes
- Intuitive navigation
- Responsive design
- Clear data visualization
- Smooth animations
- Toast notifications for actions

## Security Requirements
- Secure authentication
- Data encryption
- Secure file storage
- Regular backups
- Privacy compliance
- Secure API communication

## Testing Strategy
- Unit tests for components
- Integration tests
- E2E testing
- Performance testing
- Security testing

## Deployment Checklist
- [ ] Environment variables configuration
- [ ] App icons and splash screens
- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics integration
- [ ] App store assets preparation
- [ ] Documentation completion
