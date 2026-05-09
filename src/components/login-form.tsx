
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2, Users, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/client-provider';
import { resolveStudentDoc } from '@/lib/data-store';

interface LoginFormProps {
  schoolId?: string;
}

export default function LoginForm({ schoolId: initialSchoolId }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { db } = useFirebase();
  const [studentId, setStudentId] = useState('');
  const [schoolId, setSchoolId] = useState(initialSchoolId || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentId.trim() || !schoolId.trim()) {
      toast({
        title: 'Information Required',
        description: 'Please enter both a School ID and a Student/Parent ID.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    const trimmedId = studentId.trim().toUpperCase();
    const trimmedSchoolId = schoolId.trim().toUpperCase();
    
    if (db) {
        try {
            await resolveStudentDoc(db, trimmedId, trimmedSchoolId);
            // If it succeeds, it's a student ID
            router.push(`/dashboard?schoolId=${trimmedSchoolId}&id=${trimmedId}`);
        } catch (e) {
            // Record not found as student. Route to main dashboard (which handles parent/family view)
            router.push(`/dashboard?schoolId=${trimmedSchoolId}&id=${trimmedId}`);
        }
    } else {
        // Fallback without DB: route to main dashboard
        router.push(`/dashboard?schoolId=${trimmedSchoolId}&id=${trimmedId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                id="schoolId"
                placeholder="School ID"
                required
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                disabled={isLoading}
                className="pl-10"
            />
        </div>
        <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                id="studentId"
                placeholder="Student / Parent ID"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isLoading}
                className="pl-10"
            />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...</> : 'VIEW DASHBOARD'}
        </Button>
    </form>
  );
}
