import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import AppText from '@atoms/AppText';
import Header from '@organisms/Header';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';
import {useAuthorizeNavigation} from '../../navigators/navigators';
import {useHomeStore} from '../../store';
import api from '../../services/api';
import groupApi from '../../services/groupApi';

dayjs.extend(relativeTime);

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
};

type GroupActivityItem = {
  id: string;
  action: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  splitExpenseId?: string;
  groupId?: string;
  actorName?: string;
  metadata?: string;
};

type ActivityItem = {
  id: string;
  source: 'notification' | 'activity';
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  splitExpenseId?: string;
  groupId?: string;
  payload?: any;
};

const getIconConfig = (item: ActivityItem, colors: typeof lightTheme) => {
  if (
    item.type === 'settlement' ||
    item.type === 'settlement_created' ||
    item.body.toLowerCase().includes('paid')
  ) {
    return {
      icon: 'cash-check',
      backgroundColor: colors.success + '18',
      iconColor: colors.success,
    };
  }

  if (
    item.type === 'split_expense' ||
    item.type === 'expense_created' ||
    item.body.toLowerCase().includes('expense')
  ) {
    return {
      icon: 'receipt-text-outline',
      backgroundColor: colors.primary + '18',
      iconColor: colors.primary,
    };
  }

  if (item.groupId) {
    return {
      icon: 'account-group-outline',
      backgroundColor: (colors.warning || '#F59E0B') + '18',
      iconColor: colors.warning || '#F59E0B',
    };
  }

  return {
    icon: 'bell-outline',
    backgroundColor: colors.mutedText + '18',
    iconColor: colors.mutedText,
  };
};

const normalizeNotification = (item: NotificationItem): ActivityItem => ({
  id: item.id,
  source: 'notification',
  title: item.title || 'Notification',
  body: item.body,
  type: item.type,
  isRead: item.isRead,
  createdAt: item.createdAt,
  splitExpenseId: item.data?.splitExpenseId,
  groupId: item.data?.groupId,
  payload: item.data,
});

const normalizeActivity = (item: GroupActivityItem): ActivityItem => ({
  id: item.id,
  source: 'activity',
  title: item.actorName || 'Recent activity',
  body: item.description,
  type: item.action,
  isRead: item.isRead,
  createdAt: item.createdAt,
  splitExpenseId: item.splitExpenseId,
  groupId: item.groupId,
  payload: item.metadata,
});

const ActivityScreen = () => {
  const navigation = useAuthorizeNavigation();
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const {
    setUnreadNotifications,
    decrementUnreadNotifications,
    clearUnreadNotifications,
  } = useHomeStore();

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const [notificationResponse, groupActivityResponse, unreadActivityRes] =
        await Promise.all([
          api.get('/api/notifications/me'),
          groupApi.getUserActivityFeed(),
          groupApi.getUnreadActivityCount(),
        ]);

      const notifications: NotificationItem[] =
        notificationResponse.data?.notifications || [];
      const activityLogs: GroupActivityItem[] =
        groupActivityResponse.data?.data || [];

      const mergedItems = [
        ...notifications.map(normalizeNotification),
        ...activityLogs.map(normalizeActivity),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const totalUnread =
        (notificationResponse.data?.unreadCount || 0) +
        (unreadActivityRes.data?.data?.count || 0);

      setItems(mergedItems);
      setUnreadNotifications(totalUnread);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadNotifications]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const markItemAsRead = useCallback(
    async (item: ActivityItem) => {
      if (item.isRead) {
        return;
      }

      try {
        if (item.source === 'notification') {
          await api.patch(`/api/notifications/${item.id}/read`);
        } else {
          await groupApi.markActivityAsRead(item.id);
        }

        setItems(prev =>
          prev.map(entry =>
            entry.id === item.id && entry.source === item.source
              ? {...entry, isRead: true}
              : entry,
          ),
        );
        decrementUnreadNotifications();
      } catch (error) {
        console.error('Error marking activity as read:', error);
      }
    },
    [decrementUnreadNotifications],
  );

  const handleItemPress = async (item: ActivityItem) => {
    await markItemAsRead(item);

    if (item.splitExpenseId) {
      navigation.navigate('SplitExpenseDetail', {
        splitExpenseId: item.splitExpenseId,
      });
      return;
    }

    if (item.groupId) {
      navigation.navigate('GroupDetail', {
        groupId: item.groupId,
      });
      return;
    }

    if (
      item.type === 'splink_request' ||
      item.type === 'splink_response' ||
      item.body.toLowerCase().includes('friend request')
    ) {
      navigation.navigate('AddFriends');
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = items.filter(item => !item.isRead);
    if (unreadItems.length === 0) {
      return;
    }

    setMarkingAll(true);
    try {
      await Promise.all([
        api.patch('/api/notifications/me/read-all'),
        ...unreadItems
          .filter(item => item.source === 'activity')
          .map(item => groupApi.markActivityAsRead(item.id)),
      ]);

      setItems(prev => prev.map(item => ({...item, isRead: true})));
      clearUnreadNotifications();
    } catch (error) {
      console.error('Error marking all activity as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centerContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: 24,
        },
        itemRow: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          alignItems: 'center',
          gap: 12,
        },
        itemUnread: {
          backgroundColor: colors.primary + '08',
        },
        iconShell: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
          gap: 4,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        title: {
          flex: 1,
        },
        timestamp: {
          color: colors.mutedText,
        },
        body: {
          color: colors.mutedText,
          lineHeight: 18,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        emptyTitle: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  const renderItem = ({item}: {item: ActivityItem}) => {
    const iconConfig = getIconConfig(item, colors);

    return (
      <TouchableOpacity
        style={[styles.itemRow, !item.isRead && styles.itemUnread]}
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}>
        <View
          style={[
            styles.iconShell,
            {backgroundColor: iconConfig.backgroundColor},
          ]}>
          <Icon name={iconConfig.icon} size={20} color={iconConfig.iconColor} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText variant="lg" weight="semiBold" style={styles.title}>
              {item.title}
            </AppText>
            <AppText variant="caption" style={styles.timestamp}>
              {dayjs(item.createdAt).fromNow()}
            </AppText>
          </View>
          <AppText variant="md" style={styles.body}>
            {item.body}
          </AppText>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Activity"
        showBackButton={navigation.canGoBack()}
        showDrawerButton={!navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          items.some(item => !item.isRead) ? (
            <TouchableOpacity onPress={markAllAsRead} disabled={markingAll}>
              <AppText variant="md" color={colors.primary} weight="semiBold">
                {markingAll ? 'Updating...' : 'Mark all read'}
              </AppText>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => `${item.source}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchActivity();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Icon
                name="timeline-clock-outline"
                size={52}
                color={colors.mutedText}
              />
              <AppText variant="h6" weight="semiBold" style={styles.emptyTitle}>
                No activity yet
              </AppText>
              <AppText variant="md" style={{color: colors.mutedText, textAlign: 'center'}}>
                Splits, settlements, group updates, and alerts will all show up here.
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ActivityScreen;
