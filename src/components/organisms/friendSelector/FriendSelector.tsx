import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {darkTheme, lightTheme} from '../../../providers/Theme';
import {useTheme} from '../../../providers/ThemeContext';
import api from '../../../services/api';
import socket from '../../../utils/socket';
import {commonStyles} from '../../../utils/styles';
import AppText from '@atoms/AppText';

// Normalized friend type used by the component
export interface FriendItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  /** True for invited-but-not-registered users (placeholder accounts). */
  isPlaceholder?: boolean;
}

export interface FriendSelectorProps {
  /** Currently selected friends (must use `id` field) */
  selectedFriends: FriendItem[];
  /** Callback when a friend is toggled (selected/deselected) */
  onToggleFriend: (friend: FriendItem) => void;
  /** Enable global user search + Splink requests (default: true) */
  showGlobalSearch?: boolean;
  /** Search input placeholder */
  placeholder?: string;
  /** Dropdown max height (default: 340) */
  maxHeight?: number;
  /** Section label shown above the component */
  label?: string;
  /** Show selected friends as removable chips (default: true) */
  showSelectedChips?: boolean;
}

const FriendSelector: React.FC<FriendSelectorProps> = ({
  selectedFriends,
  onToggleFriend,
  showGlobalSearch = true,
  placeholder = 'Search friends...',
  maxHeight = 340,
  label,
  showSelectedChips = true,
}) => {
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocalFriends, setFilteredLocalFriends] = useState<
    FriendItem[]
  >([]);
  const [searchResults, setSearchResults] = useState<FriendItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch friends list
  const fetchFriendsList = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) return;
      const response = await api.get(`/api/chat/getFriends/${storedUserId}`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      const mappedFriends: FriendItem[] = data.map((f: any) => ({
        id: f.friendId || f.id,
        firstName: f.firstName || f.firstname || '',
        lastName: f.lastName || f.lastname || '',
        email: f.email || '',
        phoneNumber: f.phoneNumber || '',
        profilePicture: f.image || f.profilePicture || '',
      }));
      setFriends(mappedFriends);
    } catch (error) {
      console.error('FriendSelector: Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendsList();
  }, [fetchFriendsList]);

  // Listen for splink acceptance to refresh friends
  useEffect(() => {
    const handleSplinkResponse = (payload: any) => {
      if (payload.action === 'accept') {
        fetchFriendsList();
      }
    };
    socket.on('splink_response', handleSplinkResponse);
    return () => {
      socket.off('splink_response', handleSplinkResponse);
    };
  }, [fetchFriendsList]);

  // Filter local friends & debounce remote search
  useEffect(() => {
    const term = searchQuery.toLowerCase().trim();

    if (term.length === 0) {
      setFilteredLocalFriends(friends);
    } else {
      const filtered = friends.filter(
        f =>
          (f.firstName + ' ' + f.lastName).toLowerCase().includes(term) ||
          f.email?.toLowerCase().includes(term),
      );
      setFilteredLocalFriends(filtered);
    }

    if (showGlobalSearch && searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchRemoteUsers();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, friends, showGlobalSearch]);

  const searchRemoteUsers = async () => {
    setSearching(true);
    try {
      const resp = await api.get(`/api/users/search?q=${searchQuery}`);
      const results = (resp.data?.users || []).filter(
        (u: FriendItem) => !friends.some(f => f.id === u.id),
      );
      setSearchResults(results);
    } catch (error) {
      console.error('FriendSelector: Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const isEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  // Open Ledger: add anyone by email. Resolves to an existing user or creates
  // a placeholder (they'll be invited by email), then selects them immediately.
  const inviteByEmail = async () => {
    const email = searchQuery.trim().toLowerCase();
    if (!isEmail(email)) return;
    setInviting(true);
    try {
      const resp = await api.post('/api/users/resolve-contact', {email});
      if (resp.data?.success && resp.data?.user) {
        const u = resp.data.user;
        onToggleFriend({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          profilePicture: u.profilePicture,
          isPlaceholder: u.isPlaceholder,
        });
        setSearchQuery('');
      } else {
        Alert.alert('Error', resp.data?.message || 'Could not add this contact');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not add this contact');
    } finally {
      setInviting(false);
    }
  };

  const handleToggle = (friend: FriendItem) => {
    onToggleFriend(friend);
    setSearchQuery('');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {},
        label: {
          marginBottom: 6,
        },
        selectedChips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: colors.primary + '20',
        },
        chipText: {
          fontSize: 13,
          fontWeight: '500',
          color: colors.primary,
        },
        friendsContainer: {
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          overflow: 'hidden',
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          gap: 10,
        },
        searchInputField: {
          flex: 1,
          height: 40,
          color: colors.text,
          ...commonStyles.textDefault,
        },
        dropdown: {
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          marginTop: 8,
          maxHeight: maxHeight,
          overflow: 'hidden',
        },
        sectionLabel: {
          fontSize: 12,
          color: colors.mutedText,
          padding: 12,
          backgroundColor: colors.background,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        friendOption: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        friendOptionSelected: {
          backgroundColor: colors.primary + '10',
        },
        splinkButton: {
          backgroundColor: colors.primary + '20',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          marginLeft: 'auto',
        },
        loadingContainer: {
          padding: 16,
          alignItems: 'center',
        },
      }),
    [colors, maxHeight],
  );

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="md" weight="semiBold" style={styles.label}>
          {label}
        </AppText>
      )}

      {/* Selected friends chips */}
      {showSelectedChips && selectedFriends.length > 0 && (
        <View style={styles.selectedChips}>
          {selectedFriends.map(friend => (
            <TouchableOpacity
              key={friend.id}
              style={styles.chip}
              onPress={() => onToggleFriend(friend)}>
              <AppText style={styles.chipText}>
                {friend.firstName} {friend.lastName}
              </AppText>
              {friend.isPlaceholder && (
                <MaterialIcon
                  name="email-outline"
                  size={12}
                  color={colors.primary}
                />
              )}
              <MaterialIcon name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search input */}
      <View style={styles.friendsContainer}>
        <View
          style={[
            styles.searchContainer,
            {
              borderBottomWidth: showDropdown ? 1 : 0,
              borderBottomColor: colors.border,
            },
          ]}>
          <MaterialIcon name="at" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInputField}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowDropdown(true)}
          />
          {(searching || loadingFriends) && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
      </View>

      {/* Dropdown list */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled style={{maxHeight}}>
            {/* Local friends */}
            <AppText variant="caption" style={styles.sectionLabel}>
              Your Friends
            </AppText>
            {filteredLocalFriends.length > 0 ? (
              filteredLocalFriends.map(friendItem => {
                const isSelected = selectedFriends.some(
                  f => f.id === friendItem.id,
                );
                return (
                  <TouchableOpacity
                    key={friendItem.id}
                    style={[
                      styles.friendOption,
                      isSelected && styles.friendOptionSelected,
                    ]}
                    onPress={() => handleToggle(friendItem)}>
                    <MaterialIcon
                      name="account-circle"
                      size={36}
                      color={colors.mutedText}
                    />
                    <View style={{marginLeft: 12, flex: 1}}>
                      <AppText weight="medium">
                        {friendItem.firstName} {friendItem.lastName}
                      </AppText>
                      {friendItem.email ? (
                        <AppText variant="caption">{friendItem.email}</AppText>
                      ) : null}
                    </View>
                    {isSelected && (
                      <MaterialIcon
                        name="check-circle"
                        size={24}
                        color={colors.primary}
                        style={{marginLeft: 'auto'}}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <AppText
                variant="caption"
                style={{padding: 12, color: colors.mutedText}}>
                {searchQuery.length > 0
                  ? 'No friends match your search'
                  : 'No friends found'}
              </AppText>
            )}

            {/* App users — add directly, no handshake required (Open Ledger) */}
            {showGlobalSearch && searchResults.length > 0 && (
              <>
                <AppText variant="caption" style={styles.sectionLabel}>
                  On Trakio
                </AppText>
                {searchResults.map(remoteUser => {
                  const isSelected = selectedFriends.some(
                    f => f.id === remoteUser.id,
                  );
                  return (
                    <TouchableOpacity
                      key={remoteUser.id}
                      style={[
                        styles.friendOption,
                        isSelected && styles.friendOptionSelected,
                      ]}
                      onPress={() => handleToggle(remoteUser)}>
                      <MaterialIcon
                        name="account-circle"
                        size={36}
                        color={colors.mutedText}
                      />
                      <View style={{marginLeft: 12, flex: 1}}>
                        <AppText weight="medium">
                          {remoteUser.firstName} {remoteUser.lastName}
                        </AppText>
                        <AppText variant="caption">{remoteUser.email}</AppText>
                      </View>
                      <MaterialIcon
                        name={
                          isSelected ? 'check-circle' : 'plus-circle-outline'
                        }
                        size={24}
                        color={colors.primary}
                        style={{marginLeft: 'auto'}}
                      />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Invite someone not on Trakio yet, by email */}
            {showGlobalSearch &&
              isEmail(searchQuery) &&
              !filteredLocalFriends.some(
                f => f.email === searchQuery.trim().toLowerCase(),
              ) &&
              !searchResults.some(
                u => u.email === searchQuery.trim().toLowerCase(),
              ) && (
                <TouchableOpacity
                  style={styles.friendOption}
                  onPress={inviteByEmail}>
                  <MaterialIcon
                    name="email-plus-outline"
                    size={36}
                    color={colors.primary}
                  />
                  <View style={{marginLeft: 12, flex: 1}}>
                    <AppText weight="medium">
                      Invite {searchQuery.trim()}
                    </AppText>
                    <AppText variant="caption">
                      Added now, invited by email
                    </AppText>
                  </View>
                  {inviting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcon
                      name="plus-circle-outline"
                      size={24}
                      color={colors.primary}
                      style={{marginLeft: 'auto'}}
                    />
                  )}
                </TouchableOpacity>
              )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default FriendSelector;
