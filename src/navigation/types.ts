import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  category: string;
  notes: string;
  transaction_date: string;
  card: {
    nickname: string;
    last_four_digits: string;
  };
}

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  CardDetails: { cardId: string };
  AddTransaction: { cardId?: string };
  EditTransaction: { transaction: Transaction };
  TransactionDetails: { transaction: Transaction };
  AddCard: undefined;
  EditCard: { cardId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Cards: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;
