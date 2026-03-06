import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export type HomePayload = {
  categories: string[];
  offers: Array<{
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    discountPercent: number;
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
  }>;
};

export type SearchPayload = {
  items: Array<{
    id: string;
    name: string;
    city: string | null;
    country: string | null;
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
  employees: Array<{ id: string; displayName: string }>;
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
    slots: Array<{ time: string; available: boolean }>;
  }>;
};

export function useHomeDiscovery(params?: {
  city?: string;
  country?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["discover", "home", params],
    queryFn: async () => {
      const res = await api.get<HomePayload>("/discover/home", { params });
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useSearchDiscovery(params: {
  q?: string;
  city?: string;
  country?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["discover", "search", params],
    queryFn: async () => {
      const res = await api.get<SearchPayload>("/discover/search", { params });
      return res.data;
    },
  });
}

export function useSalonDetails(salonId?: string) {
  return useQuery({
    queryKey: ["salons", salonId],
    queryFn: async () => {
      const res = await api.get<SalonDetailsPayload>(`/salons/${salonId}`);
      return res.data;
    },
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
