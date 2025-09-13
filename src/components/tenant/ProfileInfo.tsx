import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ProfileInfo: React.FC = () => {
  const { profile } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent>
        {profile ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm"><span className="text-muted-foreground">Name:</span> {profile.full_name || '—'}</p>
              <p className="text-sm"><span className="text-muted-foreground">Email:</span> {profile.email || '—'}</p>
              {'phone' in profile ? (
                <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {(profile as unknown as { phone?: string | null }).phone || '—'}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">No profile info found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;

