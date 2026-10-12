'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as dashboardApi from './api';
import type { DashboardScope } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (scope: DashboardScope) => [...dashboardKeys.all, 'summary', scope] as const,
  bugStatus: (scope: DashboardScope) => [...dashboardKeys.all, 'bug-status', scope] as const,
  developers: (scope: DashboardScope) => [...dashboardKeys.all, 'developers', scope] as const,
  slowest: (scope: DashboardScope, openOnly: boolean) =>
    [...dashboardKeys.all, 'slowest', scope, openOnly] as const,
};

/*
 * One query per section, so each loads and fails on its own. Changing a filter keeps the old
 * numbers on screen (dimmed by the section) until the new ones arrive, instead of skeletons.
 */

export function useDashboardSummary(scope: DashboardScope) {
  return useQuery({
    queryKey: dashboardKeys.summary(scope),
    queryFn: () => dashboardApi.getSummary(scope),
    placeholderData: keepPreviousData,
  });
}

export function useBugStatusCounts(scope: DashboardScope) {
  return useQuery({
    queryKey: dashboardKeys.bugStatus(scope),
    queryFn: () => dashboardApi.getBugStatus(scope),
    placeholderData: keepPreviousData,
  });
}

export function useDeveloperPerformance(scope: DashboardScope) {
  return useQuery({
    queryKey: dashboardKeys.developers(scope),
    queryFn: () => dashboardApi.getDeveloperPerformance(scope),
    placeholderData: keepPreviousData,
  });
}

export function useSlowestTickets(scope: DashboardScope, openOnly: boolean) {
  return useQuery({
    queryKey: dashboardKeys.slowest(scope, openOnly),
    queryFn: () => dashboardApi.getSlowestTickets(scope, openOnly),
    placeholderData: keepPreviousData,
  });
}
