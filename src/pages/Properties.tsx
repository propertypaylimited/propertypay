import React, { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, MapPin, Star, Upload, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Properties = () => {
  const { user } = useAuth();
  const { properties, loading, createProperty, uploadPropertyImage } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProperty(formData);
      setFormData({ name: '', address: '' });
      setShowCreateModal(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleImageUpload = async (propertyId: string, file: File) => {
    try {
      await uploadPropertyImage(propertyId, file);
    } catch (error) {
      // Error handled in hook
    }
  };

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground">
            Browse and manage properties
          </p>
        </div>
        
        {user && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Property</DialogTitle>
                <DialogDescription>
                  Add a new property to your portfolio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProperty} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter property name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter property address"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Property
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => {
          const averageRating = calculateAverageRating(property.ratings || []);
          const availableUnits = property.units?.filter(unit => unit.is_available).length || 0;
          
          return (
            <Card key={property.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0].url}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
                
                {user && (
                  <div className="absolute top-2 right-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(property.id, file);
                          }
                        }}
                      />
                      <div className="bg-black bg-opacity-50 text-white p-1 rounded">
                        <Upload className="h-4 w-4" />
                      </div>
                    </label>
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address || 'No address provided'}
                    </CardDescription>
                  </div>
                  {parseFloat(averageRating.toString()) > 0 && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{averageRating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Badge variant="secondary">
                      {property.units?.length || 0} units
                    </Badge>
                    {availableUnits > 0 && (
                      <Badge variant="default">
                        {availableUnits} available
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first property.'}
          </p>
          {user && !searchTerm && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Properties;