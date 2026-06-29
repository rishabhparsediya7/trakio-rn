import React, {useMemo} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '@atoms/AppText';
import RupeeIcon from '@atoms/rupeeIcon';
import {darkTheme, lightTheme} from '../../../providers/Theme';
import {useTheme} from '../../../providers/ThemeContext';

export type SplitMode = 'equally' | 'unequally';

export type SplitFriend = {
  id: string;
  firstName: string;
  lastName: string;
  amountOwed: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  total: number;
  youShare: number;
  friends: SplitFriend[];
  onUpdateFriendAmount: (id: string, value: string) => void;
};

/** Bottom sheet to choose how the bill is split (equally / unequally). */
const SplitMethodSheet = ({
  visible,
  onClose,
  mode,
  onModeChange,
  total,
  youShare,
  friends,
  onUpdateFriendAmount,
}: Props) => {
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const assigned =
    friends.reduce((sum, f) => sum + (f.amountOwed || 0), 0) + youShare;
  const remainder = Math.round((total - assigned) * 100) / 100;

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
          maxHeight: '80%',
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 16,
        },
        title: {marginBottom: 12},
        tabs: {
          flexDirection: 'row',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        },
        tab: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 9,
          alignItems: 'center',
        },
        tabActive: {backgroundColor: colors.primary},
        tabText: {color: colors.text},
        tabTextActive: {color: '#fff', fontWeight: '700'},
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          gap: 12,
        },
        name: {flex: 1, color: colors.text},
        amountInput: {
          backgroundColor: colors.inputBackground,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          width: 90,
          textAlign: 'right',
          color: colors.text,
          fontSize: 15,
        },
        remainderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        done: {
          marginTop: 20,
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
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
            How to split?
          </AppText>

          <View style={styles.tabs}>
            {(['equally', 'unequally'] as SplitMode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => onModeChange(m)}>
                <AppText
                  style={mode === m ? styles.tabTextActive : styles.tabText}>
                  {m === 'equally' ? 'Equally' : 'Unequally'}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* You */}
          <View style={styles.row}>
            <MaterialIcon
              name="account-circle"
              size={32}
              color={colors.mutedText}
            />
            <AppText weight="medium" style={styles.name}>
              You{mode === 'unequally' ? ' (remainder)' : ''}
            </AppText>
            <RupeeIcon amount={youShare} size={15} color={colors.primary} />
          </View>

          {friends.map(f => (
            <View key={f.id} style={styles.row}>
              <MaterialIcon
                name="account-circle"
                size={32}
                color={colors.mutedText}
              />
              <AppText weight="medium" style={styles.name}>
                {f.firstName} {f.lastName}
              </AppText>
              {mode === 'unequally' ? (
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                  value={f.amountOwed ? String(f.amountOwed) : ''}
                  onChangeText={val => onUpdateFriendAmount(f.id, val)}
                />
              ) : (
                <RupeeIcon
                  amount={f.amountOwed}
                  size={15}
                  color={colors.primary}
                />
              )}
            </View>
          ))}

          {mode === 'unequally' && (
            <View style={styles.remainderRow}>
              <AppText
                style={{
                  color: remainder === 0 ? colors.positive : colors.negative,
                }}>
                {remainder === 0
                  ? 'All set'
                  : remainder > 0
                  ? `₹${remainder.toFixed(2)} left to assign`
                  : `₹${Math.abs(remainder).toFixed(2)} over`}
              </AppText>
              <AppText style={{color: colors.mutedText}}>
                of ₹{total.toFixed(2)}
              </AppText>
            </View>
          )}

          <TouchableOpacity style={styles.done} onPress={onClose}>
            <AppText weight="bold" style={{color: '#fff'}}>
              Done
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default SplitMethodSheet;
