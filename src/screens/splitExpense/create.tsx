import AppText from '@atoms/AppText';
import Button from '@atoms/Button';
import RupeeIcon from '@atoms/rupeeIcon';
import {FriendItem} from '@organisms/friendSelector/FriendSelector';
import Header from '@organisms/Header';
import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../providers/AuthProvider';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';
import splitExpenseApi from '../../services/splitExpenseApi';
import {formatDate} from '../../utils/formatDate';
import {commonStyles} from '../../utils/styles';
import PaidBySheet from './components/PaidBySheet';
import PeoplePickerSheet from './components/PeoplePickerSheet';
import SplitMethodSheet, {SplitMode} from './components/SplitMethodSheet';

interface SelectedFriend extends FriendItem {
  amountOwed: number;
}

const CreateSplitExpense = () => {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();
  const {user: authUser} = useAuth();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('equally');
  const [paidById, setPaidById] = useState(authUser.userId);
  const [inputWidth, setInputWidth] = useState(30);

  const [selectedFriends, setSelectedFriends] = useState<SelectedFriend[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [peopleSheet, setPeopleSheet] = useState(false);
  const [paidBySheet, setPaidBySheet] = useState(false);
  const [splitSheet, setSplitSheet] = useState(false);

  const total = parseFloat(totalAmount) || 0;
  const friendsSum = selectedFriends.reduce(
    (sum, f) => sum + (f.amountOwed || 0),
    0,
  );
  const youShare = Math.round((total - friendsSum) * 100) / 100;

  const payerName =
    paidById === authUser.userId
      ? 'You'
      : selectedFriends.find(f => f.id === paidById)?.firstName || 'You';

  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += '.' + parts[1].slice(0, 2);
    }
    const baseWidth = 30;
    const maxWidth = 100;
    const calculatedWidth = baseWidth + sanitized.length * 3;
    setInputWidth(Math.min(calculatedWidth, maxWidth));
    setTotalAmount(sanitized);
  };

  // Recompute equal shares when amount / people / mode change.
  useEffect(() => {
    if (splitMode === 'equally' && selectedFriends.length > 0 && totalAmount) {
      const perPerson = parseFloat(totalAmount) / (selectedFriends.length + 1);
      setSelectedFriends(prev =>
        prev.map(f => ({...f, amountOwed: Math.round(perPerson * 100) / 100})),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, splitMode, selectedFriends.length]);

  // If the chosen payer leaves the split, fall back to You.
  useEffect(() => {
    if (
      paidById !== authUser.userId &&
      !selectedFriends.some(f => f.id === paidById)
    ) {
      setPaidById(authUser.userId);
    }
  }, [selectedFriends, paidById, authUser.userId]);

  const onDateConfirm = (date: Date) => {
    setExpenseDate(date);
    setDatePickerVisibility(false);
  };

  const handleToggleFriend = (friend: FriendItem) => {
    const exists = selectedFriends.find(f => f.id === friend.id);
    if (exists) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      const amount =
        splitMode === 'equally' && totalAmount
          ? parseFloat(totalAmount) / (selectedFriends.length + 2)
          : 0;
      setSelectedFriends([
        ...selectedFriends,
        {...friend, amountOwed: Math.round(amount * 100) / 100},
      ]);
    }
  };

  const updateIndividualAmount = (friendId: string, amount: string) => {
    setSelectedFriends(
      selectedFriends.map(f =>
        f.id === friendId ? {...f, amountOwed: parseFloat(amount) || 0} : f,
      ),
    );
  };

  const handleCreateSplitExpense = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (total <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please add at least one person to split with');
      return;
    }

    setSubmitting(true);
    try {
      const participants = [
        {userId: authUser.userId, amountOwed: youShare},
        ...selectedFriends.map(f => ({
          userId: f.id,
          amountOwed: f.amountOwed,
        })),
      ];

      const response = await splitExpenseApi.create({
        description,
        totalAmount: total,
        participants,
        expenseDate: expenseDate.toISOString(),
        paidBy: paidById,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Split created!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert('Error', 'Failed to create split');
      }
    } catch (error) {
      console.error('Error creating split expense:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const payerOptions = useMemo(
    () => [
      {id: authUser.userId, name: 'You'},
      ...selectedFriends.map(f => ({
        id: f.id,
        name: `${f.firstName} ${f.lastName}`.trim(),
      })),
    ],
    [authUser.userId, selectedFriends],
  );

  const isDisabled =
    submitting || selectedFriends.length === 0 || total <= 0 || !description.trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {flex: 1, backgroundColor: colors.background},
        scrollContent: {paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40},
        label: {marginBottom: 10, color: colors.mutedText},
        chipsRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.primary + '18',
        },
        chipYou: {backgroundColor: colors.inputBackground},
        chipText: {color: colors.text, fontSize: 14},
        addChip: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
        },
        amountRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 28,
          marginBottom: 8,
        },
        rupee: {fontSize: 36, ...commonStyles.textDefault, color: colors.text},
        amountInput: {
          color: colors.text,
          fontSize: 40,
          fontWeight: '700',
          textAlign: 'center',
          padding: 0,
        },
        descriptionInput: {
          color: colors.text,
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 8,
          paddingVertical: 8,
        },
        summaryLine: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 20,
          flexWrap: 'wrap',
        },
        summarySegment: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: colors.inputBackground,
        },
        summaryText: {color: colors.text, fontSize: 15},
        summaryStrong: {color: colors.primary, fontWeight: '700'},
        preview: {
          marginTop: 16,
          backgroundColor: colors.cardBackground,
          borderRadius: 14,
          padding: 14,
          gap: 10,
        },
        previewRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        previewName: {color: colors.text},
        dateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 20,
          paddingVertical: 12,
        },
        dateText: {color: colors.text, fontSize: 14},
        submitButton: {marginTop: 28},
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Header title="New Split" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* With — people first */}
          <AppText variant="caption" weight="semiBold" style={styles.label}>
            WITH
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            <View style={[styles.chip, styles.chipYou]}>
              <MaterialIcon name="account" size={16} color={colors.text} />
              <Text style={styles.chipText}>You</Text>
            </View>
            {selectedFriends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={styles.chip}
                onPress={() => handleToggleFriend(friend)}>
                <Text style={styles.chipText}>{friend.firstName}</Text>
                {friend.isPlaceholder && (
                  <MaterialIcon
                    name="email-outline"
                    size={12}
                    color={colors.primary}
                  />
                )}
                <MaterialIcon name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => setPeopleSheet(true)}>
              <MaterialIcon name="plus" size={22} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>

          {/* Hero amount */}
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>
              <Icon name="rupee" size={34} color={colors.text} />
            </Text>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.mutedText}
              value={totalAmount}
              keyboardType="numeric"
              onChangeText={handleAmountChange}
              style={[styles.amountInput, {minWidth: 60, width: `${inputWidth}%`}]}
            />
          </View>

          {/* Description */}
          <TextInput
            placeholder="What was it for?"
            placeholderTextColor={colors.mutedText}
            value={description}
            onChangeText={setDescription}
            style={styles.descriptionInput}
          />

          {/* Natural-language summary line */}
          <View style={styles.summaryLine}>
            <TouchableOpacity
              style={styles.summarySegment}
              onPress={() => setPaidBySheet(true)}>
              <Text style={styles.summaryText}>
                Paid by <Text style={styles.summaryStrong}>{payerName}</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.summarySegment}
              onPress={() => setSplitSheet(true)}>
              <Text style={styles.summaryText}>
                split{' '}
                <Text style={styles.summaryStrong}>
                  {splitMode === 'equally' ? 'equally' : 'unequally'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live split preview */}
          {selectedFriends.length > 0 && total > 0 && (
            <View style={styles.preview}>
              <View style={styles.previewRow}>
                <AppText style={styles.previewName}>You</AppText>
                <RupeeIcon amount={youShare} size={14} color={colors.text} />
              </View>
              {selectedFriends.map(f => (
                <View key={f.id} style={styles.previewRow}>
                  <AppText style={styles.previewName}>
                    {f.firstName} {f.lastName}
                  </AppText>
                  <RupeeIcon
                    amount={f.amountOwed}
                    size={14}
                    color={colors.text}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Date */}
          <TouchableOpacity
            onPress={() => setDatePickerVisibility(true)}
            style={styles.dateRow}>
            <MaterialIcon name="calendar" size={20} color={colors.mutedText} />
            <Text style={styles.dateText}>
              {formatDate(expenseDate.toString())}
            </Text>
          </TouchableOpacity>

          <Button
            title="Create split"
            onPress={handleCreateSplitExpense}
            loading={submitting}
            disabled={isDisabled}
            style={styles.submitButton}
          />
        </ScrollView>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={onDateConfirm}
          onCancel={() => setDatePickerVisibility(false)}
          locale="en-IN"
        />
      </KeyboardAvoidingView>

      <PeoplePickerSheet
        visible={peopleSheet}
        onClose={() => setPeopleSheet(false)}
        selectedFriends={selectedFriends}
        onToggleFriend={handleToggleFriend}
      />
      <PaidBySheet
        visible={paidBySheet}
        onClose={() => setPaidBySheet(false)}
        participants={payerOptions}
        paidById={paidById}
        onSelect={setPaidById}
      />
      <SplitMethodSheet
        visible={splitSheet}
        onClose={() => setSplitSheet(false)}
        mode={splitMode}
        onModeChange={setSplitMode}
        total={total}
        youShare={youShare}
        friends={selectedFriends}
        onUpdateFriendAmount={updateIndividualAmount}
      />
    </View>
  );
};

export default CreateSplitExpense;
