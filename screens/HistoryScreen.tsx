import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreen() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // NEW: Permissions states
  const [currentRunnerId, setCurrentRunnerId] = useState("none");
  const [userId, setUserId] = useState<string | null>(null);

  // useEffect(() => {
  //   // Get logged in user ID
  //   supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));

  //   fetchDebts();
  //   fetchRunnerStatus();

  //   const historyChannel = supabase
  //     .channel('history-sync')
  //     .on(
  //       'postgres_changes',
  //       { event: '*', schema: 'public', table: 'daily_orders' },
  //       () => fetchDebts()
  //     )
  //     // Listen for runner changes
  //     .on(
  //       'postgres_changes',
  //       { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'status_key=eq.current_runner_id' },
  //       (payload) => setCurrentRunnerId(payload.new.status_value)
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(historyChannel);
  //   };
  // }, []);

  // NEW: Fetch who is currently the runner

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id || null));

    fetchDebts();
    fetchRunnerStatus();

    const historyChannel = supabase
      .channel("history-live-sync") // Unique channel name
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for ALL changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "daily_orders",
        },
        (payload) => {
          console.log("Debt change detected:", payload.eventType);
          fetchDebts(); // Refresh the grouped list
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_settings",
          filter: "status_key=eq.current_runner_id",
        },
        (payload) => setCurrentRunnerId(payload.new.status_value)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(historyChannel);
    };
  }, []);

  async function fetchRunnerStatus() {
    const { data } = await supabase
      .from("app_settings")
      .select("status_value")
      .eq("status_key", "current_runner_id")
      .single();
    if (data) setCurrentRunnerId(data.status_value);
  }

  async function fetchDebts() {
    const { data, error } = await supabase
      .from("daily_orders")
      .select("id, user_name, quantity, food_items(name, price)")
      .eq("paid", false);

    if (error) {
      console.error("Debt fetch error:", error);
      setLoading(false);
      return;
    }

    const totals: any = {};
    data?.forEach((o) => {
      if (!o.food_items) return;

      const amt = (Number(o.quantity) || 0) * (o.food_items.price || 0);
      if (!totals[o.user_name]) {
        totals[o.user_name] = { name: o.user_name, total: 0, ids: [] };
      }
      totals[o.user_name].total += amt;
      totals[o.user_name].ids.push(o.id);
    });

    setDebts(Object.values(totals));
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDebts();
    fetchRunnerStatus();
  }, []);

  const markPaid = (item: any) => {
    Alert.alert(
      "Settle Debt",
      `Mark $${item.total.toFixed(2)} as paid for ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            console.log("Attempting to mark IDs as paid:", item.ids);

            // const { error } = await supabase
            //   .from('daily_orders')
            //   .update({ paid: true })
            //   .in('id', item.ids); // item.ids contains the list of row IDs

            // if (error) {
            //   console.error("Supabase Update Error:", error.message, error.details);
            //   Alert.alert("Error", "Database update failed: " + error.message);
            // } else {
            //   console.log("Update successful for:", item.name);
            //   fetchDebts(); // Refresh local list
            // }
            const { data, error, count } = await supabase
              .from("daily_orders")
              .update({ paid: true })
              .in("id", item.ids)
              .select(); // Adding .select() allows you to see the returned rows

            if (error) {
              console.error("Update error:", error);
            } else if (data?.length === 0) {
              console.warn(
                "Update successful but 0 rows were changed. This is an RLS policy issue!"
              );
            } else {
              console.log(`Successfully updated ${data?.length} rows.`);
              fetchDebts();
            }
          },
        },
      ]
    );
  };

  // Inside HistoryScreen.tsx
const sendNudge = async (item: any) => {
  const { error } = await supabase
    .from('debt_logs')
    .upsert({ 
      order_id: item.ids[0], // Reference the order
      last_nudge_at: new Date().toISOString()
    }, { onConflict: 'order_id' });

  if (!error) {
    Alert.alert("Nudge Sent!", `A reminder was logged for ${item.name}.`);
  }
};

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#2ecc71" />
    );

// This splits the "ID:Name" string and compares only the ID part
const runnerIdOnly = currentRunnerId.split(':')[0]; 
const isRunner = userId === runnerIdOnly;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Unpaid Debts 💸</Text>

      {debts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={80} color="#2ecc71" />
          <Text style={styles.emptyText}>Everyone is settled up!</Text>
        </View>
      ) : (
        <FlatList
          data={debts}
          keyExtractor={(item) => item.name}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2ecc71"]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.amount}>
                  Owes: ₹{item.total.toFixed(2)}
                </Text>
              </View>

              {/* Conditional UI: Runner sees Settle button, Others see Pending text */}
              {isRunner ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => markPaid(item)}
                    style={styles.paidBtn}
                  >
                    <Text style={styles.paidText}>Settle</Text>
                  </TouchableOpacity>
                  
                  {/* Added Nudge Button for the Runner */}
                  <TouchableOpacity 
                    onPress={() => sendNudge(item)}
                    style={[styles.paidBtn, { backgroundColor: '#f39c12', marginLeft: 8 }]}
                  >
                    <Ionicons name="notifications-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F9FA",
    paddingTop: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1A",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "bold", color: "#333" },
  amount: { fontSize: 16, color: "#E74C3C", marginTop: 4, fontWeight: "600" },
  paidBtn: {
    backgroundColor: "#2ECC71",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  paidText: { color: "#fff", fontWeight: "bold" },
  pendingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  pendingText: { color: "#EF6C00", fontWeight: "bold", fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100,
  },
  emptyText: { fontSize: 18, color: "#888", marginTop: 15, fontWeight: "500" },
});
