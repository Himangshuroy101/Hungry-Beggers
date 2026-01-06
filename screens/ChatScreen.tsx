// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Modal, Animated, Pressable, Alert } from 'react-native';
// import { supabase } from '../lib/supabase';
// import { Ionicons } from '@expo/vector-icons';

// const REACTION_OPTIONS = ["🍕", "🔥", "❤️", "🤣", "👍", "😮"];

// export default function ChatScreen() {
//   const [messages, setMessages] = useState<any[]>([]);
//   const [isAdmin, setIsAdmin] = useState(false); // New state
//   const [newMessage, setNewMessage] = useState('');
//   const [replyTarget, setReplyTarget] = useState<any | null>(null); // Track message being replied to
//   const [userId, setUserId] = useState<string | null>(null);
//   const [userName, setUserName] = useState<string>('');
//   const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);

//   // Inside ChatScreen.tsx - Add these state variables
// const [orderStatus, setOrderStatus] = useState('Ordering');
// const [runnerName, setRunnerName] = useState('None');

//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const flatListRef = useRef<FlatList>(null);

//   // Inside useEffect - Add this Realtime listener
// useEffect(() => {
//   // 1. Initial Fetch
//   const fetchStatus = async () => {
//     const { data } = await supabase.from('app_settings').select('*');
//     data?.forEach(s => {
//       if (s.status_key === 'order_status') setOrderStatus(s.status_value);
//       if (s.status_key === 'current_runner_id') {
//         const name = s.status_value.split(':')[1] || 'None';
//         setRunnerName(name);
//       }
//     });
//   };
//   fetchStatus();

//   // 2. Realtime Listener
//   const settingsChannel = supabase.channel('chat-status-sync')
//     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
//       if (payload.new.status_key === 'order_status') setOrderStatus(payload.new.status_value);
//       if (payload.new.status_key === 'current_runner_id') {
//         const name = payload.new.status_value.split(':')[1] || 'None';
//         setRunnerName(name);
//       }
//     })
//     .subscribe();

//   return () => { supabase.removeChannel(settingsChannel); };
// }, []);

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       const user = data.user;
//       setUserId(data.user?.id || null);
//       setUserName(data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User');
//       // ADMIN CHECK: Replace with your actual admin email
//       if (user?.email === 'himangshuroy05@gmail.com') {
//         setIsAdmin(true);
//       }
//     });
//     fetchMessages();

//     const channel = supabase.channel('chat-room')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
//         if (payload.eventType === 'INSERT') {
//           setMessages((prev) => [...prev, payload.new]);
//         } else if (payload.eventType === 'UPDATE') {
//           setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m));
//         }else if (payload.eventType === 'DELETE') {
//         // If a specific ID was deleted, remove it.
//         // If the table was cleared, the local state should be cleared.
//         if (payload.old && payload.old.id) {
//           setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
//         } else {
//           setMessages([]);
//         }
//       }
//       })
//       .subscribe();

//     return () => { supabase.removeChannel(channel); };
//   }, []);

//   // NEW: Delete All Messages Function
//   const deleteAllMessages = () => {
//     Alert.alert(
//       "Clear All Chat?",
//       "This will permanently delete all messages to save database storage.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete Everything",
//           style: "destructive",
//           onPress: async () => {
//             const { error } = await supabase
//               .from('messages')
//               .delete()
//               .neq('id', 0); // Deletes all rows where ID is not 0

//             if (error) {
//               Alert.alert("Error", "Could not clear storage: " + error.message);
//             } else {
//               setMessages([]); // Clear local UI immediately
//               Alert.alert("Success", "Database storage cleared!");
//             }
//           }
//         }
//       ]
//     );
//   };

//   const fetchMessages = async () => {
//     const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
//     if (data) setMessages(data);
//   };

//   const toggleReaction = async (messageId: number, emoji: string) => {
//     const message = messages.find(m => m.id === messageId);
//     let reactions = { ...(message.reactions || {}) };
//     let userList = reactions[emoji] || [];
//     const myIndex = userList.findIndex((u: any) => u.id === userId);

//     if (myIndex > -1) {
//       userList.splice(myIndex, 1);
//       if (userList.length === 0) delete reactions[emoji];
//       else reactions[emoji] = userList;
//     } else {
//       userList.push({ id: userId, name: userName });
//       reactions[emoji] = userList;
//     }
//     await supabase.from('messages').update({ reactions }).eq('id', messageId);
//     closeReactionPicker();
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     const payload: any = {
//       text: newMessage,
//       user_id: userId,
//       user_name: userName,
//       reactions: {},
//     };

//     // If replying, attach the target message info
//     if (replyTarget) {
//       payload.reply_to = {
//         user_name: replyTarget.user_name,
//         text: replyTarget.text
//       };
//     }

//     await supabase.from('messages').insert(payload);
//     setNewMessage('');
//     setReplyTarget(null);
//   };

//   const openReactionPicker = (id: number) => {
//     setSelectedMessageId(id);
//     Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
//   };

//   const closeReactionPicker = () => {
//     Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setSelectedMessageId(null));
//   };

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>

//       <View style={[styles.statusBar, { backgroundColor: orderStatus === 'Food is Here' ? '#2ecc71' : '#E23744' }]}>
//       <Text style={styles.statusText}>🚀 {orderStatus.toUpperCase()}</Text>
//       <Text style={styles.runnerText}>SAVIOR: {runnerName} 😇</Text>
//     </View>
//         {/* NEW: Admin Header Bar inside the screen */}
//       {isAdmin && (
//         <View style={styles.adminBar}>
//           <Text style={styles.adminText}>Admin Storage Control</Text>
//           <TouchableOpacity onPress={deleteAllMessages}>
//             <Ionicons name="trash-outline" size={24} color="#E23744" />
//           </TouchableOpacity>
//         </View>
//       )}
//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         keyExtractor={(item) => item.id.toString()}
//         onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             onLongPress={() => openReactionPicker(item.id)}
//             activeOpacity={0.9}
//             style={[styles.msgContainer, item.user_id === userId ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}
//           >
//             <View style={[styles.msgBox, item.user_id === userId ? styles.myMsg : styles.theirMsg]}>
//               <View style={styles.msgHeader}>
//                 <Text style={styles.userName}>{item.user_name}</Text>
//                 <TouchableOpacity onPress={() => setReplyTarget(item)}>
//                   <Ionicons name="arrow-undo-outline" size={16} color="#8e8e93" />
//                 </TouchableOpacity>
//               </View>

//               {/* Show Quoted Reply */}
//               {item.reply_to && (
//                 <View style={styles.replyQuote}>
//                   <Text style={styles.replyUserName}>{item.reply_to.user_name}</Text>
//                   <Text numberOfLines={1} style={styles.replyText}>{item.reply_to.text}</Text>
//                 </View>
//               )}

//               <Text style={[styles.msgText, item.user_id === userId && {color: '#fff'}]}>{item.text}</Text>

//               {/* Reactions UI */}
//               {Object.keys(item.reactions || {}).length > 0 && (
//                 <View style={styles.reactionRow}>
//                   {Object.entries(item.reactions).map(([emoji, reactors]: any) => {
//                     const iReacted = reactors.some((u: any) => u.id === userId);
//                     return (
//                       <TouchableOpacity key={emoji} onPress={() => iReacted ? toggleReaction(item.id, emoji) : Alert.alert(`${emoji} by`, reactors.map((r:any)=>r.name).join(', '))} style={[styles.reactionBadge, iReacted && styles.myReactionBadge]}>
//                         <Text style={{ fontSize: 12 }}>{emoji} {reactors.length}</Text>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>
//               )}
//             </View>
//           </TouchableOpacity>
//         )}
//       />

//       {/* Reply Preview UI */}
//       {replyTarget && (
//         <View style={styles.replyPreviewContainer}>
//           <View style={styles.replyBar} />
//           <View style={{ flex: 1, paddingLeft: 10 }}>
//             <Text style={styles.replyPreviewTitle}>Replying to {replyTarget.user_name}</Text>
//             <Text numberOfLines={1} style={styles.replyPreviewText}>{replyTarget.text}</Text>
//           </View>
//           <TouchableOpacity onPress={() => setReplyTarget(null)}>
//             <Ionicons name="close-circle" size={24} color="#8e8e93" />
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.inputRow}>
//         <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="Hungry thoughts..." />
//         <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
//           <Ionicons name="send" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Reaction Picker Modal */}
//       <Modal transparent visible={!!selectedMessageId} animationType="none">
//         <Pressable style={styles.modalOverlay} onPress={closeReactionPicker}>
//           <Animated.View style={[styles.reactionPicker, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
//             {REACTION_OPTIONS.map((emoji) => (
//               <TouchableOpacity key={emoji} onPress={() => toggleReaction(selectedMessageId!, emoji)} style={styles.emojiBtn}>
//                 <Text style={styles.emojiText}>{emoji}</Text>
//               </TouchableOpacity>
//             ))}
//           </Animated.View>
//         </Pressable>
//       </Modal>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   msgContainer: { marginVertical: 4, marginHorizontal: 12 },
//   msgBox: { padding: 12, borderRadius: 18, maxWidth: '85%', elevation: 2 },
//   msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
//   myMsg: { backgroundColor: '#E23744' },
//   theirMsg: { backgroundColor: '#fff' },
//   userName: { fontSize: 11, fontWeight: '700', color: '#8e8e93' },
//   msgText: { fontSize: 16 },

//   // Quoted Reply Styling
//   replyQuote: { backgroundColor: 'rgba(0,0,0,0.05)', borderLeftWidth: 4, borderLeftColor: '#ff6347', padding: 6, borderRadius: 6, marginBottom: 6 },
//   replyUserName: { fontSize: 10, fontWeight: 'bold', color: '#ff6347' },
//   replyText: { fontSize: 12, color: '#666' },

//   // Input Preview Styling
//   replyPreviewContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#f9f9f9', borderTopWidth: 1, borderColor: '#eee', alignItems: 'center' },
//   replyBar: { width: 4, height: '100%', backgroundColor: '#E23744', borderRadius: 2 },
//   replyPreviewTitle: { fontSize: 12, fontWeight: 'bold', color: '#E23744' },
//   replyPreviewText: { fontSize: 12, color: '#666' },

//   reactionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
//   reactionBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, borderWidth: 1, borderColor: '#eee' },
//   myReactionBadge: { borderColor: '#E23744', backgroundColor: '#fff5f5' },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
//   reactionPicker: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 8, elevation: 10 },
//   emojiBtn: { padding: 8 },
//   emojiText: { fontSize: 28 },
//   inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
//   input: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 25, paddingHorizontal: 18, height: 45 },
//   sendBtn: { marginLeft: 10, backgroundColor: '#E23744', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
//   adminBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//   },
//   adminText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: '#8e8e93',
//     textTransform: 'uppercase',
//   },
//   statusBar: {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   padding: 10,
//   paddingHorizontal: 15,
// },
// statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
// runnerText: { color: '#fff', fontSize: 12, fontStyle: 'italic', fontWeight: '600' },
// });

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Pressable,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

const REACTION_OPTIONS = ["🍕", "🔥", "❤️", "🤣", "👍", "😮"];

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null
  );

  // Status & Poll States
  const [orderStatus, setOrderStatus] = useState("Ordering");
  const [runnerName, setRunnerName] = useState("None");
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // 1. Add these new states for the "View Votes" feature
  const [votesModalVisible, setVotesModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial Fetch for Status and Polls
    const fetchInitialData = async () => {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("*");
      settings?.forEach((s) => {
        if (s.status_key === "order_status") setOrderStatus(s.status_value);
        if (s.status_key === "current_runner_id") {
          const name = s.status_value.split(":")[1] || "None";
          setRunnerName(name);
        }
      });

      // Fetch the latest poll
      const { data: pollData } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (pollData) setActivePoll(pollData);
    };
    fetchInitialData();

    // Realtime for Status and Polls
    const syncChannel = supabase
      .channel("chat-extras-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          if (payload.new.status_key === "order_status")
            setOrderStatus(payload.new.status_value);
          if (payload.new.status_key === "current_runner_id") {
            const name = payload.new.status_value.split(":")[1] || "None";
            setRunnerName(name);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        (payload) => {
          // UPDATED LOGIC HERE:
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setActivePoll(payload.new);
          } else if (payload.eventType === "DELETE") {
            // This tells all other users to clear the poll from their screen immediately
            setActivePoll(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUserId(user?.id || null);
      setUserName(
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
      );
      if (user?.email === "himangshuroy05@gmail.com") {
        setIsAdmin(true);
      }
    });
    fetchMessages();

    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          } else if (payload.eventType === "DELETE") {
            if (payload.old && payload.old.id) {
              setMessages((prev) =>
                prev.filter((m) => m.id !== payload.old.id)
              );
            } else {
              setMessages([]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // const deleteAllMessages = () => {
  //   Alert.alert(
  //     "Clear All Chat?",
  //     "This will permanently delete all messages to save database storage.",
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Delete Everything",
  //         style: "destructive",
  //         onPress: async () => {
  //           const { error } = await supabase.from('messages').delete().neq('id', 0);
  //           if (error) {
  //             Alert.alert("Error", "Could not clear storage: " + error.message);
  //           } else {
  //             setMessages([]);
  //             Alert.alert("Success", "Database storage cleared!");
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };

  // 5. Updated deleteAllMessages to also clear polls [Requirement 2]
  const deleteAllMessages = () => {
    Alert.alert(
      "Clear All Chat?",
      "This will delete all messages and the current poll.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await supabase.from("messages").delete().neq("id", 0); //
            await supabase.from("polls").delete().neq("id", 0); // Clear polls
            setMessages([]); //
            setActivePoll(null);
            Alert.alert("Success", "Database storage cleared!");
          },
        },
      ]
    );
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  // 2. Updated createPoll to include user ID
  const createPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some((opt) => !opt.trim())) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    const optionsObj: any = {};
    pollOptions.forEach((opt) => {
      optionsObj[opt] = [];
    }); // Changed to array to track names

    const { error } = await supabase.from("polls").insert({
      question: pollQuestion,
      options: optionsObj,
      voters: [],
      created_by: userId, // To track owner
    });

    if (!error) {
      setPollModalVisible(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    }
  };

  // 3. Updated handleVote to allow withdrawal/re-vote
  const handleVote = async (option: string) => {
    let updatedOptions = { ...activePoll.options };
    let updatedVoters = [...activePoll.voters];

    // Check if user already voted
    const alreadyVoted = activePoll.voters.includes(userId);

    if (alreadyVoted) {
      // WITHDRAW logic: Remove user from all options first
      updatedVoters = updatedVoters.filter((id) => id !== userId);
      Object.keys(updatedOptions).forEach((opt) => {
        updatedOptions[opt] = updatedOptions[opt].filter(
          (u: any) => u.id !== userId
        );
      });

      // If they clicked the SAME option, they just wanted to withdraw
      const userHadThisOption = activePoll.options[option].some(
        (u: any) => u.id === userId
      );
      if (userHadThisOption) {
        await supabase
          .from("polls")
          .update({ options: updatedOptions, voters: updatedVoters })
          .eq("id", activePoll.id);
        return;
      }
    }

    // RE-VOTE logic: Add to new option
    updatedVoters.push(userId);
    updatedOptions[option].push({ id: userId, name: userName });

    await supabase
      .from("polls")
      .update({ options: updatedOptions, voters: updatedVoters })
      .eq("id", activePoll.id);
  };

  // 4. Function to remove poll [Requirement 1]
  const deletePoll = async () => {
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", activePoll.id);
    if (error)
      Alert.alert("Error", "You don't have permission to delete this poll.");
    else setActivePoll(null);
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
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
    await supabase.from("messages").update({ reactions }).eq("id", messageId);
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
    if (replyTarget)
      payload.reply_to = {
        user_name: replyTarget.user_name,
        text: replyTarget.text,
      };
    await supabase.from("messages").insert(payload);
    setNewMessage("");
    setReplyTarget(null);
  };

  const openReactionPicker = (id: number) => {
    setSelectedMessageId(id);
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const closeReactionPicker = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setSelectedMessageId(null));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor:
              orderStatus === "Food is Here" ? "#2ecc71" : "#E23744",
          },
        ]}
      >
        <Text style={styles.statusText}>🚀 {orderStatus.toUpperCase()}</Text>
        <Text style={styles.runnerText}>SAVIOR: {runnerName} 😇</Text>
      </View>

      {/* Admin Control Bar */}
      {isAdmin && (
        <View style={styles.adminBar}>
          <Text style={styles.adminText}>Admin Storage Control</Text>
          <TouchableOpacity onPress={deleteAllMessages}>
            <Ionicons name="trash-outline" size={24} color="#E23744" />
          </TouchableOpacity>
        </View>
      )}

      {/* Poll Display */}
      {activePoll && (
        <View style={styles.pollContainer}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.pollTitle}>🗳️ {activePoll.question}</Text>
            {(isAdmin || activePoll.created_by === userId) && (
              <TouchableOpacity onPress={deletePoll}>
                <Ionicons name="close-circle" size={20} color="#8e8e93" />
              </TouchableOpacity>
            )}
          </View>

          {Object.entries(activePoll.options).map(([option, users]: any) => {
            const iVoted = users.some((u: any) => u.id === userId);
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pollOptionBtn,
                  iVoted && { borderColor: "#E23744", borderWidth: 1 },
                ]}
                onPress={() => handleVote(option)}
              >
                <Text style={styles.pollOptionText}>{option}</Text>
                <Text style={styles.pollCount}>{users.length}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => setVotesModalVisible(true)}
            style={{ marginTop: 10 }}
          >
            <Text
              style={{
                color: "#E23744",
                fontSize: 12,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              VIEW VOTES
            </Text>
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
            style={[
              styles.msgContainer,
              item.user_id === userId
                ? { alignItems: "flex-end" }
                : { alignItems: "flex-start" },
            ]}
          >
            <View
              style={[
                styles.msgBox,
                item.user_id === userId ? styles.myMsg : styles.theirMsg,
              ]}
            >
              <View style={styles.msgHeader}>
                <Text style={styles.userName}>{item.user_name}</Text>
                <TouchableOpacity onPress={() => setReplyTarget(item)}>
                  <Ionicons
                    name="arrow-undo-outline"
                    size={16}
                    color="#8e8e93"
                  />
                </TouchableOpacity>
              </View>

              {item.reply_to && (
                <View style={styles.replyQuote}>
                  <Text style={styles.replyUserName}>
                    {item.reply_to.user_name}
                  </Text>
                  <Text numberOfLines={1} style={styles.replyText}>
                    {item.reply_to.text}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.msgText,
                  item.user_id === userId && { color: "#fff" },
                ]}
              >
                {item.text}
              </Text>

              {Object.keys(item.reactions || {}).length > 0 && (
                <View style={styles.reactionRow}>
                  {Object.entries(item.reactions).map(
                    ([emoji, reactors]: any) => {
                      const iReacted = reactors.some(
                        (u: any) => u.id === userId
                      );
                      return (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() =>
                            iReacted
                              ? toggleReaction(item.id, emoji)
                              : Alert.alert(
                                  `${emoji} by`,
                                  reactors.map((r: any) => r.name).join(", ")
                                )
                          }
                          style={[
                            styles.reactionBadge,
                            iReacted && styles.myReactionBadge,
                          ]}
                        >
                          <Text style={{ fontSize: 12 }}>
                            {emoji} {reactors.length}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {replyTarget && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyBar} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.replyPreviewTitle}>
              Replying to {replyTarget.user_name}
            </Text>
            <Text numberOfLines={1} style={styles.replyPreviewText}>
              {replyTarget.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTarget(null)}>
            <Ionicons name="close-circle" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Row with Poll Creator Button [New Feature] */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={() => setPollModalVisible(true)}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="add-circle-outline" size={28} color="#E23744" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Hungry thoughts..."
          placeholderTextColor={'#888'}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Poll Creation Modal [New Feature] */}
      <Modal visible={pollModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pollModal}>
            <Text style={styles.modalTitle}>Create Food Poll 🍔</Text>
            <TextInput
              style={styles.pollInput}
              placeholder="What are we eating?"
              placeholderTextColor={'#888'}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />
            {pollOptions.map((opt, i) => (
              <TextInput
                key={i}
                style={styles.pollInput}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={'#888'}
                value={opt}
                onChangeText={(t) => {
                  const n = [...pollOptions];
                  n[i] = t;
                  setPollOptions(n);
                }}
              />
            ))}
            <TouchableOpacity
              onPress={() => setPollOptions([...pollOptions, ""])}
            >
              <Text
                style={{
                  color: "#E23744",
                  marginBottom: 15,
                  fontWeight: "bold",
                }}
              >
                + Add Option
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createPoll} style={styles.launchBtn}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Launch Poll
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPollModalVisible(false)}>
              <Text style={{ marginTop: 15, color: "#666" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!selectedMessageId} animationType="none">
        <Pressable style={styles.modalOverlay} onPress={closeReactionPicker}>
          <Animated.View
            style={[
              styles.reactionPicker,
              { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
            ]}
          >
            {REACTION_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => toggleReaction(selectedMessageId!, emoji)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* View Votes Modal [Requirement 3] */}
      <Modal visible={votesModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pollModal}>
            <Text style={styles.modalTitle}>Who voted for what?</Text>
            <FlatList
              data={Object.entries(activePoll?.options || {})}
              renderItem={({ item }: any) => (
                <View style={{ marginBottom: 10, width: "100%" }}>
                  <Text style={{ fontWeight: "bold", color: "#E23744" }}>
                    {item[0]}:
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666" }}>
                    {item[1].map((u: any) => u.name).join(", ") ||
                      "No votes yet"}
                  </Text>
                </View>
              )}
            />
            <TouchableOpacity
              onPress={() => setVotesModalVisible(false)}
              style={styles.launchBtn}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  msgContainer: { marginVertical: 4, marginHorizontal: 12 },
  msgBox: { padding: 12, borderRadius: 18, maxWidth: "85%", elevation: 2 },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  myMsg: { backgroundColor: "#E23744" },
  theirMsg: { backgroundColor: "#fff" },
  userName: { fontSize: 11, fontWeight: "700", color: "#8e8e93" },
  msgText: { fontSize: 16 },
  replyQuote: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderLeftWidth: 4,
    borderLeftColor: "#ff6347",
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  replyUserName: { fontSize: 10, fontWeight: "bold", color: "#ff6347" },
  replyText: { fontSize: 12, color: "#666" },
  replyPreviewContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  replyBar: {
    width: 4,
    height: "100%",
    backgroundColor: "#E23744",
    borderRadius: 2,
  },
  replyPreviewTitle: { fontSize: 12, fontWeight: "bold", color: "#E23744" },
  replyPreviewText: { fontSize: 12, color: "#666" },
  reactionRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  reactionBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  myReactionBadge: { borderColor: "#E23744", backgroundColor: "#fff5f5" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 8,
    elevation: 10,
  },
  emojiBtn: { padding: 8 },
  emojiText: { fontSize: 28 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    borderRadius: 25,
    paddingHorizontal: 18,
    height: 45,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#E23744",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  adminBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  adminText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8e8e93",
    textTransform: "uppercase",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    paddingHorizontal: 15,
  },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  runnerText: {
    color: "#fff",
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "600",
  },

  // New Poll Styles
  pollContainer: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },
  pollTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  pollOptionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 5,
  },
  pollOptionText: { fontSize: 14 },
  pollCount: { fontWeight: "bold", color: "#E23744" },
  pollModal: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  pollInput: {
    width: "100%",
    backgroundColor: "#f2f2f7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  launchBtn: {
    backgroundColor: "#E23744",
    padding: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
});
