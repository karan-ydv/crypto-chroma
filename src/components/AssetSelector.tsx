import React, { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cryptoApi } from '@/services/cryptoApi';
import { CryptoAsset } from '@/types/crypto';
import { useQuery } from '@tanstack/react-query';

interface AssetSelectorProps {
  selectedAssets: string[];
  onAssetAdd: (assetId: string) => void;
  onAssetRemove: (assetId: string) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAssets,
  onAssetAdd,
  onAssetRemove,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: topCryptos } = useQuery({
    queryKey: ['topCryptos'],
    queryFn: () => cryptoApi.getTopCryptos(50),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: selectedAssetData } = useQuery({
    queryKey: ['selectedAssets', selectedAssets],
    queryFn: () => cryptoApi.getAssetsByIds(selectedAssets),
    enabled: selectedAssets.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    const searchCryptos = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await cryptoApi.searchCryptos(searchQuery);
        setSearchResults(result.coins.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchCryptos, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleAddAsset = (assetId: string) => {
    if (!selectedAssets.includes(assetId)) {
      onAssetAdd(assetId);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const displayAssets = searchQuery.length >= 2 ? searchResults : topCryptos?.slice(0, 20) || [];

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Asset Selection</h3>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Selected Assets */}
        {selectedAssetData && selectedAssetData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Selected Assets ({selectedAssetData.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedAssetData.map((asset) => (
                <Badge
                  key={asset.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1 bg-secondary/50 hover:bg-secondary transition-smooth"
                >
                  <img src={asset.image} alt={asset.name} className="w-4 h-4" />
                  <span className="text-sm font-medium">{asset.symbol.toUpperCase()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssetRemove(asset.id)}
                    className="h-4 w-4 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Assets */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {searchQuery.length >= 2 ? 'Search Results' : 'Popular Assets'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
            {isSearching ? (
              <div className="col-span-full text-center py-4 text-muted-foreground">
                Searching...
              </div>
            ) : displayAssets.length > 0 ? (
              displayAssets.map((asset) => (
                <Button
                  key={asset.id}
                  variant="ghost"
                  onClick={() => handleAddAsset(asset.id)}
                  disabled={selectedAssets.includes(asset.id)}
                  className="flex items-center justify-between p-3 h-auto bg-background/30 hover:bg-background/50 border border-border/30 hover:border-border/50 transition-smooth disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={asset.thumb || asset.image} 
                      alt={asset.name} 
                      className="w-5 h-5"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium">{asset.symbol?.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-20">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  {!selectedAssets.includes(asset.id) && (
                    <Plus className="h-4 w-4 text-primary" />
                  )}
                </Button>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-muted-foreground">
                {searchQuery.length >= 2 ? 'No results found' : 'Loading popular assets...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};