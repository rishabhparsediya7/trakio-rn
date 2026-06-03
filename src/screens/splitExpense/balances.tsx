import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '@organisms/Header';
import {useTheme} from '../../providers/ThemeContext';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {commonStyles} from '../../utils/styles';
import splitExpenseApi, {Balance} from '../../services/splitExpenseApi';
import RupeeIcon from '@atoms/rupeeIcon';

const BalancesScreen = () => {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [summary, setSummary] = useState({
    youOwe: 0,
    youAreOwed: 0,
    netBalance: 0,
  });

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const response = await splitExpenseApi.getBalances();
      if (response.data.success) {
        setBalances(response.data.data.balances);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalances();
    }, []),
  );

  const renderBalanceCard = ({item}: {item: Balance}) => {
    const isPositive = item.balance > 0;
    const displayAmount = Math.abs(item.balance);

    return (
      <TouchableOpacity
        style={[styles.balanceCard, {backgroundColor: colors.cardBackground}]}
        onPress={() =>
          navigation.navigate('SplitExpenseList', {
            filterFriendId: item.friendId,
            friendName: item.friendName,
          })
        }>
        <View style={styles.avatarContainer}>
          <Icon
            name="account-circle"
            size={48}
            color={isPositive ? '#22c55e' : '#ef4444'}
          />
        </View>
        <View style={styles.balanceInfo}>
          <Text style={[styles.friendName, {color: colors.text}]}>
            {item.friendName}
          </Text>
          <Text
            style={[
              styles.balanceText,
              {color: isPositive ? '#22c55e' : '#ef4444'},
            ]}>
            {isPositive ? 'owes you' : 'you owe'}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <RupeeIcon
            amount={displayAmount}
            size={18}
            color={isPositive ? '#22c55e' : '#ef4444'}
            textStyle={{
              fontWeight: 'bold',
              color: isPositive ? '#22c55e' : '#ef4444',
            }}
          />
        </View>
        <Icon name="chevron-right" size={24} color={colors.mutedText} />
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryContainer: {
      padding: 20,
    },
    summaryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    quickActionButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    quickActionSecondary: {
      borderWidth: 1,
    },
    quickActionPrimaryText: {
      color: '#fff',
      fontWeight: '700',
      ...commonStyles.textDefault,
    },
    quickActionSecondaryText: {
      fontWeight: '600',
      ...commonStyles.textDefault,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.mutedText,
      marginBottom: 4,
      ...commonStyles.textDefault,
    },
    summaryAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      ...commonStyles.textDefault,
    },
    divider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    netBalanceContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      alignItems: 'center',
    },
    netBalanceLabel: {
      fontSize: 14,
      color: colors.mutedText,
      marginBottom: 4,
      ...commonStyles.textDefault,
    },
    netBalanceAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      ...commonStyles.textDefault,
    },
    listHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    listHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      ...commonStyles.textDefault,
    },
    balanceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 4,
      padding: 16,
      borderRadius: 12,
    },
    avatarContainer: {
      marginRight: 12,
    },
    balanceInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '500',
      ...commonStyles.textDefault,
    },
    balanceText: {
      fontSize: 13,
      marginTop: 2,
      ...commonStyles.textDefault,
    },
    amountContainer: {
      marginRight: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedText,
      marginTop: 12,
      textAlign: 'center',
      ...commonStyles.textDefault,
    },
    emptyButton: {
      marginTop: 20,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    emptyButtonText: {
      color: '#fff',
      fontWeight: '700',
      ...commonStyles.textDefault,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Balances"
          showBackButton={navigation.canGoBack()}
          showDrawerButton={!navigation.canGoBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Balances"
        showBackButton={navigation.canGoBack()}
        showDrawerButton={!navigation.canGoBack()}
        onBackPress={() => navigation.canGoBack() && navigation.goBack()}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, {backgroundColor: colors.primary + '15'}]}
              onPress={() => navigation.navigate('SplitExpenseList')}>
              <Icon
                name="format-list-bulleted"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, {backgroundColor: colors.primary}]}
              onPress={() => navigation.navigate('CreateSplitExpense')}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>You owe</Text>
              <Text style={[styles.summaryAmount, {color: '#ef4444'}]}>
                ₹{summary.youOwe.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>You are owed</Text>
              <Text style={[styles.summaryAmount, {color: '#22c55e'}]}>
                ₹{summary.youAreOwed.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.netBalanceContainer}>
            <Text style={styles.netBalanceLabel}>Net Balance</Text>
            <Text
              style={[
                styles.netBalanceAmount,
                {
                  color: summary.netBalance >= 0 ? '#22c55e' : '#ef4444',
                },
              ]}>
              {summary.netBalance >= 0 ? '+' : '-'}₹
              {Math.abs(summary.netBalance).toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, {backgroundColor: colors.primary}]}
            onPress={() => navigation.navigate('CreateSplitExpense')}>
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.quickActionPrimaryText}>New Split</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              styles.quickActionSecondary,
              {backgroundColor: colors.cardBackground, borderColor: colors.border},
            ]}
            onPress={() => navigation.navigate('SplitExpenseList')}>
            <Icon name="receipt-text-outline" size={18} color={colors.text} />
            <Text style={[styles.quickActionSecondaryText, {color: colors.text}]}>
              Shared Expenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Balances List */}
      <FlatList
        data={balances}
        keyExtractor={item => item.friendId}
        renderItem={renderBalanceCard}
        ListHeaderComponent={
          balances.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Individual Balances</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="scale-balance" size={64} color={colors.mutedText} />
            <Text style={styles.emptyText}>
              No balances yet.{'\n'}Start splitting expenses with friends!
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, {backgroundColor: colors.primary}]}
              onPress={() => navigation.navigate('CreateSplitExpense')}>
              <Text style={styles.emptyButtonText}>Create Your First Split</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{paddingBottom: 20}}
        refreshing={loading}
        onRefresh={fetchBalances}
      />
    </View>
  );
};

export default BalancesScreen;
