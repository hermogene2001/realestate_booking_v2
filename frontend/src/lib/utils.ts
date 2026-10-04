// Social Sharing & Quick Win Utilities

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export class SocialSharing {
  static shareProperty(property: {
    id: number;
    title: string;
    description: string;
    priceEth: number;
    images: string[];
  }) {
    if (!isBrowser) return;
    const url = `${window.location.origin}/properties/${property.id}`;
    const text = `${property.title} - ${property.priceEth} ETH`;
    if (navigator.share) {
      return navigator.share({
        title: property.title,
        text: text,
        url: url,
      }).catch(() => {
        this.copyToClipboard(url);
      });
    }
    this.copyToClipboard(url);
  }

  static shareOnTwitter(property: { title: string; priceEth: number; id: number }) {
    if (!isBrowser) return;
    const url = `${window.location.origin}/properties/${property.id}`;
    const text = `Check out ${property.title} - ${property.priceEth} ETH on Kigali Real Estate!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  }

  static shareOnFacebook(property: { id: number }) {
    if (!isBrowser) return;
    const url = `${window.location.origin}/properties/${property.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  }

  static shareOnWhatsApp(property: { title: string; priceEth: number; id: number }) {
    if (!isBrowser) return;
    const url = `${window.location.origin}/properties/${property.id}`;
    const text = `Check out ${property.title} - ${property.priceEth} ETH: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  private static copyToClipboard(text: string) {
    if (!isBrowser) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if ((window as any).showToast) {
          (window as any).showToast('Link copied to clipboard!');
        }
      });
    }
  }
}

export class NotificationUtils {
  static requestPermission() {
    if (!isBrowser) return Promise.reject('Not in browser');
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.reject('Notifications not supported');
  }

  static sendNotification(title: string, options?: NotificationOptions) {
    if (!isBrowser) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }

  static notifyBookingConfirmed(propertyTitle: string) {
    this.sendNotification('Booking Confirmed!', {
      body: `Your booking for ${propertyTitle} has been confirmed`,
      tag: 'booking-confirmed',
    });
  }

  static notifyPaymentReceived(amount: number, currency: string) {
    this.sendNotification('Payment Received!', {
      body: `${amount} ${currency} has been received`,
      tag: 'payment-received',
    });
  }

  static notifyNewMessage(from: string) {
    this.sendNotification('New Message', {
      body: `You have a new message from ${from}`,
      tag: 'new-message',
    });
  }
}

export class PerformanceUtils {
  static lazyLoadImages() {
    if (!isBrowser) return;
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  static debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  }
}

export class AccessibilityUtils {
  static focusElement(selector: string) {
    if (!isBrowser) return;
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).focus();
    }
  }

  static announceToScreenReader(message: string) {
    if (!isBrowser) return;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }

  static trapFocus(element: HTMLElement) {
    if (!isBrowser) return;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });
  }
}

// ─── Standalone utility functions ────────────────────────────────────────────

/** Format an ETH value to 4 decimal places */
export function formatEth(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.0000';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.0000';
  return num.toFixed(4);
}

/** Format a date string/Date to a readable local date */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/** Format a date string/Date to a readable local date + time */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** Return a Tailwind colour class based on a booking/property status string */
export function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'APPROVED':
      return 'text-green-600 bg-green-100';
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return 'text-yellow-600 bg-yellow-100';
    case 'CANCELLED':
    case 'REJECTED':
    case 'BANNED':
      return 'text-red-600 bg-red-100';
    case 'RENTED':
    case 'ACTIVE':
      return 'text-blue-600 bg-blue-100';
    case 'MAINTENANCE':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/** Parse a JSON images string or array into a string array */
export function parseImages(images: string | string[] | null | undefined): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Parse a JSON amenities string or array into a string array */
export function parseAmenities(amenities: string | string[] | null | undefined): string[] {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities;
  try {
    const parsed = JSON.parse(amenities);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Shorten a wallet address: 0x1234…abcd */
export function shortenAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
