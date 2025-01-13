import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

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

export default function AddCardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState<CardForm>({
    lastFourDigits: '',
    nickname: '',
    expiryMonth: '',
    expiryYear: '',
    creditLimit: '',
    currentBalance: '',
    statementDate: '',
    dueDate: '',
  });

  const handleCardFormChange = (key: keyof CardForm, value: string) => {
    setCardForm(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!cardForm.lastFourDigits || cardForm.lastFourDigits.length !== 4) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter valid last 4 digits',
      });
      return false;
    }

    if (!cardForm.nickname) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a card nickname',
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
        text1: 'Error',
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

    const statementDate = parseInt(cardForm.statementDate);
    if (!statementDate || statementDate < 1 || statementDate > 31) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid statement date (1-31)',
      });
      return false;
    }

    const dueDate = parseInt(cardForm.dueDate);
    if (!dueDate || dueDate < 1 || dueDate > 31) {
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
        .insert([{
          user_id: user.id,
          last_four_digits: cardForm.lastFourDigits,
          nickname: cardForm.nickname,
          expiry_month: parseInt(cardForm.expiryMonth),
          expiry_year: parseInt(cardForm.expiryYear),
          credit_limit: parseFloat(cardForm.creditLimit),
          current_balance: parseFloat(cardForm.currentBalance),
          statement_date: parseInt(cardForm.statementDate),
          due_date: parseInt(cardForm.dueDate),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Card added successfully!',
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
        <Text style={styles.title}>Add New Card</Text>
        
        <View style={styles.form}>
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

          <TextInput
            style={styles.input}
            placeholder="Card Nickname (e.g., Chase Freedom)"
            value={cardForm.nickname}
            onChangeText={(value) => handleCardFormChange('nickname', value)}
            editable={!loading}
            placeholderTextColor={COLORS.gray500}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Exp Month (MM)"
              value={cardForm.expiryMonth}
              onChangeText={(value) => handleCardFormChange('expiryMonth', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Exp Year (YY)"
              value={cardForm.expiryYear}
              onChangeText={(value) => handleCardFormChange('expiryYear', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Credit Limit"
            value={cardForm.creditLimit}
            onChangeText={(value) => handleCardFormChange('creditLimit', value)}
            keyboardType="decimal-pad"
            editable={!loading}
            placeholderTextColor={COLORS.gray500}
          />

          <TextInput
            style={styles.input}
            placeholder="Current Balance"
            value={cardForm.currentBalance}
            onChangeText={(value) => handleCardFormChange('currentBalance', value)}
            keyboardType="decimal-pad"
            editable={!loading}
            placeholderTextColor={COLORS.gray500}
          />

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

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Add Card"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
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
    padding: SIZES.screenPadding,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SIZES.xl,
  },
  form: {
    marginBottom: SIZES.xl,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.md,
    fontSize: SIZES.md,
    color: COLORS.gray800,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.md,
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.xl,
  },
});
