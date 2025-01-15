import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { EXPENSE_CATEGORIES, PAYMENT_CATEGORIES } from '../constants/categories';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'expense' | 'payment';
  category: string;
  notes: string;
  created_at: string;
  card: {
    id: string;
    nickname: string;
    last_four_digits: string;
  };
}

interface Card {
  id: string;
  nickname: string;
  last_four_digits: string;
}

type DateRange = 'all' | 'today' | 'week' | 'month' | 'year';

interface Filter {
  categories: string[];
  cards: string[];
  dateRange: DateRange;
  transactionType: 'all' | 'expense' | 'payment';
}

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    categories: [],
    cards: [],
    dateRange: 'all',
    transactionType: 'all',
  });

  useEffect(() => {
    fetchTransactions();
    fetchCards();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cards')
        .select('id, nickname, last_four_digits')
        .eq('user_id', user.id);

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          transaction_type,
          category,
          notes,
          created_at,
          card_id,
          card:cards(id, nickname, last_four_digits)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters.cards.length > 0) {
        query = query.in('card_id', filters.cards);
      }

      if (filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType);
      }

      if (filters.dateRange !== 'all') {
        const dateRange = filters.dateRange;
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);

        switch (dateRange) {
          case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'week':
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'month':
            start.setMonth(start.getMonth() - 1);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'year':
            start.setFullYear(start.getFullYear() - 1);
            start.setMonth(0);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          default:
            break;
        }

        query = query.gte('created_at', start.toISOString());
        query = query.lte('created_at', end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, []);

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleCard = (cardId: string) => {
    setFilters(prev => ({
      ...prev,
      cards: prev.cards.includes(cardId)
        ? prev.cards.filter(id => id !== cardId)
        : [...prev.cards, cardId],
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      cards: [],
      dateRange: 'all',
      transactionType: 'all',
    });
  };

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return 'All Time';
    }
  };

  const renderFilterModal = () => {
    const allCategories = [...EXPENSE_CATEGORIES, ...PAYMENT_CATEGORIES];
    const dateRanges: DateRange[] = ['all', 'today', 'week', 'month', 'year'];
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={toggleFilter}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleFilter}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filters</Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterContent}>
                {/* Transaction Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                  <View style={styles.typeContainer}>
                    {['all', 'expense', 'payment'].map((type) => (
                      <TouchableOpacity
                        key={`type-${type}`}
                        style={[
                          styles.typeButton,
                          filters.transactionType === type && styles.selectedTypeButton,
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, transactionType: type as Filter['transactionType'] }))}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          filters.transactionType === type && styles.selectedTypeButtonText,
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date Range Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Date Range</Text>
                  <View style={styles.dateRangeContainer}>
                    {dateRanges.map((range) => (
                      <TouchableOpacity
                        key={`range-${range}`}
                        style={[
                          styles.dateRangeButton,
                          filters.dateRange === range && styles.selectedDateRangeButton,
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                      >
                        <Text style={[
                          styles.dateRangeButtonText,
                          filters.dateRange === range && styles.selectedDateRangeButtonText,
                        ]}>
                          {getDateRangeLabel(range)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Categories Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Categories</Text>
                  <View style={styles.categoriesGrid}>
                    {allCategories.map((category) => (
                      <TouchableOpacity
                        key={`category-${category.id}`}
                        style={[
                          styles.categoryButton,
                          filters.categories.includes(category.id) && styles.selectedCategoryButton,
                        ]}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <Icon
                          name={category.icon}
                          size={24}
                          color={filters.categories.includes(category.id) ? COLORS.primary : COLORS.gray600}
                        />
                        <Text style={[
                          styles.categoryButtonText,
                          filters.categories.includes(category.id) && styles.selectedCategoryButtonText,
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Cards Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Cards</Text>
                  <View style={styles.cardsContainer}>
                    {cards.map((card) => (
                      <TouchableOpacity
                        key={`card-${card.id}`}
                        style={[
                          styles.cardButton,
                          filters.cards.includes(card.id) && styles.selectedCardButton,
                        ]}
                        onPress={() => toggleCard(card.id)}
                      >
                        <Text style={[
                          styles.cardButtonText,
                          filters.cards.includes(card.id) && styles.selectedCardButtonText,
                        ]}>
                          {card.nickname} (*{card.last_four_digits})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={toggleFilter}
              >
                <Text style={styles.closeButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const categoryDetails = item.transaction_type === 'expense'
      ? EXPENSE_CATEGORIES.find(cat => cat.id === item.category)
      : PAYMENT_CATEGORIES.find(cat => cat.id === item.category);

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
      >
        <View style={styles.transactionLeft}>
          <View style={styles.categoryIcon}>
            <Icon name={categoryDetails?.icon || 'help-circle'} size={24} color={COLORS.gray600} />
          </View>
          <View>
            <Text style={styles.categoryLabel}>{categoryDetails?.label || 'Unknown'}</Text>
            <Text style={styles.cardLabel}>{item.card.nickname} (*{item.card.last_four_digits})</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.amount,
            { color: item.transaction_type === 'expense' ? COLORS.error : COLORS.success }
          ]}>
            {item.transaction_type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(item.amount), currency)}
          </Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (filters.categories.length > 0 || filters.cards.length > 0 || filters.dateRange !== 'all' || filters.transactionType !== 'all') && styles.activeFilterButton,
          ]}
          onPress={toggleFilter}
        >
          <Icon name="filter-variant" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {renderFilterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '85%', // Set a fixed height
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  clearButton: {
    color: COLORS.primary,
    fontSize: 16,
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
  },
  selectedTypeButton: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    color: COLORS.gray800,
    fontSize: 14,
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    minWidth: '45%',
  },
  selectedDateRangeButton: {
    backgroundColor: COLORS.primary,
  },
  dateRangeButtonText: {
    color: COLORS.gray800,
    fontSize: 14,
    textAlign: 'center',
  },
  selectedDateRangeButtonText: {
    color: '#fff',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
    minWidth: '45%',
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.gray800,
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: COLORS.primary,
  },
  cardsContainer: {
    gap: 8,
  },
  cardButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
  },
  selectedCardButton: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cardButtonText: {
    color: COLORS.gray800,
    fontSize: 14,
  },
  selectedCardButtonText: {
    color: COLORS.primary,
  },
  closeButton: {
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary + '20',
  },
  list: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray800,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.gray600,
  },
});
