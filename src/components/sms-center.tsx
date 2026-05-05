
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

export function SmsCenter() {
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('all');
    const [specificParent, setSpecificParent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allParents, setAllParents] = useState<{id: string, name: string}[]>([]);

    const fetchAllParents = async () => {
        // Mock data for parents since DataStore doesn't have getAllParents
        const parents = [{ id: '1', name: 'Mock Parent 1' }, { id: '2', name: 'Mock Parent 2' }];
        setAllParents(parents);
    };

    useEffect(() => {
        fetchAllParents();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    recipient,
                    specificParent,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'SMS Sent',
                    description: 'Your message has been sent successfully.',
                });
                setMessage('');
            } else {
                throw new Error('Failed to send SMS');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'There was an error sending your message. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="w-6 h-6" /> SMS Center
                </CardTitle>
                <CardDescription>Send SMS to parents.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSendMessage}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient</Label>
                        <select
                            id="recipient"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="all">All Parents</option>
                            <option value="specific">Specific Parent</option>
                        </select>
                    </div>
                    {recipient === 'specific' && (
                        <div className="space-y-2">
                            <Label htmlFor="specific-parent">Select Parent</Label>
                            <select
                                id="specific-parent"
                                value={specificParent}
                                onChange={(e) => setSpecificParent(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select a parent</option>
                                {allParents.map((parent) => (
                                    <option key={parent.id} value={parent.id}>
                                        {parent.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your message here..."
                            rows={5}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send SMS'
                        )}
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}
