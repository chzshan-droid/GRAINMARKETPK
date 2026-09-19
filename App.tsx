import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sprout from 'lucide-react-native/icons/sprout';

const homeArtwork = require('./assets/agricultural-product-rates-home.png');
const homeArtworkWithoutTabs = require('./assets/agricultural-product-rates-home-no-tabs.png');
const cleanHomeArtwork = require('./assets/agricultural-product-rates-language-centered.png');
const loginArtwork = require('./assets/agricultural-product-rates-login.png');
const otpArtwork = require('./assets/agricultural-product-rates-otp.png');
const registerArtwork = require('./assets/agricultural-product-rates-register.png');
const dashboardArtwork = require('./assets/agricultural-product-rates-dashboard.png');

// Replace these constants with application state/API conditions when required.
const SHOW_PRODUCT_TABS = false;
const SHOW_BOTTOM_MENU = false;

const selectedArtwork = SHOW_PRODUCT_TABS
  ? homeArtwork
  : SHOW_BOTTOM_MENU
    ? homeArtworkWithoutTabs
    : cleanHomeArtwork;

type HotspotProps = {
  label: string;
  style: StyleProp<ViewStyle>;
  selected?: boolean;
  showCheckmark?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

/** Keeps the illustration pixel-perfect while providing native touch semantics. */
function Hotspot({
  label,
  style,
  selected,
  showCheckmark = true,
  disabled,
  onPress,
}: HotspotProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected, disabled}}
      android_ripple={{color: 'rgba(255,255,255,0.14)', borderless: false}}
      disabled={disabled}
      onPress={onPress ?? (() => undefined)}
      style={({pressed}) => [
        style,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {selected && showCheckmark && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

function SafeScreen({children}: React.PropsWithChildren) {
  return (
    <SafeAreaProvider style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}>
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function App(): React.JSX.Element {
  const [language, setLanguage] = useState<'urdu' | 'english' | null>(null);
  const [screen, setScreen] = useState<
    'language' | 'login' | 'otp' | 'register' | 'dashboard'
  >('language');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [selectedMarketTab, setSelectedMarketTab] = useState<
    'GRAINS' | 'PULSES' | 'RICE' | 'OTHERS'
  >('GRAINS');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const loginScrollRef = useRef<ScrollView>(null);
  const otpInputRef = useRef<TextInput>(null);
  const allowOtpKeyboardCloseRef = useRef(false);
  const otpRefocusInProgressRef = useRef(false);
  const {height: currentViewportHeight} = useWindowDimensions();
  const screenCanvasHeight = useRef(currentViewportHeight).current;
  const isMobileNumberValid = mobileNumber.length === 10;

  const forceOpenOtpKeyboard = (delay = 100) => {
    if (otpRefocusInProgressRef.current) {
      return;
    }

    otpRefocusInProgressRef.current = true;
    otpInputRef.current?.blur();
    setTimeout(() => {
      otpInputRef.current?.focus();
      setTimeout(() => {
        otpRefocusInProgressRef.current = false;
      }, 300);
    }, delay);
  };

  const openOtpKeyboard = () => {
    forceOpenOtpKeyboard();
  };

  useEffect(() => {
    const keyboardShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        if (screen === 'otp' && !allowOtpKeyboardCloseRef.current) {
          forceOpenOtpKeyboard(80);
        }
      },
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'otp') {
      return;
    }

    allowOtpKeyboardCloseRef.current = false;
    otpRefocusInProgressRef.current = false;
    const focusFrame = requestAnimationFrame(() => otpInputRef.current?.focus());
    const focusRetry = setTimeout(() => otpInputRef.current?.focus(), 700);
    return () => {
      cancelAnimationFrame(focusFrame);
      clearTimeout(focusRetry);
    };
  }, [screen]);

  if (screen === 'dashboard') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ImageBackground
          source={dashboardArtwork}
          resizeMode="stretch"
          style={styles.artwork}
          imageStyle={styles.image}
        />
        <ScrollView
          accessibilityRole="tablist"
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.marketTabs}
          contentContainerStyle={styles.marketTabsContent}>
          {(['GRAINS', 'PULSES', 'RICE', 'OTHERS'] as const).map(tab => {
            const selected = selectedMarketTab === tab;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={tab}
                accessibilityState={{selected}}
                key={tab}
                onPress={() => setSelectedMarketTab(tab)}
                style={({pressed}) => [
                  styles.marketTab,
                  selected && styles.marketTabSelected,
                  pressed && styles.marketTabPressed,
                ]}>
                <Text
                  style={[
                    styles.marketTabText,
                    selected && styles.marketTabTextSelected,
                  ]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.marketRateTable}>
          <Text style={styles.marketRateTableTitle}>
            {selectedMarketTab} RATES
          </Text>
          <View style={styles.marketRateHeaderRow}>
            <Text
              style={[
                styles.marketRateHeaderText,
                styles.marketNameColumn,
                styles.marketRateHeaderDivider,
              ]}>
              NAME
            </Text>
            <Text
              style={[
                styles.marketRateHeaderText,
                styles.marketValueColumn,
                styles.marketRateHeaderDivider,
              ]}>
              LOW RATE
            </Text>
            <Text
              style={[
                styles.marketRateHeaderText,
                styles.marketValueColumn,
                styles.marketRateHeaderDivider,
              ]}>
              HIGH RATE
            </Text>
            <Text style={[styles.marketRateHeaderText, styles.marketUpdatedColumn]}>
              LAST UPDATED
            </Text>
          </View>
          {selectedMarketTab === 'GRAINS' ? (
            <View style={styles.marketRateDataRow}>
              <Text style={[styles.marketRateCell, styles.marketNameColumn]}>
                WHEAT
              </Text>
              <Text style={[styles.marketRateCell, styles.marketValueColumn]}>
                4600
              </Text>
              <Text style={[styles.marketRateCell, styles.marketValueColumn]}>
                4700
              </Text>
              <Text
                style={[styles.marketRateCell, styles.marketUpdatedColumn]}>
                1 HOUR AGO
              </Text>
            </View>
          ) : (
            <View style={styles.marketRateEmptyRow}>
              <Text style={styles.marketRateEmptyText}>
                No rate data available
              </Text>
            </View>
          )}
        </View>
        <View
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.languageBrand, styles.fixedLoginBrand]}>
          <View style={styles.languageBrandRow}>
            <View style={styles.languageBrandLine} />
            <Sprout color="#2F7D3C" size={22} strokeWidth={2.4} />
            <View style={styles.languageBrandLine} />
          </View>
          <Text style={styles.languageBrandPrimary}>GRAIN MARKET</Text>
          <Text style={styles.languageBrandAccent}>PAKISTAN</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to registration"
          onPress={() => setScreen('register')}
          hitSlop={10}
          style={({pressed}) => [
            styles.loginBackButton,
            pressed && styles.pressed,
          ]}>
          <ArrowLeft color="#15552D" size={27} strokeWidth={2.5} />
        </Pressable>
      </SafeScreen>
    );
  }

  if (screen === 'register') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ImageBackground
          source={registerArtwork}
          resizeMode="stretch"
          style={styles.artwork}
          imageStyle={styles.image}>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.registrationFormContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.registrationFormCard}>
              <Text style={styles.registrationTitle}>CREATE YOUR PROFILE</Text>
              <Text style={styles.registrationTitleUrdu}>
                اپنی پروفائل مکمل کریں
              </Text>
              <Text style={styles.registrationLabel}>NAME</Text>
              <TextInput
                accessibilityLabel="Enter your name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(21,85,45,0.46)"
                selectionColor="#2F7D3C"
                returnKeyType="done"
                style={styles.registrationNameInput}
              />
              <Text style={styles.registrationLabel}>CITY</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose your city"
                accessibilityState={{expanded: cityPickerVisible}}
                onPress={() => {
                  Keyboard.dismiss();
                  setCityPickerVisible(true);
                }}
                style={({pressed}) => [
                  styles.registrationCityPicker,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.registrationCityText,
                    !city && styles.registrationPlaceholder,
                  ]}>
                  {city || 'Select your city'}
                </Text>
                <Text style={styles.registrationChevron}>⌄</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Complete registration"
                accessibilityState={{
                  disabled: !fullName.trim() || !city,
                }}
                disabled={!fullName.trim() || !city}
                onPress={() => {
                  Keyboard.dismiss();
                  setScreen('dashboard');
                }}
                style={({pressed}) => [
                  styles.registrationArrowButton,
                  (!fullName.trim() || !city) && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <ArrowRight color="#FFFFFF" size={32} strokeWidth={2.8} />
              </Pressable>
            </View>
          </ScrollView>
        </ImageBackground>
        <Modal
          animationType="fade"
          transparent
          visible={cityPickerVisible}
          onRequestClose={() => setCityPickerVisible(false)}>
          <Pressable
            style={styles.registrationModalBackdrop}
            onPress={() => setCityPickerVisible(false)}>
            <View style={styles.registrationModalCard}>
              <Text style={styles.registrationModalTitle}>SELECT CITY</Text>
              {['LAHORE', 'FAISALABAD', 'ISLAMABAD', 'KARACHI'].map(
                option => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{selected: city === option}}
                    key={option}
                    onPress={() => {
                      setCity(option);
                      setCityPickerVisible(false);
                    }}
                    style={({pressed}) => [
                      styles.registrationCityOption,
                      city === option && styles.registrationCityOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.registrationCityOptionText}>
                      {option}
                    </Text>
                    {city === option && (
                      <Text style={styles.registrationCityTick}>✓</Text>
                    )}
                  </Pressable>
                ),
              )}
            </View>
          </Pressable>
        </Modal>
        <View
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.languageBrand, styles.fixedLoginBrand]}>
          <View style={styles.languageBrandRow}>
            <View style={styles.languageBrandLine} />
            <Sprout color="#2F7D3C" size={22} strokeWidth={2.4} />
            <View style={styles.languageBrandLine} />
          </View>
          <Text style={styles.languageBrandPrimary}>GRAIN MARKET</Text>
          <Text style={styles.languageBrandAccent}>PAKISTAN</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to OTP verification"
          onPress={() => setScreen('otp')}
          hitSlop={10}
          style={({pressed}) => [
            styles.loginBackButton,
            pressed && styles.pressed,
          ]}>
          <ArrowLeft color="#15552D" size={27} strokeWidth={2.5} />
        </Pressable>
      </SafeScreen>
    );
  }

  if (screen === 'otp') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ImageBackground
          source={otpArtwork}
          resizeMode="stretch"
          style={styles.artwork}
          imageStyle={styles.image}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            style={styles.otpKeyboardArea}>
            <View
              style={[
                styles.otpNativeForm,
                isKeyboardVisible && styles.otpNativeFormKeyboard,
              ]}>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.otpPromptEnglish}>
                Please enter the 6 digit OTP
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.otpPromptUrdu}>
                براہِ کرم 6 ہندسوں کا او ٹی پی درج کریں
              </Text>
              <View style={styles.otpSlots}>
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <View key={index} style={styles.otpSlot}>
                    <Text style={styles.otpSlotDigit}>{otp[index] ?? ''}</Text>
                    <View style={styles.otpDash} />
                  </View>
                ))}
                <TextInput
                  ref={otpInputRef}
                  accessibilityLabel="Six digit OTP"
                  value={otp}
                  onChangeText={value => {
                    const sanitizedOtp = value.replace(/\D/g, '').slice(0, 6);
                    setOtp(sanitizedOtp);
                    if (sanitizedOtp.length === 6) {
                      allowOtpKeyboardCloseRef.current = true;
                      Keyboard.dismiss();
                      setScreen('register');
                    }
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  caretHidden
                  autoFocus
                  editable
                  blurOnSubmit={false}
                  showSoftInputOnFocus
                  selectionColor="transparent"
                  onPressIn={openOtpKeyboard}
                  style={styles.otpHiddenInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resend OTP"
                onPress={() => {
                  setOtp('');
                  if (isKeyboardVisible) {
                    otpInputRef.current?.focus();
                  } else {
                    forceOpenOtpKeyboard();
                  }
                }}
                style={({pressed}) => [
                  styles.resendOtpButton,
                  pressed && styles.resendOtpButtonPressed,
                ]}>
                <Text style={styles.resendOtpButtonText}>RESEND OTP</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
        <View
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.languageBrand, styles.fixedLoginBrand]}>
          <View style={styles.languageBrandRow}>
            <View style={styles.languageBrandLine} />
            <Sprout color="#2F7D3C" size={22} strokeWidth={2.4} />
            <View style={styles.languageBrandLine} />
          </View>
          <Text style={styles.languageBrandPrimary}>GRAIN MARKET</Text>
          <Text style={styles.languageBrandAccent}>PAKISTAN</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to mobile number"
          onPress={() => {
            allowOtpKeyboardCloseRef.current = true;
            Keyboard.dismiss();
            setScreen('login');
          }}
          hitSlop={10}
          style={({pressed}) => [
            styles.loginBackButton,
            pressed && styles.pressed,
          ]}>
          <ArrowLeft color="#15552D" size={27} strokeWidth={2.5} />
        </Pressable>
      </SafeScreen>
    );
  }

  if (screen === 'login') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ScrollView
          ref={loginScrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.registerScrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            source={loginArtwork}
            resizeMode="stretch"
            style={[styles.artwork, styles.registerArtwork, {height: screenCanvasHeight}]}
            imageStyle={styles.image}>
          <View style={styles.loginForm}>
            <View pointerEvents="none" style={styles.mobilePrompt}>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.mobilePromptEnglish}>
                Please enter your mobile number
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.mobilePromptUrdu}>
                براہِ کرم اپنا موبائل نمبر درج کریں
              </Text>
            </View>
            <View style={styles.mobileNumber}>
              <View style={styles.phoneIconContainer}>
                <Smartphone color="#2F7D3C" size={23} strokeWidth={2.2} />
              </View>
              <Text style={styles.countryCode}>+92</Text>
              <View style={styles.numberDivider} />
              <TextInput
                accessibilityLabel="Pakistani mobile number after plus ninety-two"
                value={mobileNumber}
                onChangeText={value =>
                  setMobileNumber(value.replace(/\D/g, '').slice(0, 10))
                }
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="3001234567"
                placeholderTextColor="rgba(21,85,45,0.5)"
                selectionColor="#2F7D3C"
                onFocus={() =>
                  loginScrollRef.current?.scrollTo({
                    y: screenCanvasHeight * 0.35,
                    animated: true,
                  })
                }
                style={styles.numberInput}
              />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to verification"
            accessibilityState={{disabled: !isMobileNumberValid}}
            disabled={!isMobileNumberValid}
            onPress={() => {
              setOtp('');
              allowOtpKeyboardCloseRef.current = false;
              Keyboard.dismiss();
              setScreen('otp');
            }}
            style={({pressed}) => [
              styles.loginArrow,
              !isMobileNumberValid && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <ArrowRight color="#ffffff" size={36} strokeWidth={2.8} />
          </Pressable>
          </ImageBackground>
        </ScrollView>
        <View
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.languageBrand, styles.fixedLoginBrand]}>
          <View style={styles.languageBrandRow}>
            <View style={styles.languageBrandLine} />
            <Sprout color="#2F7D3C" size={22} strokeWidth={2.4} />
            <View style={styles.languageBrandLine} />
          </View>
          <Text style={styles.languageBrandPrimary}>GRAIN MARKET</Text>
          <Text style={styles.languageBrandAccent}>PAKISTAN</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to language selection"
          onPress={() => {
            Keyboard.dismiss();
            setScreen('language');
          }}
          hitSlop={10}
          style={({pressed}) => [
            styles.loginBackButton,
            pressed && styles.pressed,
          ]}>
          <ArrowLeft color="#15552D" size={27} strokeWidth={2.5} />
        </Pressable>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <StatusBar
        hidden={false}
        barStyle="light-content"
        backgroundColor="#145d27"
        translucent
      />
      <ImageBackground
        source={selectedArtwork}
        resizeMode="stretch"
        style={styles.artwork}
        imageStyle={styles.image}>
        <View accessibilityRole="header" style={styles.languageBrand}>
          <View style={styles.languageBrandRow}>
            <View style={styles.languageBrandLine} />
            <Sprout color="#2F7D3C" size={22} strokeWidth={2.4} />
            <View style={styles.languageBrandLine} />
          </View>
          <Text style={styles.languageBrandPrimary}>GRAIN MARKET</Text>
          <Text style={styles.languageBrandAccent}>PAKISTAN</Text>
        </View>
        <Text pointerEvents="none" style={styles.languageSelectionEnglish}>
          LANGUAGE SELECTION
        </Text>
        <Text pointerEvents="none" style={styles.languageSelectionUrdu}>
          زبان کا انتخاب
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select Urdu language"
          accessibilityState={{selected: language === 'urdu'}}
          onPress={() => setLanguage('urdu')}
          style={({pressed}) => [
            styles.languageOption,
            styles.urdu,
            language === 'urdu' && styles.languageSelected,
            language === 'english' && styles.languageDimmed,
            pressed && styles.languageOptionPressed,
          ]}>
          <Text
            style={[styles.languageOptionText, styles.languageOptionUrduText]}>
            اردو
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select English language"
          accessibilityState={{selected: language === 'english'}}
          onPress={() => setLanguage('english')}
          style={({pressed}) => [
            styles.languageOption,
            styles.english,
            language === 'english' && styles.languageSelected,
            language === 'urdu' && styles.languageDimmed,
            pressed && styles.languageOptionPressed,
          ]}>
          <Text style={styles.languageOptionText}>ENGLISH</Text>
        </Pressable>
        {SHOW_PRODUCT_TABS && (
          <>
            <Hotspot label="Grains: Wheat rate" style={styles.grains} />
            <Hotspot label="Fruits: Current mango rate" style={styles.fruits} />
            <Hotspot label="Vegetables: Current onion rate" style={styles.vegetables} />
            <Hotspot label="Livestock: Current rate" style={styles.livestock} />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            language
              ? `Continue in ${language}`
              : 'Select a language before continuing'
          }
          onPress={() => {
            if (!language) {
              Alert.alert(
                'Select language',
                'Please select a language to continue.',
              );
              return;
            }
            setScreen('login');
          }}
          style={({pressed}) => [
            styles.enterArrow,
            pressed && styles.pressed,
          ]}>
          <ArrowRight color="#ffffff" size={36} strokeWidth={2.8} />
        </Pressable>
        {SHOW_BOTTOM_MENU && (
          <>
            <Hotspot label="Home" style={styles.home} />
            <Hotspot label="Markets" style={styles.markets} />
            <Hotspot label="News" style={styles.news} />
            <Hotspot label="Settings" style={styles.settings} />
          </>
        )}
      </ImageBackground>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#145d27',
  },
  keyboardContainer: {flex: 1},
  registerScrollContent: {flexGrow: 1},
  registerArtwork: {flex: 0},
  artwork: {flex: 1, width: '100%', height: '100%'},
  image: {width: '100%', height: '100%'},
  pressed: {backgroundColor: 'rgba(255,255,255,0.10)'},
  disabled: {opacity: 0.58},
  checkmark: {
    position: 'absolute',
    right: -8,
    top: -12,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    color: '#15752e',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
  search: {
    position: 'absolute', left: '86%', top: '2.5%', width: '9%', height: '6%', borderRadius: 28,
  },
  languageBrand: {
    position: 'absolute',
    top: '4.4%',
    left: '5%',
    width: '90%',
    alignItems: 'center',
  },
  fixedLoginBrand: {
    zIndex: 10,
    elevation: 10,
  },
  loginBackButton: {
    position: 'absolute',
    top: '4.7%',
    left: '4%',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.82)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 12,
    zIndex: 12,
  },
  languageBrandRow: {
    width: '42%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
  languageBrandLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#7DBB72',
    borderRadius: 2,
  },
  languageBrandPrimary: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.55)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  languageBrandAccent: {
    color: '#9A692B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    marginLeft: 6,
  },
  languageSelectionEnglish: {
    position: 'absolute',
    top: '39.5%',
    left: '5%',
    width: '90%',
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  languageSelectionUrdu: {
    position: 'absolute',
    top: '44%',
    left: '5%',
    width: '90%',
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  urdu: {
    position: 'absolute', left: '10%', top: '49.2%', width: '38%', height: '7%', borderRadius: 24,
  },
  english: {
    position: 'absolute', left: '52%', top: '49.2%', width: '38%', height: '7%', borderRadius: 24,
  },
  languageOption: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8ee57f',
    backgroundColor: 'rgba(8, 82, 34, 0.92)',
    shadowColor: '#001d09',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 10,
  },
  languageOptionText: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  languageOptionUrduText: {
    fontSize: 27,
    letterSpacing: 0,
    writingDirection: 'rtl',
  },
  languageOptionPressed: {
    transform: [{scale: 0.97}],
  },
  languageSelected: {
    borderColor: '#dcffd5',
    backgroundColor: '#38a947',
  },
  languageDimmed: {
    opacity: 0.48,
  },
  grains: {
    position: 'absolute', left: '21.1%', top: '35.1%', width: '27.1%', height: '17.9%', borderRadius: 28,
  },
  fruits: {
    position: 'absolute', left: '52%', top: '35.1%', width: '27%', height: '17.9%', borderRadius: 28,
  },
  vegetables: {
    position: 'absolute', left: '21.1%', top: '55.1%', width: '27.1%', height: '18%', borderRadius: 28,
  },
  livestock: {
    position: 'absolute', left: '51.7%', top: '55.1%', width: '27.3%', height: '18%', borderRadius: 28,
  },
  enterArrow: {
    position: 'absolute',
    left: '44%',
    top: '57.1%',
    width: '12%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#82d276',
    borderRadius: 50,
    backgroundColor: '#17662d',
    shadowColor: '#082b14',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.38,
    shadowRadius: 7,
    elevation: 9,
  },
  loginForm: {
    position: 'absolute',
    left: '8%',
    top: '35.5%',
    width: '84%',
    alignItems: 'stretch',
  },
  mobileNumber: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: 'rgba(255,255,255,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 7,
  },
  mobilePrompt: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  mobilePromptEnglish: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  mobilePromptUrdu: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 6,
  },
  phoneIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F3DC',
    marginRight: 8,
  },
  countryCode: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    fontWeight: '800',
  },
  numberDivider: {
    width: 1,
    height: '54%',
    marginHorizontal: 10,
    backgroundColor: 'rgba(21,85,45,0.45)',
  },
  numberInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontWeight: '600',
  },
  loginArrow: {
    position: 'absolute',
    left: '44%',
    top: '59%',
    width: '12%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#82d276',
    borderRadius: 50,
    backgroundColor: '#17662d',
    shadowColor: '#082b14',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.38,
    shadowRadius: 7,
    elevation: 9,
  },
  marketTabs: {
    position: 'absolute',
    top: '18%',
    left: '5%',
    width: '90%',
    height: 60,
    backgroundColor: 'transparent',
  },
  marketTabsContent: {
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 8,
  },
  marketTab: {
    width: 112,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketTabSelected: {
    backgroundColor: '#2F7D3C',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 4,
  },
  marketTabPressed: {
    opacity: 0.78,
    transform: [{scale: 0.97}],
  },
  marketTabText: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  marketTabTextSelected: {
    color: '#FFFFFF',
  },
  marketRateTable: {
    position: 'absolute',
    top: '27%',
    left: '5%',
    width: '90%',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7D3A3',
    backgroundColor: 'rgba(255,255,255,0.78)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  marketRateTableTitle: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.7,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  marketRateHeaderRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F7D3C',
    paddingHorizontal: 14,
  },
  marketRateHeaderText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingVertical: 12,
  },
  marketRateHeaderDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.46)',
  },
  marketNameColumn: {
    width: '28%',
    textAlign: 'left',
    paddingLeft: 2,
  },
  marketValueColumn: {
    width: '22%',
  },
  marketUpdatedColumn: {
    width: '28%',
  },
  marketRateDataRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C9E2C7',
  },
  marketRateCell: {
    color: '#174E2A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  marketRateEmptyRow: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  marketRateEmptyText: {
    color: '#5D8565',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  registrationFormContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 92,
    paddingBottom: 32,
  },
  registrationFormCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.76)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  registrationTitle: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  registrationTitleUrdu: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    lineHeight: 29,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 3,
    marginBottom: 22,
  },
  registrationLabel: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginLeft: 12,
    marginBottom: 7,
  },
  registrationNameInput: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  registrationCityPicker: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  registrationCityText: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    fontWeight: '700',
  },
  registrationPlaceholder: {
    color: 'rgba(21,85,45,0.46)',
    fontWeight: '600',
  },
  registrationChevron: {
    color: '#2F7D3C',
    fontSize: 25,
    fontWeight: '800',
    marginTop: -5,
  },
  registrationArrowButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: '#17662D',
    shadowColor: '#082B14',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 8,
  },
  registrationModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(8,43,19,0.42)',
  },
  registrationModalCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 26,
    padding: 20,
    backgroundColor: '#F3FBF0',
    shadowColor: '#092D16',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 14,
  },
  registrationModalTitle: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  registrationCityOption: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#B8DDB6',
    backgroundColor: '#FFFFFF',
  },
  registrationCityOptionSelected: {
    borderColor: '#3D914B',
    backgroundColor: '#DDF2D8',
  },
  registrationCityOptionText: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  registrationCityTick: {
    color: '#2F7D3C',
    fontSize: 20,
    fontWeight: '900',
  },
  otpKeyboardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  otpNativeForm: {
    width: '100%',
    alignItems: 'center',
    marginTop: 28,
  },
  otpNativeFormKeyboard: {
    transform: [{translateY: -72}],
  },
  otpPromptEnglish: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpPromptUrdu: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 6,
  },
  otpSlots: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
    paddingHorizontal: 4,
  },
  otpSlot: {
    width: 42,
    height: 54,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  otpSlotDigit: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpDash: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4A9855',
  },
  otpHiddenInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 1,
    padding: 0,
    zIndex: 2,
  },
  resendOtpButton: {
    minWidth: 150,
    height: 46,
    marginTop: 28,
    paddingHorizontal: 24,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4A9855',
    backgroundColor: 'rgba(255,255,255,0.86)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  resendOtpButtonPressed: {
    opacity: 0.78,
    transform: [{scale: 0.98}],
  },
  resendOtpButtonText: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  otpInput: {
    position: 'absolute',
    left: '17.8%',
    top: '48.3%',
    width: '70%',
    height: '7%',
    opacity: 0,
  },
  otpDigits: {
    position: 'absolute',
    left: '18.2%',
    top: '48.5%',
    width: '69.4%',
    height: '6.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePicture: {
    position: 'absolute', left: '38%', top: '34.8%', width: '24%', height: '12.5%', borderRadius: 80,
  },
  profileImage: {
    position: 'absolute',
    left: '40.7%',
    top: '35.2%',
    width: '18.8%',
    height: '10.4%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#82d477',
  },
  cameraBadge: {
    position: 'absolute',
    left: '54.2%',
    top: '42.8%',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f36a2b',
  },
  cameraBadgeIcon: {
    color: '#ffffff',
    fontSize: 12,
  },
  nameInput: {
    position: 'absolute',
    left: '24%',
    top: '53%',
    width: '61%',
    height: '5.8%',
    paddingVertical: 0,
    paddingHorizontal: 8,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  cityInput: {
    position: 'absolute',
    left: '24%',
    top: '60.3%',
    width: '61%',
    height: '5.8%',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '500',
  },
  cityPlaceholder: {
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
  },
  cityChevron: {
    color: '#a5e69a',
    fontSize: 28,
    lineHeight: 30,
  },
  registerButton: {
    position: 'absolute', left: '26.8%', top: '68.3%', width: '46.4%', height: '7.9%', borderRadius: 52,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  pickerCard: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#174f28',
  },
  pickerTitle: {
    marginBottom: 14,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerOption: {
    minHeight: 52,
    marginBottom: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(130,212,119,0.24)',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerTick: {
    color: '#a5e69a',
    fontSize: 22,
    fontWeight: '800',
  },
  pickerCancel: {
    minHeight: 48,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCancelText: {
    color: '#b7d8b7',
    fontSize: 17,
    fontWeight: '600',
  },
  dashboardTitle: {
    position: 'absolute',
    left: '4.2%',
    top: '2.2%',
    zIndex: 2,
    color: '#17652f',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dashboardGrains: {
    position: 'absolute', left: '4%', top: '22%', width: '21.6%', height: '14.7%', borderRadius: 22,
  },
  dashboardFruits: {
    position: 'absolute', left: '27.4%', top: '22%', width: '21.6%', height: '14.7%', borderRadius: 22,
  },
  dashboardVegetables: {
    position: 'absolute', left: '51%', top: '22%', width: '21.6%', height: '14.7%', borderRadius: 22,
  },
  dashboardLivestock: {
    position: 'absolute', left: '74.5%', top: '22%', width: '21.6%', height: '14.7%', borderRadius: 22,
  },
  viewMarkets: {
    position: 'absolute', left: '72%', top: '39.3%', width: '22%', height: '3.2%', borderRadius: 18,
  },
  provinceFilter: {
    position: 'absolute', left: '58.4%', top: '55.2%', width: '16.3%', height: '3%', borderRadius: 18,
  },
  dateFilter: {
    position: 'absolute', left: '76%', top: '55.2%', width: '18%', height: '3%', borderRadius: 18,
  },
  wheatRate: {
    position: 'absolute', left: '5%', top: '58.8%', width: '90%', height: '4.7%',
  },
  mangoRate: {
    position: 'absolute', left: '5%', top: '63.7%', width: '90%', height: '4.7%',
  },
  onionRate: {
    position: 'absolute', left: '5%', top: '68.5%', width: '90%', height: '4.7%',
  },
  cowRate: {
    position: 'absolute', left: '5%', top: '73.3%', width: '90%', height: '4.7%',
  },
  dashboardBottomNav: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    bottom: '1.5%',
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#79b968',
    borderRadius: 28,
    backgroundColor: '#16652d',
    shadowColor: '#092b16',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dashboardNavItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 20,
  },
  dashboardNavItemSelected: {
    backgroundColor: '#2d8a39',
  },
  dashboardNavItemPressed: {
    opacity: 0.72,
  },
  dashboardNavLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  otpDigit: {
    width: '13.2%',
    color: '#174f22',
    fontSize: 39,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpEnter: {
    position: 'absolute',
    left: '26.8%',
    top: '65.4%',
    width: '46.4%',
    height: '7.9%',
    borderRadius: 50,
  },
  home: {
    position: 'absolute', left: '14.5%', bottom: 0, width: '16%', height: '7.8%',
  },
  markets: {
    position: 'absolute', left: '33%', bottom: 0, width: '16%', height: '7.8%',
  },
  news: {
    position: 'absolute', left: '51.3%', bottom: 0, width: '16%', height: '7.8%',
  },
  settings: {
    position: 'absolute', left: '69.7%', bottom: 0, width: '16%', height: '7.8%',
  },
});

export default App;
