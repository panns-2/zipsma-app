'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInUser, getSchoolForAdmin } from '@/lib/data-store';
import { useFirebase } from '@/firebase/client-provider';

export default function AdminLoginForm() {
  const router = useRouter();
  const { auth, db } = useFirebase();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || !auth || !db) return;

    setIsLoading(true);
    try {
      const userCredential = await signInUser(auth, email, password);
      const user = userCredential.user;
      if (user) {
        // After successful sign-in, find the associated school
        const schoolId = await getSchoolForAdmin(db, user.uid);
        if (schoolId) {
          toast({
            title: 'Login Successful',
            description: "Redirecting to your school's dashboard...",
          });
          router.push(`/admin/dashboard?schoolId=${schoolId}`);
        } else {
           throw new Error("No school is associated with this administrator account.");
        }
      } else {
        throw new Error('Authentication failed, user not found.');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="admin@school.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="********"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground">
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="remember-me" className="flex items-center gap-2 font-normal text-muted-foreground">
            <input id="remember-me" type="checkbox" className="rounded border-gray-300"/> 
            Remember me
        </Label>
        <a href="#" className="font-medium text-primary hover:underline">Forgot Password?</a>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</> : 'LOGIN'}
      </Button>
    </form>
  );
}
