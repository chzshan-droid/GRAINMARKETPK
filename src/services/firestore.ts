import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

export type RegisteredUser = {
  phoneNumber: string;
  fullName: string;
  city: string;
  language: 'urdu' | 'english';
  hasProfileImage: boolean;
};

/** Creates or updates one user document keyed by the normalized phone number. */
export async function saveRegisteredUser(user: RegisteredUser): Promise<void> {
  const documentId = user.phoneNumber.replace(/\D/g, '');
  const userReference = doc(getFirestore(), 'users', documentId);

  await setDoc(
    userReference,
    {
      ...user,
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}
