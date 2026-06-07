import React, {useMemo} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppText from '@atoms/AppText';
import {useAuthorizeNavigation} from '../../navigators/navigators';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * The unified "⊕" action sheet (Roadmap §5). One gesture where the two
 * products meet: split, personal expense, or a new group.
 */
const AddActionSheet = ({visible, onClose}: Props) => {
  const navigation = useAuthorizeNavigation();
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const go = (
    action: () => void,
  ) => {
    onClose();
    // Defer navigation until the modal has dismissed to avoid a transition clash.
    requestAnimationFrame(action);
  };

  const actions = [
    {
      label: 'Split with friends',
      description: 'Share a bill and track who owes what',
      icon: 'git-compare-outline',
      tint: colors.primary,
      onPress: () => go(() => navigation.navigate('CreateSplitExpense')),
    },
    {
      label: 'Add personal expense',
      description: 'Log spending just for you',
      icon: 'wallet-outline',
      tint: colors.positive,
      onPress: () => go(() => navigation.navigate('QuickAddExpense')),
    },
    {
      label: 'New group',
      description: 'Start a shared group for a trip or home',
      icon: 'people-outline',
      tint: colors.accent,
      onPress: () => go(() => navigation.navigate('CreateGroup')),
    },
  ];

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
          paddingBottom: 32,
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
          fontSize: 18,
          color: colors.text,
          marginBottom: 16,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          gap: 14,
        },
        iconCircle: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rowText: {
          flex: 1,
        },
        rowLabel: {
          fontSize: 16,
          color: colors.text,
        },
        rowDescription: {
          fontSize: 13,
          color: colors.mutedText,
          marginTop: 2,
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
        <Pressable
          style={styles.sheet}
          onPress={e => e.stopPropagation()}
          android_disableSound>
          <View style={styles.handle} />
          <AppText weight="bold" style={styles.title}>
            Add
          </AppText>
          {actions.map((action, index) => (
            <View key={action.label}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={action.onPress}>
                <View
                  style={[
                    styles.iconCircle,
                    {backgroundColor: action.tint + '20'},
                  ]}>
                  <Ionicons name={action.icon} size={22} color={action.tint} />
                </View>
                <View style={styles.rowText}>
                  <AppText weight="semiBold" style={styles.rowLabel}>
                    {action.label}
                  </AppText>
                  <AppText style={styles.rowDescription}>
                    {action.description}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.mutedText}
                />
              </TouchableOpacity>
              {index < actions.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AddActionSheet;
