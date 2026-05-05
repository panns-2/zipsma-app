
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2, KeyRound, School as SchoolIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StaffLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [schoolId, setSchoolId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!schoolId.trim() || !staffId.trim()) {
      toast({
        title: 'Information Required',
        description: 'Please enter both a School ID and a Staff ID.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    router.push(`/staff/dashboard?schoolId=${schoolId.trim().toUpperCase()}&staffId=${staffId.trim().toUpperCase()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="school-id">School ID</Label>
        <div className="relative">
          <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="school-id"
            type="text"
            placeholder="Enter your school's ID"
            required
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
            disabled={isLoading}
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-id">Staff ID</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="staff-id"
            type="text"
            placeholder="Enter your unique Staff ID"
            required
            value={staffId}
            onChange={(e) => setStaffId(e.target.value.toUpperCase())}
            disabled={isLoading}
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...</> : 'LOGIN'}
      </Button>
    </form>
  );
}
