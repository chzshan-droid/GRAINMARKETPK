import React, {useState} from 'react';
import {Alert, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import {AppScreen} from '../../../../shared/components/AppScreen';
import {Brand} from '../../../../shared/components/Brand';
import {images} from '../../../../shared/assets/images';
import {colors} from '../../../../shared/theme/colors';

export type Language = 'urdu' | 'english';

type Props = {
  initialLanguage: Language | null;
  onContinue: (language: Language) => void;
};

export function LanguageScreen({initialLanguage, onContinue}: Props) {
  const [selected, setSelected] = useState<Language | null>(initialLanguage);

  return (
    <AppScreen background={images.clean}>
      <View style={styles.content}>
        <Brand />
        <View style={styles.selection}>
          <Text style={styles.heading}>LANGUAGE SELECTION</Text>
          <Text style={styles.urduHeading}>زبان کا انتخاب</Text>
          <View style={styles.options}>
            <LanguageButton
              label="English"
              selected={selected === 'english'}
              dimmed={selected === 'urdu'}
              onPress={() => setSelected('english')}
            />
            <LanguageButton
              label="اردو"
              urdu
              selected={selected === 'urdu'}
              dimmed={selected === 'english'}
              onPress={() => setSelected('urdu')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={() => {
              if (!selected) {
                Alert.alert('Select language', 'Please select the language.');
                return;
              }
              onContinue(selected);
            }}
            style={({pressed}) => [styles.arrow, pressed && styles.pressed]}>
            <ArrowRight color={colors.white} size={34} strokeWidth={2.8} />
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

function LanguageButton({
  label,
  selected,
  dimmed,
  urdu,
  onPress,
}: {
  label: string;
  selected: boolean;
  dimmed: boolean;
  urdu?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.option,
        selected && styles.optionSelected,
        dimmed && styles.optionDimmed,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.optionText, urdu && styles.optionTextUrdu]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {flex: 1, paddingHorizontal: 22, paddingTop: 30},
  selection: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  heading: {
    color: colors.green900,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  urduHeading: {
    color: '#397548',
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '600',
    marginTop: 5,
  },
  options: {width: '100%', maxWidth: 520, gap: 14, marginTop: 30},
  option: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8EE57F',
    backgroundColor: 'rgba(8,82,34,0.9)',
    elevation: 7,
  },
  optionSelected: {backgroundColor: '#38A947', borderColor: '#DCFFD5'},
  optionDimmed: {opacity: 0.48},
  optionText: {color: colors.white, fontSize: 22, fontWeight: '900'},
  optionTextUrdu: {fontSize: 28},
  arrow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    borderWidth: 2,
    borderColor: '#82D276',
    backgroundColor: colors.green800,
    elevation: 8,
  },
  pressed: {opacity: 0.8, transform: [{scale: 0.98}]},
});
