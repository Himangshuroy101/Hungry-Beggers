import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ManageMenuScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    const { data } = await supabase.from('food_items').select('*').order('name');
    setMenuItems(data || []);
  }

  async function addItem() {
    if (!name || !price) return Alert.alert("Error", "Fill all fields");
    
    const { error } = await supabase.from('food_items').insert([{ name, price: parseFloat(price) }]);
    if (error){ 
      Alert.alert("Error", error.message);
      console.log(error);
    }
    else {
      setName(''); setPrice('');
      fetchMenu();
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('food_items').delete().eq('id', id);
    if (error) Alert.alert("Error", "Cannot delete item being ordered today.");
    else fetchMenu();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Office Menu ✍️</Text>
      
      <View style={styles.inputRow}>
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="Item Name" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Price" value={price} keyboardType="numeric" onChangeText={setPrice} />
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>{item.name} - ${item.price}</Text>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginRight: 5 },
  addBtn: { backgroundColor: '#2ecc71', justifyContent: 'center', padding: 10, borderRadius: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 }
});