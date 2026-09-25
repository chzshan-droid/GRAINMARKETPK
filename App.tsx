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
import LogOut from 'lucide-react-native/icons/log-out';
import Menu from 'lucide-react-native/icons/menu';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sprout from 'lucide-react-native/icons/sprout';
import UserRound from 'lucide-react-native/icons/user-round';
import X from 'lucide-react-native/icons/x';
import {
  saveRegisteredUser,
  saveProductRate,
  subscribeToRegisteredUser,
  subscribeToProductRates,
  type ProductCategory,
  type ProductRate,
  type RegisteredUser,
} from './src/services/firestore';

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
    | 'language'
    | 'admin'
    | 'login'
    | 'otp'
    | 'register'
    | 'dashboard'
    | 'account'
  >('language');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [dashboardMenuVisible, setDashboardMenuVisible] = useState(false);
  const [accountUser, setAccountUser] = useState<RegisteredUser | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountCity, setAccountCity] = useState('');
  const [accountCityPickerVisible, setAccountCityPickerVisible] =
    useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedMarketTab, setSelectedMarketTab] = useState<
    'GRAINS' | 'PULSES' | 'RICE' | 'OTHERS'
  >('GRAINS');
  const [adminCategory, setAdminCategory] = useState<ProductCategory>('GRAINS');
  const [adminProductId, setAdminProductId] = useState('');
  const [adminProductName, setAdminProductName] = useState('');
  const [adminNewProductName, setAdminNewProductName] = useState('');
  const [adminLowRate, setAdminLowRate] = useState('');
  const [adminHighRate, setAdminHighRate] = useState('');
  const [adminProductPickerVisible, setAdminProductPickerVisible] =
    useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [remoteProductRates, setRemoteProductRates] = useState<ProductRate[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const adminScrollRef = useRef<ScrollView>(null);
  const adminNewProductInputRef = useRef<TextInput>(null);
  const adminLowRateInputRef = useRef<TextInput>(null);
  const adminHighRateInputRef = useRef<TextInput>(null);
  const loginScrollRef = useRef<ScrollView>(null);
  const otpInputRef = useRef<TextInput>(null);
  const {
    height: currentViewportHeight,
    width: currentViewportWidth,
  } = useWindowDimensions();
  const screenCanvasHeight = useRef(currentViewportHeight).current;
  const isCompactAdminScreen =
    currentViewportHeight < 720 || currentViewportWidth < 380;
  const isNarrowAdminScreen = currentViewportWidth < 340;
  const isMobileNumberValid = mobileNumber.length === 10;
  const dashboardRows = remoteProductRates
    .filter(product => product.category === selectedMarketTab)
    .sort((firstProduct, secondProduct) =>
      firstProduct.name.localeCompare(secondProduct.name),
    )
    .map(product => {
      return {
        name: product.name,
        lowRate: String(product.lowRate),
        highRate: String(product.highRate),
        updated: product.lastUpdated,
      };
    });
  const adminProducts = remoteProductRates
    .filter(product => product.category === adminCategory)
    .sort((firstProduct, secondProduct) =>
      firstProduct.name.localeCompare(secondProduct.name),
    );

  const openOtpKeyboard = () => {
    otpInputRef.current?.focus();
  };

  const revealAdminField = (y: number) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        adminScrollRef.current?.scrollTo({y, animated: true});
      }, 120);
    });
  };

  const updateProductRate = async () => {
    const lowRate = Number(adminLowRate);
    const highRate = Number(adminHighRate);
    const productName = adminProductId
      ? adminProductName.trim()
      : adminNewProductName.trim();
    const isCreatingProduct = !adminProductId;

    if (
      !productName ||
      !adminLowRate.trim() ||
    !adminHighRate.trim()
    ) {
      Alert.alert('Missing details', 'Please enter all product details.');
      return;
    }

    if (!Number.isFinite(lowRate) || !Number.isFinite(highRate)) {
      Alert.alert('Invalid rates', 'Low and high rates must be numbers.');
      return;
    }

    setIsSavingProduct(true);
    try {
      await saveProductRate({
        id: adminProductId || undefined,
        category: adminCategory,
        name: productName,
        lowRate,
        highRate,
      });
      if (isCreatingProduct) {
        setAdminNewProductName('');
        setAdminLowRate('');
        setAdminHighRate('');
      }
      Keyboard.dismiss();
      Alert.alert(
        isCreatingProduct ? 'Product added' : 'Product updated',
        'The dashboard has been updated.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update product.';
      Alert.alert('Update failed', message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const selectAdminCategory = (category: ProductCategory) => {
    setAdminCategory(category);
    setAdminProductId('');
    setAdminProductName('');
    setAdminNewProductName('');
    setAdminLowRate('');
    setAdminHighRate('');
    setAdminProductPickerVisible(false);
  };

  const selectAdminProduct = (product: ProductRate) => {
    setAdminProductId(product.id);
    setAdminProductName(product.name);
    setAdminNewProductName('');
    setAdminLowRate(String(product.lowRate));
    setAdminHighRate(String(product.highRate));
    setAdminProductPickerVisible(false);
  };

  const changeAdminNewProductName = (value: string) => {
    if (value && adminProductId) {
      setAdminProductId('');
      setAdminProductName('');
      setAdminLowRate('');
      setAdminHighRate('');
    }
    setAdminNewProductName(value);
  };

  const logoutUser = () => {
    Keyboard.dismiss();
    setDashboardMenuVisible(false);
    setAccountCityPickerVisible(false);
    setAccountUser(null);
    setAccountName('');
    setAccountCity('');
    setMobileNumber('');
    setOtp('');
    setFullName('');
    setCity('');
    setLanguage(null);
    setScreen('language');
  };

  const completeRegistration = async () => {
    if (!fullName.trim() || !city || !isMobileNumberValid) {
      return;
    }

    setIsSavingProfile(true);
    try {
      await saveRegisteredUser({
        phoneNumber: `+92${mobileNumber}`,
        fullName: fullName.trim(),
        city,
        language: language ?? 'english',
        hasProfileImage: false,
      });
      Keyboard.dismiss();
      setScreen('dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save your profile.';
      Alert.alert('Profile not saved', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateAccount = async () => {
    if (!accountUser || !accountName.trim() || !accountCity) {
      Alert.alert('Missing details', 'Please enter your name and city.');
      return;
    }

    setIsUpdatingAccount(true);
    try {
      await saveRegisteredUser({
        ...accountUser,
        fullName: accountName.trim(),
        city: accountCity,
      });
      Keyboard.dismiss();
      setFullName(accountName.trim());
      setCity(accountCity);
      Alert.alert('Profile updated', 'Your account details have been saved.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update account.';
      Alert.alert('Update failed', message);
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  useEffect(() => subscribeToProductRates(setRemoteProductRates), []);

  useEffect(() => {
    if (screen !== 'account' || !isMobileNumberValid) {
      return;
    }

    setIsAccountLoading(true);
    setAccountError('');
    return subscribeToRegisteredUser(
      `+92${mobileNumber}`,
      user => {
        setAccountUser(user);
        if (user) {
          setAccountName(user.fullName);
          setAccountCity(user.city);
        }
        setIsAccountLoading(false);
      },
      error => {
        setAccountError(error.message);
        setIsAccountLoading(false);
      },
    );
  }, [isMobileNumberValid, mobileNumber, screen]);

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

    const focusTimer = setTimeout(() => otpInputRef.current?.focus(), 250);
    return () => {
      clearTimeout(focusTimer);
    };
  }, [screen]);

  if (screen === 'admin') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ImageBackground
          source={cleanHomeArtwork}
          resizeMode="stretch"
          style={styles.artwork}
          imageStyle={styles.image}>
          <ScrollView
            ref={adminScrollRef}
            automaticallyAdjustKeyboardInsets
            style={styles.adminScroll}
            contentContainerStyle={[
              styles.adminFormContent,
              isCompactAdminScreen && styles.adminFormContentCompact,
              isKeyboardVisible && styles.adminFormContentKeyboard,
            ]}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.adminFormCard,
                isCompactAdminScreen && styles.adminFormCardCompact,
              ]}>
              <View style={styles.adminFormTitleRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to dashboard"
                  onPress={() => {
                    Keyboard.dismiss();
                    setScreen('dashboard');
                  }}
                  hitSlop={10}
                  style={({pressed}) => [
                    styles.adminInlineBackButton,
                    pressed && styles.pressed,
                  ]}>
                  <ArrowLeft color="#15552D" size={23} strokeWidth={2.5} />
                </Pressable>
                <Text style={styles.adminFormTitle}>UPDATE PRODUCT RATE</Text>
                <View style={styles.adminTitleSpacer} />
              </View>
              <Text style={styles.adminFieldLabel}>CATEGORY</Text>
              <View
                style={[
                  styles.adminCategoryRow,
                  isNarrowAdminScreen && styles.adminCategoryRowNarrow,
                ]}>
                {(['GRAINS', 'PULSES', 'RICE', 'OTHERS'] as const).map(
                  category => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{selected: adminCategory === category}}
                      key={category}
                      onPress={() => selectAdminCategory(category)}
                      style={({pressed}) => [
                        styles.adminCategoryButton,
                        isNarrowAdminScreen &&
                          styles.adminCategoryButtonNarrow,
                        adminCategory === category &&
                          styles.adminCategoryButtonSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.adminCategoryText,
                          adminCategory === category &&
                            styles.adminCategoryTextSelected,
                        ]}>
                        {category}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
              <Text style={styles.adminFieldLabel}>PRODUCT NAME</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose product"
                accessibilityHint="Opens products available in the selected category"
                disabled={adminProducts.length === 0}
                onPress={() => setAdminProductPickerVisible(true)}
                style={({pressed}) => [
                  styles.adminProductPicker,
                  adminProducts.length === 0 && styles.disabled,
                  pressed && styles.adminProductPickerPressed,
                ]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.adminProductPickerText,
                    !adminProductName && styles.adminProductPickerPlaceholder,
                  ]}>
                  {adminProductName ||
                    (adminProducts.length > 0
                      ? 'Select a product'
                      : 'No products in this category')}
                </Text>
                <Text style={styles.adminProductPickerChevron}>⌄</Text>
              </Pressable>
              <View style={styles.adminProductDividerRow}>
                <View style={styles.adminProductDivider} />
                <Text style={styles.adminProductDividerText}>OR</Text>
                <View style={styles.adminProductDivider} />
              </View>
              <Text style={styles.adminFieldLabel}>NEW PRODUCT</Text>
              <TextInput
                ref={adminNewProductInputRef}
                accessibilityLabel="New product name"
                value={adminNewProductName}
                onChangeText={changeAdminNewProductName}
                placeholder="Enter a new product name"
                placeholderTextColor="rgba(21,85,45,0.46)"
                selectionColor="#2F7D3C"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => revealAdminField(185)}
                onSubmitEditing={() => adminLowRateInputRef.current?.focus()}
                style={styles.adminTextInput}
              />
              <View
                style={[
                  styles.adminRateRow,
                  isNarrowAdminScreen && styles.adminRateRowNarrow,
                ]}>
                <View
                  style={[
                    styles.adminRateField,
                    isNarrowAdminScreen && styles.adminRateFieldNarrow,
                  ]}>
                  <Text style={styles.adminFieldLabel}>LOW RATE</Text>
                  <TextInput
                    ref={adminLowRateInputRef}
                    accessibilityLabel="Low rate"
                    value={adminLowRate}
                    onChangeText={value =>
                      setAdminLowRate(value.replace(/[^0-9.]/g, ''))
                    }
                    placeholder="0"
                    placeholderTextColor="rgba(21,85,45,0.46)"
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    selectionColor="#2F7D3C"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() => revealAdminField(310)}
                    onSubmitEditing={() =>
                      adminHighRateInputRef.current?.focus()
                    }
                    style={styles.adminTextInput}
                  />
                </View>
                <View
                  style={[
                    styles.adminRateField,
                    isNarrowAdminScreen && styles.adminRateFieldNarrow,
                  ]}>
                  <Text style={styles.adminFieldLabel}>HIGH RATE</Text>
                  <TextInput
                    ref={adminHighRateInputRef}
                    accessibilityLabel="High rate"
                    value={adminHighRate}
                    onChangeText={value =>
                      setAdminHighRate(value.replace(/[^0-9.]/g, ''))
                    }
                    placeholder="0"
                    placeholderTextColor="rgba(21,85,45,0.46)"
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    selectionColor="#2F7D3C"
                    returnKeyType="done"
                    onFocus={() => revealAdminField(370)}
                    onSubmitEditing={Keyboard.dismiss}
                    style={styles.adminTextInput}
                  />
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Update product"
                disabled={isSavingProduct}
                onPress={updateProductRate}
                style={({pressed}) => [
                  styles.adminUpdateButton,
                  isSavingProduct && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.adminUpdateButtonText}>
                  {isSavingProduct
                    ? 'SAVING…'
                    : adminProductId
                      ? 'UPDATE'
                      : 'ADD PRODUCT'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
          <Modal
            animationType="fade"
            transparent
            visible={adminProductPickerVisible}
            onRequestClose={() => setAdminProductPickerVisible(false)}>
            <Pressable
              style={styles.adminPickerBackdrop}
              onPress={() => setAdminProductPickerVisible(false)}>
              <Pressable
                accessibilityViewIsModal
                style={styles.adminPickerCard}
                onPress={event => event.stopPropagation()}>
                <Text style={styles.adminPickerTitle}>SELECT PRODUCT</Text>
                <ScrollView
                  style={styles.adminPickerList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  {adminProducts.map(product => {
                    const selected = product.name === adminProductName;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        key={product.id}
                        onPress={() => selectAdminProduct(product)}
                        style={({pressed}) => [
                          styles.adminPickerOption,
                          selected && styles.adminPickerOptionSelected,
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.adminPickerOptionDetails}>
                          <Text style={styles.adminPickerOptionName}>
                            {product.name}
                          </Text>
                          <Text style={styles.adminPickerOptionRates}>
                            Low: {product.lowRate} · High: {product.highRate}
                          </Text>
                        </View>
                        {selected && (
                          <Text style={styles.adminPickerOptionTick}>✓</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdminProductPickerVisible(false)}
                  style={({pressed}) => [
                    styles.adminPickerCancel,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.adminPickerCancelText}>CANCEL</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </ImageBackground>
      </SafeScreen>
    );
  }

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
          {dashboardRows.length > 0 ? (
            dashboardRows.map(row => (
              <View key={row.name} style={styles.marketRateDataRow}>
                <Text
                  style={[
                    styles.marketRateCell,
                    styles.marketNameColumn,
                    styles.marketRateCellDivider,
                  ]}>
                  {row.name}
                </Text>
                <Text
                  style={[
                    styles.marketRateCell,
                    styles.marketValueColumn,
                    styles.marketRateCellDivider,
                  ]}>
                  {row.lowRate}
                </Text>
                <Text
                  style={[
                    styles.marketRateCell,
                    styles.marketValueColumn,
                    styles.marketRateCellDivider,
                  ]}>
                  {row.highRate}
                </Text>
                <Text
                  style={[styles.marketRateCell, styles.marketUpdatedColumn]}>
                  {row.updated}
                </Text>
              </View>
            ))
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
          accessibilityLabel="Open dashboard menu"
          accessibilityState={{expanded: dashboardMenuVisible}}
          onPress={() => setDashboardMenuVisible(true)}
          hitSlop={10}
          style={({pressed}) => [
            styles.loginBackButton,
            styles.dashboardMenuButton,
            pressed && styles.pressed,
          ]}>
          <Menu color="#15552D" size={27} strokeWidth={2.5} />
        </Pressable>
        <Modal
          animationType="fade"
          transparent
          statusBarTranslucent
          visible={dashboardMenuVisible}
          onRequestClose={() => setDashboardMenuVisible(false)}>
          <Pressable
            accessibilityLabel="Close dashboard menu"
            style={styles.dashboardDrawerBackdrop}
            onPress={() => setDashboardMenuVisible(false)}>
            <Pressable
              accessibilityViewIsModal
              style={styles.dashboardDrawer}
              onPress={event => event.stopPropagation()}>
              <View style={styles.dashboardDrawerHeader}>
                <View style={styles.dashboardDrawerAvatar}>
                  <UserRound color="#FFFFFF" size={30} strokeWidth={2.2} />
                </View>
                <View style={styles.dashboardDrawerIdentity}>
                  <Text numberOfLines={1} style={styles.dashboardDrawerName}>
                    {fullName.trim() || 'My Account'}
                  </Text>
                  {!!mobileNumber && (
                    <Text style={styles.dashboardDrawerPhone}>
                      +92 {mobileNumber}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  hitSlop={10}
                  onPress={() => setDashboardMenuVisible(false)}
                  style={({pressed}) => [
                    styles.dashboardDrawerClose,
                    pressed && styles.pressed,
                  ]}>
                  <X color="#FFFFFF" size={22} strokeWidth={2.5} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.dashboardDrawerItemsScroll}
                contentContainerStyle={styles.dashboardDrawerItemsContent}
                showsVerticalScrollIndicator={false}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="My Account"
                onPress={() => {
                  setDashboardMenuVisible(false);
                  setScreen('account');
                }}
                style={({pressed}) => [
                  styles.dashboardDrawerItem,
                  pressed && styles.dashboardDrawerItemPressed,
                ]}>
                <View style={styles.dashboardDrawerItemIcon}>
                  <UserRound color="#2F7D3C" size={23} strokeWidth={2.3} />
                </View>
                <Text style={styles.dashboardDrawerItemText}>My Account</Text>
                <Text style={styles.dashboardDrawerItemArrow}>›</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Logout"
                onPress={logoutUser}
                style={({pressed}) => [
                  styles.dashboardDrawerItem,
                  styles.dashboardDrawerLogoutItem,
                  pressed && styles.dashboardDrawerLogoutPressed,
                ]}>
                <View
                  style={[
                    styles.dashboardDrawerItemIcon,
                    styles.dashboardDrawerLogoutIcon,
                  ]}>
                  <LogOut color="#A7352D" size={23} strokeWidth={2.3} />
                </View>
                <Text
                  style={[
                    styles.dashboardDrawerItemText,
                    styles.dashboardDrawerLogoutText,
                  ]}>
                  Logout
                </Text>
                <Text
                  style={[
                    styles.dashboardDrawerItemArrow,
                    styles.dashboardDrawerLogoutText,
                  ]}>
                  ›
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Admin"
                onPress={() => {
                  setDashboardMenuVisible(false);
                  setScreen('admin');
                }}
                style={({pressed}) => [
                  styles.dashboardDrawerItem,
                  styles.dashboardDrawerAdminItem,
                  pressed && styles.dashboardDrawerItemPressed,
                ]}>
                <View
                  style={[
                    styles.dashboardDrawerItemIcon,
                    styles.dashboardDrawerAdminIcon,
                  ]}>
                  <ShieldCheck color="#17662D" size={23} strokeWidth={2.3} />
                </View>
                <Text style={styles.dashboardDrawerItemText}>Admin</Text>
                <Text style={styles.dashboardDrawerItemArrow}>›</Text>
              </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeScreen>
    );
  }

  if (screen === 'account') {
    return (
      <SafeScreen>
        <StatusBar
          hidden={false}
          barStyle="light-content"
          backgroundColor="#145d27"
          translucent
        />
        <ImageBackground
          source={cleanHomeArtwork}
          resizeMode="stretch"
          style={styles.artwork}
          imageStyle={styles.image}>
          <View style={styles.accountHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              onPress={() => setScreen('dashboard')}
              hitSlop={10}
              style={({pressed}) => [
                styles.accountBackButton,
                pressed && styles.pressed,
              ]}>
              <ArrowLeft color="#15552D" size={25} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.accountHeaderTitle}>MY ACCOUNT</Text>
            <View style={styles.accountHeaderSpacer} />
          </View>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.accountContent}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.accountCard}>
              <View style={styles.accountAvatar}>
                <UserRound color="#FFFFFF" size={42} strokeWidth={2.1} />
              </View>
              {isAccountLoading ? (
                <Text style={styles.accountStatusText}>
                  Loading account details…
                </Text>
              ) : accountError ? (
                <Text style={styles.accountErrorText}>{accountError}</Text>
              ) : accountUser ? (
                <>
                  <Text style={styles.accountLabel}>NAME</Text>
                  <TextInput
                    accessibilityLabel="Account name"
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(21,85,45,0.46)"
                    selectionColor="#2F7D3C"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    style={styles.accountTextInput}
                  />
                  <Text style={styles.accountLabel}>CITY</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose account city"
                    accessibilityState={{expanded: accountCityPickerVisible}}
                    onPress={() => {
                      Keyboard.dismiss();
                      setAccountCityPickerVisible(true);
                    }}
                    style={({pressed}) => [
                      styles.accountCityPicker,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.accountValueText}>{accountCity}</Text>
                    <Text style={styles.accountCityChevron}>⌄</Text>
                  </Pressable>
                  <View style={styles.accountMobileLabelRow}>
                    <Text style={styles.accountLabel}>MOBILE NUMBER</Text>
                    <Text style={styles.accountReadOnlyBadge}>READ ONLY</Text>
                  </View>
                  <View style={styles.accountValueBox}>
                    <Text style={styles.accountValueText}>
                      {accountUser.phoneNumber}
                    </Text>
                  </View>
                  <Text style={styles.accountMobileNotice}>
                    Your mobile number cannot be changed.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Update profile"
                    accessibilityState={{
                      disabled:
                        !accountName.trim() ||
                        !accountCity ||
                        isUpdatingAccount,
                    }}
                    disabled={
                      !accountName.trim() ||
                      !accountCity ||
                      isUpdatingAccount
                    }
                    onPress={updateAccount}
                    style={({pressed}) => [
                      styles.accountUpdateButton,
                      (!accountName.trim() ||
                        !accountCity ||
                        isUpdatingAccount) &&
                        styles.disabled,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.accountUpdateButtonText}>
                      {isUpdatingAccount ? 'UPDATING…' : 'UPDATE PROFILE'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.accountStatusText}>
                  No account data was found for +92 {mobileNumber}.
                </Text>
              )}
            </View>
          </ScrollView>
        </ImageBackground>
        <Modal
          animationType="fade"
          transparent
          visible={accountCityPickerVisible}
          onRequestClose={() => setAccountCityPickerVisible(false)}>
          <Pressable
            style={styles.registrationModalBackdrop}
            onPress={() => setAccountCityPickerVisible(false)}>
            <View style={styles.registrationModalCard}>
              <Text style={styles.registrationModalTitle}>SELECT CITY</Text>
              {['LAHORE', 'FAISALABAD', 'ISLAMABAD', 'KARACHI'].map(
                option => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{selected: accountCity === option}}
                    key={option}
                    onPress={() => {
                      setAccountCity(option);
                      setAccountCityPickerVisible(false);
                    }}
                    style={({pressed}) => [
                      styles.registrationCityOption,
                      accountCity === option &&
                        styles.registrationCityOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.registrationCityOptionText}>
                      {option}
                    </Text>
                    {accountCity === option && (
                      <Text style={styles.registrationCityTick}>✓</Text>
                    )}
                  </Pressable>
                ),
              )}
            </View>
          </Pressable>
        </Modal>
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
                  disabled: !fullName.trim() || !city || isSavingProfile,
                }}
                disabled={!fullName.trim() || !city || isSavingProfile}
                onPress={completeRegistration}
                style={({pressed}) => [
                  styles.registrationArrowButton,
                  (!fullName.trim() || !city || isSavingProfile) &&
                    styles.disabled,
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
          <View style={styles.otpKeyboardArea}>
            <View style={styles.otpNativeForm}>
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
                      Keyboard.dismiss();
                      setScreen('register');
                    }
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  caretHidden
                  editable
                  blurOnSubmit={false}
                  showSoftInputOnFocus={true}
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
                  otpInputRef.current?.focus();
                }}
                style={({pressed}) => [
                  styles.resendOtpButton,
                  pressed && styles.resendOtpButtonPressed,
                ]}>
                <Text style={styles.resendOtpButtonText}>RESEND OTP</Text>
              </Pressable>
            </View>
          </View>
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
  adminScroll: {
    flex: 1,
  },
  adminFormContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  adminFormContentCompact: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  adminFormContentKeyboard: {
    justifyContent: 'flex-start',
    paddingBottom: 48,
  },
  adminFormCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  adminFormCardCompact: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderRadius: 22,
  },
  adminFormTitle: {
    flex: 1,
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  adminFormTitleRow: {
    width: '100%',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminInlineBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  adminTitleSpacer: {
    width: 42,
    height: 42,
  },
  adminFieldLabel: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 10,
    marginBottom: 6,
  },
  adminCategoryRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  adminCategoryRowNarrow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  adminCategoryButton: {
    width: '24%',
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FCB91',
    backgroundColor: '#EFF8EC',
  },
  adminCategoryButtonNarrow: {
    width: '48%',
  },
  adminCategoryButtonSelected: {
    borderColor: '#2F7D3C',
    backgroundColor: '#2F7D3C',
  },
  adminCategoryText: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  adminCategoryTextSelected: {
    color: '#FFFFFF',
  },
  adminProductPicker: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 16,
    marginBottom: 16,
  },
  adminProductPickerPressed: {
    backgroundColor: '#E5F4E1',
  },
  adminProductPickerText: {
    flex: 1,
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontWeight: '700',
  },
  adminProductPickerPlaceholder: {
    color: 'rgba(21,85,45,0.48)',
    fontWeight: '600',
  },
  adminProductPickerChevron: {
    color: '#2F7D3C',
    fontSize: 25,
    lineHeight: 27,
    fontWeight: '900',
    marginLeft: 10,
    marginTop: -5,
  },
  adminProductDividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  adminProductDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#A7D3A3',
  },
  adminProductDividerText: {
    color: '#5D8565',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adminTextInput: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: 'rgba(255,255,255,0.94)',
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  adminRateRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  adminRateRowNarrow: {
    flexDirection: 'column',
    gap: 0,
  },
  adminRateField: {
    flex: 1,
  },
  adminRateFieldNarrow: {
    width: '100%',
    flex: 0,
  },
  adminUpdateButton: {
    minWidth: 150,
    height: 50,
    borderRadius: 25,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 26,
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: '#17662D',
    shadowColor: '#082B14',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 7,
  },
  adminUpdateButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adminPickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(8,43,19,0.46)',
  },
  adminPickerCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '72%',
    alignSelf: 'center',
    borderRadius: 26,
    padding: 18,
    backgroundColor: '#F3FBF0',
    shadowColor: '#092D16',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 14,
  },
  adminPickerTitle: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  adminPickerList: {
    flexGrow: 0,
  },
  adminPickerOption: {
    minHeight: 62,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#B8DDB6',
    backgroundColor: '#FFFFFF',
  },
  adminPickerOptionSelected: {
    borderColor: '#3D914B',
    backgroundColor: '#DDF2D8',
  },
  adminPickerOptionDetails: {
    flex: 1,
    paddingRight: 12,
  },
  adminPickerOptionName: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontWeight: '900',
  },
  adminPickerOptionRates: {
    color: '#5D8565',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  adminPickerOptionTick: {
    color: '#2F7D3C',
    fontSize: 20,
    fontWeight: '900',
  },
  adminPickerCancel: {
    minHeight: 46,
    marginTop: 12,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminPickerCancelText: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
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
  dashboardMenuButton: {
    borderColor: 'rgba(82,160,83,0.72)',
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  dashboardDrawerBackdrop: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(5,31,14,0.26)',
  },
  dashboardDrawer: {
    width: '84%',
    maxWidth: 340,
    height: '100%',
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 16 : 54,
    borderRightWidth: 1,
    borderRightColor: 'rgba(130,210,118,0.72)',
    backgroundColor: 'rgba(239,250,235,0.9)',
    shadowColor: '#041B0B',
    shadowOffset: {width: 6, height: 0},
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 18,
  },
  dashboardDrawerHeader: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(155,220,145,0.72)',
    backgroundColor: 'rgba(18,96,43,0.9)',
  },
  dashboardDrawerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: '#2F7D3C',
  },
  dashboardDrawerIdentity: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },
  dashboardDrawerName: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontWeight: '900',
  },
  dashboardDrawerPhone: {
    color: '#CDE9C8',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  dashboardDrawerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dashboardDrawerItemsScroll: {
    flex: 1,
  },
  dashboardDrawerItemsContent: {
    paddingBottom: 24,
  },
  dashboardDrawerItem: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 18,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B8DDB6',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  dashboardDrawerItemPressed: {
    backgroundColor: '#DDF2D8',
    transform: [{scale: 0.99}],
  },
  dashboardDrawerItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F3DC',
  },
  dashboardDrawerItemText: {
    flex: 1,
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 12,
  },
  dashboardDrawerItemArrow: {
    color: '#2F7D3C',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },
  dashboardDrawerLogoutItem: {
    marginTop: 10,
    borderColor: 'rgba(195,99,90,0.36)',
    backgroundColor: 'rgba(255,247,246,0.74)',
  },
  dashboardDrawerLogoutIcon: {
    backgroundColor: 'rgba(243,218,214,0.82)',
  },
  dashboardDrawerLogoutText: {
    color: '#A7352D',
  },
  dashboardDrawerLogoutPressed: {
    backgroundColor: 'rgba(246,220,216,0.9)',
    transform: [{scale: 0.99}],
  },
  dashboardDrawerAdminItem: {
    marginTop: 10,
    borderColor: 'rgba(85,155,85,0.42)',
    backgroundColor: 'rgba(241,250,238,0.78)',
  },
  dashboardDrawerAdminIcon: {
    backgroundColor: 'rgba(216,239,211,0.9)',
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
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 20,
  },
  marketRateCellDivider: {
    borderRightWidth: 1,
    borderRightColor: '#C9E2C7',
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
  accountHeader: {
    width: '100%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(232,247,227,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#9BCB97',
  },
  accountBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FCB91',
    backgroundColor: '#FFFFFF',
  },
  accountHeaderTitle: {
    flex: 1,
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  accountHeaderSpacer: {
    width: 42,
    height: 42,
  },
  accountContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },
  accountCard: {
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 26,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.86)',
    shadowColor: '#15552D',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  accountAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#82D276',
    backgroundColor: '#2F7D3C',
  },
  accountLabel: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginLeft: 10,
    marginBottom: 7,
  },
  accountValueBox: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 19,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#A7D3A3',
    backgroundColor: '#F7FCF5',
  },
  accountTextInput: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: '#FFFFFF',
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 19,
    marginBottom: 18,
  },
  accountCityPicker: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#72B879',
    backgroundColor: '#FFFFFF',
  },
  accountCityChevron: {
    color: '#2F7D3C',
    fontSize: 25,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: -5,
  },
  accountValueText: {
    color: '#15552D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 17,
    fontWeight: '700',
  },
  accountMobileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountReadOnlyBadge: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginRight: 10,
    marginBottom: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#DDF2D8',
  },
  accountMobileNotice: {
    color: '#5D8565',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -7,
  },
  accountUpdateButton: {
    minWidth: 184,
    height: 50,
    borderRadius: 25,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: '#17662D',
    shadowColor: '#082B14',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 7,
  },
  accountUpdateButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  accountStatusText: {
    color: '#397548',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 24,
  },
  accountErrorText: {
    color: '#B3261E',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 24,
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
