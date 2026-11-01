"use client";

import { useQuery } from "@tanstack/react-query";
import type { GlobalStats } from "@/types";

async function fetchGlobalStats(): Promise<GlobalStats> {
  const response = await fetch(`/api/stats?t=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to load live stats");
  }
  return (await response.json()) as GlobalStats;
}

export function useGlobalStats() {
  return useQuery<GlobalStats>({
    queryKey: ["global-stats"],
    queryFn: fetchGlobalStats,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
