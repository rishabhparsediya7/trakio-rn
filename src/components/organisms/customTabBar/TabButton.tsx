import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../providers/ThemeContext';
import { darkTheme, lightTheme } from '../../../providers/Theme';
import { useMemo } from 'react';
import {useHomeStore} from '../../../store';

const routeIcons: { [key: string]: { default: string; focused: string } } = {
    Balances: { default: 'wallet-outline', focused: 'wallet' },
    Friends: { default: 'people-outline', focused: 'people' },
    Groups: { default: 'layers-outline', focused: 'layers' },
    Activity: { default: 'pulse-outline', focused: 'pulse' },
    Profile: { default: 'person-outline', focused: 'person' },
};

type Props = {
    routeName: string;
    isFocused: boolean;
    isLeftOfFocused: boolean;
    isRightOfFocused: boolean;
    onPress: () => void;
    index: number;
    focusedIndex: number;
    maxIndex: number;
};

const TabButton = (props: Props) => {
    const { routeName, isFocused, isLeftOfFocused, isRightOfFocused, onPress, index, focusedIndex, maxIndex } = props;
    const iconInfo = routeIcons[routeName] || {
        default: 'ellipse-outline',
        focused: 'ellipse',
    };
    const { theme } = useTheme();
    const {unreadNotifications} = useHomeStore();
    const colors = theme === 'dark' ? darkTheme : lightTheme;

    const styles = useMemo(() => StyleSheet.create({
        wrapper: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: 'transparent',
        },
        container: {
            width: '100%',
            height: 72,
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 4,
            position: 'absolute',
            paddingHorizontal: 20,
        },
        inactiveContainer: { 
            backgroundColor: 'transparent'
        },
        activeGroupContainer: { 
            backgroundColor: colors.tabBarBackground
        },
        focusedPill: { 
            borderTopLeftRadius: 25, 
            borderTopRightRadius: 25, 
            borderBottomLeftRadius: 25, 
            borderBottomRightRadius: 25, 
            borderWidth: 2, 
            borderColor: colors.background ,  
            height: 74,
            width: '90%',
            backgroundColor: colors.tabBarBackground,
        },
        immediateLeftAdjacent: { 
            borderTopRightRadius: 25, 
            borderBottomRightRadius: 25,
            height: 72,
        },
        immediateRightAdjacent: { 
            borderTopLeftRadius: 25, 
            borderBottomLeftRadius: 25,
            height: 72,
        },
        mostLeft: { 
            borderTopLeftRadius: 25, 
            borderBottomLeftRadius: 25,
            height: 72,
        },
        mostRight: { 
            borderTopRightRadius: 25, 
            borderBottomRightRadius: 25,
            height: 72,
        },
        iconWrapper: {
            position: 'relative',
        },
        badge: {
            position: 'absolute',
            top: -6,
            right: -8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#FF3B30',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: 1,
            borderColor: colors.background,
        },
        badgeText: {
            color: 'white',
            fontSize: 9,
            fontWeight: '700',
        },
    }), [theme]);

    const containerStyle: StyleProp<ViewStyle> = [
        styles.container,
        (isFocused || isLeftOfFocused || isRightOfFocused)
            ? styles.activeGroupContainer
            : styles.inactiveContainer,
    ];

    if (isFocused) {
        containerStyle.push(styles.focusedPill);
    } else {
        if (index === focusedIndex - 1) {
            containerStyle.push(styles.immediateLeftAdjacent);
        }
        if (index === focusedIndex + 1) {
            containerStyle.push(styles.immediateRightAdjacent);
        }
        if (index === 0) {
            containerStyle.push(styles.mostLeft);
        }
        if (index === maxIndex) {
            containerStyle.push(styles.mostRight);
        }
    }

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity onPress={onPress} style={containerStyle} activeOpacity={0.8}>
                <View style={styles.iconWrapper}>
                    <Icon
                        name={isFocused ? iconInfo.focused : iconInfo.default}
                        size={24}
                        color={isFocused ? colors.tabBarIconActive : colors.tabBarIconInactive}
                    />
                    {routeName === 'Activity' && unreadNotifications > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};



export default TabButton;
