import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function CardDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text>Card Details Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.white,
  },
});
