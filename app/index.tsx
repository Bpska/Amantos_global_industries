import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

export default function IndexLandingPage() {
  const { user, token } = useAuthStore();

  // If already authenticated, redirect straight to their role workspace
  if (token && user) {
    return <Redirect href={user.role === 'ADMIN' ? '/dashboard' : '/home'} />;
  }

  const openAdmin = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/admin/';
    } else {
      router.push('/login');
    }
  };

  const openStaffLogin = () => {
    router.push('/login');
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Executive Navigation Bar */}
        <View style={s.navbar}>
          <View style={s.navBrandRow}>
            <View style={s.navLogoFrame}>
              <Image
                source={require('@/assets/images/agi-logo.jpg')}
                style={s.navLogo}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={s.navBrandTitle}>HEYLANE</Text>
              <Text style={s.navBrandSubtitle}>INDUSTRI NETWORK</Text>
            </View>
          </View>

          <View style={s.navActions}>
            <Pressable
              onPress={openAdmin}
              style={({ pressed }) => [
                s.navAdminBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="shield-outline" size={14} color="#D4AF37" />
              <Text style={s.navAdminBtnText}>Admin Console</Text>
            </Pressable>

            <Pressable
              onPress={openStaffLogin}
              style={({ pressed }) => [
                s.navLoginBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={s.navLoginBtnText}>Staff Sign In</Text>
              <Ionicons name="arrow-forward" size={14} color="#0B0F17" />
            </Pressable>
          </View>
        </View>

        {/* Hero Section */}
        <View style={s.heroSection}>
          {/* Glowing Medallion Emblem */}
          <View style={s.emblemWrapper}>
            <View style={s.emblemGlowRing}>
              <Image
                source={require('@/assets/images/agi-logo.jpg')}
                style={s.emblemImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Domain Verification Badge */}
          <View style={s.badgePill}>
            <Ionicons name="diamond" size={12} color="#D4AF37" />
            <Text style={s.badgePillText}>INDUSTRI.HEYLANE.IN · ENTERPRISE SYSTEM</Text>
          </View>

          {/* Titles */}
          <Text style={s.heroHeadline}>HEYLANE</Text>
          <Text style={s.heroGoldSub}>INDUSTRIAL & COMMERCIAL DISTRIBUTION</Text>

          <Text style={s.heroDescription}>
            The authoritative high-velocity field workforce operations platform.
            Streamlining merchant onboarding, automated 30-day recurring replenishment billing,
            dual physical/digital dispatch, and real-time salesforce telemetry.
          </Text>

          {/* Main Action CTAs */}
          <View style={s.ctaGroup}>
            <Pressable
              onPress={openStaffLogin}
              style={({ pressed }) => [
                s.primaryGoldBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="log-in-outline" size={18} color="#0B0F17" />
              <Text style={s.primaryGoldBtnText}>Launch Field Staff Portal</Text>
              <Ionicons name="arrow-forward" size={16} color="#0B0F17" />
            </Pressable>

            <Pressable
              onPress={openAdmin}
              style={({ pressed }) => [
                s.secondaryGlassBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="desktop-outline" size={17} color="#F5E6BE" />
              <Text style={s.secondaryGlassBtnText}>Executive Web Management</Text>
            </Pressable>
          </View>

          {/* Live Status Indicators */}
          <View style={s.liveStatBar}>
            <View style={s.liveStatItem}>
              <View style={s.statDotGreen} />
              <Text style={s.statText}>Database: Online (PostgreSQL 16)</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.liveStatItem}>
              <Ionicons name="lock-closed" size={12} color="#D4AF37" />
              <Text style={s.statText}>Security: TLS 1.3 Active</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.liveStatItem}>
              <Ionicons name="flash" size={12} color="#F59E0B" />
              <Text style={s.statText}>Latency: &lt; 20ms</Text>
            </View>
          </View>
        </View>

        {/* Enterprise Feature Cards */}
        <View style={s.featuresSection}>
          <Text style={s.sectionTitle}>PLATFORM CAPABILITIES</Text>
          <Text style={s.sectionSubtitle}>
            Engineered for high-volume retail supply chains and field sales productivity
          </Text>

          <View style={s.cardsGrid}>
            {/* Card 1: Merchant Onboarding */}
            <View style={s.featureCard}>
              <View style={s.cardIconBox}>
                <Ionicons name="storefront" size={22} color="#D4AF37" />
              </View>
              <Text style={s.cardTitle}>Rapid Store Onboarding</Text>
              <Text style={s.cardText}>
                Register local retailers in under a minute with automated GPS geo-tagging,
                owner KYC profiling, storefront photography, and customizable product line allocations.
              </Text>
            </View>

            {/* Card 2: 30-Day Recurring Billing */}
            <View style={s.featureCard}>
              <View style={s.cardIconBox}>
                <Ionicons name="repeat" size={22} color="#D4AF37" />
              </View>
              <Text style={s.cardTitle}>30-Day Recurring Replenishment</Text>
              <Text style={s.cardText}>
                Automated monthly repeat-order engine. Reps log recurring purchases with 
                custom decimal pricing and quantities, preventing inventory stockouts automatically.
              </Text>
            </View>

            {/* Card 3: Dual Billing Dispatch */}
            <View style={s.featureCard}>
              <View style={s.cardIconBox}>
                <Ionicons name="receipt" size={22} color="#D4AF37" />
              </View>
              <Text style={s.cardTitle}>Physical & Digital Billing</Text>
              <Text style={s.cardText}>
                Choose between physical hardcopy billing and instant digital dispatch.
                Administrators can verify, brand, and transmit bills directly via WhatsApp with one click.
              </Text>
            </View>

            {/* Card 4: Workforce Telemetry */}
            <View style={s.featureCard}>
              <View style={s.cardIconBox}>
                <Ionicons name="analytics" size={22} color="#D4AF37" />
              </View>
              <Text style={s.cardTitle}>Real-Time Staff Telemetry</Text>
              <Text style={s.cardText}>
                Full visibility into daily store visit counts per representative, active route
                efficiency, reorder velocity, and comprehensive financial audit reports.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerBrandRow}>
            <Image
              source={require('@/assets/images/agi-logo.jpg')}
              style={s.footerLogo}
              resizeMode="cover"
            />
            <Text style={s.footerBrandText}>HEYLANE DISTRIBUTION NETWORK</Text>
          </View>
          <Text style={s.footerSubText}>
            Production Node: industri.heylane.in · PostgreSQL Enterprise · All Rights Reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'rgba(11, 15, 23, 0.95)',
  },
  navBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLogoFrame: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    backgroundColor: '#000',
  },
  navLogo: {
    width: '100%',
    height: '100%',
  },
  navBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F5E6BE',
    letterSpacing: 1.2,
  },
  navBrandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  navAdminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5E6BE',
  },
  navLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  navLoginBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B0F17',
    letterSpacing: 0.4,
  },

  /* Hero */
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  emblemWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlowRing: {
    width: 104,
    height: 104,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.7)',
    backgroundColor: '#000',
    ...Platform.select({
      web: {
        boxShadow: '0 0 45px rgba(212, 175, 55, 0.35), 0 16px 32px rgba(0, 0, 0, 0.8)',
      },
      default: {
        elevation: 12,
      },
    }),
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16,
  },
  badgePillText: {
    color: '#F5E6BE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroHeadline: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroGoldSub: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 18,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 640,
    marginBottom: 32,
  },
  ctaGroup: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 520,
    marginBottom: 36,
  },
  primaryGoldBtn: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
        cursor: 'pointer',
      },
    }),
  },
  primaryGoldBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryGlassBtn: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  secondaryGlassBtnText: {
    color: '#F5E6BE',
    fontSize: 14,
    fontWeight: '700',
  },
  liveStatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  /* Feature Grid */
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 28,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureCard: {
    width: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 280,
    backgroundColor: 'rgba(18, 24, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: 16,
    padding: 22,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94A3B8',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  footerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  footerBrandText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  footerSubText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
