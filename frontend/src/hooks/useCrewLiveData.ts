/** Crew dashboards: cache briefly; sockets + manual refresh handle urgent updates. */
export const crewLiveQueryOptions = {
  staleTime: 45_000,
  gcTime: 5 * 60_000,
  refetchInterval: 45_000,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true,
};
