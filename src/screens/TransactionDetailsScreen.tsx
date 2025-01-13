import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatters';

interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  category: string;
  notes?: string;
  created_at: string;
  card_id: string;
  card?: {
    nickname: string;
    last_four: string;
  };
}

export default function TransactionDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const routeTransaction = (route.params as any)?.transaction as Transaction;

  useEffect(() => {
    if (routeTransaction) {
      setTransaction(routeTransaction);
    }
  }, [routeTransaction]);

  const handleEdit = () => {
    if (transaction) {
      navigation.navigate('EditTransaction', { transaction });
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
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
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
              console.error('Error deleting transaction:', error);
            }
          },
        },
      ]
    );
  };

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.content, styles.centerContent]}>
          <Text>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            { color: transaction.type === 'expense' ? COLORS.error : COLORS.success }
          ]}>
            {transaction.type === 'expense' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.date}>
            {new Date(transaction.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{transaction.description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{transaction.category}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {transaction?.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : ''}
            </Text>
          </View>

          {transaction.card && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card</Text>
              <Text style={styles.detailValue}>
                {transaction.card.nickname} (*{transaction.card.last_four})
              </Text>
            </View>
          )}

          {transaction.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{transaction.notes}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Transaction</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.gray100,
  },
  amount: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  date: {
    marginTop: SIZES.xs,
    color: COLORS.gray600,
    fontSize: SIZES.md,
  },
  detailsContainer: {
    padding: SIZES.screenPadding,
  },
  detailRow: {
    marginBottom: SIZES.lg,
  },
  detailLabel: {
    fontSize: SIZES.sm,
    color: COLORS.gray500,
    marginBottom: SIZES.xs,
  },
  detailValue: {
    fontSize: SIZES.md,
    color: COLORS.gray800,
    fontWeight: '500',
  },
  editButton: {
    margin: SIZES.screenPadding,
    backgroundColor: COLORS.primary,
    padding: SIZES.md,
    borderRadius: SIZES.buttonRadius,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
});
