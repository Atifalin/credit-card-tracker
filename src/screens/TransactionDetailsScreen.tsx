import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { EXPENSE_CATEGORIES, PAYMENT_CATEGORIES, Category } from '../constants/categories';
import { supabase } from '../services/supabase';

interface Transaction {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  type: 'expense' | 'payment';
  category: string;
  notes: string;
  receipt_url: string;
  created_at: string;
  card: {
    nickname: string;
    last_four_digits: string;
  };
}

export default function TransactionDetailsScreen({ route }: any) {
  const navigation = useNavigation();
  const { currency } = useCurrency();
  const transaction: Transaction = route.params.transaction;

  const getCategoryDetails = (categoryId: string, type: 'expense' | 'payment') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : PAYMENT_CATEGORIES;
    const foundCategory = categories.find((cat: Category) => cat.id === categoryId);
    
    return foundCategory || { 
      id: categoryId,
      label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: 'help-circle'
    };
  };

  const isExpense = transaction.type === 'expense';
  const categoryDetails = getCategoryDetails(transaction.category, transaction.type);

  const handleEdit = () => {
    navigation.navigate('EditTransaction', { transaction });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id);

              if (error) throw error;

              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} color={COLORS.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, styles.centered]}>
          <Icon
            name={categoryDetails.icon}
            size={48}
            color={isExpense ? COLORS.error : COLORS.success}
            style={styles.categoryIcon}
          />
          
          <Text style={styles.categoryLabel}>{categoryDetails.label}</Text>
          
          <Text style={[
            styles.amount,
            { color: isExpense ? COLORS.error : COLORS.success }
          ]}>
            {isExpense ? '-' : '+'}
            {formatCurrency(Math.abs(transaction.amount), currency)}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card</Text>
              <Text style={styles.detailValue}>
                {transaction.card.nickname} (*{transaction.card.last_four_digits})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(transaction.created_at).toLocaleDateString()}
              </Text>
            </View>

            {transaction.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{transaction.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Icon name="trash-can-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  editButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  editButtonText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    paddingTop: 24,
  },
  categoryIcon: {
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 32,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  detailsContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.gray600,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.gray800,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    marginTop: 32,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
