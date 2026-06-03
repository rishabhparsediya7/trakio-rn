import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useCallback, useEffect} from 'react';
import CustomTabBar from '@organisms/customTabBar/CustomTabBar';
import api from '../services/api';
import groupApi from '../services/groupApi';
import BalancesScreen from '../screens/splitExpense/balances';
import AddFriends from '../screens/friends/addFriends';
import GroupList from '../screens/groups/GroupList';
import ActivityScreen from '../screens/notifications';
import Profile from '../screens/profile';
import {useHomeStore} from '../store';

export type TabStackParamList = {
  Balances: undefined;
  Friends: undefined;
  Groups: undefined;
  Activity: undefined;
  Profile: undefined;
};
const Tab = createBottomTabNavigator<TabStackParamList>();

const BottomTabNavigator = () => {
  const {setUnreadNotifications} = useHomeStore();

  const syncUnreadCounts = useCallback(async () => {
    try {
      const [notificationResponse, activityResponse] = await Promise.all([
        api.get('/api/notifications/me', {params: {limit: 1}}),
        groupApi.getUnreadActivityCount(),
      ]);

      const notificationCount = notificationResponse.data?.unreadCount || 0;
      const activityCount = activityResponse.data?.data?.count || 0;
      setUnreadNotifications(notificationCount + activityCount);
    } catch (error) {
      console.error('Failed to sync activity counts:', error);
    }
  }, [setUnreadNotifications]);

  useEffect(() => {
    syncUnreadCounts();
  }, [syncUnreadCounts]);

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Balances" component={BalancesScreen} />
      <Tab.Screen name="Friends" component={AddFriends} />
      <Tab.Screen name="Groups" component={GroupList} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
