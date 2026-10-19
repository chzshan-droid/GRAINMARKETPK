import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {images} from '../assets/images';
import {colors} from '../theme/colors';
import {AppScreen} from './AppScreen';

export function AppLoading() {
  return (
    <AppScreen background={images.clean}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.green700} size="large" />
        <Text style={styles.text}>GRAIN MARKET PAKISTAN</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
  text: {color: colors.green900, fontSize: 16, fontWeight: '900'},
});
