import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Home, Star, X } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';

interface PropertySearchProps {
  className?: string;
  onClose?: () => void;
}

const PropertySearch: React.FC<PropertySearchProps> = ({ className, onClose }) => {
  const { properties, loading } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);

  // Calculate average rating for a property
  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  };

  // Get available units for a property
  const getAvailableUnits = (property: any) => {
    return property.units?.filter((unit: any) => unit.is_available) || [];
  };

  // Get rent range for a property
  const getRentRange = (property: any) => {
    const availableUnits = getAvailableUnits(property);
    if (availableUnits.length === 0) return { min: 0, max: 0 };
    
    const rents = availableUnits.map((unit: any) => unit.rent_amount);
    return {
      min: Math.min(...rents),
      max: Math.max(...rents)
    };
  };

  useEffect(() => {
    if (!properties) return;

    let filtered = properties.filter(property => {
      // Text search
      const matchesSearch = !searchTerm || 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());

      // Rent range filter
      const rentRange = getRentRange(property);
      const minRentNum = minRent ? parseInt(minRent) : 0;
      const maxRentNum = maxRent ? parseInt(maxRent) : 10000;
      const matchesRent = rentRange.min <= maxRentNum && rentRange.max >= minRentNum;

      // Only show properties with available units
      const hasAvailableUnits = getAvailableUnits(property).length > 0;

      return matchesSearch && matchesRent && hasAvailableUnits;
    });

    // Sort properties by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProperties(filtered);
  }, [properties, searchTerm, minRent, maxRent]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading properties...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search size={24} />
            Find Properties
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Simple Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Min Rent */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign size={16} />
              Min Rent
            </label>
            <Input
              type="number"
              placeholder="Min rent"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
            />
          </div>

          {/* Max Rent */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign size={16} />
              Max Rent
            </label>
            <Input
              type="number"
              placeholder="Max rent"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Available Properties ({filteredProperties.length})</h3>
            {filteredProperties.length > 0 && (
              <Button variant="ghost" size="sm">View Map</Button>
            )}
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No properties found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProperties.map((property) => {
                const availableUnits = getAvailableUnits(property);
                const rentRange = getRentRange(property);
                const avgRating = calculateAverageRating(property.ratings || []);
                const hasImage = property.images && property.images.length > 0;

                return (
                  <Card key={property.id} className="cursor-pointer hover:shadow-md transition-all border">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Property Image */}
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {hasImage ? (
                            <img 
                              src={property.images[0].url} 
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Home size={24} className="text-muted-foreground" />
                          )}
                        </div>

                        {/* Property Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-lg truncate">{property.name}</h4>
                              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                                <MapPin size={14} />
                                <span className="truncate">{property.address}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium text-primary">
                                  ${rentRange.min.toLocaleString()} - ${rentRange.max.toLocaleString()}/month
                                </span>
                                {avgRating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star size={14} className="text-warning fill-warning" />
                                    <span>{avgRating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {availableUnits.length} unit{availableUnits.length !== 1 ? 's' : ''} available
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertySearch;