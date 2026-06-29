import React, {useMemo} from 'react';
import {Modal, Pressable, StyleSheet, TouchableOpacity, View} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '@atoms/AppText';
import {darkTheme, lightTheme} from '../../../providers/Theme';
import {useTheme} from '../../../providers/ThemeContext';

export type Payer = {id: string; name: string};

type Props = {
  visible: boolean;
  onClose: () => void;
  participants: Payer[];
  paidById: string;
  onSelect: (id: string) => void;
};

/** Bottom sheet to pick who paid (any participant). */
const PaidBySheet = ({
  visible,
  onClose,
  participants,
  paidById,
  onSelect,
}: Props) => {
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          maxHeight: '70%',
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 16,
        },
        title: {
          marginBottom: 12,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          gap: 12,
        },
        name: {
          flex: 1,
          color: colors.text,
        },
        divider: {
          height: 1,
          backgroundColor: colors.borderLight,
        },
      }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <AppText weight="bold" variant="h6" style={styles.title}>
            Who paid?
          </AppText>
          {participants.map((p, i) => {
            const selected = p.id === paidById;
            return (
              <View key={p.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onSelect(p.id);
                    onClose();
                  }}>
                  <MaterialIcon
                    name="account-circle"
                    size={36}
                    color={colors.mutedText}
                  />
                  <AppText weight="medium" style={styles.name}>
                    {p.name}
                  </AppText>
                  <MaterialIcon
                    name={
                      selected
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    size={22}
                    color={selected ? colors.primary : colors.mutedText}
                  />
                </TouchableOpacity>
                {i < participants.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PaidBySheet;
