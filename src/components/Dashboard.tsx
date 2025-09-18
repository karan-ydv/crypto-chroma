import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

import { AssetSelector } from '@/components/AssetSelector';
import { AssetTable } from '@/components/AssetTable';
import { PriceChart } from '@/components/PriceChart';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { PortfolioMetrics } from '@/components/PortfolioMetrics';

import { cryptoApi } from '@/services/cryptoApi';
import { TimeRange, ChartDataPoint } from '@/types/crypto';
import { 
  calculatePortfolioMetrics, 
  createPortfolioAssets, 
  combineChartData,
  getChartColors,
  sortAssets
} from '@/utils/portfolio';

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['bitcoin', 'ethereum', 'binancecoin']);
  const [allocations, setAllocations] = useState<Record<string, number>>({
    bitcoin: 40,
    ethereum: 35,
    binancecoin: 25,
  });
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(10000);
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change_24h' | 'change_7d' | 'market_cap'>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Fetch selected assets data
  const { data: assetsData, isLoading: isLoadingAssets, refetch: refetchAssets } = useQuery({
    queryKey: ['selectedAssets', selectedAssets],
    queryFn: () => cryptoApi.getAssetsByIds(selectedAssets),
    enabled: selectedAssets.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds auto-refresh
  });

  // Create portfolio assets with allocations
  const portfolioAssets = useMemo(() => {
    if (!assetsData) return [];
    return createPortfolioAssets(assetsData, allocations, totalPortfolioValue);
  }, [assetsData, allocations, totalPortfolioValue]);

  // Sort assets
  const sortedAssets = useMemo(() => {
    return sortAssets(portfolioAssets, sortBy, sortOrder);
  }, [portfolioAssets, sortBy, sortOrder]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!portfolioAssets || portfolioAssets.length === 0) return null;
    return calculatePortfolioMetrics(portfolioAssets, totalPortfolioValue, chartData, timeRange);
  }, [portfolioAssets, totalPortfolioValue, chartData, timeRange]);

  // Load chart data when assets or time range changes
  useEffect(() => {
    const loadChartData = async () => {
      if (selectedAssets.length === 0 || !assetsData || portfolioAssets.length === 0) {
        setChartData([]);
        return;
      }

      setIsLoadingChart(true);
      try {
        const days = cryptoApi.getTimeRangeDays(timeRange);
        const chartPromises = selectedAssets.map(async (assetId) => {
          const priceHistory = await cryptoApi.getPriceHistory(assetId, days);
          return { id: assetId, prices: priceHistory.prices };
        });

        const assetsChartData = await Promise.all(chartPromises);
        const combinedData = combineChartData(assetsChartData, assetsData, portfolioAssets);
        setChartData(combinedData);
      } catch (error) {
        console.error('Error loading chart data:', error);
        toast({
          title: "Error loading chart data",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoadingChart(false);
      }
    };

    loadChartData();
  }, [selectedAssets, timeRange, assetsData, portfolioAssets, toast]);

  // Chart colors and asset info
  const chartAssets = useMemo(() => {
    if (!assetsData) return [];
    return getChartColors(assetsData.map(asset => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
    })));
  }, [assetsData]);

  // Event handlers
  const handleAssetAdd = (assetId: string) => {
    if (!selectedAssets.includes(assetId)) {
      setSelectedAssets(prev => [...prev, assetId]);
      setAllocations(prev => ({ ...prev, [assetId]: 0 }));
    }
  };

  const handleAssetRemove = (assetId: string) => {
    setSelectedAssets(prev => prev.filter(id => id !== assetId));
    setAllocations(prev => {
      const { [assetId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleAllocationChange = (assetId: string, allocation: number) => {
    setAllocations(prev => ({ ...prev, [assetId]: allocation }));
  };

  const handleSort = (column: 'name' | 'price' | 'change_24h' | 'change_7d' | 'market_cap') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleRefresh = () => {
    refetchAssets();
    toast({
      title: "Data refreshed",
      description: "Portfolio data has been updated",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
              Crypto Portfolio Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze and manage your cryptocurrency portfolio with real-time data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="portfolio-value" className="text-sm font-medium">
                Portfolio Value:
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="portfolio-value"
                  type="number"
                  value={totalPortfolioValue}
                  onChange={(e) => setTotalPortfolioValue(parseFloat(e.target.value) || 0)}
                  className="pl-10 w-32 bg-background/50 border-border/50"
                  min="0"
                  step="100"
                />
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isLoadingAssets}
              size="sm"
              className="gradient-primary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAssets ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Asset Selection */}
        <AssetSelector
          selectedAssets={selectedAssets}
          onAssetAdd={handleAssetAdd}
          onAssetRemove={handleAssetRemove}
        />

        {/* Portfolio Metrics */}
        <PortfolioMetrics
          assets={portfolioAssets}
          totalPortfolioValue={totalPortfolioValue}
          metrics={portfolioMetrics}
        />

        {/* Price Chart */}
        <PriceChart
          data={chartData}
          assets={chartAssets}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          isLoading={isLoadingChart}
        />

        {/* Portfolio Charts */}
        <PortfolioCharts assets={portfolioAssets} />

        {/* Asset Table */}
        <AssetTable
          assets={sortedAssets}
          onAllocationChange={handleAllocationChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};