import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Property {
  id: string;
  name: string;
  address: string;
  landlord_id: string;
  created_at: string;
  images?: { id: string; url: string }[];
  units?: { id: string; name: string; is_available: boolean; rent_amount: number }[];
  ratings?: { rating: number; comment: string }[];
}

export const useProperties = () => {
  const { user, isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select(`
          *,
          images (id, url),
          units (id, name, is_available, rent_amount),
          ratings (rating, comment)
        `);

      // If not admin, only show user's properties or all for browsing
      if (!isAdmin && user) {
        // For now, let users see all properties for browsing
        // Later we can add a separate endpoint for owned properties
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching properties",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: {
    name: string;
    address: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([{
          ...propertyData,
          landlord_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Property created successfully",
      });

      await fetchProperties();
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating property",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Property updated successfully",
      });

      await fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error updating property",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Property deleted successfully",
      });

      await fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadPropertyImage = async (propertyId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${propertyId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('images')
        .insert([{
          property_id: propertyId,
          url: publicUrl,
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Image uploaded successfully",
      });

      await fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user, isAdmin]);

  return {
    properties,
    loading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
  };
};