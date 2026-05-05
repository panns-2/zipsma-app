'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentProfile from '@/components/student-profile';
import ContactBar from '@/components/contact-bar';
import { StudentLedgerView } from '@/components/student-ledger-view';
import { useFirebase, useAuth } from '@/firebase/client-provider';
import { Student, getStudentsByParentId, AcademicPeriod, getAcademicPeriods } from '@/lib/data-store';
import { Loader2 } from 'lucide-react';
import Header from '@/components/header';

function ParentDashboardContent() {
  const searchParams = useSearchParams();
  const { auth, db } = useFirebase();
  const { user, loading: authLoading } = useAuth() || { loading: true };
  
  const urlId = searchParams.get('id');
  const schoolId = searchParams.get('schoolId');

  const [children, setChildren] = useState<Student[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      
      const parentId = urlId || (user ? user.uid : null);
      if (!parentId || !schoolId || !db) {
        setIsLoading(false);
        return;
      }

      try {
        const periods = await getAcademicPeriods(db, schoolId);
        setAcademicPeriods(periods);
        const current = periods.find(p => p.isCurrent);
        if (current) setSelectedPeriodId(current.id);
        else if (periods.length > 0) setSelectedPeriodId(periods[0].id);

        const students = await getStudentsByParentId(db, schoolId, parentId);
        setChildren(students);
      } catch (error) {
        console.error("Error fetching parent data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, urlId, schoolId, db]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !urlId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to view this page.</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-2xl font-bold mb-2">No Students Found</h2>
        <p className="text-muted-foreground">We could not find any students linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Header 
          userName="Family Portal" 
          userIdentifier={user?.uid || urlId || ''} 
          profilePicture="" 
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 mt-6">
        <div className="mb-8">
            <h1 className="text-3xl font-jakarta font-bold tracking-tight text-foreground">Family Dashboard</h1>
            <p className="text-muted-foreground mt-1">Unified view of your children's financial statements</p>
        </div>
        
        {children.map(student => (
          <div key={student.studentId} className="bg-card rounded-xl shadow-sm border p-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-1 space-y-6">
                <StudentProfile 
                  name={student.name} 
                  studentClass={student.className} 
                  studentId={student.studentId} 
                  profilePicture={student.profilePicture || ''} 
                  onRefresh={() => {}} 
                  isRefreshing={false} 
                  onEdit={() => {}} 
                />
                <ContactBar />
              </div>
              <div className="xl:col-span-3">
                <StudentLedgerView 
                  student={student} 
                  periods={academicPeriods} 
                  selectedPeriodId={selectedPeriodId} 
                />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

const ParentDashboard = () => {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    }>
        <ParentDashboardContent />
    </Suspense>
  );
};

export default ParentDashboard;
