import React, { useMemo, useCallback } from 'react';
import { BarChart3, List, Calendar, Download, Activity, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { ErrorBoundary } from '../ErrorBoundary';
import { Skeleton, SkeletonStats } from '../ui/Skeleton';
import { StatsCards } from '../analytics/StatsCards';
import { ActivityChart } from '../analytics/ActivityChart';
import { ActionDistributionChart } from '../analytics/ActionDistributionChart';
import { formatActionName } from '../../utils/analytics';
import { useI18n } from '../../contexts/I18nContext';
import type { AuditLog } from '../../types';

interface ActivityTabProps {
  projectId: string | undefined;
  activityView: 'analytics' | 'list';
  onViewChange: (view: 'analytics' | 'list') => void;
  dateRange: '7d' | '30d' | '90d' | 'all';
  onDateRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void;
  // Analytics props
  analyticsStats: any;
  isAnalyticsLoading: boolean;
  analyticsError: Error | null;
  chartData: any[];
  onExportAnalytics: () => void;
  // List props
  activityData: any;
  isActivityLoading: boolean;
  activityError: Error | null;
  activityPage: number;
  onPageChange: (page: number) => void;
}

// Memoized utility functions
const getTimeAgo = (timestamp: string, t: (key: string, params?: Record<string, string | number>) => string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('home.justNow');
  if (diffInSeconds < 3600) return t('home.timeAgo.minutes', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('home.timeAgo.hours', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800) return t('home.timeAgo.days', { count: Math.floor(diffInSeconds / 86400) });
  return date.toLocaleDateString();
};

const formatAction = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (action.includes('CREATE')) return 'success';
  if (action.includes('DELETE')) return 'danger';
  if (action.includes('UPDATE') || action.includes('ROTATE')) return 'warning';
  if (action.includes('READ')) return 'info';
  return 'default';
};

// Memoized activity log item component
const ActivityLogItem = React.memo<{ log: AuditLog }>(({ log }) => {
  const { t } = useI18n();
  const actionColor = useMemo(() => getActionColor(log.action), [log.action]);
  const formattedAction = useMemo(() => formatAction(log.action), [log.action]);
  const timeAgo = useMemo(() => getTimeAgo(log.createdAt || '', t), [log.createdAt, t]);
  const userEmail = useMemo(
    () => log.userEmail || log.user?.email || t('activity.project.unknownUser'),
    [log.userEmail, log.user?.email, t]
  );

  return (
    <div className="p-4 transition-colors hover:bg-elevation-1">
      <div className="flex items-start gap-4">
        <div
          className={`p-2 rounded-lg ${
            actionColor === 'success' ? 'bg-status-success-bg text-status-success' :
            actionColor === 'danger' ? 'bg-status-danger-bg text-status-danger' :
            actionColor === 'warning' ? 'bg-status-warning-bg text-status-warning' :
            actionColor === 'info' ? 'bg-status-info-bg text-status-info' :
            'bg-elevation-2 text-theme-secondary'
          }`}
        >
          <Activity className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          {log.description ? (
            <p className="text-body-sm font-medium text-theme-primary">
              {log.description}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={actionColor}>
                  {formattedAction}
                </Badge>
                {log.resourceName && (
                  <span className="text-body-sm font-medium text-theme-primary">
                    {log.resourceName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-body-sm text-theme-tertiary">
                by {userEmail}
                {log.metadata?.teamName && (
                  <span className="text-theme-tertiary"> (team: {log.metadata.teamName as string})</span>
                )}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center text-body-sm text-theme-tertiary">
          <Clock className="h-4 w-4 mr-1" />
          {timeAgo}
        </div>
      </div>
    </div>
  );
});

ActivityLogItem.displayName = 'ActivityLogItem';

export const ActivityTab: React.FC<ActivityTabProps> = React.memo(({
  projectId,
  activityView,
  onViewChange,
  dateRange,
  onDateRangeChange,
  analyticsStats,
  isAnalyticsLoading,
  analyticsError,
  chartData,
  onExportAnalytics,
  activityData,
  isActivityLoading,
  activityError,
  activityPage,
  onPageChange,
}) => {
  const { t } = useI18n();
  const handleViewChange = useCallback((view: 'analytics' | 'list') => {
    onViewChange(view);
  }, [onViewChange]);

  const handleDateRangeChange = useCallback((range: '7d' | '30d' | '90d' | 'all') => {
    onDateRangeChange(range);
  }, [onDateRangeChange]);

  const handlePageChange = useCallback((page: number) => {
    onPageChange(page);
  }, [onPageChange]);
  return (
    <ErrorBoundary
      resetKeys={[projectId || '', activityView]}
      fallback={
        <Card className="p-6">
          <div className="text-center">
            <p className="mb-2 text-status-danger">{t('activityTab.errorLoadingTab')}</p>
            <p className="text-sm text-theme-tertiary">
              {t('activityTab.errorLoadingTabDescription')}
            </p>
            <Button onClick={() => window.location.reload()}>{t('activityTab.refreshPage')}</Button>
          </div>
        </Card>
      }
    >
      <div className="tab-content-container space-y-6">
        {/* Header with view toggle and date filter */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-h3 font-semibold text-theme-primary">
            {t('activityTab.projectActivity')}
          </h2>
          <div className="flex items-center gap-3">
            {/* Date Range Filter and Export (only for analytics) */}
            {activityView === 'analytics' && (
              <>
                <div className="flex items-center gap-2 rounded-lg p-1 bg-elevation-1">
                  <Calendar className="h-4 w-4 text-theme-tertiary" />
                  <select
                    value={dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                    className="bg-transparent border-none text-body-sm font-medium focus:outline-none cursor-pointer text-theme-primary"
                  >
                    <option value="7d">{t('activityTab.last7Days')}</option>
                    <option value="30d">{t('activityTab.last30Days')}</option>
                    <option value="90d">{t('activityTab.last90Days')}</option>
                    <option value="all">{t('activityTab.allTime')}</option>
                  </select>
                </div>
                {analyticsStats && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onExportAnalytics}
                    className="!m-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('activityTab.export')}
                  </Button>
                )}
              </>
            )}

            {/* View Toggle */}
            <div className="flex items-center gap-2 rounded-lg p-1 bg-elevation-1">
              <Button
                variant={activityView === 'analytics' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleViewChange('analytics')}
                className="!m-0"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('activityTab.analytics')}
              </Button>
              <Button
                variant={activityView === 'list' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleViewChange('list')}
                className="!m-0"
              >
                <List className="h-4 w-4 mr-2" />
                {t('activityTab.list')}
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics View */}
        {activityView === 'analytics' && (
          <>
            {isAnalyticsLoading ? (
              <div className="space-y-6">
                <SkeletonStats />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card rounded-lg p-6">
                    <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  </div>
                  <div className="card rounded-lg p-6">
                    <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  </div>
                </div>
              </div>
            ) : analyticsError ? (
              <Card className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 bg-status-danger-bg">
                    <AlertTriangle className="h-6 w-6 text-status-danger" />
                  </div>
                  <h3 className="text-h3 font-medium mb-2 text-theme-primary">{t('activityTab.errorLoadingAnalytics')}</h3>
                  <p className="text-body-sm mb-4 text-theme-secondary">
                    {analyticsError instanceof Error
                      ? analyticsError.message
                      : t('activityTab.errorLoadingAnalyticsDescription')}
                  </p>
                  {(analyticsError as any)?.isPermissionError && (
                    <p className="text-caption mb-4 text-theme-tertiary">
                      {t('activityTab.noPermissionAnalytics')}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    {t('activityTab.refreshPage')}
                  </Button>
                </div>
              </Card>
            ) : !analyticsStats ? (
              <Card className="p-6">
                <EmptyState
                  icon={<Activity className="h-16 w-16 text-theme-tertiary" />}
                  title="No Activity"
                  description="Activity for this project will appear here as actions are performed"
                />
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <StatsCards stats={analyticsStats} />

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActivityChart data={chartData} title={t('activityTab.activityOverTime')} type="line" />
                  <ActionDistributionChart
                    actionsByType={analyticsStats.actionsByType}
                    title={t('activityTab.actionsDistribution')}
                  />
                </div>

                {/* Top Users and Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Users */}
                  <Card className="p-6">
                    <h3 className="text-h3 font-semibold mb-4 text-theme-primary">{t('activityTab.topContributors')}</h3>
                    {analyticsStats.topUsers.length === 0 ? (
                      <p className="text-body-sm text-theme-tertiary">{t('activityTab.noUserData')}</p>
                    ) : (
                      <div className="space-y-3">
                        {analyticsStats.topUsers.map((user: { userId: string; email?: string; count: number }, index: number) => (
                          <div key={user.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold bg-elevation-2 text-theme-secondary">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-body-sm font-medium text-theme-primary">
                                  {user.email || t('activity.project.unknownUser')}
                                </p>
                                <p className="text-caption text-theme-tertiary">{user.count} {t('activityTab.actions')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Top Actions */}
                  <Card className="p-6">
                    <h3 className="text-h3 font-semibold mb-4 text-theme-primary">{t('activityTab.mostCommonActions')}</h3>
                    {analyticsStats.topActions.length === 0 ? (
                      <p className="text-body-sm text-theme-tertiary">{t('activityTab.noActionData')}</p>
                    ) : (
                      <div className="space-y-3">
                        {analyticsStats.topActions.map((action: { action: string; count: number }, index: number) => (
                          <div key={action.action} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold bg-status-info-bg text-status-info">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-body-sm font-medium text-theme-primary">
                                  {formatActionName(action.action)}
                                </p>
                                <p className="text-caption text-theme-tertiary">{action.count} {t('activityTab.occurrences')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* List View */}
        {activityView === 'list' && (
          <>
            {isActivityLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : activityError ? (
              <Card className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 bg-status-danger-bg">
                    <AlertTriangle className="h-6 w-6 text-status-danger" />
                  </div>
                  <h3 className="text-h3 font-medium mb-2 text-theme-primary">{t('activityTab.errorLoadingActivity')}</h3>
                  <p className="text-body-sm mb-4 text-theme-secondary">
                    {activityError instanceof Error
                      ? activityError.message
                      : t('activityTab.errorLoadingActivityDescription')}
                  </p>
                  {(activityError as any)?.isPermissionError && (
                    <p className="text-caption mb-4 text-theme-tertiary">
                      {t('activityTab.noPermissionActivity')}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    {t('activityTab.refreshPage')}
                  </Button>
                </div>
              </Card>
            ) : !activityData || !('content' in activityData) || activityData.content.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  icon={<Activity className="h-16 w-16 text-theme-tertiary" />}
                  title={t('activityTab.noActivity')}
                  description={t('activityTab.noActivityDescription')}
                />
              </Card>
            ) : (
              <>
                <div className="rounded-lg border border-theme-subtle divide-y divide-theme-subtle bg-card">
                  {activityData.content.map((log: AuditLog) => (
                    <ActivityLogItem key={log.id} log={log} />
                  ))}
                </div>

                {activityData.totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, activityPage - 1))}
                        disabled={activityPage === 1}
                      >
                        {t('activityTab.previous')}
                      </Button>
                      <span className="flex items-center px-4 text-body-sm text-theme-secondary">
                        {t('activityTab.page', { current: activityPage, total: activityData.totalPages })}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(activityData.totalPages, activityPage + 1))}
                        disabled={activityPage >= activityData.totalPages}
                      >
                        {t('activityTab.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
});

ActivityTab.displayName = 'ActivityTab';

