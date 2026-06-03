import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '@organisms/Header';
import AppText from '@atoms/AppText';
import SegmentedControl from '@molecules/SegmentedControl';
import RupeeIcon from '@atoms/rupeeIcon';
import {useAuth} from '../../providers/AuthProvider';
import {lightTheme} from '../../providers/Theme';
import splitExpenseApi, {SplitExpense} from '../../services/splitExpenseApi';
import {commonStyles} from '../../utils/styles';

const filterOptions = ['All', 'You Owe', 'Owed to You', 'Settled'];

const SplitExpenseList = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user} = useAuth();
  const colors = lightTheme;
  const filterFriendId = route.params?.filterFriendId as string | undefined;
  const friendName = route.params?.friendName as string | undefined;

  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await splitExpenseApi.getList();
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching split expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, []),
  );

  const getFilteredExpenses = () => {
    if (!user?.userId) return expenses;

    return expenses.filter(expense => {
      if (
        filterFriendId &&
        !expense.participants?.some(p => p.userId === filterFriendId)
      ) {
        return false;
      }

      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Settled') return expense.status === 'settled';

      const userParticipantIndex = expense.participants?.findIndex(
        p => p.userId === user.userId,
      );
      const userParticipant =
        userParticipantIndex > -1
          ? expense.participants[userParticipantIndex]
          : null;

      if (selectedFilter === 'You Owe') {
        // You owe money if you are a participant, you DID NOT pay the full amount,
        // and your owed amount is greater than your paid amount.
        return (
          userParticipant &&
          !userParticipant.isPayer &&
          userParticipant.status !== 'settled' &&
          userParticipant.amountOwed > (userParticipant.amountPaid ?? 0)
        );
      }

      if (selectedFilter === 'Owed to You') {
        // Money is owed to you if you are the payer, and the expense is not fully settled
        return (
          userParticipant &&
          userParticipant.isPayer &&
          expense.status !== 'settled'
        );
      }

      return true;
    });
  };

  const getAmountDisplay = (expense: SplitExpense) => {
    if (!user?.userId) return {amount: 0, type: 'neutral'};

    const participant = expense.participants?.find(
      p => p.userId === user.userId,
    );

    if (participant?.isPayer) {
      // User paid, calculate what others owe them
      const totalOwed =
        expense.participants
          ?.filter(p => !p.isPayer && p.status !== 'settled')
          .reduce((sum, p) => sum + (p.amountOwed - (p.amountPaid || 0)), 0) ||
        0;
      return {amount: totalOwed, type: 'positive'};
    } else if (participant) {
      // User owes money
      const remaining = participant.amountOwed - (participant.amountPaid || 0);
      return {amount: remaining, type: remaining > 0 ? 'negative' : 'neutral'};
    }

    return {amount: 0, type: 'neutral'};
  };

  const renderExpenseCard = ({item}: {item: SplitExpense}) => {
    const themeColors = lightTheme;
    const {amount, type} = getAmountDisplay(item);
    const amountColor =
      type === 'positive'
        ? '#22c55e'
        : type === 'negative'
        ? '#ef4444'
        : themeColors.text;

    return (
      <TouchableOpacity
        style={[
          localStyles.card,
          {backgroundColor: themeColors.cardBackground},
        ]}
        onPress={() =>
          navigation.navigate('SplitExpenseDetail', {splitExpenseId: item.id})
        }>
        <View style={localStyles.cardHeader}>
          <View style={localStyles.cardTitleSection}>
            <AppText variant="lg" numberOfLines={1}>
              {item.description}
            </AppText>
            <AppText variant="md" style={{color: themeColors.mutedText}}>
              by {item.creatorName || 'You'}
            </AppText>
          </View>
          <View style={localStyles.cardAmountSection}>
            <AppText variant="sm" style={{color: amountColor}}>
              {type === 'negative'
                ? 'You owe'
                : type === 'positive'
                ? 'You get back'
                : ''}
            </AppText>
            <RupeeIcon
              amount={amount}
              size={16}
              color={amountColor}
              textStyle={{color: amountColor, fontWeight: 'bold'}}
            />
          </View>
        </View>
        <View style={localStyles.cardFooter}>
          <AppText variant="md" style={{color: themeColors.mutedText}}>
            <Icon
              name="account-group"
              size={14}
              color={themeColors.mutedText}
            />{' '}
            {item.participants?.length || 0} people
          </AppText>
          <View
            style={[
              localStyles.statusBadge,
              {
                backgroundColor:
                  item.status === 'settled'
                    ? '#22c55e20'
                    : item.status === 'partially_settled'
                    ? '#f59e0b20'
                    : '#3b82f620',
              },
            ]}>
            <AppText
              variant="md"
              style={[
                {
                  color:
                    item.status === 'settled'
                      ? colors.success
                      : item.status === 'partially_settled'
                      ? '#f59e0b'
                      : '#3b82f6',
                },
              ]}>
              {item.status === 'settled'
                ? 'Settled'
                : item.status === 'partially_settled'
                ? 'Partial'
                : 'Pending'}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonInactive: {
      borderColor: colors.border,
    },
    filterTextInactive: {
      color: colors.text,
    },
    balanceButton: {
      backgroundColor: colors.primary + '20',
    },
    balanceButtonText: {
      color: colors.primary,
    },
    fab: {
      backgroundColor: colors.primary,
    },
    emptyText: {
      color: colors.mutedText,
    },
  };

  return (
    <View style={[localStyles.container, dynamicStyles.container]}>
      <Header
        title="Split Expenses"
        showBackButton
        onBackPress={() => navigation.canGoBack() && navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={[localStyles.balanceButton, dynamicStyles.balanceButton]}
            onPress={() => navigation.navigate('Balances')}>
            <Icon name="scale-balance" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Filter tabs */}
      <View style={localStyles.filterContainer}>
        <SegmentedControl
          options={filterOptions}
          activeOption={selectedFilter}
          onOptionPress={setSelectedFilter}
        />
      </View>

      {/* Expenses list */}
      {friendName ? (
        <View style={localStyles.friendBanner}>
          <AppText variant="md" style={{color: colors.mutedText}}>
            Showing shared expenses with {friendName}
          </AppText>
        </View>
      ) : null}
      <FlatList
        data={getFilteredExpenses()}
        keyExtractor={item => item.id}
        renderItem={renderExpenseCard}
        refreshing={loading}
        onRefresh={fetchExpenses}
        contentContainerStyle={{paddingBottom: 80}}
        ItemSeparatorComponent={() => (
          <View
            style={[
              localStyles.separator,
              {backgroundColor: 'gray', marginHorizontal: 26},
            ]}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={localStyles.emptyContainer}>
              <Icon name="receipt" size={48} color={colors.mutedText} />
              <Text style={[localStyles.emptyText, dynamicStyles.emptyText]}>
                No split expenses yet
              </Text>
            </View>
          )
        }
      />

      {/* FAB to create new */}
      <TouchableOpacity
        style={[localStyles.fab, dynamicStyles.fab]}
        onPress={() => navigation.navigate('CreateSplitExpense')}>
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  friendBanner: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    ...commonStyles.textDefault,
  },
  cardCreator: {
    fontSize: 12,
    marginTop: 2,
  },
  cardAmountSection: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardParticipants: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  separator: {
    height: 0.5,
  },
  balanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  balanceButtonText: {
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default SplitExpenseList;
