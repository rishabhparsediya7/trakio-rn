import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '@organisms/Header';
import {useTheme} from '../../providers/ThemeContext';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {commonStyles} from '../../utils/styles';
import splitExpenseApi from '../../services/splitExpenseApi';

interface RouteParams {
  splitExpenseId: string;
  friendId: string;
  friendName: string;
  amountOwed: number;
  payerId: string;
  payeeId: string;
}

const SettlementScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const {splitExpenseId, friendId, friendName, amountOwed, payerId, payeeId} =
    route.params as RouteParams;
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [amount, setAmount] = useState(amountOwed.toString());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSettle = async () => {
    const settleAmount = parseFloat(amount);
    if (!settleAmount || settleAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (settleAmount > amountOwed) {
      Alert.alert('Error', `Amount cannot exceed ₹${amountOwed.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await splitExpenseApi.settleUp({
        splitExpenseId,
        payerId,
        payeeId,
        amount: settleAmount,
        note: note.trim() || undefined,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Payment recorded successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert(
          'Error',
          response.data.message || 'Failed to record payment',
        );
      }
    } catch (error) {
      console.error('Error settling up:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    friendName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      ...commonStyles.textDefault,
    },
    owedText: {
      fontSize: 14,
      color: colors.mutedText,
      ...commonStyles.textDefault,
    },
    owedAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.negative,
      marginTop: 4,
      ...commonStyles.textDefault,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: colors.mutedText,
      marginBottom: 8,
      ...commonStyles.textDefault,
    },
    inputContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    currencySymbol: {
      fontSize: 24,
      color: colors.text,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      paddingVertical: 16,
      ...commonStyles.textDefault,
    },
    noteInput: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      ...commonStyles.textDefault,
    },
    quickAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    quickAmountButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
    },
    quickAmountText: {
      color: colors.primary,
      fontWeight: '500',
      ...commonStyles.textDefault,
    },
    settleButton: {
      backgroundColor: colors.positive,
      borderRadius: 12,
      padding: 18,
      alignItems: 'center',
      marginTop: 'auto',
      marginBottom: 20,
    },
    settleButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
      ...commonStyles.textDefault,
    },
    infoText: {
      textAlign: 'center',
      color: colors.mutedText,
      fontSize: 12,
      marginTop: 12,
      ...commonStyles.textDefault,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="Record Payment" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        {/* Friend Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Icon name="account" size={48} color={colors.primary} />
          </View>
          <Text style={styles.friendName}>{friendName}</Text>
          <Text style={styles.owedText}>owes you</Text>
          <Text style={styles.owedAmount}>₹{amountOwed.toFixed(2)}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount to settle</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedText}
            />
          </View>
          <View style={styles.quickAmounts}>
            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() => setAmount((amountOwed / 2).toFixed(2))}>
              <Text style={styles.quickAmountText}>Half</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() => setAmount(amountOwed.toFixed(2))}>
              <Text style={styles.quickAmountText}>Full Amount</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.mutedText}
            multiline
          />
        </View>

        <Text style={styles.infoText}>
          This will record the payment in your split expense history. No actual
          money transfer will happen through the app.
        </Text>

        {/* Settle Button */}
        <TouchableOpacity
          style={[styles.settleButton, submitting && {opacity: 0.6}]}
          onPress={handleSettle}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.settleButtonText}>
              <Icon name="check" size={18} color="#fff" /> Record Payment
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SettlementScreen;
