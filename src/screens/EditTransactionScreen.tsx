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
import { COLORS, SIZES } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  transaction_type: string;
  category: string;
  notes: string;
  receipt_url: string;
  transaction_date: string;
}

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping' },
  { id: 'transportation', label: 'Transportation', icon: 'car' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'utilities', label: 'Utilities', icon: 'lightning-bolt' },
  { id: 'health', label: 'Health', icon: 'medical-bag' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense', icon: 'arrow-up' },
  { id: 'payment', label: 'Payment', icon: 'arrow-down' },
];

export default function EditTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const transaction = (route.params as any)?.transaction as Transaction;

  const [amount, setAmount] = useState(Math.abs(transaction.amount).toString());
  const [notes, setNotes] = useState(transaction.notes || '');
  const [category, setCategory] = useState(transaction.category);
  const [transactionType, setTransactionType] = useState<'expense' | 'payment'>(transaction.transaction_type as 'expense' | 'payment');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactionDate, setTransactionDate] = useState(
    new Date(transaction.transaction_date)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('cards')
        .select('id, nickname, last_four_digits, current_balance, credit_limit')
        .eq('user_id', user.id);

      if (error) throw error;
      setCards(data || []);
      
      // Set the selected card
      const card = data?.find(c => c.id === transaction.card_id);
      if (card) {
        setSelectedCard(card);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  const handleSubmit = async () => {
    if (!amount || !selectedCard || !category) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    const parsedAmount = Math.abs(parseFloat(amount));
    
    // For credit cards:
    // - Expenses increase the balance (positive amount)
    // - Payments decrease the balance (negative amount)
    const newTransactionAmount = transactionType === 'expense' ? parsedAmount : -parsedAmount;
    
    // Calculate the difference in amount to update the card balance
    const amountDifference = newTransactionAmount - transaction.amount;
    const newBalance = selectedCard.current_balance + amountDifference;

    // Check if this transaction would exceed the credit limit
    if (transactionType === 'expense' && newBalance > selectedCard.credit_limit) {
      Toast.show({
        type: 'error',
        text1: 'Credit Limit Exceeded',
        text2: 'This transaction would exceed your credit limit',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Update the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          user_id: user.id,
          amount: newTransactionAmount,
          transaction_type: transactionType,
          category,
          notes,
          card_id: selectedCard.id,
          transaction_date: transactionDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (transactionError) throw transactionError;

      // Update the card balance with the difference
      const { error: cardError } = await supabase
        .from('cards')
        .update({
          current_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCard.id);

      if (cardError) throw cardError;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
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
              setIsSubmitting(true);

              // Get the current user
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (userError) throw userError;
              if (!user) throw new Error('No user found');

              // Reverse the transaction amount in the card balance
              const { error: cardError } = await supabase
                .from('cards')
                .update({
                  current_balance: selectedCard.current_balance - transaction.amount,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', selectedCard.id)
                .eq('user_id', user.id);

              if (cardError) throw cardError;

              // Delete the transaction
              const { error: deleteError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id)
                .eq('user_id', user.id);

              if (deleteError) throw deleteError;

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
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Transaction</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isSubmitting}
            >
              <Icon name="delete-outline" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          {/* Transaction Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'expense' && styles.typeButtonSelected,
                ]}
                onPress={() => setTransactionType('expense')}
              >
                <Icon
                  name="arrow-up"
                  size={20}
                  color={transactionType === 'expense' ? COLORS.white : COLORS.gray600}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextSelected,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'payment' && styles.typeButtonSelected,
                ]}
                onPress={() => setTransactionType('payment')}
              >
                <Icon
                  name="arrow-down"
                  size={20}
                  color={transactionType === 'payment' ? COLORS.white : COLORS.gray600}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'payment' && styles.typeButtonTextSelected,
                  ]}
                >
                  Payment
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Card Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cardList}
            >
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardButton,
                    selectedCard?.id === card.id && styles.cardButtonSelected,
                  ]}
                  onPress={() => setSelectedCard(card)}
                >
                  <Text
                    style={[
                      styles.cardButtonText,
                      selectedCard?.id === card.id &&
                        styles.cardButtonTextSelected,
                    ]}
                  >
                    {card.nickname}
                  </Text>
                  <Text
                    style={[
                      styles.cardButtonSubtext,
                      selectedCard?.id === card.id &&
                        styles.cardButtonTextSelected,
                    ]}
                  >
                    *{card.last_four_digits}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Icon
                    name={cat.icon}
                    size={24}
                    color={
                      category === cat.id ? COLORS.white : COLORS.gray600
                    }
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            {Platform.OS === 'ios' && showDatePicker ? (
              <View>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={transactionDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dateInput}
                onPress={showDatepicker}
              >
                <Icon name="calendar" size={24} color={COLORS.gray600} />
                <Text style={styles.dateText}>
                  {transactionDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={transactionDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  deleteButton: {
    padding: SIZES.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SIZES.md,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
    marginHorizontal: SIZES.xs,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    marginLeft: SIZES.xs,
    fontSize: SIZES.md,
    color: COLORS.gray600,
  },
  typeButtonTextSelected: {
    color: COLORS.white,
  },
  amountInput: {
    fontSize: SIZES.xl,
    color: COLORS.gray800,
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
  },
  cardList: {
    flexDirection: 'row',
  },
  cardButton: {
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
    marginRight: SIZES.md,
    minWidth: 120,
  },
  cardButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  cardButtonText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: SIZES.xs,
  },
  cardButtonSubtext: {
    fontSize: SIZES.sm,
    color: COLORS.gray600,
  },
  cardButtonTextSelected: {
    color: COLORS.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.xs,
  },
  categoryButton: {
    width: '31%',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
    margin: SIZES.xs,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    marginTop: SIZES.xs,
    fontSize: SIZES.sm,
    color: COLORS.gray600,
  },
  categoryButtonTextSelected: {
    color: COLORS.white,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
  },
  dateText: {
    marginLeft: SIZES.md,
    fontSize: SIZES.md,
    color: COLORS.gray600,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.gray100,
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
  },
  datePickerButton: {
    padding: SIZES.xs,
  },
  datePickerButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '500',
  },
  notesInput: {
    height: 100,
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
    fontSize: SIZES.md,
    color: COLORS.gray800,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    borderRadius: SIZES.md,
    alignItems: 'center',
    margin: SIZES.screenPadding,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
});
