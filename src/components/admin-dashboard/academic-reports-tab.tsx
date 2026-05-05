'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { getReportSettings, saveReportSettings, ReportSettings } from '@/lib/data-store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Save, FileText } from 'lucide-react';

const defaultClassGroups = [
  {
    groupName: 'Crèche, Nursery, KG',
    classes: ['Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2'],
    subjects: [
      'English Language',
      'Mathematics',
      'Environmental Studies',
      'Creative Arts',
      'Religious and Moral Education (RME)',
      'Physical Education',
      'Ghanaian Language',
      'Computing',
    ],
  },
  {
    groupName: 'Primary 1 - 6',
    classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    subjects: [
      'English Language',
      'Mathematics',
      'Science',
      'Creative Arts',
      'Religious and Moral Education (RME)',
      'Social Studies',
      'Ghanaian Language',
      'Physical Education',
      'Computing',
    ],
  },
  {
    groupName: 'JHS 1 - 3',
    classes: ['JHS 1', 'JHS 2', 'JHS 3'],
    subjects: [
      'English Language',
      'Mathematics',
      'Science',
      'Social Studies',
      'Religious and Moral Education (RME)',
      'ICT',
      'Creative Arts and Design',
      'Ghanaian Language',
      'Career Technology',
      'Physical Education',
    ],
  },
];

export function AcademicReportsTab({ schoolId }: { schoolId: string }) {
  const { db, auth } = useFirebase();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing before saving
  const [groups, setGroups] = useState(defaultClassGroups);
  const [newSubjectInputs, setNewSubjectInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadSettings() {
      if (!db || !schoolId) return;
      try {
        const data = await getReportSettings(db, schoolId);
        if (data && data.classGroups && data.classGroups.length > 0) {
          setSettings(data);
          setGroups(data.classGroups);
        } else {
          // No settings exist yet, we will use defaultClassGroups
        }
      } catch (error) {
        console.error("Failed to load report settings:", error);
        toast({ title: "Error", description: "Could not load report settings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [db, schoolId, toast]);

  const handleAddSubject = (groupIndex: number) => {
    const subject = newSubjectInputs[groupIndex]?.trim();
    if (!subject) return;
    
    setGroups(prev => {
      const newGroups = [...prev];
      if (!newGroups[groupIndex].subjects.includes(subject)) {
        newGroups[groupIndex].subjects.push(subject);
      }
      return newGroups;
    });
    
    setNewSubjectInputs(prev => ({ ...prev, [groupIndex]: '' }));
  };

  const handleRemoveSubject = (groupIndex: number, subjectIndex: number) => {
    setGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].subjects.splice(subjectIndex, 1);
      return newGroups;
    });
  };

  const handleSave = async () => {
    if (!db || !auth || !schoolId) return;
    setIsSaving(true);
    try {
      await saveReportSettings(db, auth, schoolId, { classGroups: groups });
      toast({ title: "Settings Saved", description: "Academic report settings updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-heading-lg flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" /> Report Card Configuration
          </CardTitle>
          <CardDescription>
            Configure the subjects that will appear on student report cards for different class levels.
            These settings will apply to all generated reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-xl p-5 bg-card relative shadow-sm">
              <h3 className="text-heading-md text-foreground mb-1">{group.groupName}</h3>
              <p className="text-body-sm text-muted-foreground mb-4">
                Applies to: {group.classes.join(', ')}
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.subjects.map((subject, subjectIndex) => (
                    <div key={subjectIndex} className="flex items-center justify-between bg-muted/50 border border-border px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium">{subject}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                        onClick={() => handleRemoveSubject(groupIndex, subjectIndex)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/50 max-w-sm">
                  <Input 
                    placeholder="Add new subject..." 
                    value={newSubjectInputs[groupIndex] || ''}
                    onChange={(e) => setNewSubjectInputs(prev => ({ ...prev, [groupIndex]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject(groupIndex);
                      }
                    }}
                    className="h-9"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleAddSubject(groupIndex)}
                    disabled={!newSubjectInputs[groupIndex]?.trim()}
                    className="shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-4 pb-4 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="min-w-[120px]">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
