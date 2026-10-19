import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Check from 'lucide-react-native/icons/check';
import Crown from 'lucide-react-native/icons/crown';
import {
  requestSubscription,
  subscribeToUserSubscription,
  type SubscriptionPlan,
  type UserSubscription,
} from '../../../../services/subscription';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';
import type {Language} from '../../../language/screens/LanguageScreen/LanguageScreen';

type Props = {
  mobileNumber: string;
  language: Language;
  onBack: () => void;
  onApproved: () => Promise<void>;
};

const plans: Array<{
  id: SubscriptionPlan;
  title: string;
  urduTitle: string;
  price: number;
  detail: string;
  urduDetail: string;
}> = [
  {
    id: 'monthly',
    title: 'Monthly',
    urduTitle: 'ماہانہ',
    price: 300,
    detail: 'Access for one month',
    urduDetail: 'ایک ماہ کی رسائی',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    urduTitle: 'سالانہ',
    price: 2000,
    detail: 'Best value for one year',
    urduDetail: 'ایک سال کے لیے بہترین قیمت',
  },
];

export function SubscriptionScreen({mobileNumber, language, onBack, onApproved}: Props) {
  const urdu = language === 'urdu';
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan>('monthly');
  const [subscription, setSubscription] =
    useState<UserSubscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const approvalHandled = useRef(false);

  useEffect(
    () =>
      subscribeToUserSubscription(
        mobileNumber,
        nextSubscription => {
          setSubscription(nextSubscription);
          if (nextSubscription) {
            setSelectedPlan(nextSubscription.plan);
          }
          setError('');
        },
        subscriptionError => setError(subscriptionError.message),
      ),
    [mobileNumber],
  );

  useEffect(() => {
    if (subscription?.status !== 'approved' || approvalHandled.current) {
      return;
    }

    approvalHandled.current = true;
    onApproved().catch(approvalError => {
      approvalHandled.current = false;
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : 'Unable to activate the approved subscription.',
      );
    });
  }, [onApproved, subscription?.status]);

  const submit = async () => {
    setSaving(true);
    try {
      await requestSubscription(mobileNumber, selectedPlan);
      Alert.alert(
        urdu ? 'درخواست جمع ہوگئی' : 'Request submitted',
        urdu
          ? 'آپ کی سبسکرپشن ایڈمن کی منظوری کے لیے بھیج دی گئی ہے۔'
          : 'Your subscription has been sent for admin approval.',
      );
    } catch (requestError) {
      Alert.alert(
        urdu ? 'درخواست ناکام' : 'Request failed',
        requestError instanceof Error
          ? requestError.message
          : 'Unable to submit subscription.',
      );
    } finally {
      setSaving(false);
    }
  };

  const approved = subscription?.status === 'approved';
  const pending = subscription?.status === 'pending';

  return (
    <AppScreen background={images.clean}>
      <ScreenHeader
        title={urdu ? 'سبسکرپشن' : 'SUBSCRIPTION'}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroIcon}>
          <Crown color={colors.white} size={36} />
        </View>
        <Text style={[styles.heading, urdu && styles.urdu]}>
          {urdu ? 'اپنا پلان منتخب کریں' : 'Choose your plan'}
        </Text>
        <Text style={[styles.subtitle, urdu && styles.urdu]}>
          {urdu
            ? 'تازہ ترین منڈی نرخوں تک رسائی حاصل کریں'
            : 'Get access to the latest market rates'}
        </Text>

        <View style={styles.plans}>
          {plans.map(plan => {
            const selected = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                disabled={approved}
                onPress={() => setSelectedPlan(plan.id)}
                style={({pressed}) => [
                  styles.plan,
                  selected && styles.planSelected,
                  pressed && styles.pressed,
                ]}>
                <View
                  style={[
                    styles.planIcon,
                    selected && styles.planIconSelected,
                  ]}>
                  <CalendarDays
                    color={selected ? colors.white : colors.green700}
                    size={26}
                  />
                </View>
                <View style={styles.planCopy}>
                  <Text style={[styles.planTitle, urdu && styles.urdu]}>
                    {urdu ? plan.urduTitle : plan.title}
                  </Text>
                  <Text style={[styles.planDetail, urdu && styles.urdu]}>
                    {urdu ? plan.urduDetail : plan.detail}
                  </Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.price}>Rs. {plan.price}</Text>
                  {selected && (
                    <View style={styles.check}>
                      <Check color={colors.white} size={14} strokeWidth={3} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.paymentCard}>
          <Text style={[styles.paymentLabel, urdu && styles.urdu]}>
            {urdu ? 'ادائیگی کی تفصیلات' : 'PAYMENT DETAILS'}
          </Text>
          <Text style={styles.paymentText}>
            Jazz Cash Account 03006608811 Zeeshan Ahmad
          </Text>
          <Text style={styles.paymentInstruction}>
            Send the payment slip on WhatsApp
          </Text>
        </View>

        {(pending || approved) && (
          <View style={[styles.status, approved && styles.statusApproved]}>
            <Text style={[styles.statusTitle, urdu && styles.urdu]}>
              {approved
                ? urdu
                  ? 'سبسکرپشن منظور ہوگئی'
                  : 'Subscription approved'
                : urdu
                  ? 'منظوری کا انتظار ہے'
                  : 'Waiting for approval'}
            </Text>
            <Text style={[styles.statusText, urdu && styles.urdu]}>
              {approved
                ? urdu
                  ? 'آپ کا پلان فعال ہے۔'
                  : 'Your selected plan is active.'
                : urdu
                  ? 'ایڈمن جلد آپ کی درخواست کا جائزہ لے گا۔'
                  : 'The admin will review your request shortly.'}
            </Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!approved && (
          <Pressable
            disabled={saving}
            onPress={submit}
            style={({pressed}) => [
              styles.button,
              saving && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.buttonText, urdu && styles.urdu]}>
              {saving
                ? urdu
                  ? 'جمع ہو رہا ہے…'
                  : 'SUBMITTING…'
                : pending
                  ? urdu
                    ? 'پلان تبدیل کریں'
                    : 'CHANGE PLAN REQUEST'
                  : urdu
                    ? 'درخواست بھیجیں'
                    : 'REQUEST SUBSCRIPTION'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 38,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: colors.green700,
    borderWidth: 3,
    borderColor: '#82D276',
    elevation: 7,
  },
  heading: {
    color: colors.green900,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    color: '#4C7D57',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 24,
  },
  plans: {gap: 14},
  plan: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#A9D4A6',
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
  },
  planSelected: {
    borderWidth: 2.5,
    borderColor: colors.green700,
    backgroundColor: '#E7F6E2',
  },
  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green100,
  },
  planIconSelected: {backgroundColor: colors.green700},
  planCopy: {flex: 1, marginHorizontal: 14},
  planTitle: {color: colors.green900, fontSize: 19, fontWeight: '900'},
  planDetail: {color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 5},
  priceBlock: {alignItems: 'flex-end', gap: 9},
  price: {color: colors.green800, fontSize: 17, fontWeight: '900'},
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green700,
  },
  paymentCard: {
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 3,
  },
  paymentLabel: {
    color: colors.green700,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  paymentText: {
    color: colors.green900,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 7,
  },
  paymentInstruction: {
    color: '#4C7D57',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  status: {
    marginTop: 22,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0B858',
    backgroundColor: '#FFF8E2',
  },
  statusApproved: {borderColor: '#78BF72', backgroundColor: '#E3F5DF'},
  statusTitle: {color: colors.green900, fontSize: 16, fontWeight: '900', textAlign: 'center'},
  statusText: {color: '#4C7D57', fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center', marginTop: 5},
  button: {
    minHeight: 54,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 28,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: colors.green800,
    elevation: 7,
  },
  buttonText: {color: colors.white, fontSize: 14, fontWeight: '900'},
  error: {color: colors.danger, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 18},
  disabled: {opacity: 0.55},
  pressed: {opacity: 0.8, transform: [{scale: 0.99}]},
  urdu: {writingDirection: 'rtl'},
});
