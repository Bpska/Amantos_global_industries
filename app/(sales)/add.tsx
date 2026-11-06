import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { salesApi } from '@/services/api';
import { dateDay, apiError, money } from '@/utils/format';
import { FormInput, MoneyText, PrimaryButton, StatusChip, usePalette } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, shadows } from '@/constants/theme';

const PRODUCT_PRESETS = [
  'Mixture Pack',
  'CTC Chai 1kg',
  'Roasted Peanuts',
  'Khakhra Masala',
  'Besan Ladoo 500g',
];

const schema = z
  .object({
    name: z.string().trim().min(2, 'Shop name is required'),
    location: z.string().trim().min(3, 'Location is required'),
    ownerName: z.string().trim().min(2, 'Owner name is required'),
    contactNumber: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    product: z.string().trim().min(1, 'Product is required'),
    quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be greater than 0'),
    unitPrice: z.number().positive('Unit price must be greater than 0'),
    amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
    date: z.date(),
    notes: z.string().optional(),
  })
  .refine((x) => Number(x.amountPaid) <= Number(x.quantity) * Number(x.unitPrice), {
    path: ['amountPaid'],
    message: 'Amount paid cannot exceed total order amount',
  });

type Form = z.infer<typeof schema>;

const num = (x: string | number) => {
  const n = parseFloat(String(x));
  return Number.isNaN(n) ? 0 : n;
};

export default function Add() {
  const p = usePalette();
  const qc = useQueryClient();
  const productsQ = useQuery({ queryKey: ['products'], queryFn: salesApi.products });
  const [dateOpen, setDateOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER'>('CASH');
  const [billingType, setBillingType] = useState<'ONLINE' | 'PHYSICAL'>('ONLINE');
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    total: number;
    paid: number;
    baki: number;
    paymentMethod: string;
    billingType: 'ONLINE' | 'PHYSICAL';
  } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      location: '',
      ownerName: '',
      contactNumber: '',
      product: 'Mixture Pack',
      quantity: 100,
      unitPrice: 5,
      amountPaid: 200,
      date: new Date(),
      notes: '',
    },
  });

  const [qty, price, paid, date, currentProduct] = useWatch({
    control,
    name: ['quantity', 'unitPrice', 'amountPaid', 'date', 'product'],
  });

  const total = num(qty) * num(price);
  const amountPaidNum = num(paid);
  const baki = Math.max(0, total - amountPaidNum);

  const m = useMutation({
    mutationFn: (v: Form) =>
      salesApi.createShop({
        ...v,
        quantity: Number(v.quantity),
        unitPrice: Number(v.unitPrice),
        amountPaid: Number(v.amountPaid || 0),
        paymentMethod,
        billingType,
        date: v.date.toISOString(),
      }),
    onMutate: () => setSubmitError(''),
    onSuccess: (shop) => {
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['my-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSubmittedData({
        name: shop.name,
        total: shop.totalAmount,
        paid: shop.paidAmount,
        baki: shop.baki,
        paymentMethod,
        billingType,
      });
    },
    onError: (e) => setSubmitError(`Could not onboard retailer: ${apiError(e)}`),
  });

  const locate = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        throw new Error('Location permission was denied. Please type the address manually.');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const a = await Location.reverseGeocodeAsync(pos.coords);
      const x = a[0];
      const address = x
        ? [x.name, x.street, x.city, x.region, x.postalCode].filter(Boolean).join(', ')
        : `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;

      setValue('location', address, { shouldValidate: true });
    } catch (e) {
      setSubmitError(`GPS unavailable: ${apiError(e)}`);
    } finally {
      setLocating(false);
    }
  };

  const submit = handleSubmit(
    (v: Form) => {
      if (!m.isPending) m.mutate(v);
    },
    () => setSubmitError('Please correct the highlighted fields above, then complete onboarding again.')
  );

  if (submittedData) {
    return (
      <View style={[s.successWrap, { backgroundColor: p.bg }]}>
        <View style={[s.receiptCard, { backgroundColor: p.card, borderColor: p.border }, shadows.md]}>
          <View style={s.successBadge}>
            <Ionicons name="checkmark-sharp" size={32} color="#fff" />
          </View>
          <Text style={[s.successTitle, { color: p.text }]}>Retailer Onboarded</Text>
          <Text style={[s.successSub, { color: p.sub }]}>
            Store account created and initial delivery ledger has been synchronized.
          </Text>

          <View style={[s.receiptTable, { backgroundColor: p.bg, borderColor: p.border }]}>
            <View style={s.receiptRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Store Name</Text>
              <Text style={{ color: p.text, fontSize: 14, fontWeight: '800' }}>{submittedData.name}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Order Value</Text>
              <Text style={{ color: p.text, fontSize: 14, fontWeight: '800' }}>{money(submittedData.total)}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Collected Upfront</Text>
              <Text style={{ color: colors.settled, fontSize: 14, fontWeight: '800' }}>{money(submittedData.paid)}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Payment Mode</Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>{submittedData.paymentMethod}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Billing Option</Text>
              <Text style={{ color: submittedData.billingType === 'PHYSICAL' ? '#D97706' : colors.primary, fontSize: 14, fontWeight: '800' }}>
                {submittedData.billingType === 'PHYSICAL' ? '📄 Physical Bill' : '🌐 Online Billing'}
              </Text>
            </View>
            <View style={[s.divider, { backgroundColor: p.border }]} />
            <View style={s.receiptRow}>
              <Text style={{ color: colors.baki, fontSize: 13, fontWeight: '800' }}>Pending BAKI</Text>
              <MoneyText value={submittedData.baki} baki style={{ fontSize: 18 }} />
            </View>
          </View>

          <View style={{ width: '100%', gap: 10, marginTop: 24 }}>
            <PrimaryButton
              title="Onboard Another Store"
              icon="add-circle-outline"
              onPress={() => {
                reset();
                setSubmitError('');
                setSubmittedData(null);
              }}
            />
            <PrimaryButton
              title="View Store Directory"
              variant="outline"
              icon="storefront-outline"
              onPress={() => {
                reset();
                setSubmitError('');
                setSubmittedData(null);
                router.push('/shops');
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  const renderField = (name: keyof Form, label: string, extra: any = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <FormInput
          label={label}
          required={extra.required !== false}
          value={value instanceof Date ? '' : String(value ?? '')}
          onChangeText={(x) => {
            if (extra.numeric) {
              // Allow numbers and decimal fractions (e.g. 10.50, 12.25)
              const sanitized = x.replace(/[^0-9.]/g, '');
              const parts = sanitized.split('.');
              const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
              if (formatted === '' || formatted === '.' || formatted.endsWith('.')) {
                onChange(formatted as any);
              } else {
                const parsed = parseFloat(formatted);
                onChange(Number.isNaN(parsed) ? (0 as any) : parsed);
              }
            } else {
              onChange(x);
            }
          }}
          onBlur={() => {
            onBlur();
            if (extra.numeric) {
              const parsed = parseFloat(String(value));
              onChange(Number.isNaN(parsed) ? (0 as any) : parsed);
            }
          }}
          error={errors[name]?.message as string}
          {...extra}
        />
      )}
    />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: p.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 50 }}>
        <AppHeader
          title="Onboard Retailer"
          subtitle="Register store identity and record first inventory delivery"
        />

        {/* Section 1: Retailer Identity */}
        <FormSection
          num="01"
          title="Store Identity"
          caption="Basic retailer information and trade location"
          p={p}
        >
          {renderField('name', 'Trade / Store Name', { placeholder: 'e.g. Mahadev Kirana & General Stores' })}

          <View style={{ marginBottom: 4 }}>
            {renderField('location', 'Store Location / Street Address', { placeholder: 'Market Yard, Main Road, Pune' })}
            <Pressable
              onPress={locate}
              disabled={locating}
              style={[s.gpsBtn, { borderColor: p.border, backgroundColor: p.bg }]}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="navigate-circle" size={18} color={colors.primary} />
              )}
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                {locating ? 'Acquiring GPS Fix…' : 'Detect Live Location (GPS)'}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 10 }} />

          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              {renderField('ownerName', 'Proprietor Name', { placeholder: 'e.g. Ramesh Patel' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderField('contactNumber', 'Mobile (10 Digits)', {
                keyboardType: 'phone-pad',
                maxLength: 10,
                placeholder: '9876543210',
              })}
            </View>
          </View>
        </FormSection>

        {/* Section 2: Order Details */}
        <FormSection
          num="02"
          title="Initial Stock Delivery"
          caption="Select fast-moving inventory items or type custom SKU"
          p={p}
        >
          <Text style={[s.fieldMicroLabel, { color: p.sub }]}>ADMIN CONFIGURED SKUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetPills}>
            {(productsQ.data && productsQ.data.length > 0
              ? productsQ.data
              : PRODUCT_PRESETS.map((name) => ({ id: name, name, unitPrice: 10, category: 'General' }))
            ).map((item: any) => {
              const active = currentProduct === item.name;
              return (
                <Pressable
                  key={item.name}
                  onPress={() => {
                    setValue('product', item.name, { shouldValidate: true });
                    if (item.unitPrice) {
                      setValue('unitPrice', Number(item.unitPrice), { shouldValidate: true });
                    }
                  }}
                  style={[
                    s.skuChip,
                    {
                      backgroundColor: active ? colors.primary : p.bg,
                      borderColor: active ? colors.primary : p.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'cube-outline'}
                    size={14}
                    color={active ? '#fff' : p.sub}
                  />
                  <Text style={[s.skuChipText, { color: active ? '#fff' : p.text }]}>
                    {item.name} (₹{item.unitPrice})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {renderField('product', 'Product / SKU Description')}

          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              {renderField('quantity', 'Quantity (Units)', { keyboardType: 'numeric', numeric: true })}
            </View>
            <View style={{ flex: 1 }}>
              {renderField('unitPrice', 'Rate Per Unit (₹)', { keyboardType: 'decimal-pad', numeric: true })}
            </View>
          </View>

          <View style={[s.calcPreview, { backgroundColor: p.bg, borderColor: p.border }]}>
            <Text style={{ color: p.sub, fontSize: 12, fontWeight: '600' }}>Delivery Total:</Text>
            <Text style={{ color: p.text, fontSize: 15, fontWeight: '800' }}>
              {qty || 0} units × ₹{price || 0} = <Text style={{ color: colors.primary }}>{money(total)}</Text>
            </Text>
          </View>
        </FormSection>

        {/* Section 3: Payment & BAKI Ledger */}
        <FormSection
          num="03"
          title="Ledger Settlement & BAKI"
          caption="Record upfront collection and calculate pending balance"
          p={p}
        >
          {renderField('amountPaid', 'Upfront Amount Collected (₹)', {
            keyboardType: 'decimal-pad',
            numeric: true,
            placeholder: '0',
          })}

          {/* Payment Method Selector (Seller Panel Option) */}
          <Text style={[s.fieldMicroLabel, { color: p.sub, marginTop: 10, marginBottom: 8 }]}>
            PAYMENT METHOD MODE
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { key: 'CASH', label: 'Cash', icon: 'cash-outline' },
              { key: 'UPI', label: 'UPI / QR', icon: 'qr-code-outline' },
              { key: 'CHEQUE', label: 'Cheque', icon: 'document-text-outline' },
              { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'card-outline' },
            ].map((pm) => {
              const active = paymentMethod === pm.key;
              return (
                <Pressable
                  key={pm.key}
                  onPress={() => setPaymentMethod(pm.key as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : p.border,
                    backgroundColor: active ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
                  }}
                >
                  <Ionicons
                    name={pm.icon as any}
                    size={15}
                    color={active ? colors.primary : p.sub}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: active ? '800' : '600',
                      color: active ? colors.primary : p.text,
                    }}
                  >
                    {pm.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Billing Option: Physical or Online */}
          <Text style={[s.fieldMicroLabel, { color: p.sub, marginTop: 14 }]}>
            BILLING OPTION / FORMAT
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 }}>
            {[
              {
                key: 'PHYSICAL',
                title: 'Physical Bill',
                desc: 'Paper cash memo handed to shop',
                icon: 'document-text-outline',
              },
              {
                key: 'ONLINE',
                title: 'Online Billing',
                desc: 'Admin sends bill to WhatsApp',
                icon: 'globe-outline',
              },
            ].map((b) => {
              const active = billingType === b.key;
              return (
                <Pressable
                  key={b.key}
                  onPress={() => setBillingType(b.key as any)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? colors.primary : p.border,
                    backgroundColor: active ? (p.dark ? '#1E293B' : '#EFF6FF') : p.card,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={b.icon as any} size={16} color={active ? colors.primary : p.sub} />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: active ? colors.primary : p.text }}>
                        {b.title}
                      </Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                  </View>
                  <Text style={{ fontSize: 11, color: p.sub, marginTop: 4 }}>
                    {b.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* High-End Enterprise Ledger Receipt */}
          <View style={[s.ledgerBox, { backgroundColor: p.bg, borderColor: p.border }]}>
            <View style={s.ledgerRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Gross Billed</Text>
              <Text style={{ color: p.text, fontSize: 15, fontWeight: '800' }}>{money(total)}</Text>
            </View>
            <View style={s.ledgerRow}>
              <Text style={{ color: p.sub, fontSize: 13, fontWeight: '600' }}>Amount Collected</Text>
              <Text style={{ color: colors.settled, fontSize: 15, fontWeight: '800' }}>
                - {money(amountPaidNum)}
              </Text>
            </View>
            <View style={[s.divider, { backgroundColor: p.border }]} />
            <View style={s.ledgerRow}>
              <View>
                <Text style={{ color: colors.baki, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>
                  REMAINING BAKI
                </Text>
                <Text style={{ color: p.sub, fontSize: 11, marginTop: 2 }}>Outstanding store credit</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <MoneyText value={baki} baki style={{ fontSize: 20 }} />
                <View style={{ marginTop: 4 }}>
                  <StatusChip status={baki === 0 ? 'PAID' : (amountPaidNum > 0 ? 'PARTIAL' : 'UNPAID')} />
                </View>
              </View>
            </View>
          </View>
        </FormSection>

        {/* Section 4: Visit Metadata */}
        <FormSection
          num="04"
          title="Visit Details & Field Notes"
          caption="Audit timestamp and route remarks"
          p={p}
        >
          <Text style={[s.fieldMicroLabel, { color: p.sub }]}>DISPATCH DATE</Text>
          <Pressable
            onPress={() => setDateOpen(true)}
            style={[s.dateBtn, { borderColor: p.border, backgroundColor: p.bg }]}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={{ color: p.text, fontWeight: '700', fontSize: 14 }}>
              {dateDay(date || new Date())}
            </Text>
          </Pressable>

          {dateOpen && (
            <DateTimePicker
              value={date || new Date()}
              maximumDate={new Date()}
              onChange={(_, d) => {
                setDateOpen(Platform.OS === 'ios');
                if (d) setValue('date', d);
              }}
            />
          )}

          {renderField('notes', 'Dispatch Notes / Payment Promise', {
            required: false,
            multiline: true,
            numberOfLines: 3,
            placeholder: 'e.g. Next collection visit on Tuesday morning. Cheque promised.',
            style: { height: 74, textAlignVertical: 'top', paddingTop: 10 },
          })}
        </FormSection>

        {/* Action Button */}
        <View style={s.submitWrap}>
          {submitError ? (
            <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 12, fontSize: 14 }}>
              {submitError}
            </Text>
          ) : null}
          <PrimaryButton
            title={m.isPending ? 'Saving Retailer…' : 'Complete Retailer Onboarding'}
            icon="checkmark-circle"
            size="lg"
            onPress={submit}
            loading={m.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormSection({
  num,
  title,
  caption,
  p,
  children,
}: {
  num: string;
  title: string;
  caption: string;
  p: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.sectionCard, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
      <View style={s.sectionHeader}>
        <View style={s.sectionNumBadge}>
          <Text style={s.sectionNumText}>{num}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sectionTitle, { color: p.text }]}>{title}</Text>
          <Text style={[s.sectionCaption, { color: p.sub }]}>{caption}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  fieldMicroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetPills: {
    gap: 8,
    paddingBottom: 12,
  },
  skuChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  skuChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  calcPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  ledgerBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  submitWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  successWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  receiptCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.settled,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  receiptTable: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
