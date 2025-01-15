import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EXPENSE_CATEGORIES, PAYMENT_CATEGORIES } from '../constants/categories';

type TimeRange = 'week' | 'month' | 'year';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'expense' | 'payment';
  category: string;
  created_at: string;
}

interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

export default function AnalyticsScreen() {
  const { currency } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, [timeRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const start = new Date(today);

      switch (timeRange) {
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      calculateTotals(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (transactions: Transaction[]) => {
    let expenses = 0;
    let payments = 0;
    const categoryAmounts: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'expense') {
        expenses += transaction.amount;
        categoryAmounts[transaction.category] = (categoryAmounts[transaction.category] || 0) + transaction.amount;
      } else {
        payments += transaction.amount;
      }
    });

    setTotalExpenses(expenses);
    setTotalPayments(payments);

    // Calculate category percentages
    const totals: CategoryTotal[] = Object.entries(categoryAmounts)
      .map(([category, total]) => ({
        category,
        total,
        percentage: (total / expenses) * 100,
      }))
      .sort((a, b) => b.total - a.total);

    setCategoryTotals(totals);
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = [...EXPENSE_CATEGORIES, ...PAYMENT_CATEGORIES].find(
      cat => cat.id === categoryId
    );
    return category?.label || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = [...EXPENSE_CATEGORIES, ...PAYMENT_CATEGORIES].find(
      cat => cat.id === categoryId
    );
    return category?.icon || 'help-circle';
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.selectedTimeRangeButton,
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === range && styles.selectedTimeRangeText,
            ]}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: COLORS.primary + '20' }]}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={[styles.summaryAmount, { color: COLORS.primary }]}>
          {formatCurrency(totalExpenses, currency)}
        </Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: COLORS.success + '20' }]}>
        <Text style={styles.summaryLabel}>Total Payments</Text>
        <Text style={[styles.summaryAmount, { color: COLORS.success }]}>
          {formatCurrency(totalPayments, currency)}
        </Text>
      </View>
    </View>
  );

  const renderCategoryBreakdown = () => (
    <View style={styles.categoryBreakdown}>
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {categoryTotals.map((category) => (
        <View key={category.category} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryIcon}>
              <Icon name={getCategoryIcon(category.category)} size={24} color={COLORS.gray600} />
            </View>
            <View>
              <Text style={styles.categoryLabel}>{getCategoryLabel(category.category)}</Text>
              <Text style={styles.categoryAmount}>
                {formatCurrency(category.total, currency)}
              </Text>
            </View>
          </View>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{category.percentage.toFixed(1)}%</Text>
            <View style={styles.percentageBar}>
              <View
                style={[
                  styles.percentageFill,
                  { width: `${category.percentage}%` },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Analytics</Text>
      {renderTimeRangeSelector()}
      {renderSummaryCards()}
      {renderCategoryBreakdown()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gray800,
    padding: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
  },
  selectedTimeRangeButton: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    color: COLORS.gray800,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTimeRangeText: {
    color: COLORS.white,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 16,
  },
  categoryBreakdown: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: 16,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray800,
  },
  categoryAmount: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  percentageContainer: {
    marginLeft: 52,
  },
  percentageText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  percentageBar: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
