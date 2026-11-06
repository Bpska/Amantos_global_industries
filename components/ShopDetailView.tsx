import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { salesApi, adminApi } from '@/services/api';
import { apiError, dateDay, money } from '@/utils/format';
import {
  EmptyState,
  FormInput,
  MoneyText,
  PrimaryButton,
  Skeleton,
  StatusChip,
  usePalette,
} from './ui';
import { colors, shadows } from '@/constants/theme';
import type { Order } from '@/types';

export function ShopDetailView({ id, admin = false }: { id: string; admin?: boolean }) {
  const p = usePalette();
  const qc = useQueryClient();

  const [modal, setModal] = useState<'order' | 'pay' | null>(null);
  const [amount, setAmount] = useState('');
  const [product, setProduct] = useState('Mixture Pack');
  const [qty, setQty] = useState('50');
  const [price, setPrice] = useState('10');
  const [notes, setNotes] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER'>('CASH');
  const [orderBillingType, setOrderBillingType] = useState<'ONLINE' | 'PHYSICAL'>('ONLINE');
  const [viewInvoice, setViewInvoice] = useState<Order | null>(null);

  const q = useQuery({
    queryKey: [admin ? 'admin-shop' : 'shop', id],
    queryFn: () => (admin ? adminApi.shop(id) : salesApi.shop(id)),
  });

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: salesApi.products,
  });

  const billingSettingsQ = useQuery({
    queryKey: ['billingSettings'],
    queryFn: salesApi.billingSettings,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [admin ? 'admin-shop' : 'shop', id] });
    qc.invalidateQueries({ queryKey: ['summary'] });
    qc.invalidateQueries({ queryKey: ['my-shops'] });
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const orderM = useMutation({
    mutationFn: () =>
      salesApi.addOrder(id, {
        product,
        productName: product,
        quantity: Number(qty),
        unitPrice: Number(price),
        billingType: orderBillingType,
        notes: notes.trim() || undefined,
        date: new Date().toISOString(),
      }),
    onSuccess: () => {
      setModal(null);
      setNotes('');
      refresh();
      Alert.alert('Order Created', 'New stock dispatch has been recorded.');
    },
    onError: (e) => Alert.alert('Error', apiError(e)),
  });

  const payM = useMutation({
    mutationFn: () => salesApi.pay(selectedOrderId, Number(amount), `[Method: ${payMethod}] Collection received via ${payMethod}`),
    onSuccess: () => {
      setModal(null);
      setAmount('');
      refresh();
      Alert.alert('Payment Recorded', `Collection received via ${payMethod} and credited to store ledger.`);
    },
    onError: (e) => Alert.alert('Error', apiError(e)),
  });

  if (q.isLoading) return <Skeleton />;
  if (!q.data) return <EmptyState title="Merchant Not Found" message="This store account does not exist or was archived." />;

  const x = q.data;
  const orders: Order[] = x.orders || [];

  const handleOpenPay = () => {
    const dueOrder = orders.find((o) => o.baki > 0) || orders[0];
    if (dueOrder) {
      setSelectedOrderId(dueOrder.id);
      setAmount(String(dueOrder.baki || ''));
    }
    setModal('pay');
  };

  const openPhone = () => {
    if (x.contactNumber) {
      Linking.openURL(`tel:${x.contactNumber}`).catch(() => {
        Alert.alert('Call', `Unable to initiate call to ${x.contactNumber}`);
      });
    }
  };

  const openWhatsApp = () => {
    if (x.contactNumber) {
      const cleanPhone = x.contactNumber.replace(/[^0-9]/g, '');
      const url = `https://wa.me/91${cleanPhone}?text=Namaste%20${encodeURIComponent(x.ownerName)},%20greeting%20from%20RetailFlow.%20Your%20current%20pending%20balance%20is%20Rs%20${x.baki}.`;
      Linking.openURL(url).catch(() => {
        Alert.alert('WhatsApp', 'WhatsApp is not installed on this device.');
      });
    }
  };

  const getInvoiceNumber = (order: Order) => {
    if (order.invoiceNumber) return order.invoiceNumber;
    const year = new Date(order.date || Date.now()).getFullYear();
    const hash = (order.id || '000000').slice(0, 6).toUpperCase();
    return `INV-${year}-${hash}`;
  };

  const initial = (x.name || 'S').trim().charAt(0).toUpperCase();
  const collectionRatio = x.totalAmount > 0 ? Math.min(100, Math.round((x.paidAmount / x.totalAmount) * 100)) : 100;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {/* Top Navigation Bar */}
      <View style={[s.navbar, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={p.text} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text numberOfLines={1} style={[s.navbarTitle, { color: p.text }]}>{x.name}</Text>
          <Text numberOfLines={1} style={[s.navbarSub, { color: p.sub }]}>Merchant Account #{id.slice(0, 8)}</Text>
        </View>
        <View style={s.statusPill}>
          <StatusChip status={x.baki === 0 ? 'PAID' : (x.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Merchant Hero Card */}
        <View style={[s.heroCard, { backgroundColor: p.card, borderColor: p.border }, shadows.sm]}>
          <View style={s.heroHeader}>
            <View style={s.storeAvatar}>
              <Text style={s.storeAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text numberOfLines={1} style={[s.storeName, { color: p.text }]}>{x.name}</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </View>
              <Text style={[s.proprietorText, { color: p.sub }]}>Proprietor: {x.ownerName}</Text>
            </View>
          </View>

          {/* Quick Communication Pills */}
          <View style={s.commRow}>
            <Pressable onPress={openPhone} style={[s.commBtn, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <Ionicons name="call" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                +91 {x.contactNumber}
              </Text>
            </Pressable>

            <Pressable onPress={openWhatsApp} style={[s.commBtn, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
              <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
              <Text style={{ color: '#16A34A', fontWeight: '700', fontSize: 13 }}>WhatsApp</Text>
            </Pressable>
          </View>

          {/* Address Line */}
          <View style={[s.addressRow, { borderTopColor: p.border }]}>
            <Ionicons name="location-outline" size={16} color={p.sub} style={{ marginTop: 2 }} />
            <Text style={[s.addressText, { color: p.sub }]}>{x.location}</Text>
          </View>

          {admin && x.salesperson && (
            <View style={[s.repRow, { borderTopColor: p.border }]}>
              <Ionicons name="person-outline" size={14} color={p.sub} />
              <Text style={{ color: p.sub, fontSize: 12 }}>
                Assigned Sales Rep: <Text style={{ color: colors.primary, fontWeight: '700' }}>{x.salesperson.name}</Text>
              </Text>
            </View>
          )}

          {/* Financial Ledger Ribbon */}
          <View style={[s.ledgerRibbon, { backgroundColor: p.bg, borderColor: p.border }]}>
            <View style={s.ledgerCol}>
              <Text style={s.ledgerColLabel}>TOTAL BILLED</Text>
              <Text style={[s.ledgerColValue, { color: p.text }]}>{money(x.totalAmount)}</Text>
            </View>
            <View style={[s.colDivider, { backgroundColor: p.border }]} />
            <View style={s.ledgerCol}>
              <Text style={s.ledgerColLabel}>COLLECTED</Text>
              <Text style={[s.ledgerColValue, { color: colors.settled }]}>{money(x.paidAmount)}</Text>
            </View>
            <View style={[s.colDivider, { backgroundColor: p.border }]} />
            <View style={s.ledgerCol}>
              <Text style={[s.ledgerColLabel, { color: colors.baki }]}>BALANCE (BAKI)</Text>
              <MoneyText value={x.baki} baki style={{ fontSize: 15 }} />
            </View>
          </View>

          {/* Collection Progress Bar */}
          <View style={s.progressWrap}>
            <View style={s.progressLabelRow}>
              <Text style={{ color: p.sub, fontSize: 11, fontWeight: '700' }}>Settlement Ratio</Text>
              <Text style={{ color: colors.settled, fontSize: 11, fontWeight: '800' }}>{collectionRatio}% Paid</Text>
            </View>
            <View style={[s.track, { backgroundColor: '#E2E8F0' }]}>
              <View style={[s.fill, { width: `${collectionRatio}%`, backgroundColor: collectionRatio >= 100 ? colors.settled : colors.primary }]} />
            </View>
          </View>
        </View>

        {/* Action Buttons for Sales Rep */}
        {!admin && (
          <View style={s.actionGrid}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="New Stock Order"
                icon="add-circle"
                onPress={() => setModal('order')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Collect BAKI"
                variant="outline"
                icon="cash-outline"
                onPress={handleOpenPay}
              />
            </View>
          </View>
        )}

        {/* Ledger & Orders Section Header */}
        <View style={s.sectionHeaderRow}>
          <Text style={[s.sectionTitle, { color: p.text }]}>Orders & Ledger Log</Text>
          <View style={[s.countBadge, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={{ color: p.sub, fontSize: 12, fontWeight: '800' }}>{orders.length} Records</Text>
          </View>
        </View>

        {/* Order History Cards */}
        {orders.length ? (
          orders.map((o, idx) => (
            <View key={o.id} style={[s.orderCard, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
              <View style={s.orderTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.orderIndex, { color: colors.primary }]}>#{orders.length - idx}</Text>
                    <Text style={[s.orderProduct, { color: p.text }]}>{o.product}</Text>
                  </View>
                  <Text style={[s.orderMeta, { color: p.sub }]}>
                    {dateDay(o.date)} · {o.quantity} units @ ₹{o.unitPrice}
                  </Text>
                </View>
                <StatusChip status={o.baki === 0 ? 'PAID' : (o.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')} />
              </View>

              <View style={[s.orderLedgerStrip, { backgroundColor: p.bg, borderColor: p.border }]}>
                <View style={s.stripCol}>
                  <Text style={s.stripColLabel}>BILLED</Text>
                  <Text style={[s.stripColValue, { color: p.text }]}>{money(o.totalAmount)}</Text>
                </View>
                <View style={s.stripCol}>
                  <Text style={s.stripColLabel}>PAID</Text>
                  <Text style={[s.stripColValue, { color: colors.settled }]}>{money(o.paidAmount)}</Text>
                </View>
                <View style={s.stripCol}>
                  <Text style={[s.stripColLabel, { color: colors.baki }]}>BAKI</Text>
                  <MoneyText value={o.baki} baki style={{ fontSize: 13 }} />
                </View>
              </View>

              {o.notes ? (
                <View style={s.notesRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={p.sub} />
                  <Text style={[s.notesText, { color: p.sub }]}>{o.notes}</Text>
                </View>
              ) : null}

              {/* Payments receipt timeline */}
              {o.payments && o.payments.length > 0 && (
                <View style={[s.paymentHistory, { borderTopColor: p.border }]}>
                  <Text style={[s.paymentHistoryTitle, { color: p.sub }]}>PAYMENT SETTLEMENTS</Text>
                  {o.payments.map((y) => (
                    <View key={y.id} style={s.paymentRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="arrow-down-circle" size={16} color={colors.settled} />
                        <View>
                          <Text style={{ color: p.text, fontSize: 13, fontWeight: '700' }}>
                            + {money(y.amount)}
                          </Text>
                          <Text style={{ color: p.sub, fontSize: 11 }}>{dateDay(y.createdAt)}</Text>
                        </View>
                      </View>
                      {y.note ? <Text style={{ color: p.sub, fontSize: 11, fontStyle: 'italic' }}>{y.note}</Text> : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Invoice & WhatsApp Bill Bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: p.border,
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="receipt-outline" size={13} color={colors.primary} />
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      {getInvoiceNumber(o)}
                    </Text>
                  </View>

                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: o.billingType === 'PHYSICAL' ? '#FEF3C7' : '#EFF6FF',
                  }}>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: o.billingType === 'PHYSICAL' ? '#D97706' : colors.primary,
                    }}>
                      {o.billingType === 'PHYSICAL' ? '📄 Physical' : '🌐 Online'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    onPress={() => setViewInvoice(o)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: p.border,
                      backgroundColor: p.bg,
                    }}
                  >
                    <Ionicons name="eye-outline" size={13} color={p.text} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: p.text }}>View Bill</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="No orders on file"
            message="No stock dispatches recorded for this merchant yet."
            icon="receipt-outline"
          />
        )}
      </ScrollView>

      {/* Modern Modal Sheets */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setModal(null)}>
          <Pressable style={[s.modalSheet, { backgroundColor: p.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalDragHandle} />

            {modal === 'order' ? (
              <>
                <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: p.text }]}>New Stock Dispatch</Text>
                  <Text style={[s.modalSub, { color: p.sub }]}>Record replenishment delivery for {x.name}</Text>
                </View>

                {productsQ.data && productsQ.data.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: p.sub, marginBottom: 6, letterSpacing: 0.5 }}>
                      SELECT CONFIGURED SKU
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {productsQ.data.map((item) => {
                        const active = product === item.name;
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              setProduct(item.name);
                              if (item.unitPrice) setPrice(String(item.unitPrice));
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              borderColor: active ? colors.primary : p.border,
                              backgroundColor: active ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
                            }}
                          >
                            <Ionicons name="cube-outline" size={13} color={active ? colors.primary : p.sub} />
                            <Text style={{ fontSize: 12, fontWeight: active ? '800' : '600', color: active ? colors.primary : p.text }}>
                              {item.name} (₹{item.unitPrice})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <FormInput
                  label="Product SKU Description"
                  value={product}
                  onChangeText={setProduct}
                  placeholder="e.g. Mixture Pack 500g"
                  required
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Quantity"
                      keyboardType="numeric"
                      value={qty}
                      onChangeText={setQty}
                      placeholder="50"
                      required
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Unit Rate (₹)"
                      keyboardType="decimal-pad"
                      value={price}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9.]/g, '');
                        const parts = cleaned.split('.');
                        setPrice(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned);
                      }}
                      placeholder="e.g. 12.50"
                      required
                    />
                  </View>
                </View>

                {/* Live total calculation preview */}
                <View style={[s.modalCalcBox, { backgroundColor: p.bg, borderColor: p.border }]}>
                  <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Calculated Total Value:</Text>
                  <MoneyText value={(parseFloat(qty) || 0) * (parseFloat(price) || 0)} style={{ fontSize: 18 }} />
                </View>

                <FormInput
                  label="Delivery Note / Remarks (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Payment promised by Saturday"
                />

                {/* Billing Option Selector */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: p.sub, marginTop: 10, marginBottom: 6, letterSpacing: 0.5 }}>
                  BILLING OPTION / FORMAT
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {[
                    { key: 'PHYSICAL', label: 'Physical Bill', icon: 'document-text-outline', desc: 'Handed to shop' },
                    { key: 'ONLINE', label: 'Online Billing', icon: 'globe-outline', desc: 'Admin WhatsApp' },
                  ].map((b) => {
                    const active = orderBillingType === b.key;
                    return (
                      <Pressable
                        key={b.key}
                        onPress={() => setOrderBillingType(b.key as any)}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : p.border,
                          backgroundColor: active ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name={b.icon as any} size={14} color={active ? colors.primary : p.sub} />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: active ? colors.primary : p.text }}>
                              {b.label}
                            </Text>
                          </View>
                          {active && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                        </View>
                        <Text style={{ fontSize: 10, color: p.sub, marginTop: 2 }}>{b.desc}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 14 }}>
                  <PrimaryButton
                    title="Confirm Order Dispatch"
                    icon="checkmark-circle"
                    size="lg"
                    loading={orderM.isPending}
                    disabled={!product || Number(qty) <= 0 || Number(price) <= 0}
                    onPress={() => orderM.mutate()}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: p.text }]}>Record BAKI Collection</Text>
                  <Text style={[s.modalSub, { color: p.sub }]}>Receive cash or digital UPI payment</Text>
                </View>

                <View style={[s.balanceBanner, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                  <Text style={{ color: colors.baki, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                    CURRENT OUTSTANDING BAKI
                  </Text>
                  <MoneyText value={x.baki} baki style={{ fontSize: 26, marginTop: 2 }} />
                </View>

                {/* Quick settlement chips */}
                {x.baki > 0 && (
                  <View style={s.quickAmounts}>
                    <Pressable
                      style={[s.quickAmountBtn, { borderColor: colors.primary, backgroundColor: '#EFF6FF' }]}
                      onPress={() => setAmount(String(x.baki))}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
                        100% Full Settle (₹{x.baki})
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[s.quickAmountBtn, { borderColor: p.border, backgroundColor: p.bg }]}
                      onPress={() => setAmount(String(Math.round(x.baki / 2)))}
                    >
                      <Text style={{ color: p.text, fontWeight: '700', fontSize: 12 }}>50% Half</Text>
                    </Pressable>
                  </View>
                )}

                <FormInput
                  label="Amount Collected (₹)"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    setAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned);
                  }}
                  placeholder="e.g. 150.50"
                  required
                />

                {/* Payment Method Selector in Seller Panel Modal */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: p.sub, marginTop: 12, marginBottom: 8, letterSpacing: 0.5 }}>
                  CHOOSE PAYMENT METHOD
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[
                    { key: 'CASH', label: 'Cash', icon: 'cash-outline' },
                    { key: 'UPI', label: 'UPI / QR', icon: 'qr-code-outline' },
                    { key: 'CHEQUE', label: 'Cheque', icon: 'document-text-outline' },
                    { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'card-outline' },
                  ].map((pm) => {
                    const active = payMethod === pm.key;
                    return (
                      <Pressable
                        key={pm.key}
                        onPress={() => setPayMethod(pm.key as any)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : p.border,
                          backgroundColor: active ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
                        }}
                      >
                        <Ionicons name={pm.icon as any} size={14} color={active ? colors.primary : p.sub} />
                        <Text style={{ fontSize: 12, fontWeight: active ? '800' : '600', color: active ? colors.primary : p.text }}>
                          {pm.label}
                        </Text>
                        {active && (
                          <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 14 }}>
                  <PrimaryButton
                    title={`Record Collection via ${payMethod}`}
                    icon="cash"
                    size="lg"
                    loading={payM.isPending}
                    disabled={!selectedOrderId || Number(amount) <= 0}
                    onPress={() => payM.mutate()}
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Itemized Tax Invoice / Cash Memo Modal for Staff */}
      <Modal visible={!!viewInvoice} transparent animationType="slide" onRequestClose={() => setViewInvoice(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setViewInvoice(null)}>
          <Pressable
            style={[s.modalSheet, { backgroundColor: p.card, maxHeight: '85%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalDragHandle} />

            {viewInvoice && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Invoice Header with AGI Logo and Admin-Customized Name */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: p.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Image
                      source={require('@/assets/images/agi-logo.jpg')}
                      style={{ width: 44, height: 44, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: p.text, letterSpacing: -0.2 }}>
                        {billingSettingsQ.data?.businessName || 'AGI'}
                      </Text>
                      <Text style={{ fontSize: 11, color: p.sub, marginTop: 1 }}>
                        {billingSettingsQ.data?.tagline || 'Wholesale & Retail Replenishment Network'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{
                      backgroundColor: viewInvoice.billingType === 'PHYSICAL' ? '#FEF3C7' : '#EFF6FF',
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 4,
                      marginBottom: 4,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: viewInvoice.billingType === 'PHYSICAL' ? '#D97706' : colors.primary,
                      }}>
                        {viewInvoice.billingType === 'PHYSICAL' ? '📄 PHYSICAL BILL' : '🌐 ONLINE BILLING'}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, fontWeight: '800', color: p.text }}>
                      {getInvoiceNumber(viewInvoice)}
                    </Text>
                    <Text style={{ fontSize: 11, color: p.sub, marginTop: 1 }}>
                      {dateDay(viewInvoice.date)}
                    </Text>
                  </View>
                </View>

                {/* Retailer Details */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.border }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: p.sub, letterSpacing: 0.5, marginBottom: 4 }}>
                    BILLED TO (RETAILER)
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: p.text }}>
                    {x.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.sub, marginTop: 2 }}>
                    Proprietor: {x.ownerName} · +91 {x.contactNumber}
                  </Text>
                  <Text style={{ fontSize: 11, color: p.sub, marginTop: 2 }}>
                    📍 {x.location}
                  </Text>
                </View>

                {/* Itemized Line Item */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.border }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: p.sub, letterSpacing: 0.5, marginBottom: 8 }}>
                    DISPATCHED STOCK
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: p.text }}>
                        {viewInvoice.product}
                      </Text>
                      <Text style={{ fontSize: 11, color: p.sub, marginTop: 2 }}>
                        {viewInvoice.quantity} units @ ₹{viewInvoice.unitPrice}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: p.text }}>
                      {money(viewInvoice.totalAmount)}
                    </Text>
                  </View>
                </View>

                {/* Financial Summary */}
                <View style={{ paddingVertical: 12, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: p.sub }}>Subtotal:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: p.text }}>{money(viewInvoice.totalAmount)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: colors.settled, fontWeight: '700' }}>Amount Paid:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.settled }}>{money(viewInvoice.paidAmount)}</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    marginTop: 4,
                    borderTopWidth: 1.5,
                    borderTopColor: p.border,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: viewInvoice.baki > 0 ? colors.baki : p.text }}>
                      Balance Due (BAKI):
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: viewInvoice.baki > 0 ? colors.baki : colors.settled }}>
                      {money(viewInvoice.baki)}
                    </Text>
                  </View>
                </View>

                {/* Action Button inside Invoice Modal */}
                <View style={{ marginTop: 14 }}>
                  <Pressable
                    onPress={() => setViewInvoice(null)}
                    style={{
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: p.border,
                      backgroundColor: p.bg,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: p.text }}>Close Bill View</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  navbar: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navbarSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    paddingRight: 4,
  },
  heroCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  proprietorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  commRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  commBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  ledgerRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  ledgerCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 28,
  },
  ledgerColLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.muted,
    marginBottom: 2,
  },
  ledgerColValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressWrap: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIndex: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderProduct: {
    fontSize: 15,
    fontWeight: '800',
  },
  orderMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  orderLedgerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  stripCol: {
    alignItems: 'center',
  },
  stripColLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.muted,
    marginBottom: 2,
  },
  stripColValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  paymentHistory: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 6,
  },
  paymentHistoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCalcBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  balanceBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickAmountBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
