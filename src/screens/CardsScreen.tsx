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
} from 'react-native';
import { COLORS, SIZES, GRADIENTS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getGradient = (index: number) => {
    const gradients = [GRADIENTS.card1, GRADIENTS.card2, GRADIENTS.card3];
    return gradients[index % gradients.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={styles.cardContainer}
            onPress={() => handleEditCard(card)}
            disabled={loading}
          >
            <LinearGradient
              colors={getGradient(index)}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardNickname}>{card.nickname}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteCard(card)}
                  disabled={loading}
                  style={styles.deleteButton}
                >
                  <Icon name="delete-outline" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardNumber}>•••• •••• •••• {card.last_four_digits}</Text>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>Balance / Limit</Text>
                  <Text style={styles.cardBalance}>
                    {formatCurrency(card.current_balance || 0)} / {formatCurrency(card.credit_limit || 0)}
                  </Text>
                </View>

                <View>
                  <Text style={styles.cardLabel}>Due Date</Text>
                  <Text style={styles.cardDate}>
                    {card.due_date ? card.due_date.toString().padStart(2, '0') : '-'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCard}
        disabled={loading}
      >
        <Icon name="plus" size={24} color={COLORS.white} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
  },
  cardContainer: {
    marginBottom: SIZES.lg,
    borderRadius: SIZES.md,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    padding: SIZES.lg,
    borderRadius: SIZES.md,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  cardNickname: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  deleteButton: {
    padding: SIZES.xs,
  },
  cardNumber: {
    fontSize: SIZES.xl,
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: SIZES.xl,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SIZES.xs,
  },
  cardBalance: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cardDate: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    right: SIZES.xl,
    bottom: SIZES.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
