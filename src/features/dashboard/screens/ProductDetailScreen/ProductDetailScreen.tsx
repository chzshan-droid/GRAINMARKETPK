import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import Clock3 from 'lucide-react-native/icons/clock-3';
import MapPin from 'lucide-react-native/icons/map-pin';
import PackageOpen from 'lucide-react-native/icons/package-open';
import TrendingDown from 'lucide-react-native/icons/trending-down';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import type {ProductRate} from '../../../../services/firestore';
import {images} from '../../../../shared/assets/images';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {colors} from '../../../../shared/theme/colors';
import type {Language} from '../../../language/screens/LanguageScreen/LanguageScreen';
import {useProductRates} from '../../../products/hooks/useProductRates';
import {
  categoryUrdu,
  getUrduProductName,
  getUrduUpdatedTime,
} from '../../dashboardCopy';

type Props = {
  language: Language;
  product: ProductRate;
  onBack: () => void;
};

export function ProductDetailScreen({language, product, onBack}: Props) {
  const {products} = useProductRates();
  const urdu = language === 'urdu';
  const productName = urdu ? getUrduProductName(product.name) : product.name;
  const category = urdu
    ? categoryUrdu[product.category] ?? product.categoryUrduName ?? product.category
    : product.category;
  const lastUpdated = urdu
    ? getUrduUpdatedTime(product.lastUpdated)
    : product.lastUpdated;
  const marketRates = useMemo(() => {
    const matchingRates = products
      .filter(
        item =>
          item.category === product.category &&
          item.name.trim().toUpperCase() === product.name.trim().toUpperCase(),
      )
      .sort((a, b) => a.city.localeCompare(b.city));

    return matchingRates.length ? matchingRates : [product];
  }, [product, products]);

  return (
    <AppScreen background={images.dashboard}>
      <ScreenHeader
        title={urdu ? 'مصنوعات کی تفصیل' : 'PRODUCT DETAIL'}
        onBack={onBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.productIcon}>
            <PackageOpen color={colors.white} size={38} strokeWidth={2.2} />
          </View>
          <Text style={[styles.category, urdu && styles.urduText]}>{category}</Text>
          <Text style={[styles.productName, urdu && styles.urduText]}>{productName}</Text>
          <Text style={[styles.helper, urdu && styles.urduText]}>
            {urdu ? 'تازہ ترین مارکیٹ نرخ' : 'Latest market rates'}
          </Text>
        </View>

        <View style={styles.rateRow}>
          <RateCard
            icon={TrendingDown}
            label={urdu ? 'کم نرخ' : 'LOW RATE'}
            value={product.lowRate}
            tone="low"
            urdu={urdu}
          />
          <RateCard
            icon={TrendingUp}
            label={urdu ? 'زیادہ نرخ' : 'HIGH RATE'}
            value={product.highRate}
            tone="high"
            urdu={urdu}
          />
        </View>

        <View style={styles.marketsCard}>
          <View style={styles.marketsTitleRow}>
            <View style={styles.mapIcon}>
              <MapPin color={colors.white} size={21} strokeWidth={2.5} />
            </View>
            <View style={styles.marketsTitleCopy}>
              <Text style={[styles.marketsTitle, urdu && styles.urduText]}>
                {urdu ? 'پاکستان کی منڈیاں' : 'PAKISTAN MARKETS'}
              </Text>
              <Text style={[styles.marketsSubtitle, urdu && styles.urduText]}>
                {urdu ? `${productName} کے موجودہ نرخ` : `${product.name} current rates`}
              </Text>
            </View>
          </View>

          <View style={styles.marketTableHeader}>
            <Text style={[styles.marketHeaderName, urdu && styles.urduText]}>
              {urdu ? 'منڈی' : 'MARKET'}
            </Text>
            <Text style={[styles.marketHeaderRate, urdu && styles.urduText]}>
              {urdu ? 'کم' : 'LOW'}
            </Text>
            <Text style={[styles.marketHeaderRate, urdu && styles.urduText]}>
              {urdu ? 'زیادہ' : 'HIGH'}
            </Text>
          </View>

          {marketRates.map((market, index) => {
            const [englishCity, urduCity] = market.city
              .split('/')
              .map(value => value.trim());
            return (
              <View
                key={market.id}
                style={[styles.marketRow, index % 2 === 1 && styles.marketRowAlternate]}>
                <View style={styles.marketNameColumn}>
                  <Text style={[styles.marketName, urdu && styles.urduText]}>
                    {urdu ? urduCity || englishCity : englishCity}
                  </Text>
                  {!!urduCity && (
                    <Text numberOfLines={1} style={[styles.marketDetail, urdu && styles.urduText]}>
                      {urdu ? englishCity : urduCity}
                    </Text>
                  )}
                </View>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.marketRate}>
                  {market.lowRate.toLocaleString()}
                </Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.marketRate}>
                  {market.highRate.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.updatedCard}>
          <View style={styles.clockIcon}>
            <Clock3 color={colors.green700} size={25} />
          </View>
          <View style={styles.updatedCopy}>
            <Text style={[styles.updatedLabel, urdu && styles.urduText]}>
              {urdu ? 'آخری تازہ کاری' : 'LAST UPDATED'}
            </Text>
            <Text style={[styles.updatedValue, urdu && styles.urduText]}>{lastUpdated}</Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function RateCard({icon: Icon, label, value, tone, urdu}: {
  icon: typeof TrendingDown;
  label: string;
  value: number;
  tone: 'low' | 'high';
  urdu: boolean;
}) {
  const high = tone === 'high';

  return (
    <View style={[styles.rateCard, high && styles.highRateCard]}>
      <View style={[styles.rateIcon, high && styles.highRateIcon]}>
        <Icon color={high ? colors.green800 : '#8B5E20'} size={25} />
      </View>
      <Text style={[styles.rateLabel, urdu && styles.urduText]}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.rateValue}>
        Rs. {value.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {padding: 20, paddingBottom: 40},
  heroCard: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#98CD95',
    backgroundColor: 'rgba(27,101,48,0.94)',
    elevation: 8,
    shadowColor: '#123E20',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
  },
  productIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#9BDC92',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  category: {marginTop: 16, color: '#CBE9C7', fontSize: 12, fontWeight: '900', letterSpacing: 1.8},
  productName: {marginTop: 7, color: colors.white, fontSize: 30, fontWeight: '900', textAlign: 'center'},
  helper: {marginTop: 7, color: '#D8EED5', fontSize: 14, fontWeight: '600'},
  rateRow: {flexDirection: 'row', gap: 12, marginTop: 18},
  rateCard: {
    flex: 1,
    minHeight: 168,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D7BC8D',
    backgroundColor: 'rgba(255,249,237,0.96)',
    elevation: 4,
  },
  highRateCard: {borderColor: '#9BCF98', backgroundColor: 'rgba(238,249,234,0.97)'},
  rateIcon: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4E5C7'},
  highRateIcon: {backgroundColor: '#D8EFD4'},
  rateLabel: {marginTop: 12, color: '#58715D', fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center'},
  rateValue: {width: '100%', marginTop: 8, color: colors.green900, fontSize: 20, fontWeight: '900', textAlign: 'center'},
  marketsCard: {
    overflow: 'hidden',
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#A7D3A3',
    backgroundColor: 'rgba(255,255,255,0.94)',
    elevation: 4,
  },
  marketsTitleRow: {flexDirection: 'row', alignItems: 'center', padding: 17},
  mapIcon: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green700},
  marketsTitleCopy: {flex: 1, marginLeft: 12},
  marketsTitle: {color: colors.green900, fontSize: 16, fontWeight: '900', letterSpacing: 0.5},
  marketsSubtitle: {marginTop: 2, color: colors.muted, fontSize: 12, fontWeight: '600'},
  marketTableHeader: {minHeight: 38, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, backgroundColor: colors.green700},
  marketHeaderName: {width: '50%', color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.5},
  marketHeaderRate: {width: '25%', color: colors.white, fontSize: 10, fontWeight: '900', textAlign: 'center', letterSpacing: 0.4},
  marketRow: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C5DDC2'},
  marketRowAlternate: {backgroundColor: '#EDF7EA'},
  marketNameColumn: {width: '50%', paddingRight: 8},
  marketName: {color: colors.green900, fontSize: 14, fontWeight: '900'},
  marketDetail: {marginTop: 2, color: colors.muted, fontSize: 10, fontWeight: '600'},
  marketRate: {width: '25%', color: colors.green800, fontSize: 14, fontWeight: '900', textAlign: 'center'},
  updatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#B6DAB2',
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 3,
  },
  clockIcon: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green100},
  updatedCopy: {flex: 1, marginLeft: 14},
  updatedLabel: {color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.7},
  updatedValue: {marginTop: 3, color: colors.green900, fontSize: 18, fontWeight: '900'},
  urduText: {writingDirection: 'rtl'},
});
