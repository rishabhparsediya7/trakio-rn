import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useCallback, useEffect, useState} from 'react';
import CustomTabBar from '@organisms/customTabBar/CustomTabBar';
import AddActionSheet from '@organisms/AddActionSheet';
import api from '../services/api';
import groupApi from '../services/groupApi';
import BalancesScreen from '../screens/splitExpense/balances';
import GroupList from '../screens/groups/GroupList';
import InsightsScreen from '../screens/home';
import ActivityScreen from '../screens/notifications';
import {useHomeStore} from '../store';

export type TabStackParamList = {
  Home: undefined;
  Groups: undefined;
  Add: undefined;
  Insights: undefined;
  Activity: undefined;
};
const Tab = createBottomTabNavigator<TabStackParamList>();

// Placeholder for the center "Add" slot — never rendered; pressing the tab
// opens the AddActionSheet instead of navigating (see CustomTabBar / listeners).
const AddPlaceholder = () => null;

const BottomTabNavigator = () => {
  const {setUnreadNotifications} = useHomeStore();
  const [addSheetVisible, setAddSheetVisible] = useState(false);

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
    <>
      <Tab.Navigator
        tabBar={props => (
          <CustomTabBar
            {...props}
            onAddPress={() => setAddSheetVisible(true)}
          />
        )}
        screenOptions={{
          headerShown: false,
        }}>
        <Tab.Screen name="Home" component={BalancesScreen} />
        <Tab.Screen name="Groups" component={GroupList} />
        <Tab.Screen
          name="Add"
          component={AddPlaceholder}
          listeners={{
            tabPress: e => {
              e.preventDefault();
              setAddSheetVisible(true);
            },
          }}
        />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Activity" component={ActivityScreen} />
      </Tab.Navigator>
      <AddActionSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
      />
    </>
  );
};

export default BottomTabNavigator;
