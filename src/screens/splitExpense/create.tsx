import AppText from '@atoms/AppText';
import Button from '@atoms/Button';
import RupeeIcon from '@atoms/rupeeIcon';
import AppInput from '@molecules/AppInput';
import FriendSelector, {
  FriendItem,
} from '@organisms/friendSelector/FriendSelector';
import Header from '@organisms/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../providers/AuthProvider';
import { darkTheme, lightTheme } from '../../providers/Theme';
import { useTheme } from '../../providers/ThemeContext';
import splitExpenseApi from '../../services/splitExpenseApi';
import { formatDate } from '../../utils/formatDate';
import { commonStyles } from '../../utils/styles';

interface SelectedFriend extends FriendItem {
  amountOwed: number;
}

const CreateSplitExpense = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {theme} = useTheme();
  const {user: authUser} = useAuth();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [splitEqually, setSplitEqually] = useState(true);
  const [paidByMe, setPaidByMe] = useState(true);
  const [inputWidth, setInputWidth] = useState(30);

  const [selectedFriends, setSelectedFriends] = useState<SelectedFriend[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (splitEqually && selectedFriends.length > 0 && totalAmount) {
      const amountValue = parseFloat(totalAmount);
      const perPerson = amountValue / (selectedFriends.length + 1);
      setSelectedFriends(
        selectedFriends.map(f => ({
          ...f,
          amountOwed: Math.round(perPerson * 100) / 100,
        })),
      );
    }
  }, [totalAmount, splitEqually, selectedFriends.length]);

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
        splitEqually && totalAmount
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
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to split with');
      return;
    }

    setSubmitting(true);
    try {
      const payerId = paidByMe ? authUser.userId : selectedFriends[0].id;
      const participants = [
        ...selectedFriends.map(f => ({
          userId: f.id,
          amountOwed: f.amountOwed,
        })),
        ...(paidByMe
          ? []
          : [
              {
                userId: authUser.userId,
                amountOwed:
                  parseFloat(totalAmount) -
                  selectedFriends.reduce((sum, f) => sum + f.amountOwed, 0),
              },
            ]),
      ];

      if (paidByMe) {
        participants.push({
          userId: authUser.userId,
          amountOwed:
            parseFloat(totalAmount) -
            selectedFriends.reduce((sum, f) => sum + f.amountOwed, 0),
        });
      }

      const response = await splitExpenseApi.create({
        description,
        totalAmount: parseFloat(totalAmount),
        participants,
        expenseDate: expenseDate.toISOString(),
        paidBy: payerId,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Split expense created!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert('Error', 'Failed to create split expense');
      }
    } catch (error) {
      console.error('Error creating split expense:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        },
        sectionTitle: {
          marginBottom: 12,
          marginTop: 24,
        },
        amountRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          marginBottom: 8,
          width: '100%',
        },
        amountInput: {
          padding: 16,
          borderRadius: 12,
          color: colors.inputText,
          fontSize: 32,
          fontWeight: '600',
        },
        rupee: {
          fontSize: 32,
          ...commonStyles.textDefault,
          color: colors.buttonText,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        dateBox: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          padding: 16,
          borderRadius: 12,
        },
        dateText: {
          marginLeft: 8,
          fontSize: 14,
          color: colors.buttonText,
        },
        toggleContainer: {
          flexDirection: 'row',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 4,
        },
        toggleButton: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: 'center',
        },
        friendsContainer: {
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          overflow: 'hidden',
        },
        selectedFriend: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        friendInfo: {
          flex: 1,
          marginLeft: 12,
        },
        friendAmountInput: {
          backgroundColor: colors.background,
          borderRadius: 8,
          padding: 8,
          width: 80,
          textAlign: 'center',
          color: colors.text,
          fontSize: 14,
        },
        removeButton: {
          padding: 8,
        },
        submitButton: {
          marginTop: 32,
        },
      }),
    [colors, theme],
  );

  const isDisabled = useMemo(() => {
    return (
      submitting ||
      selectedFriends.length === 0 ||
      !totalAmount ||
      parseFloat(totalAmount) <= 0 ||
      !description.trim()
    );
  }, [submitting, selectedFriends.length, totalAmount, description]);

  return (
    <View style={styles.container}>
      <Header
        title="Create Split"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <AppText variant="h6" weight="medium" style={styles.sectionTitle}>
            Total Amount
          </AppText>
          <View style={styles.amountRow}>
            <View style={styles.amountRow}>
              <Text style={styles.rupee}>
                <Icon name="rupee" size={32} color={colors.buttonText} />
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={colors.inputText + '80'}
                value={totalAmount}
                keyboardType="numeric"
                onChangeText={handleAmountChange}
                style={[styles.amountInput, {width: `${inputWidth}%`}]}
              />
            </View>
          </View>

          <AppInput
            containerStyle={{marginTop: 24}}
            label="Expense Title"
            placeholder="What did you spend on?"
            value={description}
            onChangeText={setDescription}
            labelProps={{
              variant: 'h6',
              weight: 'medium',
            }}
          />

          <AppText variant="h6" weight="medium" style={styles.sectionTitle}>
            Date
          </AppText>
          <TouchableOpacity
            onPress={() => setDatePickerVisibility(true)}
            style={styles.dateBox}>
            <MaterialIcon name="calendar" size={24} color={colors.buttonText} />
            <AppText variant="md" style={styles.dateText}>
              {formatDate(expenseDate.toString())}
            </AppText>
          </TouchableOpacity>

          <AppText variant="h6" weight="medium" style={styles.sectionTitle}>
            Paid by
          </AppText>
          <View style={styles.toggleContainer}>
            <Button
              variant={paidByMe ? 'primary' : 'ghost'}
              title="You"
              onPress={() => setPaidByMe(true)}
              style={styles.toggleButton}
              textStyle={{fontSize: 14}}
            />
            <Button
              variant={!paidByMe ? 'primary' : 'ghost'}
              title="Someone else"
              onPress={() => setPaidByMe(false)}
              style={styles.toggleButton}
              textStyle={{fontSize: 14}}
            />
          </View>

          <AppText variant="h6" weight="medium" style={styles.sectionTitle}>
            Split type
          </AppText>
          <View style={styles.toggleContainer}>
            <Button
              variant={splitEqually ? 'primary' : 'ghost'}
              title="Equal"
              onPress={() => setSplitEqually(true)}
              style={styles.toggleButton}
              textStyle={{fontSize: 14}}
            />
            <Button
              variant={!splitEqually ? 'primary' : 'ghost'}
              title="Custom"
              onPress={() => setSplitEqually(false)}
              style={styles.toggleButton}
              textStyle={{fontSize: 14}}
            />
          </View>

          <AppText variant="h6" weight="medium" style={styles.sectionTitle}>
            Split with
          </AppText>
          <View style={styles.friendsContainer}>
            {selectedFriends.map(friend => (
              <View key={friend.id} style={styles.selectedFriend}>
                <MaterialIcon
                  name="account-circle"
                  size={40}
                  color={colors.mutedText}
                />
                <View style={styles.friendInfo}>
                  <AppText weight="medium">
                    {friend.firstName} {friend.lastName}
                  </AppText>
                </View>
                {!splitEqually ? (
                  <TextInput
                    style={styles.friendAmountInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={friend.amountOwed.toString()}
                    onChangeText={val => updateIndividualAmount(friend.id, val)}
                  />
                ) : (
                  <RupeeIcon
                    amount={friend.amountOwed}
                    size={14}
                    color={colors.primary}
                  />
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleToggleFriend(friend)}>
                  <MaterialIcon name="close-circle" size={24} color={colors.negative} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <FriendSelector
            selectedFriends={selectedFriends}
            onToggleFriend={handleToggleFriend}
            showGlobalSearch={true}
            placeholder="Search friends..."
            showSelectedChips={false}
          />

          <Button
            title="Create Split Expense"
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
    </View>
  );
};

export default CreateSplitExpense;
