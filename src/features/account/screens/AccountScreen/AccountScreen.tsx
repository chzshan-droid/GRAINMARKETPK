import React, {useEffect, useState} from 'react';
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
import UserRound from 'lucide-react-native/icons/user-round';
import {
  saveRegisteredUser,
  subscribeToRegisteredUser,
  type RegisteredUser,
} from '../../../../services/firestore';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {CityPickerModal} from '../../../../shared/components/CityPickerModal';
import {ScreenHeader} from '../../../../shared/components/ScreenHeader';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';

type Props = {
  mobileNumber: string;
  onBack: () => void;
  onUpdated: (name: string, city: string) => Promise<void>;
};

export function AccountScreen({mobileNumber, onBack, onUpdated}: Props) {
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(
    () =>
      subscribeToRegisteredUser(
        `+92${mobileNumber}`,
        nextUser => {
          setUser(nextUser);
          setName(nextUser?.fullName ?? '');
          setCity(nextUser?.city ?? '');
          setLoading(false);
        },
        subscriptionError => {
          setError(subscriptionError.message);
          setLoading(false);
        },
      ),
    [mobileNumber],
  );

  const update = async () => {
    if (!user || !name.trim() || !city) {
      return;
    }
    setSaving(true);
    try {
      await saveRegisteredUser({...user, fullName: name.trim(), city});
      Keyboard.dismiss();
      await onUpdated(name.trim(), city);
      Alert.alert('Profile updated', 'Your account details have been saved.');
    } catch (saveError) {
      Alert.alert('Update failed', saveError instanceof Error ? saveError.message : 'Unable to update account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen background={images.clean}>
      <ScreenHeader title="MY ACCOUNT" onBack={onBack} />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.avatar}><UserRound color={colors.white} size={42} /></View>
          {loading ? (
            <Text style={styles.status}>Loading account details…</Text>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : user ? (
            <>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              <Text style={styles.label}>CITY</Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setPickerVisible(true);
                }}
                style={styles.picker}>
                <Text style={styles.value}>{city}</Text>
                <Text style={styles.chevron}>⌄</Text>
              </Pressable>
              <View style={styles.mobileLabelRow}>
                <Text style={styles.label}>MOBILE NUMBER</Text>
                <Text style={styles.badge}>READ ONLY</Text>
              </View>
              <View style={styles.readOnly}>
                <Text style={styles.value}>{user.phoneNumber}</Text>
              </View>
              <Text style={styles.notice}>Your mobile number cannot be changed.</Text>
              <Pressable
                disabled={!name.trim() || !city || saving}
                onPress={update}
                style={[styles.button, (!name.trim() || !city || saving) && styles.disabled]}>
                <Text style={styles.buttonText}>{saving ? 'UPDATING…' : 'UPDATE PROFILE'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.status}>No account data was found for +92 {mobileNumber}.</Text>
          )}
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
  content: {flexGrow: 1, padding: 18, paddingBottom: 30},
  card: {
    width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, borderRadius: 26,
    borderWidth: 1.5, borderColor: '#8FCB91', backgroundColor: 'rgba(255,255,255,0.86)', elevation: 8,
  },
  avatar: {width: 84, height: 84, borderRadius: 42, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 3, borderColor: '#82D276', backgroundColor: colors.green700},
  label: {color: colors.green900, fontSize: 12, fontWeight: '900', marginLeft: 10, marginBottom: 7},
  input: {
    height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: colors.green500, backgroundColor: colors.white,
    color: colors.green900, fontSize: 17, fontWeight: '700', paddingHorizontal: 19, marginBottom: 18,
  },
  picker: {
    minHeight: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 19, marginBottom: 18, borderWidth: 1.5, borderColor: colors.green500, backgroundColor: colors.white,
  },
  readOnly: {minHeight: 56, borderRadius: 28, justifyContent: 'center', paddingHorizontal: 19, marginBottom: 18, borderWidth: 1.5, borderColor: colors.green300, backgroundColor: '#F7FCF5'},
  value: {color: colors.green900, fontSize: 17, fontWeight: '700'},
  chevron: {color: colors.green700, fontSize: 25, marginTop: -5},
  mobileLabelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  badge: {color: '#397548', fontSize: 9, fontWeight: '900', marginRight: 10, marginBottom: 7, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: '#DDF2D8'},
  notice: {color: colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -7},
  button: {minWidth: 184, height: 50, borderRadius: 25, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 24, backgroundColor: colors.green800, borderWidth: 2, borderColor: '#82D276', elevation: 7},
  buttonText: {color: colors.white, fontSize: 14, fontWeight: '900'},
  disabled: {opacity: 0.5},
  status: {color: '#397548', fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center', paddingVertical: 24},
  error: {color: '#B3261E', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center', paddingVertical: 24},
});
