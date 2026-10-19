import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LogOut from 'lucide-react-native/icons/log-out';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Menu from 'lucide-react-native/icons/menu';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import UserRound from 'lucide-react-native/icons/user-round';
import X from 'lucide-react-native/icons/x';
import type {ProductCategory, ProductRate} from '../../../../services/firestore';
import {
  ensureFreeTrialStarted,
  FREE_TRIAL_DURATION_MS,
  subscribeToSubscriptionAccess,
} from '../../../../services/subscription';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';
import {isAdminMobileNumber} from '../../../../shared/utils/phoneNumber';
import {useProductRates} from '../../../products/hooks/useProductRates';
import type {Language} from '../../../language/screens/LanguageScreen/LanguageScreen';
import {
  categoryUrdu,
  getUrduProductName,
  getUrduUpdatedTime,
} from '../../dashboardCopy';

const defaultTabs: ProductCategory[] = ['GRAINS', 'PULSES', 'RICE', 'OTHERS'];

type Props = {
  language: Language;
  name: string;
  mobileNumber: string;
  onAccount: () => void;
  onSubscription: () => void;
  onAdmin: () => void;
  onProductPress: (product: ProductRate) => void;
  onTrialExpired: () => Promise<void>;
  onLogout: () => Promise<void>;
};

export function DashboardScreen({language, name, mobileNumber, onAccount, onSubscription, onAdmin, onProductPress, onTrialExpired, onLogout}: Props) {
  const {width} = useWindowDimensions();
  const {products, error} = useProductRates();
  const [tab, setTab] = useState<ProductCategory>('GRAINS');
  const [menuVisible, setMenuVisible] = useState(false);
  const [trialStartedAt, setTrialStartedAt] = useState<number | null>(null);
  const [subscriptionApproved, setSubscriptionApproved] = useState(false);
  const expirationHandled = useRef(false);
  const tabs = useMemo(
    () => [
      ...defaultTabs,
      ...products
        .map(product => product.category)
        .filter(category => !defaultTabs.includes(category)),
    ].filter((category, index, categories) => categories.indexOf(category) === index),
    [products],
  );
  const rows = useMemo(() => {
    const groupedProducts = new Map<string, ProductRate>();

    products
      .filter(product => product.category === tab)
      .forEach(product => {
        const key = product.name.trim().toUpperCase();
        const current = groupedProducts.get(key);
        groupedProducts.set(
          key,
          current
            ? {
                ...current,
                city: 'MULTIPLE MARKETS / متعدد منڈیاں',
                lowRate: Math.min(current.lowRate, product.lowRate),
                highRate: Math.max(current.highRate, product.highRate),
              }
            : product,
        );
      });

    return [...groupedProducts.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [products, tab]);
  const urdu = language === 'urdu';
  const tabWidth = Math.max(88, Math.min(120, (width - 56) / 3.25));

  useEffect(() => {
    if (isAdminMobileNumber(mobileNumber)) {
      return;
    }

    ensureFreeTrialStarted(mobileNumber).catch(trialError =>
      console.warn('Unable to initialize the free trial.', trialError),
    );

    return subscribeToSubscriptionAccess(
      mobileNumber,
      access => {
        setTrialStartedAt(access.trialStartedAt);
        setSubscriptionApproved(access.subscription?.status === 'approved');
      },
      accessError =>
        console.warn('Unable to load subscription access.', accessError),
    );
  }, [mobileNumber]);

  useEffect(() => {
    if (
      isAdminMobileNumber(mobileNumber) ||
      subscriptionApproved ||
      trialStartedAt === null
    ) {
      expirationHandled.current = false;
      return;
    }

    const expire = () => {
      if (expirationHandled.current) {
        return;
      }
      expirationHandled.current = true;
      onTrialExpired().catch(expirationError =>
        console.warn('Unable to complete trial-expiry logout.', expirationError),
      );
    };
    const remaining =
      trialStartedAt + FREE_TRIAL_DURATION_MS - Date.now();

    if (remaining <= 0) {
      expire();
      return;
    }

    const timeout = setTimeout(expire, remaining);
    return () => clearTimeout(timeout);
  }, [mobileNumber, onTrialExpired, subscriptionApproved, trialStartedAt]);

  const confirmLogout = () => {
    Alert.alert(
      urdu ? 'لاگ آؤٹ' : 'Logout',
      urdu
        ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟'
        : 'Are you sure you want to logout?',
      [
        {
          text: urdu ? 'نہیں' : 'NO',
          style: 'cancel',
        },
        {
          text: urdu ? 'ہاں' : 'YES',
          style: 'destructive',
          onPress: () => {
            setMenuVisible(false);
            onLogout().catch(() =>
              Alert.alert(
                urdu ? 'خرابی' : 'Logout failed',
                urdu
                  ? 'براہ کرم دوبارہ کوشش کریں۔'
                  : 'Please try again.',
              ),
            );
          },
        },
      ],
    );
  };

  return (
    <AppScreen background={images.dashboard}>
      <ScreenHeader
        title={urdu ? 'اجناس کے نرخ' : 'GRAIN RATES'}
        leftIcon={Menu}
        leftLabel="Open menu"
        onLeftPress={() => setMenuVisible(true)}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          style={styles.tabsScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}>
          {tabs.map(item => {
            const translatedCategory =
              categoryUrdu[item] ??
              products.find(product => product.category === item)
                ?.categoryUrduName ??
              item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{selected: tab === item}}
                onPress={() => setTab(item)}
                style={[styles.tab, {width: tabWidth}, tab === item && styles.tabSelected]}>
                <Text
                  style={[
                    styles.tabText,
                    urdu && styles.urduText,
                    tab === item && styles.tabTextSelected,
                  ]}>
                  {urdu ? translatedCategory : item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[styles.categoryHint, urdu && styles.urduText]}>
          {urdu ? 'مزید اقسام دیکھنے کے لیے دائیں یا بائیں سوائپ کریں  ›' : 'Swipe to see more categories  ›'}
        </Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Cell header name urdu={urdu} text={urdu ? 'نام' : 'NAME'} />
            <Cell header urdu={urdu} text={urdu ? 'کم نرخ' : 'LOW RATE'} />
            <Cell header urdu={urdu} text={urdu ? 'زیادہ نرخ' : 'HIGH RATE'} />
            <Cell header updated urdu={urdu} text={urdu ? 'آخری تازہ کاری' : 'LAST UPDATED'} />
          </View>
          {rows.map((row, index) => (
            <Pressable
              key={row.id}
              accessibilityRole="button"
              accessibilityLabel={`${row.name} product details`}
              onPress={() => onProductPress(row)}
              style={({pressed}) => [
                styles.dataRow,
                index % 2 === 1 && styles.dataRowAlternate,
                pressed && styles.dataRowPressed,
              ]}>
              <Cell name urdu={urdu} text={urdu ? getUrduProductName(row.name) : row.name} />
              <Cell rate text={String(row.lowRate)} />
              <Cell rate text={String(row.highRate)} />
              <Cell updated urdu={urdu} text={urdu ? getUrduUpdatedTime(row.lastUpdated) : row.lastUpdated} />
            </Pressable>
          ))}
          {!rows.length && (
            <Text style={[styles.empty, urdu && styles.urduText]}>
              {error
                ? urdu
                  ? 'ڈیٹا حاصل نہیں ہو سکا'
                  : error
                : urdu
                  ? 'کوئی نرخ دستیاب نہیں'
                  : 'No rate data available'}
            </Text>
          )}
        </View>
      </ScrollView>
      <DashboardMenu
        name={name}
        urdu={urdu}
        mobileNumber={mobileNumber}
        trialStartedAt={trialStartedAt}
        subscriptionApproved={subscriptionApproved}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAccount={() => {
          setMenuVisible(false);
          onAccount();
        }}
        onSubscription={() => {
          setMenuVisible(false);
          onSubscription();
        }}
        onAdmin={() => {
          setMenuVisible(false);
          onAdmin();
        }}
        onLogout={confirmLogout}
      />
    </AppScreen>
  );
}

function Cell({text, header, name, rate, updated, urdu}: {text: string; header?: boolean; name?: boolean; rate?: boolean; updated?: boolean; urdu?: boolean}) {
  return (
    <View
      style={[
        name ? styles.nameColumn : updated ? styles.updatedColumn : styles.valueColumn,
        !updated && (header ? styles.headerColumnDivider : styles.dataColumnDivider),
      ]}>
      <Text
        numberOfLines={2}
        style={[
          header ? styles.headerCell : styles.cell,
          name && !header && styles.productName,
          rate && styles.rateValue,
          updated && !header && styles.updatedValue,
          urdu && styles.urduText,
        ]}>
        {text}
      </Text>
    </View>
  );
}

function DashboardMenu({name, mobileNumber, trialStartedAt, subscriptionApproved, visible, urdu, onClose, onAccount, onSubscription, onAdmin, onLogout}: {
  name: string;
  mobileNumber: string;
  trialStartedAt: number | null;
  subscriptionApproved: boolean;
  visible: boolean;
  urdu: boolean;
  onClose: () => void;
  onAccount: () => void;
  onSubscription: () => void;
  onAdmin: () => void;
  onLogout: () => void;
}) {
  const canAccessAdmin = isAdminMobileNumber(mobileNumber);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!visible || canAccessAdmin || subscriptionApproved) {
      return;
    }

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [canAccessAdmin, subscriptionApproved, visible]);

  const trialRemaining = trialStartedAt
    ? Math.max(0, trialStartedAt + FREE_TRIAL_DURATION_MS - now)
    : null;

  return (
    <Modal transparent statusBarTranslucent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.drawer} onPress={event => event.stopPropagation()}>
          <View style={styles.drawerHeader}>
            <View style={styles.avatar}><UserRound color={colors.white} size={29} /></View>
            <View style={styles.identity}>
              <Text numberOfLines={1} style={[styles.drawerName, urdu && styles.urduText]}>
                {name || (urdu ? 'میرا اکاؤنٹ' : 'My Account')}
              </Text>
              {!!mobileNumber && <Text style={styles.phone}>+92 {mobileNumber}</Text>}
            </View>
            <Pressable onPress={onClose} style={styles.close}><X color={colors.white} size={22} /></Pressable>
          </View>
          {!canAccessAdmin && (
            <View style={styles.trialCard}>
              <View style={styles.trialIcon}>
                <Clock3 color={colors.white} size={22} />
              </View>
              <View style={styles.trialCopy}>
                <Text style={[styles.trialLabel, urdu && styles.urduText]}>
                  {subscriptionApproved
                    ? urdu
                      ? 'سبسکرپشن فعال ہے'
                      : 'SUBSCRIPTION ACTIVE'
                    : urdu
                      ? '7 دن کا مفت ٹرائل'
                      : '7-DAY FREE TRIAL'}
                </Text>
                <Text style={styles.trialTime}>
                  {subscriptionApproved
                    ? urdu
                      ? 'منظور شدہ'
                      : 'APPROVED'
                    : trialRemaining === null
                      ? urdu
                        ? 'شروع ہو رہا ہے…'
                        : 'STARTING…'
                      : trialRemaining === 0
                        ? urdu
                          ? 'ٹرائل ختم ہوگیا'
                          : 'TRIAL EXPIRED'
                        : formatTrialTime(trialRemaining)}
                </Text>
              </View>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.drawerItems}>
            <MenuItem icon={UserRound} label={urdu ? 'میرا اکاؤنٹ' : 'My Account'} urdu={urdu} onPress={onAccount} />
            {!canAccessAdmin && (
              <MenuItem icon={CreditCard} label={urdu ? 'سبسکرپشن' : 'Subscription'} urdu={urdu} onPress={onSubscription} />
            )}
            <MenuItem icon={LogOut} label={urdu ? 'لاگ آؤٹ' : 'Logout'} urdu={urdu} danger onPress={onLogout} />
            {canAccessAdmin && (
              <MenuItem icon={ShieldCheck} label={urdu ? 'ایڈمن' : 'Admin'} urdu={urdu} onPress={onAdmin} />
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatTrialTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function MenuItem({icon: Icon, label, danger, urdu, onPress}: {
  icon: typeof UserRound;
  label: string;
  danger?: boolean;
  urdu?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.menuItem, danger && styles.dangerItem, pressed && styles.pressed]}>
      <View style={[styles.menuIcon, danger && styles.dangerIcon]}>
        <Icon color={danger ? colors.danger : colors.green700} size={23} />
      </View>
      <Text style={[styles.menuText, urdu && styles.urduText, danger && styles.dangerText]}>{label}</Text>
      <Text style={[styles.menuArrow, danger && styles.dangerText]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingBottom: 36},
  tabsScroll: {height: 66, flexGrow: 0, marginRight: -16},
  tabs: {height: 66, alignItems: 'center', gap: 8, paddingRight: 24},
  tab: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7D4A5',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  tabSelected: {borderColor: colors.green700, backgroundColor: colors.green700, elevation: 4},
  tabText: {color: '#28673A', fontSize: 12, fontWeight: '900'},
  tabTextSelected: {color: colors.white},
  categoryHint: {color: '#4C7D57', fontSize: 11, fontWeight: '800', textAlign: 'right', marginTop: -3, marginBottom: 9},
  table: {overflow: 'hidden', borderRadius: 22, borderWidth: 1.2, borderColor: '#A9D4A6', backgroundColor: 'rgba(255,255,255,0.92)', elevation: 7, shadowColor: '#123E20', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: {width: 0, height: 5}},
  headerRow: {minHeight: 56, flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.green700},
  dataRow: {minHeight: 68, flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C8DFC5', backgroundColor: 'rgba(250,255,248,0.96)'},
  dataRowAlternate: {backgroundColor: 'rgba(230,246,226,0.72)'},
  dataRowPressed: {opacity: 0.7, backgroundColor: '#D4EDCF'},
  headerCell: {color: colors.white, fontSize: 10, lineHeight: 14, fontWeight: '900', textAlign: 'center', letterSpacing: 0.25},
  cell: {color: '#174E2A', fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center'},
  productName: {fontSize: 13, fontWeight: '900', textAlign: 'left', color: colors.green900},
  rateValue: {overflow: 'hidden', minWidth: 58, paddingHorizontal: 7, paddingVertical: 7, borderRadius: 12, backgroundColor: '#E0F2DC', color: colors.green800, fontSize: 13, fontWeight: '900'},
  updatedValue: {color: '#58715D', fontSize: 10.5, lineHeight: 15, fontWeight: '800'},
  nameColumn: {width: '28%', justifyContent: 'center', paddingHorizontal: 10},
  valueColumn: {width: '22%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5},
  updatedColumn: {width: '28%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7},
  headerColumnDivider: {borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)'},
  dataColumnDivider: {borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#BFD8BC'},
  empty: {color: colors.muted, fontSize: 15, fontWeight: '700', textAlign: 'center', padding: 28},
  backdrop: {flex: 1, alignItems: 'flex-start', backgroundColor: 'rgba(5,31,14,0.26)'},
  drawer: {
    width: '84%', maxWidth: 340, height: '100%', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 16 : 54,
    borderRightWidth: 1, borderRightColor: 'rgba(130,210,118,0.72)', backgroundColor: 'rgba(239,250,235,0.9)', elevation: 18,
  },
  drawerHeader: {
    minHeight: 104, flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, padding: 18,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(155,220,145,0.72)', backgroundColor: 'rgba(18,96,43,0.9)',
  },
  avatar: {width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#82D276', backgroundColor: colors.green700},
  identity: {flex: 1, marginHorizontal: 12},
  drawerName: {color: colors.white, fontSize: 18, fontWeight: '900'},
  phone: {color: '#CDE9C8', fontSize: 13, fontWeight: '600', marginTop: 3},
  close: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)'},
  drawerItems: {paddingBottom: 24},
  trialCard: {
    minHeight: 78, flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 14, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: '#9DD296', backgroundColor: 'rgba(225,245,220,0.94)',
  },
  trialIcon: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green700},
  trialCopy: {flex: 1, marginLeft: 12},
  trialLabel: {color: colors.green900, fontSize: 12, fontWeight: '900'},
  trialTime: {color: colors.green700, fontSize: 14, fontWeight: '900', marginTop: 4},
  menuItem: {
    minHeight: 66, flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 12, paddingHorizontal: 13,
    borderRadius: 18, borderWidth: 1, borderColor: '#B8DDB6', backgroundColor: 'rgba(255,255,255,0.72)',
  },
  menuIcon: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green100},
  menuText: {flex: 1, color: colors.green900, fontSize: 16, fontWeight: '900', marginLeft: 12},
  menuArrow: {color: colors.green700, fontSize: 28},
  dangerItem: {borderColor: 'rgba(195,99,90,0.36)', backgroundColor: 'rgba(255,247,246,0.74)'},
  dangerIcon: {backgroundColor: 'rgba(243,218,214,0.82)'},
  dangerText: {color: colors.danger},
  pressed: {opacity: 0.78, transform: [{scale: 0.99}]},
  urduText: {writingDirection: 'rtl'},
});
