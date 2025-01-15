import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { ProfileContext } from '../navigation/RootNavigator';

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

export default function OnboardingScreen() {
  const { refreshProfile } = React.useContext(ProfileContext);
  const [name, setName] = useState('');
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
  const [currency, setCurrency] = useState('USD'); // Add currency state

  const handleCardFormChange = (key: keyof CardForm, value: string) => {
    setCardForm(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your name',
      });
      return false;
    }

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
    if (!cardForm.creditLimit || isNaN(creditLimit) || creditLimit <= 0) {
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

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          name,
          currency, // Use currency state instead of hardcoded 'USD'
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select();

      if (profileError) throw profileError;

      // Create card
      const { error: cardError } = await supabase
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

      if (cardError) throw cardError;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your profile has been set up successfully!',
      });

      await refreshProfile();
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Icon name="account-circle" size={60} color={COLORS.primary} />
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              editable={!loading}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currency</Text>
            <View style={styles.row}>
              <Text style={styles.input}>USD</Text>
              <Text style={styles.input}>INR</Text>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="currency-usd" size={24} color={COLORS.gray600} />
              <TextInput
                style={styles.input}
                placeholder="Select Currency"
                value={currency}
                onChangeText={(value) => setCurrency(value)}
                editable={!loading}
                placeholderTextColor={COLORS.gray500}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Your First Card</Text>
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

            <View style={styles.inputContainer}>
              <Icon name="credit-card" size={24} color={COLORS.gray600} />
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
              title="Complete Setup"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginTop: SIZES.md,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray500,
    marginTop: SIZES.xs,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SIZES.md,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  buttonContainer: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.xl,
  },
});
