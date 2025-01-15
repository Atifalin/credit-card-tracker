import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCurrency } from '../contexts/CurrencyContext';
import { EXPENSE_CATEGORIES, PAYMENT_CATEGORIES, Category } from '../constants/categories';

interface Card {
  id: string;
  nickname: string;
  last_four_digits: string;
  current_balance: number;
  credit_limit: number;
}

interface Transaction {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  transaction_type: 'expense' | 'payment';
  category: string;
  notes: string;
  receipt_url: string;
  created_at: string;
  card: {
    nickname: string;
    last_four_digits: string;
  };
}

const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense', icon: 'arrow-down', color: COLORS.error },
  { id: 'payment', label: 'Payment', icon: 'arrow-up', color: COLORS.success },
];

export default function EditTransactionScreen({ route }: any) {
  const navigation = useNavigation();
  const { currency } = useCurrency();
  const originalTransaction: Transaction = route.params.transaction;

  const [amount, setAmount] = useState(originalTransaction.amount.toString());
  const [type, setType] = useState<'expense' | 'payment'>(originalTransaction.transaction_type);
  const [category, setCategory] = useState(originalTransaction.category);
  const [notes, setNotes] = useState(originalTransaction.notes || '');
  const [date, setDate] = useState(new Date(originalTransaction.created_at));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setCards(data || []);
      const card = data?.find(c => c.id === originalTransaction.card_id);
      if (card) setSelectedCard(card);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!selectedCard) throw new Error('Please select a card');
      if (!amount || isNaN(parseFloat(amount))) throw new Error('Please enter a valid amount');
      if (!category) throw new Error('Please select a category');

      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(amount),
          transaction_type: type,
          category,
          notes,
          created_at: date.toISOString(),
          card_id: selectedCard.id,
        })
        .eq('id', originalTransaction.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction updated successfully',
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
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
                .eq('id', originalTransaction.id);

              if (error) throw error;

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Transaction deleted successfully',
              });
              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message,
              });
            }
          },
        },
      ]
    );
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : PAYMENT_CATEGORIES;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={28} color={COLORS.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Transaction</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Transaction Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeContainer}>
              {TRANSACTION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeButton,
                    type === t.id && { backgroundColor: t.color + '15' },
                  ]}
                  onPress={() => setType(t.id as 'expense' | 'payment')}
                >
                  <Icon name={t.icon} size={24} color={type === t.id ? t.color : COLORS.gray400} />
                  <Text style={[
                    styles.typeText,
                    type === t.id && { color: t.color },
                  ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && { backgroundColor: COLORS.primary + '15' },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Icon
                    name={cat.icon}
                    size={24}
                    color={category === cat.id ? COLORS.primary : COLORS.gray400}
                  />
                  <Text style={[
                    styles.categoryText,
                    category === cat.id && { color: COLORS.primary },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={COLORS.gray400}
              multiline
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={24} color={COLORS.gray600} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="trash-can-outline" size={20} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete Transaction</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.gray800,
    padding: 0,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    gap: 8,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray600,
    marginTop: 4,
    textAlign: 'center',
  },
  notesInput: {
    fontSize: 15,
    color: COLORS.gray800,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.gray800,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
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
