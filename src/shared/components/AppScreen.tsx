import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import type {ImageSourcePropType, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = React.PropsWithChildren<{
  background: ImageSourcePropType;
  contentStyle?: ViewStyle;
}>;

export function AppScreen({background, children, contentStyle}: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#145D27"
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ImageBackground
          source={background}
          resizeMode="stretch"
          style={styles.flex}
          imageStyle={styles.image}>
          <View style={[styles.flex, contentStyle]}>{children}</View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#145D27'},
  flex: {flex: 1},
  image: {width: '100%', height: '100%'},
});
