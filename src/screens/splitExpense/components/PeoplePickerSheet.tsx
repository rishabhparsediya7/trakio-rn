import React, {useMemo} from 'react';
import {Modal, Pressable, StyleSheet, TouchableOpacity, View} from 'react-native';
import AppText from '@atoms/AppText';
import FriendSelector, {
  FriendItem,
} from '@organisms/friendSelector/FriendSelector';
import {darkTheme, lightTheme} from '../../../providers/Theme';
import {useTheme} from '../../../providers/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedFriends: FriendItem[];
  onToggleFriend: (friend: FriendItem) => void;
};

/** Bottom sheet that hosts the "add anyone" selector (friends / app users / invite). */
const PeoplePickerSheet = ({
  visible,
  onClose,
  selectedFriends,
  onToggleFriend,
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
          maxHeight: '85%',
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 16,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        done: {
          color: colors.primary,
          fontSize: 16,
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
          <View style={styles.headerRow}>
            <AppText weight="bold" variant="h6">
              Split with
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <AppText weight="semiBold" style={styles.done}>
                Done
              </AppText>
            </TouchableOpacity>
          </View>
          <FriendSelector
            selectedFriends={selectedFriends}
            onToggleFriend={onToggleFriend}
            showGlobalSearch
            placeholder="Search or invite by email…"
            showSelectedChips
            maxHeight={380}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PeoplePickerSheet;
