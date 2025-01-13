import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface GradientCardProps {
  title: string;
  amount: string;
  gradientColors: string[];
  onPress?: () => void;
  subtitle?: string;
  extraInfo?: string;
}

export default function GradientCard({
  title,
  amount,
  gradientColors,
  onPress,
  subtitle,
  extraInfo,
}: GradientCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.amount}>{amount}</Text>
          {extraInfo && <Text style={styles.extraInfo}>{extraInfo}</Text>}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SIZES.screenPadding,
    marginVertical: SIZES.sm,
    borderRadius: SIZES.borderRadiusLg,
    ...SHADOWS.medium,
  },
  gradient: {
    borderRadius: SIZES.borderRadiusLg,
    height: SIZES.cardHeight,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: SIZES.md,
    opacity: 0.8,
    marginTop: SIZES.xs,
  },
  amount: {
    color: COLORS.white,
    fontSize: SIZES.xl,
    fontWeight: 'bold',
  },
  extraInfo: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    opacity: 0.8,
  },
});
