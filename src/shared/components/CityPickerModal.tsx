import React, {useMemo, useState} from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {cityOptions} from '../constants/cities';
import {colors} from '../theme/colors';

export function CityPickerModal({visible, selected, onClose, onSelect}: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (city: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filteredCities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return cityOptions;
    }
    return cityOptions.filter(
      option =>
        option.english.toLocaleLowerCase().includes(normalizedQuery) ||
        option.urdu.includes(query.trim()),
    );
  }, [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>SELECT CITY / شہر منتخب کریں</Text>
          <TextInput
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
            placeholder="Search city / شہر تلاش کریں"
            placeholderTextColor="rgba(21,85,45,0.48)"
            selectionColor={colors.green700}
            style={styles.search}
          />
          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.options}>
            {filteredCities.map(option => {
              const isSelected =
                selected === option.value || selected === option.english;
              return (
                <Pressable
                  key={option.english}
                  onPress={() => {
                    onSelect(option.value);
                    close();
                  }}
                  style={[styles.option, isSelected && styles.selected]}>
                  <View style={styles.cityNames}>
                    <Text style={styles.optionText}>{option.english}</Text>
                    <Text style={styles.optionUrdu}>{option.urdu}</Text>
                  </View>
                  {isSelected && <Text style={styles.tick}>✓</Text>}
                </Pressable>
              );
            })}
            {!filteredCities.length && (
              <Text style={styles.empty}>No matching city found / کوئی شہر نہیں ملا</Text>
            )}
          </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardArea: {flex: 1},
  backdrop: {flex: 1, justifyContent: 'center', paddingHorizontal: 28, backgroundColor: 'rgba(8,43,19,0.42)'},
  card: {width: '100%', maxWidth: 480, maxHeight: '82%', alignSelf: 'center', borderRadius: 26, padding: 20, backgroundColor: '#F3FBF0'},
  title: {color: colors.green900, fontSize: 19, fontWeight: '900', textAlign: 'center', marginBottom: 12},
  search: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.green500,
    backgroundColor: '#FFFFFF',
    color: colors.green900,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  options: {paddingBottom: 10},
  option: {
    minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, marginTop: 7, borderWidth: 1, borderColor: '#B8DDB6', backgroundColor: '#FFFFFF',
  },
  selected: {borderColor: '#3D914B', backgroundColor: '#DDF2D8'},
  optionText: {color: colors.green900, fontSize: 16, fontWeight: '900'},
  cityNames: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10},
  optionUrdu: {
    color: '#397548',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  tick: {color: colors.green700, fontSize: 20, fontWeight: '900'},
  empty: {color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center', paddingVertical: 28},
});
