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
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Card {
  id: string;
  nickname: string;
  last_four_digits: string;
  current_balance: number;
  credit_limit: number;
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

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'payment'>('expense');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactionDate, setTransactionDate] = useState(new Date());
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
      if (data && data.length > 0) {
        setSelectedCard(data[0]);
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
    const transactionAmount = transactionType === 'expense' ? parsedAmount : -parsedAmount;
    const newBalance = selectedCard.current_balance + transactionAmount;

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

      // Insert the transaction
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: transactionAmount,
          transaction_type: transactionType,
          category,
          notes,
          card_id: selectedCard.id,
          transaction_date: transactionDate.toISOString(),
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update the card balance
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
        text2: 'Transaction added successfully',
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
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
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Transaction</Text>
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
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
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

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={transactionDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

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
            <Text style={styles.submitButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  keyboardAvoidingView: {
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
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
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
    gap: SIZES.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    gap: SIZES.sm,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  typeButtonText: {
    fontSize: SIZES.md,
    fontWeight: '500',
    color: COLORS.gray800,
  },
  typeButtonTextSelected: {
    color: COLORS.white,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.md,
  },
  currencySymbol: {
    fontSize: SIZES.xl,
    color: COLORS.gray800,
  },
  amountInput: {
    fontSize: SIZES.xl,
    color: COLORS.gray800,
    flex: 1,
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
