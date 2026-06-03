import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '@atoms/AppText';
import Header from '@organisms/Header';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';
import api from '../../services/api';
import socket from '../../utils/socket';
import {createInitialsForImage} from '../../utils/users';
import {commonStyles} from '../../utils/styles';
import SegmentedControl from '@molecules/SegmentedControl';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

const TABS = ['Friends', 'Requests', 'Find'];

const AddFriends = () => {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [activeTab, setActiveTab] = useState('Friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [requestingSplink, setRequestingSplink] = useState<string | null>(null);
  const [pendingSplinks, setPendingSplinks] = useState<any[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [sentSplinks, setSentSplinks] = useState<any[]>([]);

  // Fetch existing friends
  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const response = await api.get(`/api/chat/getFriends/${userId}`);
      const mapped = (response.data || []).map((f: any) => ({
        ...f,
        id: f.friendId,
      }));
      setFriends(mapped);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Fetch sent (outgoing) Splink requests
  const fetchSentSplinks = async () => {
    try {
      const resp = await api.get('/api/chat/splink/sent');
      setSentSplinks(resp.data || []);
    } catch (error) {
      console.error('Error fetching sent Splinks:', error);
    }
  };

  // Fetch pending Splink requests
  const fetchPendingSplinks = async () => {
    try {
      const resp = await api.get('/api/chat/splink/pending');
      setPendingSplinks(resp.data || []);
    } catch (error) {
      console.error('Error fetching pending Splinks:', error);
    }
  };

  // Respond to a pending Splink request
  const handleSplinkResponse = async (
    friendId: string,
    action: 'accept' | 'reject',
  ) => {
    setRespondingTo(friendId);
    try {
      await api.post('/api/chat/splink/response', {friendId, action});
      fetchPendingSplinks();
      if (action === 'accept') {
        fetchFriends();
      }
    } catch (error) {
      console.error('Error responding to Splink:', error);
      Alert.alert('Error', 'Failed to respond to request');
    } finally {
      setRespondingTo(null);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchPendingSplinks();
    fetchSentSplinks();

    // Listen for real-time splink events
    const onSplinkRequest = () => fetchPendingSplinks();
    const onSplinkResponse = (payload: any) => {
      fetchPendingSplinks();
      fetchSentSplinks();
      if (payload.action === 'accept') {
        fetchFriends();
      }
    };

    socket.on('splink_request', onSplinkRequest);
    socket.on('splink_response', onSplinkResponse);
    return () => {
      socket.off('splink_request', onSplinkRequest);
      socket.off('splink_response', onSplinkResponse);
    };
  }, []);

  // Debounced remote search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeout = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    try {
      const resp = await api.get(`/api/users/search?q=${searchQuery}`);
      // Filter out users who are already friends
      const results = (resp.data?.users || []).filter(
        (u: User) => !friends.some(f => f.id === u.id),
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendSplinkRequest = async (user: User) => {
    setRequestingSplink(user.id);
    try {
      await api.post('/api/chat/splink/request', {friendId: user.id});
      Alert.alert('Request Sent', `A friend request was sent to ${user.firstName}.`);
      // Remove from search results and add to sent list
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
      setSentSplinks(prev => [
        ...prev,
        {friendId: user.id, firstName: user.firstName, lastName: user.lastName},
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to send Splink request',
      );
    } finally {
      setRequestingSplink(null);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          paddingHorizontal: 14,
          marginTop: 8,
          marginBottom: 16,
          gap: 10,
        },
        searchInput: {
          flex: 1,
          height: 46,
          color: colors.text,
          fontSize: 15,
          ...commonStyles.textDefault,
        },
        sectionLabel: {
          fontSize: 12,
          color: colors.mutedText,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          marginTop: 12,
        },
        userRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        avatarImage: {
          width: 44,
          height: 44,
          borderRadius: 22,
        },
        avatarText: {
          color: 'white',
          fontSize: 16,
          fontWeight: '700',
        },
        userInfo: {
          flex: 1,
          marginLeft: 12,
        },
        friendActions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 10,
        },
        friendActionChip: {
          borderRadius: 18,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        splinkButton: {
          backgroundColor: colors.primary + '15',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
        },
        friendBadge: {
          backgroundColor: colors.success + '15',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        },
        pendingBadge: {
          backgroundColor: (colors.warning || '#F59E0B') + '15',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 40,
        },
        hint: {
          textAlign: 'center',
          paddingHorizontal: 40,
          marginTop: 8,
        },
        pendingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        actionButtons: {
          flexDirection: 'row',
          gap: 8,
        },
        acceptButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
        },
        rejectButton: {
          backgroundColor: colors.error + '15',
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
        },
      }),
    [colors, theme],
  );

  const openFriendChat = (user: User) => {
    navigation.navigate('FriendChat', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.profilePicture || '',
      lastMessage: '',
      lastMessageTime: '',
    });
  };

  const renderUserRow = (user: User, isFriend: boolean) => {
    const isSentPending = sentSplinks.some(s => s.friendId === user.id);

    return (
      <View key={user.id} style={styles.userRow}>
        {user.profilePicture ? (
          <Image source={{uri: user.profilePicture}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <AppText weight="bold" style={styles.avatarText}>
              {createInitialsForImage(
                (user.firstName || '') + ' ' + (user.lastName || ''),
              )}
            </AppText>
          </View>
        )}
        <View style={styles.userInfo}>
          <AppText weight="semiBold">
            {user.firstName} {user.lastName}
          </AppText>
          <AppText variant="caption" color={colors.mutedText}>
            {user.email || user.phoneNumber}
          </AppText>
          {isFriend && (
            <View style={styles.friendActions}>
              <TouchableOpacity
                style={[
                  styles.friendActionChip,
                  {backgroundColor: colors.primary + '15'},
                ]}
                onPress={() =>
                  navigation.navigate('CreateSplitExpense', {
                    preselectedFriends: [user.id],
                  })
                }>
                <AppText
                  variant="caption"
                  weight="semiBold"
                  style={{color: colors.primary}}>
                  New split
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.friendActionChip,
                  {backgroundColor: (colors.warning || '#F59E0B') + '15'},
                ]}
                onPress={() =>
                  navigation.navigate('SplitExpenseList', {
                    filterFriendId: user.id,
                    friendName: `${user.firstName} ${user.lastName}`,
                  })
                }>
                <AppText
                  variant="caption"
                  weight="semiBold"
                  style={{color: colors.warning || '#F59E0B'}}>
                  Settle up
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.friendActionChip,
                  {backgroundColor: colors.cardBackground},
                ]}
                onPress={() => openFriendChat(user)}>
                <AppText
                  variant="caption"
                  weight="semiBold"
                  style={{color: colors.text}}>
                  Message
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isFriend ? (
          <View style={styles.friendBadge}>
            <AppText
              variant="caption"
              weight="semiBold"
              style={{color: colors.success}}>
              Friends
            </AppText>
          </View>
        ) : isSentPending ? (
          <View style={styles.pendingBadge}>
            <AppText
              variant="caption"
              weight="semiBold"
              style={{color: colors.warning || '#F59E0B'}}>
              Pending
            </AppText>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.splinkButton}
            onPress={() => sendSplinkRequest(user)}
            disabled={requestingSplink === user.id}>
            {requestingSplink === user.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppText
                variant="caption"
                weight="semiBold"
                style={{color: colors.primary}}>
                Connect
              </AppText>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Filter friends based on search query
  const filteredFriends = searchQuery.trim()
    ? friends.filter(f =>
        (f.firstName + ' ' + f.lastName)
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim()),
      )
    : friends;

  return (
    <View style={styles.container}>
      <Header
        title="Friends"
        showBackButton={navigation.canGoBack()}
        showDrawerButton={!navigation.canGoBack()}
        showImage={false}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary + '15',
              }}
              onPress={() => setActiveTab('Find')}>
              <MaterialIcon name="person-add" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}
              onPress={() => navigation.navigate('CreateSplitExpense')}>
              <MaterialIcon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.content}>
        <SegmentedControl
          options={TABS}
          activeOption={activeTab}
          onOptionPress={setActiveTab}
          containerStyle={{marginBottom: 16}}
        />

        {activeTab !== 'Requests' && (
          <View style={styles.searchContainer}>
            <MaterialIcon name="magnify" size={22} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === 'Find'
                  ? 'Search by email or phone...'
                  : 'Search your friends...'
              }
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 40}}>
          {activeTab === 'Find' && (
            <>
              {searchResults.length > 0 ? (
                <>
                  <AppText variant="caption" style={styles.sectionLabel}>
                    People you can add
                  </AppText>
                  {searchResults.map(user => renderUserRow(user, false))}
                </>
              ) : searchQuery.length > 2 && !searching ? (
                <View style={styles.emptyState}>
                  <MaterialIcon
                    name="account-search"
                    size={48}
                    color={colors.mutedText}
                  />
                  <AppText
                    variant="md"
                    color={colors.mutedText}
                    style={styles.hint}>
                    No users found. Try a different email or phone number.
                  </AppText>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcon
                    name="account-plus"
                    size={48}
                    color={colors.mutedText}
                  />
                  <AppText
                    variant="md"
                    color={colors.mutedText}
                    style={styles.hint}>
                    Search by email or phone number to connect with people you split with.
                  </AppText>
                </View>
              )}
            </>
          )}

          {activeTab === 'Requests' && (
            <>
              {pendingSplinks.length === 0 && sentSplinks.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcon
                    name="clock-outline"
                    size={48}
                    color={colors.mutedText}
                  />
                  <AppText
                    variant="md"
                    color={colors.mutedText}
                    style={styles.hint}>
                    No pending requests at the moment.
                  </AppText>
                </View>
              ) : (
                <>
                  {pendingSplinks.length > 0 && (
                    <>
                      <AppText variant="caption" style={styles.sectionLabel}>
                        Incoming Requests
                      </AppText>
                      {pendingSplinks.map(item => (
                        <View key={item.friendId} style={styles.pendingRow}>
                          <View style={styles.avatar}>
                            <AppText weight="bold" style={styles.avatarText}>
                              {createInitialsForImage(
                                (item.firstName || '') +
                                  ' ' +
                                  (item.lastName || ''),
                              )}
                            </AppText>
                          </View>
                          <View style={styles.userInfo}>
                            <AppText weight="semiBold">
                              {item.firstName} {item.lastName}
                            </AppText>
                            <AppText variant="caption" color={colors.mutedText}>
                              Sent you a friend request
                            </AppText>
                          </View>
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.acceptButton}
                              disabled={respondingTo === item.friendId}
                              onPress={() =>
                                handleSplinkResponse(item.friendId, 'accept')
                              }>
                              {respondingTo === item.friendId ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <AppText
                                  variant="caption"
                                  weight="semiBold"
                                  style={{color: 'white'}}>
                                  Accept
                                </AppText>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.rejectButton}
                              disabled={respondingTo === item.friendId}
                              onPress={() =>
                                handleSplinkResponse(item.friendId, 'reject')
                              }>
                              <AppText
                                variant="caption"
                                weight="semiBold"
                                style={{color: colors.error}}>
                                Reject
                              </AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {sentSplinks.length > 0 && (
                    <>
                      <AppText variant="caption" style={styles.sectionLabel}>
                        Sent Requests
                      </AppText>
                      {sentSplinks.map(user =>
                        renderUserRow(user as User, false),
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'Friends' && (
            <>
              {filteredFriends.length > 0 ? (
                <>
                  <AppText variant="caption" style={styles.sectionLabel}>
                    Your Friends ({friends.length})
                  </AppText>
                  {filteredFriends.map(friend => renderUserRow(friend, true))}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcon
                    name="account-group"
                    size={48}
                    color={colors.mutedText}
                  />
                  <AppText
                    variant="md"
                    color={colors.mutedText}
                    style={styles.hint}>
                    {searchQuery.trim()
                      ? 'No friends match your search.'
                      : "You haven't added any friends yet."}
                  </AppText>
                </View>
              )}
            </>
          )}

          {loadingFriends && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default AddFriends;
