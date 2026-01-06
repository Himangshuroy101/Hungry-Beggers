// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
// import { supabase } from '../lib/supabase';
// import { Ionicons } from '@expo/vector-icons';

// export default function MenuScreen() {
//   const [items, setItems] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false); // New state for refresh
//   const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

//   // useEffect(() => {
//   //   fetchMenuAndOrders();
//   // }, []);

//   useEffect(() => {
//   // 1. Initial fetch of the menu and user's current orders
//   fetchMenuAndOrders();

//   // 2. Realtime subscription for the MENU items
//   const menuChannel = supabase
//     .channel('menu-changes')
//     .on(
//       'postgres_changes',
//       { event: '*', schema: 'public', table: 'food_items' },
//       (payload) => {
//         console.log('Menu change detected!', payload);
//         fetchMenuAndOrders(); // Refresh the list when Admin makes a change
//       }
//     )
//     .subscribe();

//   // 3. Cleanup subscription on unmount
//   return () => {
//     supabase.removeChannel(menuChannel);
//   };
// }, []);

//   async function fetchMenuAndOrders() {
//     setLoading(true);
//     const { data: { user } } = await supabase.auth.getUser();
    
//     // 1. Fetch the Menu
//     const { data: menuData } = await supabase.from('food_items').select('*');
    
//     // 2. Fetch User's current orders to set initial counts
//     const { data: orderData } = await supabase
//       .from('daily_orders')
//       .select('item_id, quantity')
//       .eq('user_id', user?.id);

//     const counts: any = {};
//     orderData?.forEach(order => {
//       counts[order.item_id] = order.quantity;
//     });

//     setQuantities(counts);
//     setItems(menuData || []);
//     setLoading(false);
//   }

//   async function updateQuantity(itemId: string, itemName: string, change: number) {
//   const currentQty = quantities[itemId] || 0;
//   const newQty = currentQty + change;

//   if (newQty < 0) return;

//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return;

//   if (newQty === 0) {
//     // If quantity is 0, delete the row
//     await supabase
//       .from('daily_orders')
//       .delete()
//       .eq('item_id', itemId)
//       .eq('user_id', user.id);
//   } else {
//     // UPSERT logic
//    const { error } = await supabase.from('daily_orders').upsert(
//   {
//     item_id: itemId,
//     user_id: user.id, // Must match auth.uid()
//     user_name: user.user_metadata?.full_name || user.email,
//     quantity: newQty,
//   },
//   { onConflict: 'user_id,item_id' }
// );

//     if (error) {
//       console.error("Upsert Error:", error);
//       Alert.alert("Error", "Could not update quantity. Check console.");
//       return;
//     }
//   }

//   // Update local UI state
//   setQuantities({ ...quantities, [itemId]: newQty });
// }

//   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#ff6347" />;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Select your food 🍔</Text>
//       <FlatList
//         data={items}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <View>
//               <Text style={styles.itemName}>{item.name}</Text>
//               <Text style={styles.itemPrice}>${item.price}</Text>
//             </View>
            
//             <View style={styles.counterContainer}>
//               <TouchableOpacity onPress={() => updateQuantity(item.id, item.name, -1)}>
//                 <Ionicons name="remove-circle-outline" size={32} color="#ff6347" />
//               </TouchableOpacity>
              
//               <Text style={styles.quantityText}>{quantities[item.id] || 0}</Text>
              
//               <TouchableOpacity onPress={() => updateQuantity(item.id, item.name, 1)}>
//                 <Ionicons name="add-circle" size={32} color="#ff6347" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: '#fff' },
//   header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
//   card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#f8f9fa', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
//   itemName: { fontSize: 18, fontWeight: '600' },
//   itemPrice: { color: '#666' },
//   counterContainer: { flexDirection: 'row', alignItems: 'center' },
//   quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, minWidth: 20, textAlign: 'center' }
// });

import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Vibration,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function MenuScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for refresh
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  

  // NEW: Track the live status from app_settings
  const [orderStatus, setOrderStatus] = useState('Ordering');

  // useEffect(() => {
  //   fetchMenuAndOrders();

  //   // Realtime subscription for the MENU items
  //   const menuChannel = supabase
  //     .channel('menu-changes')
  //     .on(
  //       'postgres_changes',
  //       { event: '*', schema: 'public', table: 'food_items' },
  //       () => fetchMenuAndOrders() 
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(menuChannel);
  //   };
  // }, []);


// Inside MenuScreen.tsx

useEffect(() => {
  // 1. Initial Data Load
  fetchMenuAndOrders();
  fetchCurrentStatus();

  // 2. Optimized Stable Channel
  const menuChannel = supabase
    .channel('menu_locking_system') // Use underscores, some versions of Realtime prefer them
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'food_items' },
      () => fetchMenuAndOrders()
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'status_key=eq.order_status' },
      (payload) => {
        console.log("Menu Received Status Update:", payload.new.status_value);
          const newStatus = payload.new.status_value;
          
          // 3. Trigger Vibration if status is "Food is Here"
          if (newStatus === "Food is Here") {
            // Pattern: Wait 0ms, vibrate 500ms, wait 200ms, vibrate 500ms
            const ONE_SECOND_IN_MS = 1000;
            const PATTERN = [0, 500, 200, 500]; 
            Vibration.vibrate(PATTERN);
            
            Alert.alert("Snack Attack! 🍕", "The runner has arrived with the snacks!");
          }

          setOrderStatus(newStatus);
        }
      )
    .subscribe((status) => {
      console.log("Menu Channel Sync Status:", status);
      // If we re-connected after an error, pull the status again to be safe
      if (status === 'SUBSCRIBED') {
        fetchCurrentStatus();
      }
    });

  return () => {
    supabase.removeChannel(menuChannel);
  };
}, []);

// Simplified lock check to ensure strict string matching
const isLocked = orderStatus === 'At Store' || orderStatus === 'Food is Here';

  const fetchCurrentStatus = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('status_value')
      .eq('status_key', 'order_status')
      .single();
    if (data) setOrderStatus(data.status_value);
  };
  
  const fetchMenuAndOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: menuData } = await supabase.from('food_items').select('*').order('name');
    
    const { data: orderData } = await supabase
      .from('daily_orders')
      .select('item_id, quantity')
      .eq('user_id', user?.id);

    const counts: any = {};
    orderData?.forEach(order => {
      counts[order.item_id] = order.quantity;
    });

    setQuantities(counts);
    setItems(menuData || []);
    setLoading(false);
    setRefreshing(false); // Stop the spinner
  };

  // // NEW: Boolean to determine if buttons should be locked
  // const isLocked = orderStatus === 'At Store' || orderStatus === 'Food is Here';

  // Function called when user pulls down
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMenuAndOrders();
  }, []);

  async function updateQuantity(itemId: string, itemName: string, change: number) {
    const currentQty = quantities[itemId] || 0;
    const newQty = currentQty + change;
    // Prevent execution if locked
    if (isLocked) {
      Alert.alert("Closed", "The runner is already at the store!");
      return;
    }
    if (newQty < 0) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (newQty === 0) {
      await supabase.from('daily_orders').delete().eq('item_id', itemId).eq('user_id', user?.id);
    } else {
      await supabase.from('daily_orders').upsert({
        item_id: itemId,
        user_id: user?.id,
        user_name: user?.user_metadata?.full_name || user?.email,
        quantity: newQty,
      }, { onConflict: 'user_id,item_id' });
    }

    setQuantities({ ...quantities, [itemId]: newQty });
  }

  

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#ff6347" />;

  return (
    <View style={styles.container}>
      {isLocked && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockText}>🚫 Ordering is closed for today</Text>
        </View>
      )}
      <Text style={styles.header}>Select your food 🍔</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#ff6347']} // Android spinner color
            tintColor={'#ff6347'} // iOS spinner color
          />
        }
       renderItem={({ item }) => (
          <View style={[styles.card, isLocked && { opacity: 0.6 }]}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                onPress={() => updateQuantity(item.id, item.name, -1)}
                disabled={isLocked} // Disable button interaction
              >
                <Ionicons 
                  name="remove-circle-outline" 
                  size={32} 
                  color={isLocked ? "#ccc" : "#ff6347"} 
                />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantities[item.id] || 0}</Text>
              
              <TouchableOpacity 
                onPress={() => updateQuantity(item.id, item.name, 1)}
                disabled={isLocked} // Disable button interaction
              >
                <Ionicons 
                  name="add-circle" 
                  size={32} 
                  color={isLocked ? "#ccc" : "#ff6347"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 0 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#f8f9fa', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  itemName: { fontSize: 18, fontWeight: '600' },
  itemPrice: { color: '#666' },
  counterContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  lockBanner: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  lockText: { color: '#fff', fontWeight: 'bold' }
});