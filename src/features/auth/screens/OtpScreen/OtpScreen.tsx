import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';

type Props = {
  mobileNumber: string;
  onBack: () => void;
  onVerified: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
};

export function OtpScreen({mobileNumber, onBack, onVerified, onResend}: Props) {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const focusInput = () => inputRef.current?.focus();

  const verifyOtp = async (code: string) => {
    if (verifying || code.length !== 6) {
      return;
    }

    setVerifying(true);
    try {
      await onVerified(code);
      Keyboard.dismiss();
    } catch (error) {
      setOtp('');
      Alert.alert(
        'Invalid OTP',
        error instanceof Error
          ? error.message
          : 'The verification code is incorrect or has expired.',
      );
      setTimeout(focusInput, 250);
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (resending || verifying) {
      return;
    }

    setResending(true);
    try {
      await onResend();
      setOtp('');
      Alert.alert('Demo OTP', 'Use 123456 to continue. No SMS is sent.');
      setTimeout(focusInput, 250);
    } catch (error) {
      Alert.alert(
        'Unable to resend OTP',
        error instanceof Error
          ? error.message
          : 'Please wait and try again.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AppScreen background={images.otp}>
      <ScreenHeader
        title="OTP TOKEN"
        onBack={() => {
          Keyboard.dismiss();
          onBack();
        }}
      />
      <View style={styles.content}>
        <Text style={styles.prompt}>Please enter the 6 digit OTP</Text>
        <Text style={styles.promptUrdu}>براہِ کرم 6 ہندسوں کا او ٹی پی درج کریں</Text>
        <Text style={styles.number}>+92 {mobileNumber}</Text>
        <Text style={styles.demoCode}>Demo OTP: 123456</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter six digit OTP"
          onPress={focusInput}
          style={styles.slots}>
          {[0, 1, 2, 3, 4, 5].map(index => (
            <View key={index} style={styles.slot}>
              <Text style={styles.digit}>{otp[index] ?? ''}</Text>
              <View style={styles.dash} />
            </View>
          ))}
          <TextInput
            ref={inputRef}
            accessibilityLabel="Six digit OTP input"
            value={otp}
            onChangeText={value => {
              const nextOtp = value.replace(/\D/g, '').slice(0, 6);
              setOtp(nextOtp);
              if (nextOtp.length === 6) {
                verifyOtp(nextOtp);
              }
            }}
            editable={!verifying}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            caretHidden
            blurOnSubmit={false}
            showSoftInputOnFocus={true}
            selectionColor="transparent"
            underlineColorAndroid="transparent"
            style={styles.hiddenInput}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={resending || verifying}
          onPress={resendOtp}
          style={({pressed}) => [
            styles.resend,
            (resending || verifying) && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.resendText}>
            {resending ? 'SENDING…' : verifying ? 'VERIFYING…' : 'RESEND OTP'}
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  prompt: {
    color: colors.green900,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  promptUrdu: {
    width: '100%',
    color: '#397548',
    fontSize: 18,
    lineHeight: 30,
    marginTop: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  number: {color: colors.green700, fontSize: 14, fontWeight: '800', marginTop: 8},
  demoCode: {color: colors.green800, fontSize: 15, fontWeight: '900', marginTop: 8},
  slots: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
    paddingHorizontal: 4,
  },
  slot: {width: 42, height: 54, justifyContent: 'flex-end', alignItems: 'center'},
  digit: {color: colors.green900, fontSize: 28, lineHeight: 36, fontWeight: '900'},
  dash: {width: '100%', height: 3, borderRadius: 2, backgroundColor: '#4A9855'},
  hiddenInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 1,
    padding: 0,
    zIndex: 2,
  },
  resend: {
    minWidth: 150,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    borderWidth: 1.5,
    borderColor: '#4A9855',
    backgroundColor: 'rgba(255,255,255,0.86)',
    elevation: 5,
  },
  resendText: {color: colors.green900, fontSize: 15, fontWeight: '900', letterSpacing: 0.8},
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.78, transform: [{scale: 0.98}]},
});
