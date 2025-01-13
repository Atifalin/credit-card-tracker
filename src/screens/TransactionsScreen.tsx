import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

interface Transaction {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  transaction_type: string;
  category: string;
  notes: string;
  receipt_url: string;
  transaction_date: string;
  card: {
    nickname: string;
    last_four_digits: string;
  };
}

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          card:cards(nickname, last_four_digits)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction' as never);
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(absAmount);
  };

  const renderTransaction = (transaction: Transaction) => {
    const isExpense = transaction.transaction_type === 'expense';
    
    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetails' as never, { transaction } as never)}
      >
        <View style={styles.transactionIcon}>
          <Icon
            name={isExpense ? 'arrow-down' : 'arrow-up'}
            size={24}
            color={isExpense ? COLORS.error : COLORS.success}
          />
        </View>
        <View style={styles.transactionInfo}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionCategory}>
              {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
            </Text>
            <Text
              style={[
                styles.transactionAmount,
                {
                  color: isExpense ? COLORS.error : COLORS.success,
                },
              ]}
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionCard}>
              {transaction.card.nickname} (*{transaction.card.last_four_digits})
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(transaction.transaction_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {transactions.map((transaction) => renderTransaction(transaction))}

        {transactions.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="credit-card-off" size={48} color={COLORS.gray400} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first transaction using the + button below
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddTransaction}
        disabled={loading}
      >
        <Icon name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  transactionCategory: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.gray800,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  transactionCard: {
    fontSize: SIZES.sm,
    color: COLORS.gray600,
  },
  transactionDate: {
    fontSize: SIZES.sm,
    color: COLORS.gray600,
  },
  transactionNotes: {
    fontSize: SIZES.sm,
    color: COLORS.gray600,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyStateText: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray600,
    marginTop: SIZES.md,
  },
  emptyStateSubtext: {
    fontSize: SIZES.md,
    color: COLORS.gray500,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SIZES.xl,
    bottom: SIZES.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
