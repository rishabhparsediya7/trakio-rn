import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '@atoms/Button';
import Header from '@organisms/Header';
import AppText from '@atoms/AppText';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';
import {commonStyles} from '../../utils/styles';
import groupApi, {Group} from '../../services/groupApi';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

const GROUP_TYPE_ICONS: Record<string, string> = {
  trip: 'airplane',
  home: 'home-outline',
  couple: 'heart-outline',
  other: 'dots-horizontal',
  general: 'star-outline',
};

const GroupList = () => {
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const navigation = useNavigation<any>();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await groupApi.getGroupList();
      if (res.data?.success) {
        setGroups(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const term = searchQuery.toLowerCase().trim();
    return groups.filter(
      g =>
        g.name.toLowerCase().includes(term) ||
        g.type?.toLowerCase().includes(term),
    );
  }, [groups, searchQuery]);

  const renderGroupItem = ({item}: {item: Group}) => {
    const net = item.balanceSummary?.net || 0;
    const isPositive = net > 0;
    const typeIcon = GROUP_TYPE_ICONS[item.type || 'general'] || 'star-outline';

    return (
      <TouchableOpacity
        style={[styles.groupRow, {borderBottomColor: colors.border}]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('GroupDetail', {groupId: item.id})}>
        <View style={styles.groupRowLeft}>
          <View
            style={[
              styles.groupAvatar,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <Icon name={typeIcon} size={26} color={colors.primary} />
          </View>
          <View style={styles.groupInfo}>
            <AppText variant="lg" weight="semiBold">
              {item.name}
            </AppText>
            <View style={styles.metaRow}>
              <Icon
                name="account-multiple"
                size={16}
                color={colors.mutedText}
              />
              <AppText variant="md" style={{color: colors.mutedText}}>
                {item.memberCount || 0} members
              </AppText>
              {item.type && item.type !== 'general' && (
                <>
                  <AppText variant="sm" style={{color: colors.mutedText}}>
                    {' '}
                    •{' '}
                  </AppText>
                  <AppText
                    variant="md"
                    weight="medium"
                    style={{
                      color: colors.primary,
                      textTransform: 'capitalize',
                    }}>
                    {item.type}
                  </AppText>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.groupRowRight}>
          {net !== 0 ? (
            <View style={styles.balanceContainer}>
              <AppText
                variant="md"
                style={{color: isPositive ? colors.success : colors.error}}>
                {isPositive ? 'you get' : 'you owe'}
              </AppText>
              <AppText
                variant="md"
                weight="bold"
                style={{color: isPositive ? colors.success : colors.error}}>
                ₹{Math.abs(net).toFixed(0)}
              </AppText>
            </View>
          ) : (
            <View
              style={[
                styles.settledBadge,
                {backgroundColor: colors.success + '15'},
              ]}>
              <Icon
                name="check-circle-outline"
                size={14}
                color={colors.success}
              />
              <AppText
                variant="md"
                weight="medium"
                style={{color: colors.success}}>
                settled
              </AppText>
            </View>
          )}
          <Icon name="chevron-right" size={22} color={colors.mutedText} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        {backgroundColor: colors.inputBackground},
      ]}>
      <Icon name="magnify" size={22} color={colors.mutedText} />
      <TextInput
        style={[styles.searchInput, {color: colors.text}]}
        placeholder="Search groups..."
        placeholderTextColor={colors.mutedText}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="close-circle" size={18} color={colors.mutedText} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {renderSearchBar()}
      {filteredGroups.length > 0 && (
        <AppText
          variant="sm"
          weight="medium"
          style={{color: colors.mutedText, marginTop: 4}}>
          {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
        </AppText>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[styles.emptyIcon, {backgroundColor: colors.primary + '15'}]}>
        <Icon name="account-group-outline" size={52} color={colors.primary} />
      </View>
      <AppText variant="h6" weight="semiBold">
        {searchQuery ? 'No groups found' : 'No groups yet'}
      </AppText>
      <AppText
        variant="md"
        style={{
          color: colors.mutedText,
          textAlign: 'center',
          lineHeight: 22,
        }}>
        {searchQuery
          ? `No groups matching "${searchQuery}"`
          : 'Create a group to split expenses with friends'}
      </AppText>
      {!searchQuery && (
        <Button
          title="Create Group"
          onPress={() => navigation.navigate('CreateGroup')}
          icon={
            <Icon
              name="plus"
              size={18}
              color="#FFFFFF"
              style={{marginRight: 6}}
            />
          }
          style={styles.createBtn}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.screen, {backgroundColor: colors.background}]}>
        <Header
          title="Groups"
          showBackButton={navigation.canGoBack()}
          showDrawerButton={!navigation.canGoBack()}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <Header
        title="Groups"
        showBackButton={navigation.canGoBack()}
        showDrawerButton={!navigation.canGoBack()}
        rightComponent={
          <TouchableOpacity
            style={[styles.addBtn, {backgroundColor: colors.primary + '15'}]}
            onPress={() => navigation.navigate('CreateGroup')}>
            <Icon name="plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    flexGrow: 1,
  },
  listHeader: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    ...commonStyles.textDefault,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  groupRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  groupAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    gap: 3,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  createBtn: {
    borderRadius: 20,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});

export default GroupList;
