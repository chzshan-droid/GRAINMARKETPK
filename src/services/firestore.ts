import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
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

/** Subscribes to the user document associated with one mobile number. */
export function subscribeToRegisteredUser(
  phoneNumber: string,
  onUser: (user: RegisteredUser | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const documentId = phoneNumber.replace(/\D/g, '');
  const userReference = doc(getFirestore(), 'users', documentId);

  return onSnapshot(
    userReference,
    snapshot => {
      if (!snapshot.exists()) {
        onUser(null);
        return;
      }

      const data = snapshot.data();
      if (
        typeof data?.phoneNumber !== 'string' ||
        typeof data.fullName !== 'string' ||
        typeof data.city !== 'string' ||
        (data.language !== 'urdu' && data.language !== 'english') ||
        typeof data.hasProfileImage !== 'boolean'
      ) {
        onUser(null);
        return;
      }

      onUser({
        phoneNumber: data.phoneNumber,
        fullName: data.fullName,
        city: data.city,
        language: data.language,
        hasProfileImage: data.hasProfileImage,
      });
    },
    error => onError?.(error),
  );
}

export type ProductCategory = 'GRAINS' | 'PULSES' | 'RICE' | 'OTHERS';

export type ProductRate = {
  id: string;
  category: ProductCategory;
  name: string;
  lowRate: number;
  highRate: number;
  lastUpdated: string;
};

export type ProductRateInput = Omit<ProductRate, 'id' | 'lastUpdated'> & {
  id?: string;
};

function formatLastUpdated(updatedAt: unknown): string {
  if (
    !updatedAt ||
    typeof updatedAt !== 'object' ||
    !('toDate' in updatedAt) ||
    typeof updatedAt.toDate !== 'function'
  ) {
    return 'JUST NOW';
  }

  const updatedDate = updatedAt.toDate();
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - updatedDate.getTime()) / 60000),
  );

  if (elapsedMinutes < 1) {
    return 'JUST NOW';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} MIN AGO`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? 'HOUR' : 'HOURS'} AGO`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? 'DAY' : 'DAYS'} AGO`;
}

/** Creates or updates a product rate keyed by its category and product name. */
export async function saveProductRate(
  product: ProductRateInput,
): Promise<void> {
  const documentId =
    product.id ??
    `${product.category}-${product.name}`
      .trim()
      .toLowerCase()
      .replace(/[\\/]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/^-|-$/g, '');
  const productReference = doc(getFirestore(), 'productRates', documentId);

  await setDoc(
    productReference,
    {
      category: product.category,
      name: product.name.trim().toUpperCase(),
      lowRate: product.lowRate,
      highRate: product.highRate,
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

/** Subscribes to live product-rate changes used by the dashboard tables. */
export function subscribeToProductRates(
  onProducts: (products: ProductRate[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(getFirestore(), 'productRates'),
    snapshot => {
      const products = snapshot.docs.flatMap(productDocument => {
        const data = productDocument.data();
        const category = data.category as ProductCategory | undefined;
        const name = data.name;
        const lowRate = data.lowRate;
        const highRate = data.highRate;
        const lastUpdated = formatLastUpdated(data.updatedAt);

        if (
          !category ||
          typeof name !== 'string' ||
          typeof lowRate !== 'number' ||
          typeof highRate !== 'number'
        ) {
          return [];
        }

        return [{
          id: productDocument.id,
          category,
          name,
          lowRate,
          highRate,
          lastUpdated,
        }];
      });

      onProducts(products);
    },
    error => onError?.(error),
  );
}
