import React, { useState, useEffect, createElement } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Alert, Platform, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { getBills, saveBills } from '../store/storage';
import { useIsFocused } from '@react-navigation/native';

const CustomDatePicker = ({ initialDate, onApply, onCancel }) => {
  const format = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const [textVal, setTextVal] = useState(format(initialDate));
  const [showNativePicker, setShowNativePicker] = useState(false);

  const handleChange = (text) => {
    setTextVal(text);
  };

  const handleApply = () => {
    const parts = textVal.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const newDate = new Date(y, m, d);
      if (!isNaN(newDate.getTime()) && y > 1900 && y < 2100) {
        onApply(newDate);
        return;
      }
    }
    alert("Please enter a valid date in DD/MM/YYYY format.");
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, minWidth: 220 }}>
        <Text style={{marginBottom: 10, fontSize: 14, fontWeight: 'bold'}}>Select Date:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, backgroundColor: '#fff', paddingLeft: 5 }}>
          <TouchableOpacity 
            style={{ position: 'relative', width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginRight: 5 }}
            onPress={() => {
              if (Platform.OS !== 'web') {
                setShowNativePicker(true);
              }
            }}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#333" />
            {Platform.OS === 'web' && createElement('input', {
              type: 'date',
              onChange: (e) => {
                if (e.target.value) {
                  const parts = e.target.value.split('-');
                  setTextVal(`${parts[2]}/${parts[1]}/${parts[0]}`);
                }
              },
              style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
            })}
          </TouchableOpacity>
          <TextInput
            style={{ padding: 10, fontSize: 16, outlineStyle: 'none', width: 120 }}
            value={textVal}
            onChangeText={handleChange}
            placeholder="DD/MM/YYYY"
            maxLength={10}
          />
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 5}}>
          <TouchableOpacity onPress={onCancel} style={{padding: 8}}>
            <Text style={{color: Colors.primary, fontWeight: 'bold', fontSize: 16}}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={{padding: 8}}>
            <Text style={{color: Colors.primary, fontWeight: 'bold', fontSize: 16}}>OK</Text>
          </TouchableOpacity>
        </View>

        {showNativePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={initialDate}
            mode="date"
            display="default"
            locale="en-IN"
            onChange={(event, selected) => {
              setShowNativePicker(false);
              if (selected) {
                setTextVal(format(selected));
              }
            }}
          />
        )}
      </View>
    </View>
  );
};

export default function HistorySalesScreen() {
  const [bills, setBills] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('total'); // 'daily', 'monthly', 'yearly', 'total'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadBills();
    }
  }, [isFocused]);

  const loadBills = async () => {
    const data = await getBills();
    setBills(data);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSelectedDate(new Date());
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (selectedFilter === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (selectedFilter === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (selectedFilter === 'yearly') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  const getDisplayDate = () => {
    if (selectedFilter === 'daily') {
      return selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (selectedFilter === 'monthly') {
      return selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (selectedFilter === 'yearly') {
      return selectedDate.getFullYear().toString();
    }
    return '';
  };

  const targetDateStr = selectedDate.toLocaleDateString();
  const targetMonth = selectedDate.getMonth();
  const targetYear = selectedDate.getFullYear();

  let dailySales = 0;
  let monthlySales = 0;
  let yearlySales = 0;
  let totalSales = 0;

  const totalBills = [];
  const dailyBills = [];
  const monthlyBills = [];
  const yearlyBills = [];

  bills.forEach(bill => {
    const hiddenSections = bill.hiddenSections || [];
    const billDateObj = new Date(bill.date);
    
    if (!hiddenSections.includes('total')) {
      totalSales += bill.total;
      totalBills.push(bill);
    }

    if (bill.date === targetDateStr && !hiddenSections.includes('daily')) {
      dailySales += bill.total;
      dailyBills.push(bill);
    }
    
    if (billDateObj.getMonth() === targetMonth && billDateObj.getFullYear() === targetYear && !hiddenSections.includes('monthly')) {
      monthlySales += bill.total;
      monthlyBills.push(bill);
    }
    
    if (billDateObj.getFullYear() === targetYear && !hiddenSections.includes('yearly')) {
      yearlySales += bill.total;
      yearlyBills.push(bill);
    }
  });

  let displayedBills = totalBills;
  let listHeaderTitle = `All Receipts (${totalBills.length})`;
  
  if (selectedFilter === 'daily') {
    displayedBills = dailyBills;
    listHeaderTitle = `Today's Receipts (${dailyBills.length})`;
  } else if (selectedFilter === 'monthly') {
    displayedBills = monthlyBills;
    listHeaderTitle = `This Month's Receipts (${monthlyBills.length})`;
  } else if (selectedFilter === 'yearly') {
    displayedBills = yearlyBills;
    listHeaderTitle = `This Year's Receipts (${yearlyBills.length})`;
  }

  const handleClearBills = async () => {
    if (bills.length === 0) return;
    if (selectedFilter !== 'total' && displayedBills.length === 0) return;

    let filterLabel = '';
    if (selectedFilter === 'total') filterLabel = 'ALL';
    else if (selectedFilter === 'daily') filterLabel = "Today's";
    else if (selectedFilter === 'monthly') filterLabel = "This Month's";
    else if (selectedFilter === 'yearly') filterLabel = "This Year's";

    const deleteAction = async () => {
      let newBills = [...bills];
      
      const displayedBillIds = displayedBills.map(b => b.id);
      
      newBills = newBills.map(b => {
        if (displayedBillIds.includes(b.id)) {
          const hiddenSections = b.hiddenSections || [];
          if (!hiddenSections.includes(selectedFilter)) {
            return { ...b, hiddenSections: [...hiddenSections, selectedFilter] };
          }
        }
        return b;
      });

      await saveBills(newBills);
      setBills(newBills);
    };

    const confirmMessage = selectedFilter === 'total' 
      ? `Are you sure you want to delete ALL bills? This action cannot be undone.`
      : `Are you sure you want to delete ONLY ${filterLabel} bills? Other bills will remain safe. This action cannot be undone.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        await deleteAction();
      }
    } else {
      Alert.alert(
        "Clear History",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: deleteAction
          }
        ]
      );
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="receipt" size={60} color={Colors.border} />
      <Text style={styles.emptyText}>No bills found for this period.</Text>
    </View>
  );

  const renderBillItem = ({ item }) => (
    <TouchableOpacity style={styles.billCard} onPress={() => setSelectedBill(item)}>
      <View style={styles.billIcon}>
        <FontAwesome5 name="receipt" size={20} color={Colors.primary} />
      </View>
      <View style={styles.billInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.billId}>{item.id}</Text>
          {item.paymentMethod && (
            <View style={{ backgroundColor: item.paymentMethod === 'UPI' ? '#E3F2FD' : item.paymentMethod === 'Card' ? '#F3E5F5' : '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, color: item.paymentMethod === 'UPI' ? '#1565C0' : item.paymentMethod === 'Card' ? '#7B1FA2' : '#2E7D32', fontWeight: 'bold' }}>{item.paymentMethod.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.billDate}>{item.date} {item.time ? `- ${item.time}` : ''}</Text>
      </View>
      <Text style={styles.billAmount}>₹{item.total}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bill History & Sales</Text>
        <View style={styles.headerRightControls}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.headerDateBtn}>
            <MaterialCommunityIcons name="calendar" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearBills} style={styles.headerDeleteBtn}>
            <MaterialCommunityIcons name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <CustomDatePicker 
          initialDate={selectedDate}
          onApply={(newDate) => {
            setSelectedDate(newDate);
            if (selectedFilter === 'total') setSelectedFilter('daily');
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      )}

      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: '#6C5CE7' }, selectedFilter === 'total' && styles.activeCard]}
            onPress={() => handleFilterChange('total')}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrapper}><MaterialCommunityIcons name="cash-multiple" size={18} color="#6C5CE7" /></View>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <Text style={styles.summaryValue}>₹{totalSales}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: '#FF7675' }, selectedFilter === 'daily' && styles.activeCard]}
            onPress={() => handleFilterChange('daily')}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrapper}><FontAwesome5 name="calendar-day" size={16} color="#FF7675" /></View>
              <Text style={styles.summaryLabel}>Today</Text>
            </View>
            <Text style={styles.summaryValue}>₹{dailySales}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: '#0984E3' }, selectedFilter === 'monthly' && styles.activeCard]}
            onPress={() => handleFilterChange('monthly')}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrapper}><FontAwesome5 name="calendar-alt" size={16} color="#0984E3" /></View>
              <Text style={styles.summaryLabel}>Monthly</Text>
            </View>
            <Text style={styles.summaryValue}>₹{monthlySales}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: '#00B894' }, selectedFilter === 'yearly' && styles.activeCard]}
            onPress={() => handleFilterChange('yearly')}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrapper}><FontAwesome5 name="calendar" size={16} color="#00B894" /></View>
              <Text style={styles.summaryLabel}>Yearly</Text>
            </View>
            <Text style={styles.summaryValue}>₹{yearlySales}</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeader}>{listHeaderTitle}</Text>
        {selectedFilter !== 'total' && (
          <TouchableOpacity onPress={() => handleFilterChange('total')} style={styles.clearBtn}>
            <Text style={styles.clearFilterText}>Show All</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedFilter !== 'total' && (
        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{getDisplayDate()}</Text>
          <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayedBills}
        keyExtractor={item => item.id}
        renderItem={renderBillItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={displayedBills.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {selectedBill && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%', maxWidth: 400, maxHeight: '80%', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Bill Details - {selectedBill.id}</Text>
              <TouchableOpacity onPress={() => setSelectedBill(null)} style={{ padding: 5 }}>
                <FontAwesome5 name="times" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 5 }}>
              Date: {selectedBill.date} | Time: {selectedBill.time || 'N/A'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 13, color: '#666', fontWeight: 'bold' }}>Payment Mode: </Text>
              <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: 'bold' }}>{selectedBill.paymentMethod || 'Cash'}</Text>
            </View>

            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 8 }}>
              <Text style={{ flex: 2, fontWeight: 'bold', color: '#555' }}>Item</Text>
              <Text style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#555' }}>Qty</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#555' }}>Amount</Text>
            </View>

            <ScrollView style={{ marginBottom: 15 }}>
              {(selectedBill.cart || selectedBill.items || []).map((billItem, index) => (
                <View key={index} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' }}>
                  <Text style={{ flex: 2, color: '#333' }}>{billItem.name}</Text>
                  <Text style={{ flex: 1, textAlign: 'center', color: '#333' }}>{billItem.qty || billItem.quantity || 1}</Text>
                  <Text style={{ flex: 1, textAlign: 'right', color: '#333' }}>₹{billItem.total || billItem.price || 0}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#eee', paddingTop: 15 }}>
              <Text style={{ fontSize: 18, color: '#333' }}>Grand Total:</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary }}>₹{selectedBill.total}</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { 
    backgroundColor: Colors.primary, 
    padding: 15, 
    paddingTop: 40, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    marginBottom: 15, 
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerRightControls: { flexDirection: 'row', gap: 10 },
  headerDateBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  headerDeleteBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  webDatePickerContainer: { position: 'absolute', top: 70, alignSelf: 'center', zIndex: 100, backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  
  
  summaryContainer: { marginBottom: 10 },
  scrollContent: { paddingHorizontal: 15, gap: 10, paddingBottom: 10 },
  summaryCard: {
    width: 110,
    height: 85,
    padding: 10,
    borderRadius: 16,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  activeCard: {
    transform: [{ scale: 1.05 }],
    borderWidth: 2,
    borderColor: '#fff'
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrapper: { backgroundColor: '#fff', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, marginTop: 10, marginBottom: 10 },
  listHeader: { fontSize: 16, color: '#2D3436', fontWeight: '800' },
  clearBtn: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  clearFilterText: { fontSize: 11, color: Colors.primary, fontWeight: 'bold' },
  
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, marginBottom: 10, backgroundColor: '#fff', padding: 5, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  navBtn: { padding: 5, backgroundColor: Colors.primaryLight, borderRadius: 8 },
  dateLabel: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
  
  listContent: { paddingHorizontal: 15, paddingBottom: 30 },
  emptyListContent: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: Colors.textLight, marginTop: 20, fontSize: 14, lineHeight: 20 },
  
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary
  },
  billIcon: { backgroundColor: '#FFF0E6', width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  billInfo: { flex: 1 },
  billId: { fontWeight: '800', fontSize: 14, color: '#2D3436' },
  billDate: { fontSize: 11, color: '#636E72', marginTop: 2, fontWeight: '500' },
  billAmount: { fontWeight: '900', fontSize: 16, color: Colors.primary }
});
