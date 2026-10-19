import type {ProductCategory} from '../../services/firestore';

export const categoryUrdu: Record<ProductCategory, string> = {
  GRAINS: 'اناج',
  PULSES: 'دالیں',
  RICE: 'چاول',
  OTHERS: 'دیگر',
};

const productUrdu: Record<string, string> = {
  WHEAT: 'گندم',
  SESAME: 'تل',
  SEASME: 'تل',
  MUSTARD: 'سرسوں',
  MUSATRD: 'سرسوں',
  MILLET: 'باجرہ',
  CORN: 'مکئی',
  MAIZE: 'مکئی',
  RICE: 'چاول',
};

export function getUrduProductName(name: string): string {
  return productUrdu[name.toUpperCase()] ?? name;
}

export function getUrduUpdatedTime(value: string): string {
  if (value === 'JUST NOW') {
    return 'ابھی';
  }

  const match = value.match(/^(\d+) (MIN|HOUR|HOURS|DAY|DAYS) AGO$/);
  if (!match) {
    return value;
  }

  const [, amount, unit] = match;
  const unitUrdu = unit === 'MIN' ? 'منٹ' : unit.startsWith('HOUR') ? 'گھنٹے' : 'دن';
  return `${amount} ${unitUrdu} پہلے`;
}
