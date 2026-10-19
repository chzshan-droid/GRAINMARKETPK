import {useEffect, useState} from 'react';
import {
  subscribeToProductRates,
  type ProductRate,
} from '../../../services/firestore';

export function useProductRates() {
  const [products, setProducts] = useState<ProductRate[]>([]);
  const [error, setError] = useState('');

  useEffect(
    () =>
      subscribeToProductRates(setProducts, subscriptionError =>
        setError(subscriptionError.message),
      ),
    [],
  );

  return {products, error};
}
