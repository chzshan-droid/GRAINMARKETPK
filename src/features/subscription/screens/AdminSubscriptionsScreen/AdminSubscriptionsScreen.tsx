import React, {useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import CheckCircle from 'lucide-react-native/icons/circle-check-big';
import UserCheck from 'lucide-react-native/icons/user-check';
import {
  approveSubscription,
  subscribeToPendingSubscriptions,
  type UserSubscription,
} from '../../../../services/subscription';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';

export function AdminSubscriptionsScreen({onBack}: {onBack: () => void}) {
  const [requests, setRequests] = useState<UserSubscription[]>([]);
  const [approvingId, setApprovingId] = useState('');
  const [error, setError] = useState('');

  useEffect(
    () =>
      subscribeToPendingSubscriptions(
        setRequests,
        subscriptionError => setError(subscriptionError.message),
      ),
    [],
  );

  const approve = async (request: UserSubscription) => {
    setApprovingId(request.userId);
    try {
      await approveSubscription(request.userId);
      Alert.alert('Subscription approved', `${request.fullName}'s plan is now active.`);
    } catch (approvalError) {
      Alert.alert(
        'Approval failed',
        approvalError instanceof Error
          ? approvalError.message
          : 'Unable to approve this subscription.',
      );
    } finally {
      setApprovingId('');
    }
  };

  return (
    <AppScreen background={images.clean}>
      <ScreenHeader title="SUBSCRIPTION APPROVALS" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <UserCheck color={colors.green700} size={28} />
          <View>
            <Text style={styles.heading}>PENDING REQUESTS</Text>
            <Text style={styles.count}>{requests.length} waiting for approval</Text>
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!error && !requests.length && (
          <View style={styles.emptyCard}>
            <CheckCircle color={colors.green700} size={42} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>There are no pending subscription requests.</Text>
          </View>
        )}

        {requests.map(request => (
          <View key={request.userId} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{request.fullName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.name}>{request.fullName}</Text>
                <Text style={styles.detail}>{request.phoneNumber}</Text>
                {!!request.city && <Text style={styles.detail}>{request.city}</Text>}
              </View>
              <View style={styles.planBadge}>
                <Text style={styles.plan}>{request.plan.toUpperCase()}</Text>
                <Text style={styles.amount}>Rs. {request.amount}</Text>
              </View>
            </View>
            <Pressable
              disabled={approvingId === request.userId}
              onPress={() => approve(request)}
              style={({pressed}) => [
                styles.approveButton,
                approvingId === request.userId && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <CheckCircle color={colors.white} size={20} />
              <Text style={styles.approveText}>
                {approvingId === request.userId ? 'APPROVING…' : 'APPROVE USER'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18, paddingBottom: 36},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingHorizontal: 5},
  heading: {color: colors.green900, fontSize: 18, fontWeight: '900'},
  count: {color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2},
  card: {padding: 17, marginBottom: 14, borderRadius: 23, borderWidth: 1.5, borderColor: '#9FD09C', backgroundColor: 'rgba(255,255,255,0.9)', elevation: 5},
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  avatar: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green700},
  avatarText: {color: colors.white, fontSize: 20, fontWeight: '900'},
  identity: {flex: 1, marginHorizontal: 12},
  name: {color: colors.green900, fontSize: 16, fontWeight: '900'},
  detail: {color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2},
  planBadge: {alignItems: 'flex-end', padding: 10, borderRadius: 14, backgroundColor: colors.green100},
  plan: {color: colors.green800, fontSize: 10, fontWeight: '900'},
  amount: {color: colors.green900, fontSize: 14, fontWeight: '900', marginTop: 2},
  approveButton: {height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, borderRadius: 24, backgroundColor: colors.green800},
  approveText: {color: colors.white, fontSize: 13, fontWeight: '900'},
  emptyCard: {alignItems: 'center', padding: 34, borderRadius: 24, borderWidth: 1.5, borderColor: '#A9D4A6', backgroundColor: 'rgba(255,255,255,0.86)'},
  emptyTitle: {color: colors.green900, fontSize: 19, fontWeight: '900', marginTop: 13},
  emptyText: {color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center', marginTop: 5},
  error: {color: colors.danger, fontSize: 14, fontWeight: '700', textAlign: 'center', padding: 22},
  disabled: {opacity: 0.55},
  pressed: {opacity: 0.8},
});
