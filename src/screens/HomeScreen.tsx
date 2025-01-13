import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS, SIZES, GRADIENTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatters';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [cards, setCards] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .limit(3);
      
      if (cardsError) throw cardsError;
      setCards(cardsData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactionsData || []);

      // Calculate total balance
      const total = (cardsData || []).reduce((sum, card) => sum + (card.current_balance || 0), 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.gray700} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={GRADIENTS.balance}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.33, 0.66, 1]}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cards')}
          >
            <Ionicons name="card-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Cards</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Ionicons name="list-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Ionicons name="bar-chart-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction, index) => (
            <TouchableOpacity 
              key={transaction.id}
              style={[styles.transaction, index === 0 && styles.firstTransaction]}
              onPress={() => navigation.navigate('TransactionDetails', { transaction })}
            >
              <View style={[
                styles.transactionIcon,
                { backgroundColor: transaction.type === 'expense' ? COLORS.gray100 : COLORS.success + '15' }
              ]}>
                <Ionicons 
                  name={transaction.type === 'expense' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                  size={20} 
                  color={transaction.type === 'expense' ? COLORS.error : COLORS.success} 
                />
              </View>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle}>{transaction.description || transaction.category}</Text>
                  <Text 
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'expense' ? COLORS.error : COLORS.success }
                    ]}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
                {transaction.card && (
                  <Text style={styles.transactionSubtitle}>
                    {transaction.card.nickname} (*{transaction.card.last_four})
                  </Text>
                )}
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  welcomeText: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  balanceCard: {
    margin: SIZES.screenPadding,
    padding: SIZES.xl,
    borderRadius: SIZES.cardRadius,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceLabel: {
    color: COLORS.white,
    fontSize: SIZES.md,
    opacity: 0.9,
    fontWeight: '500',
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: SIZES.xxl * 1.2,
    fontWeight: 'bold',
    marginVertical: SIZES.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.buttonRadius,
    marginTop: SIZES.md,
  },
  addButtonIcon: {
    marginRight: SIZES.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.lg,
    backgroundColor: COLORS.gray100,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.gray700,
    marginTop: SIZES.xs,
    fontSize: SIZES.sm,
  },
  section: {
    padding: SIZES.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: SIZES.md,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  firstTransaction: {
    borderTopWidth: 0,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionTitle: {
    fontSize: SIZES.md,
    color: COLORS.gray800,
    fontWeight: '600',
    flex: 1,
    marginRight: SIZES.sm,
  },
  transactionSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.gray600,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: SIZES.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
});
