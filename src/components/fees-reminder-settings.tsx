
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase/client-provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const defaultMessage = `Dear Parent, this is a friendly reminder that your ward's outstanding balance is {balance}. Please make a payment to avoid any inconvenience. Thank you`;

export function FeesReminderSettings({ schoolId }: { schoolId: string }) {
    const { db } = useFirebase();
    const { toast } = useToast();
    
    const [isEnabled, setIsEnabled] = useState(false);
    const [frequency, setFrequency] = useState('daily');
    const [day, setDay] = useState('monday');
    const [time, setTime] = useState('09:00');
    const [customMessage, setCustomMessage] = useState(defaultMessage);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!db) {
                // If db is not ready, don't do anything yet.
                // The effect will re-run when db becomes available.
                return;
            }

            setIsLoading(true);
            const settingsRef = doc(db, 'schools', schoolId.toUpperCase(), 'settings', 'feeReminders');

            try {
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    setIsEnabled(settings.isEnabled || false);
                    setFrequency(settings.frequency || 'daily');
                    setDay(settings.day || 'monday');
                    setTime(settings.time || '09:00');
                    setCustomMessage(settings.message || defaultMessage);
                } else {
                    // If the document doesn't exist, we'll just use the default values.
                    // No error needed.
                }
            } catch (error) {
                console.error("Error fetching settings: ", error);
                toast({ title: 'Error', description: 'Could not load reminder settings.', variant: 'destructive' });
            } finally {
                // This is now guaranteed to run.
                setIsLoading(false);
            }
        };

        fetchSettings();

    }, [db, toast]); // The key change: this effect now depends on 'db'.


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) {
            toast({ title: 'Error', description: 'Database connection not ready.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        const settingsRef = doc(db, 'schools', schoolId.toUpperCase(), 'settings', 'feeReminders');
        try {
            const settingsToSave = {
                isEnabled,
                frequency,
                day,
                time,
                message: customMessage,
            };
            await setDoc(settingsRef, settingsToSave, { merge: true });
            toast({
                title: 'Settings Saved',
                description: 'Your fees reminder settings have been updated successfully.',
            });
        } catch (error) {
            console.error("Error saving settings: ", error);
            toast({ title: 'Error', description: 'Could not save reminder settings.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-heading-lg">Fees Reminder Settings</CardTitle>
                <CardDescription>Configure automated SMS reminders for parents about overdue fee payments.</CardDescription>
            </CardHeader>
            {isLoading ? (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="reminder-enabled" className="text-base">Enable Fee Reminders</Label>
                                <p className="text-sm text-muted-foreground">
                                    Turn on or off the automated fee reminder system.
                                </p>
                            </div>
                            <Switch
                                id="reminder-enabled"
                                checked={isEnabled}
                                onCheckedChange={setIsEnabled}
                                disabled={isSubmitting}
                            />
                        </div>

                        {isEnabled && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="reminder-frequency">Frequency</Label>
                                        <Select value={frequency} onValueChange={setFrequency} disabled={isSubmitting}>
                                            <SelectTrigger id="reminder-frequency"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {frequency === 'weekly' && (
                                        <div>
                                            <Label htmlFor="reminder-day">Day of the Week</Label>
                                            <Select value={day} onValueChange={setDay} disabled={isSubmitting}>
                                                <SelectTrigger id="reminder-day"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monday">Monday</SelectItem>
                                                    <SelectItem value="tuesday">Tuesday</SelectItem>
                                                    <SelectItem value="wednesday">Wednesday</SelectItem>
                                                    <SelectItem value="thursday">Thursday</SelectItem>
                                                    <SelectItem value="friday">Friday</SelectItem>
                                                    <SelectItem value="saturday">Saturday</SelectItem>
                                                    <SelectItem value="sunday">Sunday</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="reminder-time">Time of Day (24-hour)</Label>
                                        <Input 
                                            id="reminder-time"
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="custom-message">Custom Message</Label>
                                    <Textarea
                                        id="custom-message"
                                        placeholder="Enter your custom message here"
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        rows={4}
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Use the placeholder <code className='font-mono bg-muted p-0.5 rounded'>&#123;balance&#125;</code> where you want the student's outstanding balance to appear.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <div className="px-6 pb-6">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                'Save Reminder Settings'
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </Card>
    );
}
