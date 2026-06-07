import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Header from '@organisms/Header';
import Button from '@atoms/Button';
import AppText from '@atoms/AppText';
import {useTheme} from '../../providers/ThemeContext';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {commonStyles} from '../../utils/styles';
import splitExpenseApi, {SplitExpense} from '../../services/splitExpenseApi';
import RupeeIcon from '@atoms/rupeeIcon';
import {useAuth} from '../../providers/AuthProvider';
import {createInitialsForImage} from '../../utils/users';

interface RouteParams {
  splitExpenseId: string;
}

interface ParticipantDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  amountOwed: number;
  amountPaid: number;
  isPayer: boolean;
  status: string;
  settledAt?: string;
}

interface Settlement {
  id: string;
  payerName: string;
  payeeName: string;
  amount: number;
  settledAt: string;
  note?: string;
}

const SplitExpenseDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const {splitExpenseId} = route.params as RouteParams;
  const {theme} = useTheme();
  const {user} = useAuth();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<SplitExpense | null>(null);
  const [participants, setParticipants] = useState<ParticipantDetail[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await splitExpenseApi.getDetails(splitExpenseId);
      if (response.data.success) {
        setExpense(response.data.data as any);
        setParticipants((response.data.data as any).participants || []);
        setSettlements((response.data.data as any).settlements || []);
      }
    } catch (error) {
      console.error('Error fetching split expense details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [splitExpenseId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Split Expense',
      'Are you sure you want to delete this split expense? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await splitExpenseApi.delete(splitExpenseId);
              if (response.data.success) {
                Alert.alert('Deleted', 'Split expense has been deleted');
                navigation.goBack();
              } else {
                Alert.alert(
                  'Error',
                  response.data.message || 'Failed to delete',
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete split expense');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleSettle = (participant: ParticipantDetail) => {
    const payer = participants.find(p => p.isPayer);
    if (!payer) return;

    navigation.navigate('SettlementScreen', {
      splitExpenseId,
      friendId: participant.userId,
      friendName: `${participant.firstName} ${participant.lastName}`,
      amountOwed: participant.amountOwed - participant.amountPaid,
      payerId: participant.userId,
      payeeId: payer.userId,
    });
  };

  const handleSendReminder = (participant: ParticipantDetail) => {
    navigation.navigate('FriendChat', {
      id: participant.userId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      image: participant.profilePicture || '',
      lastMessage: `Reminder: You owe ₹${(
        participant.amountOwed - participant.amountPaid
      ).toFixed(2)} for "${expense?.description}"`,
      lastMessageTime: new Date().toISOString(),
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const payer = participants.find(p => p.isPayer);
  const isCreator = expense?.createdBy === user?.userId;
  const canDelete = isCreator && expense?.status === 'pending';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    summaryCard: {
      alignItems: 'center',
      paddingVertical: 32,
      marginBottom: 16,
    },
    summaryAmount: {
      fontSize: 42,
      color: colors.text,
      marginBottom: 8,
    },
    summaryDescription: {
      fontSize: 16,
      color: colors.mutedText,
      textAlign: 'center',
    },
    summaryDate: {
      fontSize: 14,
      color: colors.mutedText,
      textAlign: 'center',
      marginTop: 4,
    },
    statusBadge: {
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      color: colors.mutedText,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    participantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border || '#E5E7EB',
      backgroundColor: colors.background, // Important for Swipeable overlap
    },
    participantAvatar: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      color: colors.text,
    },
    participantStatus: {
      fontSize: 12,
      color: colors.mutedText,
      marginTop: 2,
    },
    participantAmount: {
      alignItems: 'flex-end',
    },
    payerBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
    },
    payerBadgeText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      height: '100%',
      alignItems: 'center',
    },
    actionSwipeButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 60,
      height: '100%',
    },
    settleButton: {
      backgroundColor: colors.positive,
    },
    reminderButton: {
      backgroundColor: colors.primary,
    },
    settlementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border || '#E5E7EB',
    },
    settlementInfo: {
      flex: 1,
      marginLeft: 12,
    },
    settlementText: {
      color: colors.text,
    },
    settlementDate: {
      color: colors.mutedText,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Split Details" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.container}>
        <Header title="Split Details" showBackButton onBackPress={handleBack} />
        <View style={styles.loadingContainer}>
          <AppText style={{color: colors.text}}>
            Split expense not found
          </AppText>
        </View>
      </View>
    );
  }

  const statusColor =
    expense.status === 'settled'
      ? colors.positive
      : expense.status === 'partially_settled'
      ? '#f59e0b'
      : '#3b82f6';

  return (
    <View style={styles.container}>
      <Header
        title="Split Details"
        showBackButton
        onBackPress={() => navigation.canGoBack() && navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <AppText variant="h1" weight="bold" style={styles.summaryAmount}>
            ₹{parseFloat(expense.totalAmount.toString()).toFixed(2)}
          </AppText>
          <AppText style={styles.summaryDescription}>
            {expense.description}
          </AppText>
          <AppText style={styles.summaryDate}>
            {new Date(expense.expenseDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </AppText>
          <View
            style={[styles.statusBadge, {backgroundColor: statusColor + '30'}]}>
            <AppText
              weight="semiBold"
              style={[styles.statusText, {color: statusColor}]}>
              {expense.status === 'settled'
                ? '✓ Settled'
                : expense.status === 'partially_settled'
                ? 'Partially Settled'
                : 'Pending'}
            </AppText>
          </View>
        </View>

        {/* Paid By */}
        {payer && (
          <View style={styles.section}>
            <AppText variant="lg" weight="semiBold" style={styles.sectionTitle}>
              Paid by
            </AppText>
            <View style={styles.participantCard}>
              <View
                style={[
                  styles.participantAvatar,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <AppText color={colors.primary} weight="semiBold">
                  {createInitialsForImage(
                    `${payer.firstName} ${payer.lastName}`,
                  )}
                </AppText>
              </View>
              <View style={styles.participantInfo}>
                <AppText
                  variant="lg"
                  weight="medium"
                  style={styles.participantName}>
                  {payer.firstName} {payer.lastName}
                  {payer.userId === user?.userId && ' (You)'}
                </AppText>
              </View>
              <RupeeIcon
                amount={parseFloat(expense.totalAmount.toString())}
                size={16}
                color={colors.primary}
              />
            </View>
          </View>
        )}

        {/* Participants */}
        <View style={styles.section}>
          <AppText variant="lg" weight="semiBold" style={styles.sectionTitle}>
            Split between
          </AppText>
          {participants
            .filter(p => !p.isPayer)
            .map(participant => {
              const remaining = participant.amountOwed - participant.amountPaid;
              const isSettled = participant.status === 'settled';
              const canSettle = !isSettled && payer?.userId === user?.userId;

              const renderRightActions = () => {
                if (isSettled) return null;
                return (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionSwipeButton, styles.settleButton]}
                      onPress={() => handleSettle(participant)}>
                      <Icon name="check" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionSwipeButton, styles.reminderButton]}
                      onPress={() => handleSendReminder(participant)}>
                      <Icon name="bell-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                );
              };

              return (
                <Swipeable
                  key={participant.id}
                  renderRightActions={renderRightActions}
                  overshootRight={false}>
                  <View style={styles.participantCard}>
                    <View
                      style={[
                        styles.participantAvatar,
                        {
                          backgroundColor: isSettled
                            ? colors.positive + '20'
                            : colors.primary + '20',
                        },
                      ]}>
                      <AppText
                        color={isSettled ? colors.positive : colors.primary}
                        weight="semiBold">
                        {createInitialsForImage(
                          `${participant.firstName} ${participant.lastName}`,
                        )}
                      </AppText>
                    </View>
                    <View style={styles.participantInfo}>
                      <AppText
                        variant="lg"
                        weight="medium"
                        style={styles.participantName}>
                        {participant.firstName} {participant.lastName}
                        {participant.userId === user?.userId && ' (You)'}
                      </AppText>
                      <AppText variant="sm" style={styles.participantStatus}>
                        {isSettled
                          ? '✓ Settled'
                          : `Owes ₹${remaining.toFixed(2)}`}
                      </AppText>
                    </View>
                    <View style={styles.participantAmount}>
                      <RupeeIcon
                        amount={participant.amountOwed}
                        size={14}
                        color={isSettled ? colors.positive : colors.text}
                      />
                    </View>
                  </View>
                </Swipeable>
              );
            })}
        </View>

        {/* Settlement History */}
        {settlements.length > 0 && (
          <View style={styles.section}>
            <AppText variant="lg" weight="semiBold" style={styles.sectionTitle}>
              Settlement History
            </AppText>
            {settlements.map(settlement => (
              <View key={settlement.id} style={styles.settlementCard}>
                <Icon name="check-circle" size={24} color={colors.positive} />
                <View style={styles.settlementInfo}>
                  <AppText
                    variant="lg"
                    weight="medium"
                    style={styles.settlementText}>
                    {settlement.payerName} paid {settlement.payeeName}
                  </AppText>
                  <AppText variant="sm" style={styles.settlementDate}>
                    {new Date(settlement.settledAt).toLocaleDateString('en-IN')}
                    {settlement.note && ` • ${settlement.note}`}
                  </AppText>
                </View>
                <RupeeIcon
                  amount={settlement.amount}
                  size={14}
                  color={colors.positive}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Delete Button Footer */}
      {canDelete && (
        <View style={{padding: 16, backgroundColor: colors.background}}>
          <Button
            variant="outline"
            style={{borderColor: colors.error}}
            onPress={handleDelete}
            disabled={deleting}
            loading={deleting}>
            <AppText weight="semiBold" color={colors.error}>
              Delete Split Expense
            </AppText>
          </Button>
        </View>
      )}
    </View>
  );
};

export default SplitExpenseDetail;
