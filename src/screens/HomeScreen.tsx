import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCY_SYMBOLS } from '../constants/currencies';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { currency } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [cards, setCards] = useState([]);

  const fetchData = async () => {
    try {
      const [cardsResult, transactionsResult] = await Promise.all([
        supabase.from('cards').select('*').limit(3),
        supabase.from('transactions')
          .select('*, card:cards(*)')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (cardsResult.error) throw cardsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setCards(cardsResult.data || []);
      setRecentTransactions(transactionsResult.data || []);
      setTotalBalance(cardsResult.data?.reduce((sum, card) => sum + (card.current_balance || 0), 0) || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currency]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderTransaction = (transaction) => {
    const isExpense = transaction.type === 'expense';
    const amount = transaction.amount;
    const formattedAmount = formatCurrency(amount, currency);
    
    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetails', { transaction })}
      >
        <View style={[styles.transactionIcon, { backgroundColor: isExpense ? `${COLORS.error}15` : `${COLORS.success}15` }]}>
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
                { color: isExpense ? COLORS.error : COLORS.success }
              ]}
            >
              {formattedAmount}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            {transaction.card && (
              <Text style={styles.transactionCard}>
                {transaction.card.nickname} (*{transaction.card.last_four})
              </Text>
            )}
            <Text style={styles.transactionDate}>
              {new Date(transaction.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Track your expenses</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#6C5CE7', '#8E7CF7', '#A594FF']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {CURRENCY_SYMBOLS[currency]}{formatCurrency(Math.abs(totalBalance), currency, false).replace(/[₹$]/g, '')}
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity 
              style={styles.balanceButton}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Icon name="plus-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.balanceButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'credit-card', label: 'Cards', screen: 'Cards' },
            { icon: 'history', label: 'History', screen: 'Transactions' },
            { icon: 'chart-line', label: 'Analytics', screen: 'Analytics' }
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((transaction) => renderTransaction(transaction))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  balanceCard: {
    margin: SIZES.screenPadding,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.white + '99',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  balanceActions: {
    marginTop: 16,
    flexDirection: 'row',
  },
  balanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  balanceButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  transactionsSection: {
    paddingHorizontal: SIZES.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  seeAllButton: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray800,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCard: {
    fontSize: 13,
    color: COLORS.gray600,
  },
  transactionDate: {
    fontSize: 13,
    color: COLORS.gray500,
  },
});
