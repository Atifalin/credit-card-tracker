import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES, GRADIENTS, SHADOWS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';

interface Card {
  id: string;
  user_id: string;
  nickname: string;
  last_four_digits: string;
  expiry_month: number;
  expiry_year: number;
  credit_limit: number;
  current_balance: number;
  statement_date: number | null;
  due_date: number | null;
  created_at: string;
  updated_at: string;
}

export default function CardsScreen() {
  const navigation = useNavigation();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { currency } = useCurrency();

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  const handleAddCard = () => {
    navigation.navigate('AddCard' as never);
  };

  const handleEditCard = (card: Card) => {
    navigation.navigate('EditCard' as never, { card } as never);
  };

  const handleDeleteCard = async (card: Card) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card.nickname}?`,
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
              setLoading(true);
              const { error } = await supabase
                .from('cards')
                .delete()
                .eq('id', card.id);

              if (error) throw error;

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Card deleted successfully',
              });

              await fetchCards();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const getGradient = (index: number) => {
    const gradients = [
      ['#FF6B6B', '#4ECDC4'],
      ['#A8E6CF', '#3B4371'],
      ['#FFD93D', '#FF6B6B'],
      ['#6C63FF', '#3B4371'],
      ['#FF758C', '#FF7EB3'],
    ];
    return gradients[index % gradients.length];
  };

  const renderCard = (card: Card) => {
    const availableCredit = card.credit_limit - card.current_balance;
    const formattedAvailableCredit = formatCurrency(availableCredit, currency);
    const formattedCreditLimit = formatCurrency(card.credit_limit, currency);
    const formattedCurrentBalance = formatCurrency(card.current_balance, currency);

    return (
      <TouchableOpacity
        key={card.id}
        style={styles.cardContainer}
        onPress={() => handleEditCard(card)}
        disabled={loading}
      >
        <LinearGradient
          colors={getGradient(cards.indexOf(card))}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNickname}>{card.nickname || 'Test'}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteCard(card)}
                disabled={loading}
                style={styles.deleteButton}
              >
                <Icon name="delete-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.currentBalanceLabel}>Current Balance</Text>
            <Text style={styles.currentBalanceValue}>{formattedCurrentBalance}</Text>
            
            <Text style={styles.cardNumber}>•••• •••• •••• {card.last_four_digits}</Text>

            <View style={styles.bottomRow}>
              <View style={styles.limitContainer}>
                <Text style={styles.limitLabel}>Credit Limit</Text>
                <Text style={styles.limitValue}>{formattedCreditLimit}</Text>
              </View>

              <View style={styles.limitContainer}>
                <Text style={styles.limitLabel}>Available</Text>
                <Text style={styles.limitValue}>{formattedAvailableCredit}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingVertical: SIZES.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {cards.map(renderCard)}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddCard}
        disabled={loading}
      >
        <Icon name="plus" size={24} style={styles.addButtonIcon} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  cardContainer: {
    marginHorizontal: SIZES.screenPadding,
    marginVertical: SIZES.md,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  card: {
    height: 220,
  },
  cardContent: {
    flex: 1,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardNickname: {
    fontSize: 34,
    fontWeight: '600',
    color: COLORS.white,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  currentBalanceLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  currentBalanceValue: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 4,
    opacity: 0.9,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  limitContainer: {
    flex: 1,
  },
  limitLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  limitValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    right: SIZES.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  addButtonIcon: {
    color: COLORS.white,
  },
});
