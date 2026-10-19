import React, {useState} from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import {saveRegisteredUser} from '../../../../services/firestore';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {CityPickerModal} from '../../../../shared/components/CityPickerModal';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';
import type {Language} from '../../../language/screens/LanguageScreen/LanguageScreen';

type Props = {
  phoneNumber: string;
  language: Language;
  initialName: string;
  initialCity: string;
  onBack: () => void;
  onComplete: (name: string, city: string) => Promise<void>;
};

export function RegisterScreen({
  phoneNumber,
  language,
  initialName,
  initialCity,
  onBack,
  onComplete,
}: Props) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !city) {
      return;
    }
    setSaving(true);
    try {
      await saveRegisteredUser({
        phoneNumber: `+92${phoneNumber}`,
        fullName: name.trim(),
        city,
        language,
        hasProfileImage: false,
      });
    } catch (error) {
      console.error('Unable to save the registered user profile.', error);
      Alert.alert(
        'Profile not saved',
        error instanceof Error ? error.message : 'Unable to save profile.',
      );
      setSaving(false);
      return;
    }

    Keyboard.dismiss();
    try {
      await onComplete(name.trim(), city);
    } catch (error) {
      console.error('Profile saved, but the session could not be started.', error);
      Alert.alert(
        'Profile saved',
        'Your profile was saved successfully. Please continue to the dashboard.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen background={images.register}>
      <ScreenHeader title="PROFILE INFO" onBack={onBack} />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.urduTitle}>اپنی پروفائل مکمل کریں</Text>
          <Text style={styles.label}>NAME / نام</Text>
          <TextInput
            accessibilityLabel="Enter your name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="rgba(21,85,45,0.46)"
            selectionColor={colors.green700}
            returnKeyType="done"
            style={styles.input}
          />
          <Text style={styles.label}>CITY / شہر</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Keyboard.dismiss();
              setPickerVisible(true);
            }}
            style={styles.picker}>
            <Text style={[styles.pickerText, !city && styles.placeholder]}>
              {city || 'Select your city'}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!name.trim() || !city || saving}
            onPress={save}
            style={({pressed}) => [
              styles.arrow,
              (!name.trim() || !city || saving) && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <ArrowRight color={colors.white} size={32} strokeWidth={2.8} />
          </Pressable>
        </View>
      </ScrollView>
      <CityPickerModal
        selected={city}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setCity}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, justifyContent: 'flex-start', padding: 18},
  card: {
    width: '100%', maxWidth: 560, alignSelf: 'center', padding: 22, borderRadius: 26,
    borderWidth: 1.5, borderColor: '#8FCB91', backgroundColor: 'rgba(255,255,255,0.84)', elevation: 7,
  },
  urduTitle: {color: '#397548', fontSize: 18, textAlign: 'center', marginBottom: 22},
  label: {color: colors.green900, fontSize: 12, fontWeight: '900', marginLeft: 10, marginBottom: 7},
  input: {
    height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: colors.green500,
    backgroundColor: '#FFFFFF', color: colors.green900, fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 20,
  },
  picker: {
    height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: colors.green500,
    backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  pickerText: {color: colors.green900, fontSize: 17, fontWeight: '700'},
  placeholder: {color: 'rgba(21,85,45,0.46)'},
  chevron: {color: colors.green700, fontSize: 25, marginTop: -5},
  arrow: {
    width: 58, height: 58, borderRadius: 29, alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    marginTop: 26, borderWidth: 2, borderColor: '#82D276', backgroundColor: colors.green800, elevation: 8,
  },
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.8},
});
