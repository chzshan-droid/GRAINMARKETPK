import React, {useEffect, useState} from 'react';
import {Alert, BackHandler} from 'react-native';
import {
  clearSession,
  createSession,
  getSession,
} from '../../services/session';
import {AccountScreen} from '../../features/account/screens/AccountScreen/AccountScreen';
import {AdminScreen} from '../../features/admin/screens/AdminScreen/AdminScreen';
import {LoginScreen} from '../../features/auth/screens/LoginScreen/LoginScreen';
import {OtpScreen} from '../../features/auth/screens/OtpScreen/OtpScreen';
import {DashboardScreen} from '../../features/dashboard/screens/DashboardScreen/DashboardScreen';
import {ProductDetailScreen} from '../../features/dashboard/screens/ProductDetailScreen/ProductDetailScreen';
import {getRegisteredUser, type ProductRate} from '../../services/firestore';
import {
  getSubscriptionAccess,
  hasExpiredAccess,
} from '../../services/subscription';
import {
  LanguageScreen,
  type Language,
} from '../../features/language/screens/LanguageScreen/LanguageScreen';
import {RegisterScreen} from '../../features/registration/screens/RegisterScreen/RegisterScreen';
import {SubscriptionScreen} from '../../features/subscription/screens/SubscriptionScreen/SubscriptionScreen';
import {AdminSubscriptionsScreen} from '../../features/subscription/screens/AdminSubscriptionsScreen/AdminSubscriptionsScreen';
import {AppLoading} from '../../shared/components/AppLoading';
import {isAdminMobileNumber} from '../../shared/utils/phoneNumber';
import type {AppRoute} from './routes';

export function AppNavigator() {
  const [stack, setStack] = useState<AppRoute[]>(['language']);
  const [language, setLanguage] = useState<Language | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductRate | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const route = stack[stack.length - 1];

  const navigate = (next: AppRoute) => setStack(current => [...current, next]);
  const goBack = () =>
    setStack(current => (current.length > 1 ? current.slice(0, -1) : current));
  const reset = (next: AppRoute) => setStack([next]);

  const openDashboardWithSession = async (
    nextName: string,
    nextCity: string,
    nextLanguage: Language = language ?? 'english',
  ) => {
    try {
      await createSession({
        mobileNumber,
        language: nextLanguage,
        name: nextName,
        city: nextCity,
      });
    } catch (error) {
      console.warn('Unable to create the persistent session.', error);
    }
    setLanguage(nextLanguage);
    setName(nextName);
    setCity(nextCity);
    reset('dashboard');
  };

  const returnToLoggedOutState = () => {
    setLanguage(null);
    setMobileNumber('');
    setName('');
    setCity('');
    setSelectedProduct(null);
    reset('language');
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const savedSession = await getSession();

        if (active && savedSession) {
          const access = await getSubscriptionAccess(
            savedSession.mobileNumber,
          );
          if (hasExpiredAccess(access)) {
            await clearSession(savedSession.mobileNumber);
            return;
          }

          setLanguage(savedSession.language);
          setMobileNumber(savedSession.mobileNumber);
          setName(savedSession.name);
          setCity(savedSession.city);
          setStack(['dashboard']);
        }
      } catch {
        // Session restoration must never prevent the application from opening.
      } finally {
        if (active) {
          setSessionLoaded(true);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) {
        return false;
      }
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [stack.length]);

  if (!sessionLoaded) {
    return <AppLoading />;
  }

  const dashboard = (
    <DashboardScreen
      language={language ?? 'english'}
      name={name}
      mobileNumber={mobileNumber}
      onAccount={() => navigate('account')}
      onSubscription={() => {
        if (!isAdminMobileNumber(mobileNumber)) {
          navigate('subscription');
        }
      }}
      onAdmin={() => {
        if (isAdminMobileNumber(mobileNumber)) {
          navigate('admin');
        }
      }}
      onProductPress={product => {
        setSelectedProduct(product);
        navigate('productDetail');
      }}
      onTrialExpired={async () => {
        try {
          await clearSession(mobileNumber);
        } finally {
          returnToLoggedOutState();
          Alert.alert(
            'Free trial expired',
            'Please log in again and request a subscription to continue.',
          );
        }
      }}
      onLogout={async () => {
        await clearSession(mobileNumber);
        returnToLoggedOutState();
      }}
    />
  );

  switch (route) {
    case 'language':
      return (
        <LanguageScreen
          initialLanguage={language}
          onContinue={selectedLanguage => {
            setLanguage(selectedLanguage);
            navigate('login');
          }}
        />
      );
    case 'login':
      return (
        <LoginScreen
          initialNumber={mobileNumber}
          onBack={goBack}
          onContinue={async number => {
            setMobileNumber(number);
            navigate('otp');
          }}
        />
      );
    case 'otp':
      return (
        <OtpScreen
          mobileNumber={mobileNumber}
          onBack={goBack}
          onResend={async () => undefined}
          onVerified={async otp => {
            if (otp !== '123456') {
              throw new Error('Please enter the demo OTP 123456.');
            }

            const registeredUser = await getRegisteredUser(
              `+92${mobileNumber}`,
            );
            if (!registeredUser) {
              navigate('register');
              return;
            }

            setName(registeredUser.fullName);
            setCity(registeredUser.city);
            setLanguage(registeredUser.language);

            const access = await getSubscriptionAccess(mobileNumber);
            if (hasExpiredAccess(access)) {
              reset('subscription');
              return;
            }

            await openDashboardWithSession(
              registeredUser.fullName,
              registeredUser.city,
              registeredUser.language,
            );
          }}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          phoneNumber={mobileNumber}
          language={language ?? 'english'}
          initialName={name}
          initialCity={city}
          onBack={goBack}
          onComplete={(nextName, nextCity) =>
            openDashboardWithSession(nextName, nextCity)
          }
        />
      );
    case 'dashboard':
      return dashboard;
    case 'productDetail':
      return selectedProduct ? (
        <ProductDetailScreen
          language={language ?? 'english'}
          product={selectedProduct}
          onBack={goBack}
        />
      ) : (
        <AppLoading />
      );
    case 'account':
      return (
        <AccountScreen
          mobileNumber={mobileNumber}
          onBack={goBack}
          onUpdated={async (nextName, nextCity) => {
            setName(nextName);
            setCity(nextCity);
          }}
        />
      );
    case 'subscription':
      return !isAdminMobileNumber(mobileNumber) ? (
        <SubscriptionScreen
          mobileNumber={mobileNumber}
          language={language ?? 'english'}
          onBack={stack.length > 1 ? goBack : returnToLoggedOutState}
          onApproved={() => openDashboardWithSession(name, city)}
        />
      ) : dashboard;
    case 'admin':
      return isAdminMobileNumber(mobileNumber) ? (
        <AdminScreen
          onBack={goBack}
          onSubscriptions={() => navigate('adminSubscriptions')}
        />
      ) : dashboard;
    case 'adminSubscriptions':
      return isAdminMobileNumber(mobileNumber) ? (
        <AdminSubscriptionsScreen onBack={goBack} />
      ) : dashboard;
  }
}
