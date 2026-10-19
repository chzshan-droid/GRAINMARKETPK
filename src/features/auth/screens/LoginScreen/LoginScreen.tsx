import React, {useState} from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Smartphone from 'lucide-react-native/icons/smartphone';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';

type Props = {
  initialNumber: string;
  onBack: () => void;
  onContinue: (mobileNumber: string) => Promise<void>;
};

export function LoginScreen({initialNumber, onBack, onContinue}: Props) {
  const [number, setNumber] = useState(initialNumber);
  const [sendingOtp, setSendingOtp] = useState(false);
  const valid = number.length === 10;

  const continueToOtp = async () => {
    if (!valid || sendingOtp) {
      return;
    }
    setSendingOtp(true);
    try {
      Keyboard.dismiss();
      await onContinue(number);
    } catch (error) {
      Alert.alert(
        'Unable to send OTP',
        error instanceof Error
          ? error.message
          : 'Firebase could not send the verification code.',
      );
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <AppScreen background={images.login}>
      <ScreenHeader title="MOBILE NUMBER" onBack={onBack} />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.prompt}>Please enter your mobile number</Text>
          <Text style={styles.promptUrdu}>براہِ کرم اپنا موبائل نمبر درج کریں</Text>
          <View style={styles.field}>
            <Smartphone color={colors.green700} size={24} />
            <Text style={styles.prefix}>+92</Text>
            <View style={styles.divider} />
            <TextInput
              accessibilityLabel="Mobile number"
              value={number}
              onChangeText={value => setNumber(value.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="3001234567"
              placeholderTextColor="rgba(21,85,45,0.46)"
              selectionColor={colors.green700}
              style={styles.input}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !valid || sendingOtp}}
            disabled={!valid || sendingOtp}
            onPress={continueToOtp}
            style={({pressed}) => [
              styles.arrow,
              (!valid || sendingOtp) && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <ArrowRight color={colors.white} size={33} strokeWidth={2.8} />
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32},
  form: {width: '100%', alignItems: 'center'},
  prompt: {
    color: colors.green900,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  promptUrdu: {color: '#397548', fontSize: 17, marginTop: 7, marginBottom: 24},
  field: {
    width: '100%',
    maxWidth: 520,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.green500,
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 6,
  },
  prefix: {color: colors.green900, fontSize: 19, fontWeight: '900', marginLeft: 8},
  divider: {width: 1, height: 30, marginHorizontal: 11, backgroundColor: colors.green500},
  input: {flex: 1, height: '100%', color: colors.green900, fontSize: 18, fontWeight: '700'},
  arrow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    backgroundColor: colors.green800,
    borderWidth: 2,
    borderColor: '#82D276',
    elevation: 8,
  },
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.8, transform: [{scale: 0.98}]},
});
