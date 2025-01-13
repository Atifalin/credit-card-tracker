import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CardForm {
  lastFourDigits: string;
  nickname: string;
  expiryMonth: string;
  expiryYear: string;
  creditLimit: string;
  currentBalance: string;
  statementDate: string;
  dueDate: string;
}

interface Card {
  id: string;
  user_id: string;
  last_four_digits: string;
  nickname: string | null;
  expiry_month: number;
  expiry_year: number;
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  statement_date: number | null;
  due_date: number | null;
  created_at: string;
  updated_at: string;
}

export default function EditCardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const card = (route.params as any)?.card as Card;

  if (!card) {
    navigation.goBack();
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState<CardForm>({
    lastFourDigits: card.last_four_digits || '',
    nickname: card.nickname || '',
    expiryMonth: card.expiry_month?.toString() || '',
    expiryYear: card.expiry_year?.toString() || '',
    creditLimit: card.credit_limit?.toString() || '0',
    currentBalance: card.current_balance?.toString() || '0',
    statementDate: card.statement_date?.toString() || '',
    dueDate: card.due_date?.toString() || '',
  });

  const handleCardFormChange = (key: keyof CardForm, value: string) => {
    setCardForm(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!cardForm.lastFourDigits || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.creditLimit) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all required fields',
      });
      return false;
    }

    const month = parseInt(cardForm.expiryMonth);
    if (!month || month < 1 || month > 12) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid expiry month (1-12)',
      });
      return false;
    }

    const year = parseInt(cardForm.expiryYear);
    if (!year || year < 0 || year > 99) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid expiry year (00-99)',
      });
      return false;
    }

    const creditLimit = parseFloat(cardForm.creditLimit);
    if (isNaN(creditLimit) || creditLimit <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Credit Limit',
        text2: 'Please enter a valid credit limit',
      });
      return false;
    }

    const balance = parseFloat(cardForm.currentBalance);
    if (isNaN(balance)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid current balance',
      });
      return false;
    }

    if (balance > creditLimit) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Balance',
        text2: 'Current balance cannot exceed credit limit',
      });
      return false;
    }

    const statementDate = cardForm.statementDate ? parseInt(cardForm.statementDate) : null;
    if (statementDate && (statementDate < 1 || statementDate > 31)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid statement date (1-31)',
      });
      return false;
    }

    const dueDate = cardForm.dueDate ? parseInt(cardForm.dueDate) : null;
    if (dueDate && (dueDate < 1 || dueDate > 31)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid due date (1-31)',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('cards')
        .update({
          last_four_digits: cardForm.lastFourDigits,
          nickname: cardForm.nickname || null,
          expiry_month: parseInt(cardForm.expiryMonth),
          expiry_year: parseInt(cardForm.expiryYear),
          credit_limit: parseFloat(cardForm.creditLimit),
          current_balance: parseFloat(cardForm.currentBalance),
          statement_date: cardForm.statementDate ? parseInt(cardForm.statementDate) : null,
          due_date: cardForm.dueDate ? parseInt(cardForm.dueDate) : null,
          updated_at: new Date().toISOString()
        } satisfies Partial<Card>)
        .eq('id', card.id)
        .eq('user_id', user.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Card updated successfully!',
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Edit Card</Text>
        
        <View style={styles.form}>
          {/* Card Number */}
          <View style={styles.inputContainer}>
            <Icon name="credit-card" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Last 4 Digits"
              value={cardForm.lastFourDigits}
              onChangeText={(value) => handleCardFormChange('lastFourDigits', value)}
              keyboardType="numeric"
              maxLength={4}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {/* Nickname */}
          <View style={styles.inputContainer}>
            <Icon name="card-text" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Card Nickname (e.g., Chase Freedom)"
              value={cardForm.nickname}
              onChangeText={(value) => handleCardFormChange('nickname', value)}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {/* Expiry Date */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Icon name="calendar-month" size={24} color={COLORS.gray600} />
              <TextInput
                style={styles.input}
                placeholder="Exp Month (MM)"
                value={cardForm.expiryMonth}
                onChangeText={(value) => handleCardFormChange('expiryMonth', value)}
                keyboardType="numeric"
                maxLength={2}
                editable={!loading}
                placeholderTextColor={COLORS.gray500}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Icon name="calendar-text" size={24} color={COLORS.gray600} />
              <TextInput
                style={styles.input}
                placeholder="Exp Year (YY)"
                value={cardForm.expiryYear}
                onChangeText={(value) => handleCardFormChange('expiryYear', value)}
                keyboardType="numeric"
                maxLength={2}
                editable={!loading}
                placeholderTextColor={COLORS.gray500}
              />
            </View>
          </View>

          {/* Credit Limit */}
          <View style={styles.inputContainer}>
            <Icon name="credit-card-settings" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Credit Limit"
              value={cardForm.creditLimit}
              onChangeText={(value) => handleCardFormChange('creditLimit', value)}
              keyboardType="decimal-pad"
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {/* Current Balance */}
          <View style={styles.inputContainer}>
            <Icon name="cash" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Current Balance"
              value={cardForm.currentBalance}
              onChangeText={(value) => handleCardFormChange('currentBalance', value)}
              keyboardType="decimal-pad"
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {/* Statement Date */}
          <View style={styles.inputContainer}>
            <Icon name="calendar" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Statement Date (1-31)"
              value={cardForm.statementDate}
              onChangeText={(value) => handleCardFormChange('statementDate', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {/* Due Date */}
          <View style={styles.inputContainer}>
            <Icon name="calendar-clock" size={24} color={COLORS.gray600} />
            <TextInput
              style={styles.input}
              placeholder="Due Date (1-31)"
              value={cardForm.dueDate}
              onChangeText={(value) => handleCardFormChange('dueDate', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.xl,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SIZES.xl,
  },
  form: {
    gap: SIZES.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  input: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: SIZES.md,
    color: COLORS.gray800,
    paddingVertical: SIZES.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.lg,
    marginTop: SIZES.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
});
