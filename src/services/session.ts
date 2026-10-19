import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import {
  getId,
  getInstallations,
} from '@react-native-firebase/installations';

export type SessionLanguage = 'urdu' | 'english';

export type AppSession = {
  sessionId: string;
  mobileNumber: string;
  language: SessionLanguage;
  name: string;
  city: string;
  createdAt: string;
};

const createSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const userDocumentId = (mobileNumber: string) =>
  `92${mobileNumber.replace(/\D/g, '').replace(/^92/, '')}`;

export async function createSession(
  details: Omit<AppSession, 'sessionId' | 'createdAt'>,
): Promise<AppSession> {
  const session: AppSession = {
    ...details,
    sessionId: createSessionId(),
    createdAt: new Date().toISOString(),
  };
  const installationId = await getId(getInstallations());

  await setDoc(
    doc(getFirestore(), 'users', userDocumentId(details.mobileNumber)),
    {
      installationId,
      sessionId: session.sessionId,
      sessionActive: true,
      sessionStartedAt: serverTimestamp(),
    },
    {merge: true},
  );

  return session;
}

export async function getSession(): Promise<AppSession | null> {
  const installationId = await getId(getInstallations());
  const snapshot = await getDocs(
    query(
      collection(getFirestore(), 'users'),
      where('installationId', '==', installationId),
    ),
  );

  for (const userDocument of snapshot.docs) {
    const data = userDocument.data();
    if (
      data.sessionActive === true &&
      typeof data.sessionId === 'string' &&
      typeof data.phoneNumber === 'string' &&
      typeof data.fullName === 'string' &&
      typeof data.city === 'string' &&
      (data.language === 'urdu' || data.language === 'english')
    ) {
      return {
        sessionId: data.sessionId,
        mobileNumber: data.phoneNumber.replace(/\D/g, '').replace(/^92/, ''),
        language: data.language,
        name: data.fullName,
        city: data.city,
        createdAt:
          data.sessionStartedAt?.toDate?.().toISOString?.() ??
          new Date().toISOString(),
      };
    }
  }

  return null;
}

export async function clearSession(mobileNumber: string): Promise<void> {
  await setDoc(
    doc(getFirestore(), 'users', userDocumentId(mobileNumber)),
    {
      sessionActive: false,
      sessionEndedAt: serverTimestamp(),
    },
    {merge: true},
  );
}
