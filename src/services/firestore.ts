import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import {getBilingualCityName} from '../shared/constants/cities';

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
      city: getBilingualCityName(user.city),
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

/** Reads a registered profile once for login routing decisions. */
export async function getRegisteredUser(
  phoneNumber: string,
): Promise<RegisteredUser | null> {
  const documentId = phoneNumber.replace(/\D/g, '');
  const snapshot = await getDoc(
    doc(getFirestore(), 'users', documentId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  if (
    typeof data.phoneNumber !== 'string' ||
    typeof data.fullName !== 'string' ||
    typeof data.city !== 'string' ||
    (data.language !== 'urdu' && data.language !== 'english') ||
    typeof data.hasProfileImage !== 'boolean'
  ) {
    return null;
  }

  return {
    phoneNumber: data.phoneNumber,
    fullName: data.fullName,
    city: data.city,
    language: data.language,
    hasProfileImage: data.hasProfileImage,
  };
}

/** Persists the selected language as soon as a mobile number identifies the user. */
export async function saveUserLanguage(
  phoneNumber: string,
  language: RegisteredUser['language'],
): Promise<void> {
  const documentId = phoneNumber.replace(/\D/g, '');
  const userReference = doc(getFirestore(), 'users', documentId);

  await setDoc(
    userReference,
    {
      phoneNumber,
      language,
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

export type ProductCategory = string;

export type ProductRate = {
  id: string;
  category: ProductCategory;
  categoryUrduName: string;
  name: string;
  city: string;
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
    `${product.category}-${product.name}-${product.city}`
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
      categoryUrduName: product.categoryUrduName.trim(),
      name: product.name.trim().toUpperCase(),
      city: getBilingualCityName(product.city),
      lowRate: product.lowRate,
      highRate: product.highRate,
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

/** Permanently deletes one product/market rate document. */
export async function deleteProductRate(productId: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'productRates', productId));
}

/** Deletes every product rate assigned to a custom category. */
export async function deleteProductCategory(category: string): Promise<void> {
  const categoryQuery = query(
    collection(getFirestore(), 'productRates'),
    where('category', '==', category),
  );
  const snapshot = await getDocs(categoryQuery);
  await Promise.all(snapshot.docs.map(productDocument => deleteDoc(productDocument.ref)));
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
        const categoryUrduName =
          typeof data.categoryUrduName === 'string'
            ? data.categoryUrduName
            : category ?? '';
        const name = data.name;
        const city =
          typeof data.city === 'string' ? data.city : 'PAKISTAN / پاکستان';
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
          categoryUrduName,
          name,
          city,
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
