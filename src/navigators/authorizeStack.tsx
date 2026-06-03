import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar, Platform} from 'react-native';
import {useTheme} from '../providers/ThemeContext';
import {darkTheme, lightTheme} from '../providers/Theme';
import DrawerNavigator from './drawerNavigator';
import {RouteProp} from '@react-navigation/native';
import Dashboard from '../screens/dashboard';
import Home from '../screens/home';
import Expense from '../screens/expense';
import AddExpense from '../screens/addExpense';
import ChatScreen from '../screens/chat';
import FriendChatScreen from '../screens/chat/friendChat';
import ActionScreen from '../screens/action/addFinanceSummary';
import EditPersonalInformation from '../screens/action/editPersonalInformation';
import UpdatePassword from '../screens/action/updatePassword';
import ExportData from '../screens/action/exportData';
// Split Expense Screens
import SplitExpenseList from '../screens/splitExpense';
import CreateSplitExpense from '../screens/splitExpense/create';
import SplitExpenseDetail from '../screens/splitExpense/detail';
import SettlementScreen from '../screens/splitExpense/settle';
import BalancesScreen from '../screens/splitExpense/balances';
import QuickAddExpense from '../screens/addExpense/QuickAddExpenseScreen';
import NotificationsScreen from '../screens/notifications';
import AddFriends from '../screens/friends/addFriends';
// Group Screens
import GroupList from '../screens/groups/GroupList';
import CreateGroup from '../screens/groups/CreateGroup';
import GroupDetail from '../screens/groups/GroupDetail';
import GroupAddExpense from '../screens/groups/GroupAddExpense';
import GroupSettings from '../screens/groups/GroupSettings';
import GroupChat from '../screens/groups/GroupChat';

type ActionType = 'income' | 'bills' | 'budget' | null;

export type AuthorizeNavigationStackList = {
  DrawerNavigator: undefined;
  Home: undefined;
  Dashboard: undefined;
  AddExpense: undefined;
  Chat: undefined;
  FriendChat: {
    id: string;
    firstName: string;
    lastName: string;
    image: string;
    lastMessage: string;
    lastMessageTime: string;
  };
  Action: {type: ActionType};
  EditPersonalInformation: undefined;
  UpdatePassword: undefined;
  ExportData: undefined;
  ExpenseList: undefined;
  // Split Expense routes
  SplitExpenseList: undefined;
  CreateSplitExpense: {preselectedFriends?: string[]} | undefined;
  SplitExpenseDetail: {splitExpenseId: string};
  SettlementScreen: {
    splitExpenseId: string;
    friendId: string;
    friendName: string;
    amountOwed: number;
    payerId: string;
    payeeId: string;
  };
  Balances: undefined;
  QuickAddExpense: undefined;
  Notifications: undefined;
  AddFriends: undefined;
  // Group routes
  GroupList: undefined;
  CreateGroup: undefined;
  GroupDetail: {groupId: string};
  GroupAddExpense: {groupId: string; members: any[]};
  GroupSettings: {groupId: string};
  GroupChat: {groupId: string; groupName: string};
};

export type AuthorizeNavigationProp<
  RouteName extends keyof AuthorizeNavigationStackList,
> = RouteProp<AuthorizeNavigationStackList, RouteName>;

const AuthorizeNavigationStack =
  createStackNavigator<AuthorizeNavigationStackList>();
const AuthorizeNavigation = () => {
  const {theme} = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <AuthorizeNavigationStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <AuthorizeNavigationStack.Screen
          name="DrawerNavigator"
          component={DrawerNavigator}
        />
        <AuthorizeNavigationStack.Screen
          name="AddExpense"
          component={AddExpense}
        />
        <AuthorizeNavigationStack.Screen name="Home" component={Home} />
        <AuthorizeNavigationStack.Screen
          name="Dashboard"
          component={Dashboard}
        />
        <AuthorizeNavigationStack.Screen name="Chat" component={ChatScreen} />
        <AuthorizeNavigationStack.Screen
          name="FriendChat"
          component={FriendChatScreen}
        />
        <AuthorizeNavigationStack.Screen
          name="Action"
          component={ActionScreen}
        />
        <AuthorizeNavigationStack.Screen
          name="EditPersonalInformation"
          component={EditPersonalInformation}
        />
        <AuthorizeNavigationStack.Screen
          name="UpdatePassword"
          component={UpdatePassword}
        />
        <AuthorizeNavigationStack.Screen
          name="ExportData"
          component={ExportData}
        />
        <AuthorizeNavigationStack.Screen
          name="ExpenseList"
          component={Expense}
        />
        {/* Split Expense Screens */}
        <AuthorizeNavigationStack.Screen
          name="SplitExpenseList"
          component={SplitExpenseList}
        />
        <AuthorizeNavigationStack.Screen
          name="CreateSplitExpense"
          component={CreateSplitExpense}
        />
        <AuthorizeNavigationStack.Screen
          name="SplitExpenseDetail"
          component={SplitExpenseDetail}
        />
        <AuthorizeNavigationStack.Screen
          name="SettlementScreen"
          component={SettlementScreen}
        />
        <AuthorizeNavigationStack.Screen
          name="Balances"
          component={BalancesScreen}
        />
        <AuthorizeNavigationStack.Screen
          name="QuickAddExpense"
          component={QuickAddExpense}
        />
        <AuthorizeNavigationStack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <AuthorizeNavigationStack.Screen
          name="AddFriends"
          component={AddFriends}
        />
        {/* Group Screens */}
        <AuthorizeNavigationStack.Screen
          name="GroupList"
          component={GroupList}
        />
        <AuthorizeNavigationStack.Screen
          name="CreateGroup"
          component={CreateGroup}
        />
        <AuthorizeNavigationStack.Screen
          name="GroupDetail"
          component={GroupDetail}
        />
        <AuthorizeNavigationStack.Screen
          name="GroupAddExpense"
          component={GroupAddExpense}
        />
        <AuthorizeNavigationStack.Screen
          name="GroupSettings"
          component={GroupSettings}
        />
        <AuthorizeNavigationStack.Screen
          name="GroupChat"
          component={GroupChat}
        />
      </AuthorizeNavigationStack.Navigator>
    </>
  );
};

export default AuthorizeNavigation;
