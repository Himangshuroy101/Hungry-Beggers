import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Modal, Animated, Pressable, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const REACTION_OPTIONS = ["🍕", "🔥", "❤️", "🤣", "👍", "😮"];

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // New state
  const [newMessage, setNewMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState<any | null>(null); // Track message being replied to
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUserId(data.user?.id || null);
      setUserName(data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User');
      // ADMIN CHECK: Replace with your actual admin email
      if (user?.email === 'himangshuroy05@gmail.com') {
        setIsAdmin(true);
      }
    });
    fetchMessages();

    const channel = supabase.channel('chat-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m));
        }else if (payload.eventType === 'DELETE') {
        // If a specific ID was deleted, remove it. 
        // If the table was cleared, the local state should be cleared.
        if (payload.old && payload.old.id) {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        } else {
          setMessages([]);
        }
      }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // NEW: Delete All Messages Function
  const deleteAllMessages = () => {
    Alert.alert(
      "Clear All Chat?",
      "This will permanently delete all messages to save database storage.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase
              .from('messages')
              .delete()
              .neq('id', 0); // Deletes all rows where ID is not 0

            if (error) {
              Alert.alert("Error", "Could not clear storage: " + error.message);
            } else {
              setMessages([]); // Clear local UI immediately
              Alert.alert("Success", "Database storage cleared!");
            }
          }
        }
      ]
    );
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    let reactions = { ...(message.reactions || {}) };
    let userList = reactions[emoji] || [];
    const myIndex = userList.findIndex((u: any) => u.id === userId);

    if (myIndex > -1) {
      userList.splice(myIndex, 1);
      if (userList.length === 0) delete reactions[emoji];
      else reactions[emoji] = userList;
    } else {
      userList.push({ id: userId, name: userName });
      reactions[emoji] = userList;
    }
    await supabase.from('messages').update({ reactions }).eq('id', messageId);
    closeReactionPicker();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const payload: any = {
      text: newMessage,
      user_id: userId,
      user_name: userName,
      reactions: {},
    };

    // If replying, attach the target message info
    if (replyTarget) {
      payload.reply_to = {
        user_name: replyTarget.user_name,
        text: replyTarget.text
      };
    }

    await supabase.from('messages').insert(payload);
    setNewMessage('');
    setReplyTarget(null);
  };

  const openReactionPicker = (id: number) => {
    setSelectedMessageId(id);
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const closeReactionPicker = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setSelectedMessageId(null));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        {/* NEW: Admin Header Bar inside the screen */}
      {isAdmin && (
        <View style={styles.adminBar}>
          <Text style={styles.adminText}>Admin Storage Control</Text>
          <TouchableOpacity onPress={deleteAllMessages}>
            <Ionicons name="trash-outline" size={24} color="#E23744" />
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onLongPress={() => openReactionPicker(item.id)}
            activeOpacity={0.9}
            style={[styles.msgContainer, item.user_id === userId ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}
          >
            <View style={[styles.msgBox, item.user_id === userId ? styles.myMsg : styles.theirMsg]}>
              <View style={styles.msgHeader}>
                <Text style={styles.userName}>{item.user_name}</Text>
                <TouchableOpacity onPress={() => setReplyTarget(item)}>
                  <Ionicons name="arrow-undo-outline" size={16} color="#8e8e93" />
                </TouchableOpacity>
              </View>

              {/* Show Quoted Reply */}
              {item.reply_to && (
                <View style={styles.replyQuote}>
                  <Text style={styles.replyUserName}>{item.reply_to.user_name}</Text>
                  <Text numberOfLines={1} style={styles.replyText}>{item.reply_to.text}</Text>
                </View>
              )}

              <Text style={[styles.msgText, item.user_id === userId && {color: '#fff'}]}>{item.text}</Text>
              
              {/* Reactions UI */}
              {Object.keys(item.reactions || {}).length > 0 && (
                <View style={styles.reactionRow}>
                  {Object.entries(item.reactions).map(([emoji, reactors]: any) => {
                    const iReacted = reactors.some((u: any) => u.id === userId);
                    return (
                      <TouchableOpacity key={emoji} onPress={() => iReacted ? toggleReaction(item.id, emoji) : Alert.alert(`${emoji} by`, reactors.map((r:any)=>r.name).join(', '))} style={[styles.reactionBadge, iReacted && styles.myReactionBadge]}>
                        <Text style={{ fontSize: 12 }}>{emoji} {reactors.length}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Reply Preview UI */}
      {replyTarget && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyBar} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.replyPreviewTitle}>Replying to {replyTarget.user_name}</Text>
            <Text numberOfLines={1} style={styles.replyPreviewText}>{replyTarget.text}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTarget(null)}>
            <Ionicons name="close-circle" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="Hungry thoughts..." />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Reaction Picker Modal */}
      <Modal transparent visible={!!selectedMessageId} animationType="none">
        <Pressable style={styles.modalOverlay} onPress={closeReactionPicker}>
          <Animated.View style={[styles.reactionPicker, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
            {REACTION_OPTIONS.map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => toggleReaction(selectedMessageId!, emoji)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  msgContainer: { marginVertical: 4, marginHorizontal: 12 },
  msgBox: { padding: 12, borderRadius: 18, maxWidth: '85%', elevation: 2 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  myMsg: { backgroundColor: '#E23744' },
  theirMsg: { backgroundColor: '#fff' },
  userName: { fontSize: 11, fontWeight: '700', color: '#8e8e93' },
  msgText: { fontSize: 16 },
  
  // Quoted Reply Styling
  replyQuote: { backgroundColor: 'rgba(0,0,0,0.05)', borderLeftWidth: 4, borderLeftColor: '#ff6347', padding: 6, borderRadius: 6, marginBottom: 6 },
  replyUserName: { fontSize: 10, fontWeight: 'bold', color: '#ff6347' },
  replyText: { fontSize: 12, color: '#666' },

  // Input Preview Styling
  replyPreviewContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#f9f9f9', borderTopWidth: 1, borderColor: '#eee', alignItems: 'center' },
  replyBar: { width: 4, height: '100%', backgroundColor: '#E23744', borderRadius: 2 },
  replyPreviewTitle: { fontSize: 12, fontWeight: 'bold', color: '#E23744' },
  replyPreviewText: { fontSize: 12, color: '#666' },

  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  reactionBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, borderWidth: 1, borderColor: '#eee' },
  myReactionBadge: { borderColor: '#E23744', backgroundColor: '#fff5f5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  reactionPicker: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 8, elevation: 10 },
  emojiBtn: { padding: 8 },
  emojiText: { fontSize: 28 },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 25, paddingHorizontal: 18, height: 45 },
  sendBtn: { marginLeft: 10, backgroundColor: '#E23744', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  adminBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  adminText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8e8e93',
    textTransform: 'uppercase',
  }
});