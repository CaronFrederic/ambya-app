import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import { useOfflineCachedQuery } from "./useOfflineCachedQuery";

export type HomePayload = {
  categories: string[];
  offers: Array<{
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    discountPercent: number;
    highlightLabel?: string;
    originalPrice: number;
    discountedPrice: number;
  }>;
  topRatedSalons: Array<{
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    rating: number;
    duration: string;
    distanceKm?: number | null;
  }>;
  mapSalons: Array<{
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    rating: number;
    duration: string;
    distanceKm?: number | null;
    latitude: number;
    longitude: number;
  }>;
};

export type SearchPayload = {
  items: Array<{
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    rating: number;
    highlights: Array<{
      id: string;
      name: string;
      price: number;
      durationMin: number;
    }>;
  }>;
  total: number;
};

export type SalonDetailsPayload = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  coverImageUrl?: string;
  galleryImageUrls: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  rating: number;
  reviewCount: number;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  employees: Array<{
    id: string;
    displayName: string;
    specialties: string[];
    primarySpecialtyLabel?: string | null;
  }>;
  openingHours: Array<{
    day: string;
    open: string | null;
    close: string | null;
    closed: boolean;
  }>;
  conditions: string[];
  responseTimeMin: number | null;
  servicesByCategory: Record<
    string,
    Array<{
      id: string;
      name: string;
      description?: string | null;
      price: number;
      durationMin: number;
    }>
  >;
};

export type SalonAvailabilityPayload = {
  date: string;
  totalDurationMin: number;
  slots: Array<{ time: string; available: boolean }>;
  professionals: Array<{
    id: string;
    displayName: string;
    specialties: string[];
    primarySpecialtyLabel?: string | null;
    slots: Array<{ time: string; available: boolean }>;
  }>;
};

export function useHomeDiscovery(params?: {
  city?: string;
  country?: string;
  category?: string;
  nearMe?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return useOfflineCachedQuery({
    queryKey: ["discover", "home", params],
    queryFn: async () => {
      const res = await api.get<HomePayload>("/discover/home", {
        params: {
          ...params,
          nearMe: params?.nearMe ? "true" : undefined,
          latitude:
            typeof params?.latitude === "number"
              ? String(params.latitude)
              : undefined,
          longitude:
            typeof params?.longitude === "number"
              ? String(params.longitude)
              : undefined,
        },
      });
      return res.data;
    },
    cacheKey: `discover:home:${JSON.stringify(params ?? {})}`,
    staleTime: 1000 * 60,
  });
}

export function useSearchDiscovery(params: {
  q?: string;
  city?: string;
  country?: string;
  category?: string;
  preferredCity?: string;
  preferredCountry?: string;
}) {
  return useOfflineCachedQuery({
    queryKey: ["discover", "search", params],
    queryFn: async () => {
      const res = await api.get<SearchPayload>("/discover/search", { params });
      return res.data;
    },
    cacheKey: `discover:search:${JSON.stringify(params)}`,
  });
}

export function useSalonDetails(salonId?: string) {
  return useOfflineCachedQuery({
    queryKey: ["salons", salonId],
    queryFn: async () => {
      const res = await api.get<SalonDetailsPayload>(`/salons/${salonId}`);
      return res.data;
    },
    cacheKey: `discover:salon:${salonId ?? 'unknown'}`,
    enabled: !!salonId,
  });
}

export function useSalonAvailability(params: {
  salonId?: string;
  date?: string;
  serviceIds?: string[];
}) {
  return useQuery({
    queryKey: [
      "salons",
      params.salonId,
      "availability",
      params.date,
      params.serviceIds,
    ],
    queryFn: async () => {
      const res = await api.get<SalonAvailabilityPayload>(
        `/salons/${params.salonId}/availability`,
        {
          params: {
            date: params.date,
            serviceIds: params.serviceIds?.join(","),
          },
        },
      );
      return res.data;
    },
    enabled: !!params.salonId && !!params.date,
  });
}
