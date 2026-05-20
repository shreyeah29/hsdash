/** Keep crew dashboards fresh even if realtime sockets drop on production. */
export const crewLiveQueryOptions = {
  refetchInterval: 8_000,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
  staleTime: 0,
};
