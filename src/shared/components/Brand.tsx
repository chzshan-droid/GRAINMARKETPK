import React from 'react';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';
import {images} from '../assets/images';
import {colors} from '../theme/colors';

export function Brand() {
  return (
    <View accessibilityRole="header" style={styles.container}>
      <View style={styles.logoFrame}>
        <Image source={images.logo} resizeMode="contain" style={styles.logo} />
      </View>
      <Text style={styles.primary}>GRAIN MARKET</Text>
      <Text style={styles.accent}>PAKISTAN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center'},
  logoFrame: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: '#8CCB86',
    backgroundColor: 'rgba(255,255,255,0.68)',
    elevation: 6,
  },
  logo: {width: 80, height: 80},
  primary: {
    color: colors.green900,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  accent: {
    color: colors.brown,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 5,
    marginLeft: 5,
  },
});
