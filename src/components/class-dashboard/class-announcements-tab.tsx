import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sendAnnouncement, getAnnouncementsForAdmin, deleteAnnouncement, Announcement } from '@/lib/data-store';
import { useFirebase } from '@/firebase/client-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface ClassAnnouncementsTabProps {
    className: string;
    schoolId: string;
}

export function ClassAnnouncementsTab({ className, schoolId }: ClassAnnouncementsTabProps) {
    const { auth, db } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    const fetchAnnouncements = async () => {
        if (!db || !schoolId) return;
        try {
            const all = await getAnnouncementsForAdmin(db, schoolId);
            // Filter only for this class
            const classSpecific = all.filter(a => a.recipient === `class:${className}`);
            setAnnouncements(classSpecific.sort((a, b) => b.date.getTime() - a.date.getTime()));
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [db, schoolId, className]);


    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !db || !schoolId) return;
        
        setIsSubmitting(true);
        try {
            // Include class name in the subject to make it clear to parents
            const fullSubject = `[${className}] ${subject}`;
            // To broadcast to a specific class, we need to handle it.
            // But since 'sendAnnouncement' only takes 'recipient' ('all' or studentId) natively in our system right now,
            // we will format the recipient field as a special flag: `class:${className}`
            // The dashboard app will need to interpret this, or we just use 'all' for now and specify it's for the class.
            // A better way is using 'class:' prefix if the backend allows it, but let's assume it accepts string tags.
            // Wait, looking at `sendAnnouncement` it just saves `recipient: string`. So `class:${className}` is safe.
            
            await sendAnnouncement(db, auth, schoolId, {
                subject: fullSubject,
                message,
                recipient: `class:${className}`,
            });

            toast({ title: 'Announcement Sent', description: `Message broadcasted to parents of ${className}.` });
            setSubject('');
            setMessage('');
            fetchAnnouncements();
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not send announcement.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async () => {
        if (!announcementToDelete || !auth || !db) return;
        setIsSubmitting(true);
        try {
            await deleteAnnouncement(db, auth, announcementToDelete.id);
            toast({ title: 'Announcement Deleted', description: 'The message has been removed.' });
            fetchAnnouncements();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
            setAnnouncementToDelete(null);
        }
    };


    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-white rounded-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-gray-900">Class Announcements</CardTitle>
                    <CardDescription>Send a message directly to the parents of students in {className}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="announcement-subject">Subject</Label>
                            <Input 
                                id="announcement-subject" 
                                placeholder="e.g., Upcoming Field Trip" 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="announcement-message">Message</Label>
                            <Textarea 
                                id="announcement-message" 
                                placeholder="Type your message to parents here..." 
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-8">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Announcement</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50/50">
                    <CardTitle className="text-lg font-headline">Sent Messages</CardTitle>
                    <CardDescription>Recently sent announcements to this class.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {announcements.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground italic">No announcements sent to this class yet.</div>
                        ) : announcements.map((ann) => (
                            <div key={ann.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm">{ann.subject.replace(`[${className}] `, '')}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.message}</p>
                                    <p className="text-[10px] font-bold text-primary/60 uppercase">{ann.date.toLocaleDateString('en-GB')}</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                    onClick={() => setAnnouncementToDelete(ann)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!announcementToDelete} onOpenChange={(isOpen) => !isOpen && setAnnouncementToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This message will be removed from the parents' view. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAnnouncement} className="bg-destructive hover:bg-destructive/90 rounded-full" disabled={isSubmitting}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

    );
}
