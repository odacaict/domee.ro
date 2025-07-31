import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `${price} lei`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// NOU: Funcție pentru calculul timpului de călătorie
export function calculateTravelTime(distanceKm: number, transportMode: 'walking' | 'driving' | 'transit' = 'driving'): number {
  // Viteze medii în km/h pentru diferite moduri de transport
  const speeds = {
    walking: 5, // 5 km/h pentru mers pe jos
    driving: 30, // 30 km/h în oraș (cu trafic)
    transit: 20, // 20 km/h pentru transport public
  };
  
  const speed = speeds[transportMode];
  const timeInHours = distanceKm / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  return timeInMinutes;
}

// NOU: Funcție pentru formatarea timpului de călătorie
export function formatTravelTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `~${hours}h`;
  }
  return `~${hours}h ${remainingMinutes}min`;
}

// Funcție pentru formatarea timpului relativ
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Astăzi';
  if (diffInDays === 1) return 'Ieri';
  if (diffInDays < 7) return `Acum ${diffInDays} zile`;
  if (diffInDays < 30) return `Acum ${Math.floor(diffInDays / 7)} săptămâni`;
  if (diffInDays < 365) return `Acum ${Math.floor(diffInDays / 30)} luni`;
  return `Acum ${Math.floor(diffInDays / 365)} ani`;
}

// Funcție pentru formatarea datei
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}