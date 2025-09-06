import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Star, Upload, Plus, Edit, Trash2, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Unit {
  id: string;
  name: string;
  rent_amount: number;
  description?: string;
  is_available: boolean;
}

interface Property {
  id: string;
  name: string;
  address: string;
  landlord_id: string;
  images?: Array<{ url: string }>;
  ratings?: Array<{ rating: number }>;
  units?: Unit[];
}

interface PropertyCardProps {
  property: Property;
  onImageUpload?: (propertyId: string, file: File) => void;
  onRefresh?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onImageUpload, onRefresh }) => {
  const { user, isLandlord, isAdmin } = useAuth();
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormData, setUnitFormData] = useState({
    name: '',
    rent_amount: '',
    description: '',
  });

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const canManageUnits = user && (
    user.id === property.landlord_id || isAdmin
  );

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const unitData = {
        property_id: property.id,
        name: unitFormData.name,
        rent_amount: parseFloat(unitFormData.rent_amount),
        description: unitFormData.description,
      };

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitData)
          .eq('id', editingUnit.id);
        
        if (error) throw error;
        toast({
          title: "Unit updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('units')
          .insert([unitData]);
        
        if (error) throw error;
        toast({
          title: "Unit created successfully",
        });
      }

      setUnitFormData({ name: '', rent_amount: '', description: '' });
      setEditingUnit(null);
      setShowUnitModal(false);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error saving unit",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);
      
      if (error) throw error;
      toast({
        title: "Unit deleted successfully",
      });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error deleting unit",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name,
      rent_amount: unit.rent_amount.toString(),
      description: unit.description || '',
    });
    setShowUnitModal(true);
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setUnitFormData({ name: '', rent_amount: '', description: '' });
    setShowUnitModal(true);
  };

  const averageRating = calculateAverageRating(property.ratings || []);
  const availableUnits = property.units?.filter(unit => unit.is_available).length || 0;
  const totalUnits = property.units?.length || 0;

  return (
    <>
      <Card className="overflow-hidden">
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
          
          {canManageUnits && onImageUpload && (
            <div className="absolute top-2 right-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImageUpload(property.id, file);
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Badge variant="secondary">
                {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
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

          {/* Units Management */}
          {property.units && property.units.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="units">
                <AccordionTrigger className="text-sm">
                  View Units ({totalUnits})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {canManageUnits && (
                      <Button 
                        size="sm" 
                        onClick={openCreateModal}
                        className="w-full mb-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    )}
                    {property.units.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span className="font-medium">{unit.name}</span>
                            <Badge variant={unit.is_available ? "default" : "secondary"}>
                              {unit.is_available ? "Available" : "Occupied"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${unit.rent_amount}/month
                          </p>
                          {unit.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {unit.description}
                            </p>
                          )}
                        </div>
                        {canManageUnits && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(unit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUnit(unit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {canManageUnits && (!property.units || property.units.length === 0) && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={openCreateModal}
              className="w-full mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Unit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Unit Modal */}
      <Dialog open={showUnitModal} onOpenChange={setShowUnitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Edit Unit' : 'Add New Unit'}
            </DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Update unit details' : 'Add a new unit to this property'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnitSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Unit Name</Label>
              <Input
                id="unit-name"
                value={unitFormData.name}
                onChange={(e) => setUnitFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Unit 1A, Studio 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-amount">Monthly Rent ($)</Label>
              <Input
                id="rent-amount"
                type="number"
                value={unitFormData.rent_amount}
                onChange={(e) => setUnitFormData(prev => ({ ...prev, rent_amount: e.target.value }))}
                placeholder="1200"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-description">Description (Optional)</Label>
              <Textarea
                id="unit-description"
                value={unitFormData.description}
                onChange={(e) => setUnitFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="2 bed, 1 bath, balcony, etc."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowUnitModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUnit ? 'Update Unit' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyCard;