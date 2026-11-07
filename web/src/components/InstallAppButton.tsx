import React, { useEffect, useState } from 'react';
import { Download, Check, Share, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppButton: React.FC<{
  variant?: 'nav' | 'card' | 'banner' | 'pill';
  className?: string;
  style?: React.CSSProperties;
}> = ({ variant = 'pill', className = '', style = {} }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isAppleDevice) {
      setIsIOS(true);
    }

    // Capture standard PWA install prompt for Android/Chrome/Edge/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('HeyLane application is already installed on your device.');
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
      return;
    }

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Generic fallback for desktop or browsers waiting for trigger
    alert(
      'To install this app on your device:\n\n1. In Chrome/Edge: click the Install icon (⤓) in the address bar.\n2. On Mobile: tap browser menu (⋮) and select "Install app" or "Add to Home screen".'
    );
  };

  if (isInstalled) {
    if (variant === 'nav') return null;
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0',
          ...style,
        }}
        className={className}
        title="Application is installed and active on this device"
      >
        <Check size={14} />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`btn btn-outline ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: variant === 'nav' ? '6px 12px' : '8px 16px',
          borderRadius: '999px',
          fontSize: variant === 'nav' ? '12px' : '13px',
          fontWeight: 800,
          color: '#007F5F',
          backgroundColor: '#FFFFFF',
          borderColor: '#007F5F',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 127, 95, 0.12)',
          transition: 'all 0.15s ease',
          ...style,
        }}
        title="Download and install the HeyLane PWA on your home screen or desktop"
      >
        <Download size={15} color="#007F5F" />
        <span>Download App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowIOSModal(false)}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-container"
            style={{ maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007F5F' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                    Install on iPhone / iPad
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Add to Home Screen in Safari</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#007F5F', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>1</span>
                <div>Tap the <strong>Share button</strong> <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in the bottom toolbar of Safari.</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#007F5F', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>2</span>
                <div>Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#007F5F', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>3</span>
                <div>Tap <strong>Add</strong> in the top right corner. The app will install to your device.</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

