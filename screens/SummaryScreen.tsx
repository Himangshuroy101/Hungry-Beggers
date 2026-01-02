// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { supabase } from '../lib/supabase';

// interface AggregatedItem {
//   name: string;
//   count: number;
// }

// export default function SummaryScreen() {
//   const [summary, setSummary] = useState<AggregatedItem[]>([]);

//  useEffect(() => {
//   fetchAndGroupOrders();

//   const channel = supabase
//     .channel('daily-orders-channel')
//     .on(
//       'postgres_changes',
//       { event: '*', schema: 'public', table: 'daily_orders' },
//       (payload) => {
//         console.log('Change detected:', payload.eventType);
//         fetchAndGroupOrders(); // This refreshes the list
//       }
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, []);

//  // Inside fetchAndGroupOrders
// async function fetchAndGroupOrders() {
//   const { data, error } = await supabase
//     .from('daily_orders')
//     .select(`
//       quantity,
//       user_name,
//       food_items (name, price)
//     `);

//   if (error) return;

//   let totalCost = 0;
//   const grouped: any = {};

//   data.forEach((order: any) => {
//     const itemName = order.food_items.name;
//     const price = order.food_items.price;
//     totalCost += order.quantity * price;

//     if (!grouped[itemName]) {
//       grouped[itemName] = { total: 0, customers: [] };
//     }
//     grouped[itemName].total += order.quantity;
//     grouped[itemName].customers.push(`${order.user_name} (${order.quantity})`);
//   });

//   setSummary(Object.keys(grouped).map(key => ({
//     name: key,
//     count: grouped[key].total,
//     who: grouped[key].customers.join(", "),
//   })));
//   setTotal(totalCost);
// }
//  async function clearOrders() {
//   Alert.alert(
//     "Reset List",
//     "This will delete all current orders for everyone. Are you sure?",
//     [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes, Reset",
//         style: "destructive",
//         onPress: async () => {
//           // Use .gt('created_at', '2000-01-01') as a reliable way to catch all rows
//           const { error } = await supabase
//             .from('daily_orders')
//             .delete()
//             .neq('id', '00000000-0000-0000-0000-000000000000'); // This matches your logic but ensure RLS is on

//           if (error) {
//             Alert.alert("Error", error.message);
//             console.log("Delete error:", error);
//           } else {
//             // Manually clear the local state so the UI updates immediately
//             setSummary([]);
//             Alert.alert("Success", "The list has been cleared.");
//           }
//         }
//       }
//     ]
//   );
// }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Shopping List 🛒</Text>

//       {summary.length === 0 ? (
//         <Text style={styles.emptyText}>No orders yet. Wait for the team!</Text>
//       ) : (
//         <FlatList
//           data={summary}
//           keyExtractor={(item) => item.name}
//           renderItem={({ item }) => (
//             <View style={styles.summaryCard}>
//               <Text style={styles.itemName}>{item.name}</Text>
//               <View style={styles.badge}>
//                 <Text style={styles.badgeText}>x {item.count}</Text>
//               </View>
//             </View>
//           )}
//         />
//       )}

//       <TouchableOpacity style={styles.resetButton} onPress={clearOrders}>
//         <Text style={styles.resetButtonText}>Clear Orders for Tomorrow</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: '#fff' },
//   header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, color: '#1a1a1a' },
//   summaryCard: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     marginBottom: 12,
//     elevation: 3, // Shadow for Android
//     shadowColor: '#000', // Shadow for iOS
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   itemName: { fontSize: 18, fontWeight: '500' },
//   badge: { backgroundColor: '#ff6347', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
//   badgeText: { color: '#fff', fontWeight: 'bold' },
//   emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
//   resetButton: { marginTop: 20, padding: 15, alignItems: 'center' },
//   resetButtonText: { color: '#ff6347', fontWeight: '600' }
// });

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function SummaryScreen() {
  const [summary, setSummary] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  const [orderStatus, setOrderStatus] = useState("Ordering");
  const [currentRunnerId, setCurrentRunnerId] = useState("none");
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Improved Status Color Helper
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Ordering":
        return { bg: "#2ecc71", icon: "📝" };
      case "At Store":
        return { bg: "#f1c40f", icon: "🛒" };
      case "Food is Here":
        return { bg: "#e67e22", icon: "🍕" };
      default:
        return { bg: "#95a5a6", icon: "❓" };
    }
  };

  useEffect(() => {
    // 1. Initial Load
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id || null));
    fetchDetailedOrders();
    fetchAppSettings();

    // 2. Stable Single Channel for EVERYTHING
    const mainChannel = supabase
      .channel("office-wide-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_orders" },
        (payload) => {
          console.log("Order change detected:", payload.eventType);
          // CRITICAL: We fetch again to ensure grouping logic has latest data
          fetchDetailedOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          console.log("Remote status change detected:", payload.new);
          if (payload.new.status_key === "order_status") {
            setOrderStatus(payload.new.status_value);
          }
          if (payload.new.status_key === "current_runner_id") {
            setCurrentRunnerId(payload.new.status_value);
          }
        }
      )
      .subscribe((status) => {
        console.log("Summary Sync Status:", status);
      });

    return () => {
      supabase.removeChannel(mainChannel);
    };
  }, []);

  // useEffect(() => {
  //   fetchDetailedOrders();

  //   const channel = supabase
  //     .channel("summary-updates")
  //     .on(
  //       "postgres_changes",
  //       { event: "*", schema: "public", table: "daily_orders" },
  //       (payload) => {
  //         console.log("Change detected, refreshing...", payload.eventType);
  //         fetchDetailedOrders(); // This fetches the new quantities
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, []);

  // async function fetchDetailedOrders() {
  //   const { data, error } = await supabase.from("daily_orders").select(`
  //     quantity,
  //     user_name,
  //     food_items (name, price)
  //   `);

  //   if (error) {
  //     console.error("Fetch error:", error);
  //     return;
  //   }

  //   const grouped: any = {};
  //   let grandTotal = 0;

  //   data.forEach((order: any) => {
  //     // Check if the joined food_items data exists
  //     if (!order.food_items) return;

  //     const itemName = order.food_items.name;
  //     const price = order.food_items.price;
  //     // CRITICAL: Ensure we use the quantity from the database
  //     // Inside SummaryScreen.tsx loop
  //     const qty = Number(order.quantity) || 0;
  //     grandTotal += price * qty;

  //     if (!grouped[itemName]) {
  //       grouped[itemName] = { name: itemName, totalQty: 0, users: [] };
  //     }

  //     // Increment by the actual quantity value
  //     grouped[itemName].totalQty += qty;

  //     // Add the specific quantity next to the user's name for clarity
  //     grouped[itemName].users.push(`${order.user_name} (x${qty})`);
  //   });

  //   // Convert the grouped object back into an array for the FlatList
  //   setSummary(Object.values(grouped));
  //   setTotalCost(grandTotal);
  // }

  async function fetchDetailedOrders() {
    const { data, error } = await supabase.from("daily_orders").select(`
    quantity,
    user_name,
    food_items (name, price)
  `);

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    // Handle the empty state correctly
    if (!data || data.length === 0) {
      console.log("No orders found in database.");
      setSummary([]); // Clear the list if no data exists
      setTotalCost(0);
      return;
    }

    console.log("Processing Data:", data.length, "rows");

    const grouped: any = {};
    let grandTotal = 0;

    data.forEach((order: any) => {
      // If the food item join fails, skip this row
      if (!order.food_items) return;

      const itemName = order.food_items.name;
      const price = order.food_items.price;
      const qty = Number(order.quantity) || 0;

      grandTotal += price * qty;

      if (!grouped[itemName]) {
        grouped[itemName] = { name: itemName, totalQty: 0, users: [] };
      }

      grouped[itemName].totalQty += qty;
      grouped[itemName].users.push(`${order.user_name} (x${qty})`);
    });

    // CRITICAL: Overwrite the state with the fresh array
    const finalSummary = Object.values(grouped);
    setSummary(finalSummary);
    setTotalCost(grandTotal);
  }

  // async function clearOrders() {
  //   Alert.alert(
  //     "Reset List",
  //     "This will delete all current orders for everyone. Are you sure?",
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Yes, Reset",
  //         style: "destructive",
  //         onPress: async () => {
  //           // Use .gt('created_at', '2000-01-01') as a reliable way to catch all rows
  //           const { error } = await supabase
  //             .from("daily_orders")
  //             .delete()
  //             .neq("id", "00000000-0000-0000-0000-000000000000"); // This matches your logic but ensure RLS is on

  //           if (error) {
  //             Alert.alert("Error", error.message);
  //             console.log("Delete error:", error);
  //           } else {
  //             // Manually clear the local state so the UI updates immediately
  //             setSummary([]);
  //             Alert.alert("Success", "The list has been cleared.");
  //           }
  //         },
  //       },
  //     ]
  //   );
  // }

  // useEffect(() => {
  //   supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  //   fetchAppSettings();

  //   // Listen for changes specifically on the app_settings table
  //   const settingsChannel = supabase.channel('settings-db')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'app_settings'
  //       },
  //       (payload) => {
  //         console.log("Settings changed:", payload.new);

  //         // Use a small delay or direct check to ensure state matches DB
  //         if (payload.new.status_key === 'order_status') {
  //           setOrderStatus(payload.new.status_value);
  //         }
  //         if (payload.new.status_key === 'current_runner_id') {
  //           setCurrentRunnerId(payload.new.status_value);
  //         }
  //       }
  //     )
  //     .subscribe((status) => {
  //       // console.log("Realtime status:", status);
  //           console.log("Realtime subscription status for colleague:", status);
  //       if (status === 'CHANNEL_ERROR') {
  //         console.error("Colleague app failed to connect to Realtime. Check RLS or Project URL.");
  //       }
  //     });

  //   return () => {
  //     supabase.removeChannel(settingsChannel);
  //   };
  // }, []);

  async function clearOrders() {
    Alert.alert(
      "Reset List",
      "This will delete all orders and unlock the menu. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Reset",
          style: "destructive",
          // Inside SummaryScreen.tsx -> clearOrders
          onPress: async () => {
            // 1. Delete all current orders
            const { error: deleteError } = await supabase
              .from("daily_orders")
              .delete()
              .neq("id", "00000000-0000-0000-0000-000000000000");

            if (deleteError) {
              Alert.alert(
                "Error",
                "Could not clear orders: " + deleteError.message
              );
              return;
            }

            // 2. Optimized Combined Update using Promise.all
            try {
              const [runnerRes, statusRes] = await Promise.all([
                supabase
                  .from("app_settings")
                  .update({ status_value: "none" })
                  .eq("status_key", "current_runner_id"),
                supabase
                  .from("app_settings")
                  .update({ status_value: "Ordering" })
                  .eq("status_key", "order_status"),
              ]);

              if (runnerRes.error || statusRes.error) {
                throw new Error("Failed to reset settings in Supabase");
              }

              // 3. Update Local State only after DB success
              setSummary([]);
              setTotalCost(0);
              setOrderStatus("Ordering");
              setCurrentRunnerId("none");

              Alert.alert("Success", "System reset for the next order!");
            } catch (err) {
              console.error("Settings reset failed", err);
              Alert.alert(
                "Partial Reset",
                "Orders cleared, but database status failed to update."
              );
            }
          },
        },
      ]
    );
  }

  const fetchAppSettings = async () => {
    const { data } = await supabase.from("app_settings").select("*");
    data?.forEach((s) => {
      if (s.status_key === "order_status") setOrderStatus(s.status_value);
      if (s.status_key === "current_runner_id")
        setCurrentRunnerId(s.status_value);
    });
  };

  // const claimRunner = async () => {
  //   await supabase
  //     .from("app_settings")
  //     .update({ status_value: userId })
  //     .eq("status_key", "current_runner_id");
  //   Alert.alert("Success", "You are the runner now!");
  // };

const claimRunner = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    // 1. Get the name correctly from metadata or email
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    
    // 2. This is the critical part: Combine ID and Name
    const runnerValue = `${user.id}:${name}`;
    
    console.log("Saving to Supabase:", runnerValue); // Look for this in your console

    // 3. Update the database
    const { error } = await supabase
      .from("app_settings")
      .update({ status_value: runnerValue })
      .eq("status_key", "current_runner_id");

    if (error) throw error;
  } catch (error: any) {
    console.error("Claim Runner Error:", error);
    Alert.alert("Error", error.message);
  }
};
  // const updateStatus = async (val: string) => {
  //   await supabase.from('app_settings').update({ status_value: val }).eq('status_key', 'order_status');
  // };
  // Ensure the update function specifically targets the key
  const updateStatus = async (val: string) => {
    // Update local state immediately for the runner's snappier UI
    setOrderStatus(val);

    const { error } = await supabase
      .from("app_settings")
      .update({ status_value: val })
      .eq("status_key", "order_status");

    if (error) {
      Alert.alert("Error", "Failed to update status");
      fetchAppSettings(); // Rollback on error
    }
  };

  // // ... (In your return, add this before the FlatList)
  // const isRunner = userId === currentRunnerId;
  // This splits the "ID:Name" string and only compares the ID part
  const runnerParts = currentRunnerId.split(':');
  // const runnerIdOnly = currentRunnerId.split(':')[0];
  const runnerIdOnly = runnerParts[0];
  console.log("Current Runner ID:", runnerIdOnly, "User ID:", userId);
  // const runnerNameOnly = currentRunnerId.split(':')[1];
  const runnerName = runnerParts[1] || "None";
  const isRunner = userId === runnerIdOnly;
  console.log("Is Current User Runner?", isRunner);
  const currentStatusStyle = getStatusStyle(orderStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Buyer's Dashboard 🛒</Text>
      {/* SECTION 1: LIVE STATUS BANNER */}
      <View style={[styles.banner, { backgroundColor: currentStatusStyle.bg }]}>
        <View>
        <Text style={styles.bannerText}>
          {currentStatusStyle.icon} Status: {orderStatus}
        </Text>
        {/* Show the name part of the string */}
        {currentRunnerId !== "none" && (
          <Text style={{ color: 'white', fontSize: 14, opacity: 0.9, marginTop: 4 }}>
            🏃 Runner: {runnerName}
          </Text>
        )}

          </View>
        {!isRunner && currentRunnerId === "none" && (
          <TouchableOpacity onPress={claimRunner} style={styles.claimSmallBtn}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>I'll Go!</Text>
          </TouchableOpacity>
        )}
        {currentRunnerId !== "none" && !isRunner && (
          <Text style={styles.runnerNotice}>Runner assigned</Text>
        )}
      </View>

      {/* SECTION 2: RUNNER CONTROLS (Separated) */}
      {isRunner && (
        <View style={styles.controlsCard}>
          <Text style={styles.controlsTitle}>Update Progress:</Text>
          <View style={styles.controlsRow}>
            {/* Step 1: Ordering */}
            <TouchableOpacity
              style={[
                styles.stepBtn,
                orderStatus === "Ordering" && styles.activeStep,
              ]}
              onPress={() => updateStatus("Ordering")}
            >
              <Text>📝 Ordering</Text>
            </TouchableOpacity>

            {/* Step 2: At Store */}
            <TouchableOpacity
              style={[
                styles.stepBtn,
                orderStatus === "At Store" && styles.activeStep,
              ]}
              onPress={() => updateStatus("At Store")}
            >
              <Text>🛒 At Store</Text>
            </TouchableOpacity>

            {/* Step 3: Food is Here */}
            <TouchableOpacity
              style={[
                styles.stepBtn,
                orderStatus === "Food is Here" && styles.activeStep,
              ]}
              onPress={() => updateStatus("Food is Here")}
            >
              <Text>🍕 Is Here!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={summary}
        keyExtractor={(item) => item.name}
        extraData={summary}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.userList}>
                  Details: {item.users.join(", ")}
                </Text>
              </View>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{item.totalQty}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>
          Grand Total: ${totalCost.toFixed(2)}
        </Text>
        {/* <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            clearOrders();
          }}
        >
          <Text style={styles.resetBtnText}>Clear List</Text>
        </TouchableOpacity> */}
        {isRunner && (
          <TouchableOpacity style={styles.resetBtn} onPress={clearOrders}>
            <Text style={styles.resetBtnText}>🔄 Reset for Next Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#F5F5F5" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 8, marginTop: 0 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontSize: 18, fontWeight: "bold" },
  itemCount: { fontSize: 18, color: "#ff6347", fontWeight: "bold" },
  userList: { fontSize: 14, color: "#666", marginTop: 5, fontStyle: "italic" },
  footer: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2ecc71",
  },
  resetBtn: { marginTop: 10, alignItems: "center" },
  resetBtnText: { color: "red", fontWeight: "600" },

  quantityBadge: {
    backgroundColor: "#ff6347",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 45,
  },
  quantityText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 4,
  },
  bannerText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  controlsCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  controlsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepBtn: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#e8f4fd",
    borderColor: "#2196F3",
  },
  claimSmallBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 8,
    borderRadius: 5,
  },
  runnerNotice: { color: "#fff", fontSize: 12, fontStyle: "italic" },
});
