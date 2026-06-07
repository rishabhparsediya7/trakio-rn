import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../../providers/ThemeContext';
import {darkTheme, lightTheme} from '../../../providers/Theme';
import {useHomeStore} from '../../../store';

const routeIcons: {[key: string]: {default: string; focused: string}} = {
  Home: {default: 'home-outline', focused: 'home'},
  Groups: {default: 'layers-outline', focused: 'layers'},
  Insights: {default: 'stats-chart-outline', focused: 'stats-chart'},
  Activity: {default: 'pulse-outline', focused: 'pulse'},
};

type Props = {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
};

const TabButton = ({routeName, isFocused, onPress}: Props) => {
  const iconInfo = routeIcons[routeName] || {
    default: 'ellipse-outline',
    focused: 'ellipse',
  };
  const {theme} = useTheme();
  const {unreadNotifications} = useHomeStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pill: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 16,
        },
        iconWrapper: {
          position: 'relative',
        },
        label: {
          fontSize: 11,
          marginTop: 3,
          color: colors.tabBarIconInactive,
        },
        labelActive: {
          color: colors.tabBarIconActive,
          fontWeight: '700',
        },
        badge: {
          position: 'absolute',
          top: -6,
          right: -8,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.error,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          borderWidth: 1,
          borderColor: colors.tabBarBackground,
        },
        badgeText: {
          color: 'white',
          fontSize: 9,
          fontWeight: '700',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.pill}>
        <View style={styles.iconWrapper}>
          <Icon
            name={isFocused ? iconInfo.focused : iconInfo.default}
            size={24}
            color={
              isFocused ? colors.tabBarIconActive : colors.tabBarIconInactive
            }
          />
          {routeName === 'Activity' && unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.label, isFocused && styles.labelActive]}
          numberOfLines={1}>
          {routeName}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TabButton;
