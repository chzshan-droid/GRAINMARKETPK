import React, {useMemo, useRef, useState} from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Trash2 from 'lucide-react-native/icons/trash';
import UserCheck from 'lucide-react-native/icons/user-check';
import {
  deleteProductCategory,
  deleteProductRate,
  saveProductRate,
  type ProductCategory,
  type ProductRate,
} from '../../../../services/firestore';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {CityPickerModal} from '../../../../shared/components/CityPickerModal';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';
import {useProductRates} from '../../../products/hooks/useProductRates';
import {categoryUrdu} from '../../../dashboard/dashboardCopy';

const defaultCategories: ProductCategory[] = ['GRAINS', 'PULSES', 'RICE', 'OTHERS'];

export function AdminScreen({onBack, onSubscriptions}: {onBack: () => void; onSubscriptions: () => void}) {
  const {products} = useProductRates();
  const {width, height} = useWindowDimensions();
  const narrow = width < 390;
  const compact = height < 720;
  const scrollRef = useRef<ScrollView>(null);
  const lowRef = useRef<TextInput>(null);
  const highRef = useRef<TextInput>(null);
  const [category, setCategory] = useState<ProductCategory>('GRAINS');
  const [categoryUrduName, setCategoryUrduName] = useState('اناج');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryUrdu, setNewCategoryUrdu] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductRate | null>(null);
  const [newName, setNewName] = useState('');
  const [city, setCity] = useState('');
  const [lowRate, setLowRate] = useState('');
  const [highRate, setHighRate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const revealFormEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 180);
  };

  const categoryProducts = useMemo(
    () =>
      products
        .filter(product => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [category, products],
  );
  const categories = useMemo(
    () => [
      ...defaultCategories,
      ...products
        .map(product => product.category)
        .filter(item => !defaultCategories.includes(item)),
    ].filter((item, index, items) => items.indexOf(item) === index),
    [products],
  );

  const changeCategory = (next: ProductCategory) => {
    setCategory(next);
    setCategoryUrduName(
      categoryUrdu[next] ??
        products.find(product => product.category === next)?.categoryUrduName ??
        next,
    );
    setNewCategory('');
    setNewCategoryUrdu('');
    if (!selectedProduct) {
      setNewName('');
      setCity('');
      setLowRate('');
      setHighRate('');
    }
  };

  const useNewCategory = () => {
    const normalizedCategory = newCategory.trim().toUpperCase();
    const normalizedUrduCategory = newCategoryUrdu.trim();
    if (!normalizedCategory || !normalizedUrduCategory) {
      Alert.alert(
        'Category required',
        'Please enter the category in both English and Urdu.',
      );
      return;
    }
    setCategory(normalizedCategory);
    setCategoryUrduName(normalizedUrduCategory);
    setNewCategory('');
    setNewCategoryUrdu('');
  };

  const chooseProduct = (product: ProductRate) => {
    setSelectedProduct(product);
    setCategory(product.category);
    setCategoryUrduName(
      categoryUrdu[product.category] ?? product.categoryUrduName,
    );
    setNewName('');
    setCity(product.city);
    setLowRate(String(product.lowRate));
    setHighRate(String(product.highRate));
    setPickerVisible(false);
  };

  const save = async () => {
    const name = selectedProduct?.name ?? newName.trim();
    const low = Number(lowRate);
    const high = Number(highRate);
    if (!name || !city || !lowRate || !highRate) {
      Alert.alert('Missing details', 'Please enter all product details.');
      return;
    }
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      Alert.alert('Invalid rates', 'Low and high rates must be numbers.');
      return;
    }

    setSaving(true);
    try {
      await saveProductRate({
        id: selectedProduct?.id,
        category,
        categoryUrduName,
        name,
        city,
        lowRate: low,
        highRate: high,
      });
      Keyboard.dismiss();
      Alert.alert(
        selectedProduct ? 'Product updated' : 'Product added',
        'The dashboard has been updated.',
      );
      if (!selectedProduct) {
        setNewName('');
        setCity('');
        setLowRate('');
        setHighRate('');
      }
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Unable to save product.',
      );
    } finally {
      setSaving(false);
    }
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setNewName('');
    setCity('');
    setLowRate('');
    setHighRate('');
  };

  const confirmDeleteProduct = () => {
    if (!selectedProduct) {
      Alert.alert('Select product', 'Please select the product you want to delete.');
      return;
    }

    Alert.alert(
      'Delete product?',
      `${selectedProduct.name} for ${selectedProduct.city} will be permanently deleted.`,
      [
        {text: 'CANCEL', style: 'cancel'},
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProductRate(selectedProduct.id);
              resetProductForm();
              Alert.alert('Product deleted', 'The product rate has been removed.');
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Unable to delete product.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const confirmDeleteCategory = () => {
    if (defaultCategories.includes(category)) {
      Alert.alert(
        'Protected category',
        'Built-in categories cannot be deleted. Their individual products can still be removed.',
      );
      return;
    }

    Alert.alert(
      'Delete category?',
      `${category} / ${categoryUrduName} and every product inside it will be permanently deleted.`,
      [
        {text: 'CANCEL', style: 'cancel'},
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProductCategory(category);
              setCategory('GRAINS');
              setCategoryUrduName(categoryUrdu.GRAINS);
              resetProductForm();
              Alert.alert('Category deleted', 'The category and its products were removed.');
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Unable to delete category.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <AppScreen background={images.clean}>
      <ScreenHeader title="PRODUCT ADMIN" onBack={onBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.content, compact && styles.contentCompact]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={onSubscriptions}
          style={({pressed}) => [styles.subscriptionAdminButton, pressed && styles.pressed]}>
          <UserCheck color={colors.white} size={22} />
          <View style={styles.subscriptionAdminCopy}>
            <Text style={styles.subscriptionAdminTitle}>SUBSCRIPTION APPROVALS</Text>
            <Text style={styles.subscriptionAdminSubtitle}>Review and approve user requests</Text>
          </View>
          <Text style={styles.subscriptionAdminArrow}>›</Text>
        </Pressable>
        <View style={[styles.card, compact && styles.cardCompact]}>
          <View style={styles.titleRow}>
            <ShieldCheck color={colors.green700} size={26} />
            <Text style={styles.title}>UPDATE PRODUCT RATE</Text>
          </View>
          <Text style={styles.label}>CATEGORY / قسم</Text>
          <View style={[styles.categories, narrow && styles.categoriesNarrow]}>
            {categories.map(item => (
              <Pressable
                key={item}
                onPress={() => changeCategory(item)}
                style={[
                  styles.category,
                  narrow && styles.categoryNarrow,
                  category === item && styles.categorySelected,
                ]}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text>
                <Text style={[styles.categoryUrdu, category === item && styles.categoryTextSelected]}>
                  {categoryUrdu[item] ??
                    products.find(product => product.category === item)?.categoryUrduName ??
                    item}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>ADD OR CHANGE CATEGORY</Text>
          <View style={styles.newCategoryRow}>
            <View style={styles.newCategoryInputs}>
              <TextInput
                autoCapitalize="characters"
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Category in English"
                placeholderTextColor="rgba(21,85,45,0.46)"
                returnKeyType="next"
                style={[styles.input, styles.categoryInput]}
              />
              <TextInput
                value={newCategoryUrdu}
                onChangeText={setNewCategoryUrdu}
                onSubmitEditing={useNewCategory}
                placeholder="اردو میں قسم"
                placeholderTextColor="rgba(21,85,45,0.46)"
                returnKeyType="done"
                textAlign="right"
                style={[styles.input, styles.categoryInput, styles.urduCategoryInput]}
              />
            </View>
            <Pressable
              disabled={!newCategory.trim() || !newCategoryUrdu.trim()}
              onPress={useNewCategory}
              style={[
                styles.useCategoryButton,
                (!newCategory.trim() || !newCategoryUrdu.trim()) && styles.disabled,
              ]}>
              <Text style={styles.useCategoryText}>USE</Text>
            </Pressable>
          </View>
          <Text style={styles.activeCategory} numberOfLines={1}>
            ACTIVE CATEGORY: {category} / {categoryUrduName}
          </Text>
          <Text style={styles.label}>CITY / MARKET</Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setCityPickerVisible(true);
            }}
            style={[styles.inputLike, styles.cityPicker]}>
            <Text style={[styles.value, !city && styles.placeholder]} numberOfLines={1}>
              {city || 'Select city / market'}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          <Text style={styles.label}>EXISTING PRODUCT</Text>
          <Pressable
            disabled={!categoryProducts.length}
            onPress={() => setPickerVisible(true)}
            style={[styles.inputLike, !categoryProducts.length && styles.disabled]}>
            <Text style={[styles.value, !selectedProduct && styles.placeholder]} numberOfLines={1}>
              {selectedProduct?.name ??
                (categoryProducts.length ? 'Select a product' : 'No products in this category')}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <Text style={styles.label}>NEW PRODUCT</Text>
          <TextInput
            value={newName}
            onChangeText={value => {
              if (value && selectedProduct) {
                setSelectedProduct(null);
                setLowRate('');
                setHighRate('');
              }
              setNewName(value);
            }}
            placeholder="Enter a new product name"
            placeholderTextColor="rgba(21,85,45,0.46)"
            returnKeyType="next"
            blurOnSubmit={false}
            onFocus={() =>
              setTimeout(
                () => scrollRef.current?.scrollTo({y: 260, animated: true}),
                180,
              )
            }
            onSubmitEditing={() => lowRef.current?.focus()}
            style={styles.input}
          />
          <View style={[styles.rateRow, narrow && styles.rateRowNarrow]}>
            <View style={styles.rateField}>
              <Text style={styles.label}>LOW RATE</Text>
              <TextInput
                ref={lowRef}
                value={lowRate}
                onChangeText={value => setLowRate(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={revealFormEnd}
                onSubmitEditing={() => highRef.current?.focus()}
                placeholder="0"
                placeholderTextColor="rgba(21,85,45,0.46)"
                style={styles.input}
              />
            </View>
            <View style={styles.rateField}>
              <Text style={styles.label}>HIGH RATE</Text>
              <TextInput
                ref={highRef}
                value={highRate}
                onChangeText={value => setHighRate(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                onFocus={revealFormEnd}
                placeholder="0"
                placeholderTextColor="rgba(21,85,45,0.46)"
                style={styles.input}
              />
            </View>
          </View>
          <Pressable
            disabled={saving || deleting}
            onPress={save}
            style={[styles.saveButton, (saving || deleting) && styles.disabled]}>
            <Text style={styles.saveText}>
              {saving ? 'SAVING…' : selectedProduct ? 'UPDATE' : 'ADD PRODUCT'}
            </Text>
          </Pressable>
          <View style={styles.dangerActions}>
            <Pressable
              disabled={!selectedProduct || deleting}
              onPress={confirmDeleteProduct}
              style={[
                styles.deleteButton,
                (!selectedProduct || deleting) && styles.disabled,
              ]}>
              <Trash2 color={colors.danger} size={18} />
              <Text style={styles.deleteText}>DELETE PRODUCT</Text>
            </Pressable>
            <Pressable
              disabled={deleting}
              onPress={confirmDeleteCategory}
              style={[styles.deleteButton, deleting && styles.disabled]}>
              <Trash2 color={colors.danger} size={18} />
              <Text style={styles.deleteText}>DELETE CATEGORY</Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ProductModal
        products={categoryProducts}
        selectedId={selectedProduct?.id}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={chooseProduct}
      />
      <CityPickerModal
        selected={city}
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        onSelect={setCity}
      />
    </AppScreen>
  );
}

function ProductModal({products, selectedId, visible, onClose, onSelect}: {
  products: ProductRate[];
  selectedId?: string;
  visible: boolean;
  onClose: () => void;
  onSelect: (product: ProductRate) => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>SELECT PRODUCT</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {products.map(product => (
              <Pressable
                key={product.id}
                onPress={() => onSelect(product)}
                style={[styles.productOption, selectedId === product.id && styles.productSelected]}>
                <View style={styles.rateField}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCity}>{product.city}</Text>
                  <Text style={styles.productRates}>Low: {product.lowRate} · High: {product.highRate}</Text>
                </View>
                {selectedId === product.id && <Text style={styles.tick}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {flexGrow: 1, padding: 12, paddingBottom: 34},
  contentCompact: {paddingVertical: 8, paddingBottom: 24},
  subscriptionAdminButton: {
    width: '100%', maxWidth: 580, minHeight: 72, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.green800, elevation: 6,
  },
  subscriptionAdminCopy: {flex: 1, marginHorizontal: 12},
  subscriptionAdminTitle: {color: colors.white, fontSize: 14, fontWeight: '900'},
  subscriptionAdminSubtitle: {color: '#CDE9C8', fontSize: 11, fontWeight: '600', marginTop: 3},
  subscriptionAdminArrow: {color: colors.white, fontSize: 30},
  pressed: {opacity: 0.8},
  card: {
    width: '100%', maxWidth: 580, alignSelf: 'center', padding: 18, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#8FCB91', backgroundColor: 'rgba(255,255,255,0.84)', elevation: 7,
  },
  cardCompact: {padding: 14},
  titleRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, marginBottom: 20},
  title: {color: colors.green900, fontSize: 19, fontWeight: '900', textAlign: 'center'},
  label: {color: colors.green900, fontSize: 12, fontWeight: '900', marginLeft: 10, marginBottom: 6},
  categories: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18},
  categoriesNarrow: {flexWrap: 'wrap', gap: 8},
  category: {
    width: '23%', minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#8FCB91', backgroundColor: '#EFF8EC',
  },
  categoryNarrow: {width: '48%'},
  categorySelected: {backgroundColor: colors.green700},
  categoryText: {color: '#397548', fontSize: 9, fontWeight: '900'},
  categoryUrdu: {color: '#397548', fontSize: 13, lineHeight: 18, fontWeight: '700', writingDirection: 'rtl'},
  categoryTextSelected: {color: colors.white},
  newCategoryRow: {flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8},
  newCategoryInputs: {flex: 1, gap: 8},
  categoryInput: {flex: 1, width: undefined, marginBottom: 0},
  urduCategoryInput: {writingDirection: 'rtl'},
  useCategoryButton: {height: 50, minWidth: 70, borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.green800},
  useCategoryText: {color: colors.white, fontSize: 12, fontWeight: '900'},
  activeCategory: {color: colors.green700, fontSize: 11, fontWeight: '900', marginLeft: 10, marginBottom: 16},
  inputLike: {
    height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, borderWidth: 1.5, borderColor: colors.green500, backgroundColor: '#FFFFFF',
  },
  cityPicker: {marginBottom: 18},
  value: {flex: 1, color: colors.green900, fontSize: 16, fontWeight: '700'},
  placeholder: {color: 'rgba(21,85,45,0.48)'},
  chevron: {color: colors.green700, fontSize: 25, marginTop: -5},
  orRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14},
  orLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.green300},
  orText: {color: colors.muted, fontSize: 11, fontWeight: '900'},
  input: {
    width: '100%', height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: colors.green500,
    backgroundColor: '#FFFFFF', color: colors.green900, fontSize: 16, fontWeight: '700', paddingHorizontal: 18, marginBottom: 16,
  },
  rateRow: {flexDirection: 'row', gap: 12},
  rateRowNarrow: {flexDirection: 'column', gap: 0},
  rateField: {flex: 1},
  saveButton: {
    minWidth: 170, height: 50, borderRadius: 25, alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, borderWidth: 2, borderColor: '#82D276', backgroundColor: colors.green800, elevation: 7,
  },
  saveText: {color: colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 0.8},
  dangerActions: {flexDirection: 'row', gap: 9, marginTop: 16},
  deleteButton: {flex: 1, minHeight: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(167,53,45,0.45)', backgroundColor: 'rgba(255,245,244,0.94)'},
  deleteText: {color: colors.danger, fontSize: 10, fontWeight: '900', textAlign: 'center'},
  disabled: {opacity: 0.5},
  backdrop: {flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(8,43,19,0.46)'},
  modalCard: {width: '100%', maxWidth: 520, maxHeight: '72%', alignSelf: 'center', borderRadius: 26, padding: 18, backgroundColor: '#F3FBF0'},
  modalTitle: {color: colors.green900, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10},
  productOption: {
    minHeight: 62, borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 14,
    marginTop: 7, borderWidth: 1, borderColor: '#B8DDB6', backgroundColor: '#FFFFFF',
  },
  productSelected: {borderColor: '#3D914B', backgroundColor: '#DDF2D8'},
  productName: {color: colors.green900, fontSize: 16, fontWeight: '900'},
  productCity: {color: '#397548', fontSize: 11, fontWeight: '800', marginTop: 2},
  productRates: {color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3},
  tick: {color: colors.green700, fontSize: 20, fontWeight: '900'},
});
