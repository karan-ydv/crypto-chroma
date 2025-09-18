import React from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PortfolioAsset } from '@/types/crypto';

interface AssetTableProps {
  assets: PortfolioAsset[];
  onAllocationChange: (assetId: string, allocation: number) => void;
  sortBy: 'name' | 'price' | 'change_24h' | 'change_7d' | 'market_cap';
  sortOrder: 'asc' | 'desc';
  onSort: (column: 'name' | 'price' | 'change_24h' | 'change_7d' | 'market_cap') => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onAllocationChange,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="font-medium">
          {isPositive ? '+' : ''}{percentage.toFixed(2)}%
        </span>
      </div>
    );
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return (
      <ArrowUpDown 
        className={`h-4 w-4 text-primary ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} 
      />
    );
  };

  return (
    <Card className="gradient-card border-border/50">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Assets</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="w-[250px]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSort('name')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground p-0"
                  >
                    Asset
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSort('price')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground p-0 ml-auto"
                  >
                    Price
                    {getSortIcon('price')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSort('change_24h')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground p-0 ml-auto"
                  >
                    24h
                    {getSortIcon('change_24h')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSort('change_7d')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground p-0 ml-auto"
                  >
                    7d
                    {getSortIcon('change_7d')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSort('market_cap')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground p-0 ml-auto"
                  >
                    Market Cap
                    {getSortIcon('market_cap')}
                  </Button>
                </TableHead>
                <TableHead className="text-center w-[120px]">Allocation</TableHead>
                <TableHead className="text-right">Portfolio Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id} className="border-border/30 hover:bg-background/30 transition-smooth">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={asset.image} alt={asset.symbol} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">{asset.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(asset.current_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(asset.price_change_percentage_24h)}
                  </TableCell>
                  <TableCell className="text-right">
                    {asset.price_change_percentage_7d_in_currency ? 
                      formatPercentage(asset.price_change_percentage_7d_in_currency) : 
                      <span className="text-muted-foreground">N/A</span>
                    }
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMarketCap(asset.market_cap)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={asset.allocation}
                        onChange={(e) => onAllocationChange(asset.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm bg-background/50 border border-border/50 rounded focus:border-primary/50 focus:outline-none text-center"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {assets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-lg mb-2">No assets selected</div>
            <div className="text-sm">Add some cryptocurrencies to start building your portfolio</div>
          </div>
        )}
      </div>
    </Card>
  );
};