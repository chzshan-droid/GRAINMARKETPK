import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import {
  isAdminMobileNumber,
  toUserDocumentId,
} from '../shared/utils/phoneNumber';

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'pending' | 'approved';

export type UserSubscription = {
  userId: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  plan: SubscriptionPlan;
  amount: number;
  status: SubscriptionStatus;
};

export type SubscriptionAccess = {
  subscription: UserSubscription | null;
  trialStartedAt: number | null;
};

export const FREE_TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const planAmount = (plan: SubscriptionPlan) =>
  plan === 'monthly' ? 300 : 2000;

function readSubscription(
  userId: string,
  data: Record<string, unknown>,
): UserSubscription | null {
  const subscription = data.subscription;
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }

  const value = subscription as Record<string, unknown>;
  if (
    (value.plan !== 'monthly' && value.plan !== 'yearly') ||
    (value.status !== 'pending' && value.status !== 'approved')
  ) {
    return null;
  }

  return {
    userId,
    fullName: typeof data.fullName === 'string' ? data.fullName : 'User',
    phoneNumber:
      typeof data.phoneNumber === 'string' ? data.phoneNumber : userId,
    city: typeof data.city === 'string' ? data.city : '',
    plan: value.plan,
    amount:
      typeof value.amount === 'number' ? value.amount : planAmount(value.plan),
    status: value.status,
  };
}

function readTimestamp(value: unknown): number | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().getTime();
  }

  return null;
}

/** Starts the seven-day trial once and never resets an existing start time. */
export async function ensureFreeTrialStarted(
  mobileNumber: string,
): Promise<void> {
  if (isAdminMobileNumber(mobileNumber)) {
    return;
  }

  const userReference = doc(
    getFirestore(),
    'users',
    toUserDocumentId(mobileNumber),
  );
  const snapshot = await getDoc(userReference);

  if (!snapshot.data()?.trialStartedAt) {
    await setDoc(
      userReference,
      {trialStartedAt: serverTimestamp()},
      {merge: true},
    );
  }
}

export function subscribeToSubscriptionAccess(
  mobileNumber: string,
  onAccess: (access: SubscriptionAccess) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(getFirestore(), 'users', toUserDocumentId(mobileNumber)),
    snapshot => {
      const data = snapshot.data() ?? {};
      onAccess({
        subscription: snapshot.exists()
          ? readSubscription(snapshot.id, data)
          : null,
        trialStartedAt: readTimestamp(data.trialStartedAt),
      });
    },
    error => onError?.(error),
  );
}

export async function getSubscriptionAccess(
  mobileNumber: string,
): Promise<SubscriptionAccess> {
  const snapshot = await getDoc(
    doc(getFirestore(), 'users', toUserDocumentId(mobileNumber)),
  );
  const data = snapshot.data() ?? {};

  return {
    subscription: snapshot.exists()
      ? readSubscription(snapshot.id, data)
      : null,
    trialStartedAt: readTimestamp(data.trialStartedAt),
  };
}

export function hasExpiredAccess(access: SubscriptionAccess): boolean {
  if (access.subscription?.status === 'approved') {
    return false;
  }

  return (
    access.trialStartedAt !== null &&
    Date.now() >= access.trialStartedAt + FREE_TRIAL_DURATION_MS
  );
}

export async function requestSubscription(
  mobileNumber: string,
  plan: SubscriptionPlan,
): Promise<void> {
  if (isAdminMobileNumber(mobileNumber)) {
    throw new Error('The administrator account cannot request a subscription.');
  }

  await setDoc(
    doc(getFirestore(), 'users', toUserDocumentId(mobileNumber)),
    {
      subscription: {
        plan,
        amount: planAmount(plan),
        status: 'pending',
        requestedAt: serverTimestamp(),
        approvedAt: null,
      },
    },
    {merge: true},
  );
}

export function subscribeToUserSubscription(
  mobileNumber: string,
  onSubscription: (subscription: UserSubscription | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(getFirestore(), 'users', toUserDocumentId(mobileNumber)),
    snapshot =>
      onSubscription(
        snapshot.exists()
          ? readSubscription(snapshot.id, snapshot.data() ?? {})
          : null,
      ),
    error => onError?.(error),
  );
}

export function subscribeToPendingSubscriptions(
  onSubscriptions: (subscriptions: UserSubscription[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(getFirestore(), 'users'),
    snapshot => {
      const subscriptions = snapshot.docs
        .map(userDocument =>
          readSubscription(userDocument.id, userDocument.data()),
        )
        .filter(
          (subscription): subscription is UserSubscription =>
            subscription?.status === 'pending' &&
            !isAdminMobileNumber(subscription.phoneNumber) &&
            !isAdminMobileNumber(subscription.userId),
        );
      onSubscriptions(subscriptions);
    },
    error => onError?.(error),
  );
}

export async function approveSubscription(userId: string): Promise<void> {
  if (isAdminMobileNumber(userId)) {
    throw new Error('The administrator cannot approve its own subscription.');
  }

  await updateDoc(doc(getFirestore(), 'users', userId), {
    'subscription.status': 'approved',
    'subscription.approvedAt': serverTimestamp(),
  });
}
