
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ZipSMALogo } from "@/components/zipsma-logo";
import { 
    Search, 
    MessageCircle, 
    Book, 
    Wallet, 
    Shield, 
    Sparkles, 
    ArrowRight, 
    Loader2, 
    UserPlus,
    School,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { askHelpCenter } from "@/ai/flows/help-center-flow";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { 
        title: "Getting Started", 
        icon: <UserPlus className="w-5 h-5" />, 
        description: "Learn how to setup your school and add your first staff members.", 
        query: "How do I get started with ZipSMA and setup my school?",
        color: "bg-emerald-50 text-emerald-600"
    },
    { 
        title: "Student Records", 
        icon: <Book className="w-5 h-5" />, 
        description: "Manage enrollments, profiles, and academic tracking efficiently.", 
        query: "How do I manage student records and enrollments in ZipSMA?",
        color: "bg-blue-50 text-blue-600"
    },
    { 
        title: "Fees & Billing", 
        icon: <Wallet className="w-5 h-5" />, 
        description: "Understand our subscription model and how to track student fees.", 
        query: "How does billing work and how do I track school fees?",
        color: "bg-purple-50 text-purple-600"
    },
    { 
        title: "Data Security", 
        icon: <Shield className="w-5 h-5" />, 
        description: "Information about our security measures and data privacy policies.", 
        query: "Is my school data secure on ZipSMA? Tell me about your privacy policy.",
        color: "bg-rose-50 text-rose-600"
    },
    { 
        title: "Teachers' Corner", 
        icon: <Sparkles className="w-5 h-5" />, 
        description: "How to use our AI tools for lesson planning and report remarks.", 
        query: "What features are available in the AI Teacher's Corner?",
        color: "bg-amber-50 text-amber-600"
    },
    { 
        title: "GES Standards", 
        icon: <School className="w-5 h-5" />, 
        description: "Alignment with Ghana Education Service and NaCCA guidelines.", 
        query: "How does ZipSMA align with GES and NaCCA standards?",
        color: "bg-indigo-50 text-indigo-600"
    },
];

export default function HelpCenterPage() {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [isAsking, setIsAsking] = useState(false);
    const [suggestedLinks, setSuggestedLinks] = useState<{title: string, url: string}[]>([]);
    const { toast } = useToast();

    const handleAsk = async (customQuery?: string) => {
        const targetQuery = customQuery || query;
        if (!targetQuery.trim()) return;

        if (customQuery) setQuery(customQuery);

        setIsAsking(true);
        setAnswer(null);
        setSuggestedLinks([]);

        // Scroll to answer section
        window.scrollTo({ top: 300, behavior: 'smooth' });

        try {
            const response = await askHelpCenter({ question: targetQuery, userRole: 'Guest' });
            setAnswer(response.answer);
            setSuggestedLinks(response.suggestedLinks || []);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Something went wrong while connecting to the assistant.", 
                variant: 'destructive' 
            });
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4 flex-wrap">
                <Link href="/" className="flex items-center gap-2">
                    <ZipSMALogo className="w-8 h-8" />
                    <span className="text-xl font-bold text-primary font-headline">ZipSMA Help Center</span>
                </Link>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <Link href="/terms-of-service" className="hover:text-primary transition-colors text-gray-600">Terms</Link>
                    <Link href="/privacy-policy" className="hover:text-primary transition-colors text-gray-600">Privacy</Link>
                    <Button asChild size="sm" className="rounded-full px-4">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
            </header>

            {/* Hero Section */}
            <section className="bg-primary text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 font-headline tracking-tight">How can we help you today?</h1>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Ask our AI Assistant anything about ZipSMA features, billing, or technical support.
                    </p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="relative max-w-2xl mx-auto group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-blue-600 transition-colors">
                            <Search className="w-6 h-6" />
                        </div>
                        <Input 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type your question here... (e.g., How does billing work?)" 
                            className="h-16 pl-14 pr-32 rounded-2xl border-none shadow-2xl text-gray-900 text-lg focus-visible:ring-4 focus-visible:ring-blue-400/20"
                        />
                        <Button 
                            type="submit"
                            disabled={isAsking}
                            className="absolute right-2 top-2 bottom-2 rounded-xl px-6 font-bold"
                        >
                            {isAsking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ask AI"}
                        </Button>
                    </form>
                </div>
            </section>

            {/* AI Answer Section */}
            <div id="ai-response" className="scroll-mt-24">
                {(answer || isAsking) && (
                    <section className="py-12 px-4 container mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                            <div className="bg-blue-50/50 p-6 border-b flex items-center gap-3">
                                <div className="p-2 bg-primary rounded-lg text-white">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-primary">AI Assistant Response</span>
                            </div>
                            <CardContent className="p-8">
                                {isAsking ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <p className="text-muted-foreground animate-pulse">Thinking... analyzing ZipSMA documentation...</p>
                                    </div>
                                ) : (
                                    <div className="prose max-w-none prose-p:text-gray-600 prose-headings:text-primary">
                                        <ReactMarkdown>{answer}</ReactMarkdown>
                                        
                                        {suggestedLinks.length > 0 && (
                                            <div className="mt-8 pt-6 border-t">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Suggested Links</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {suggestedLinks.map((link, idx) => (
                                                        <Button key={idx} variant="outline" asChild size="sm" className="rounded-full">
                                                            <Link href={link.url}>
                                                                {link.title} <ArrowRight className="w-3 h-3 ml-2" />
                                                            </Link>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                )}
            </div>

            {/* Categories Section */}
            <section className="py-20 px-4 container mx-auto max-w-6xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 font-headline">Explore Categories</h2>
                        <p className="text-muted-foreground mt-2">Click a category to ask the AI assistant specifically about that topic.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map((cat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleAsk(cat.query)}
                            className="group cursor-pointer"
                        >
                            <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-100 rounded-3xl relative overflow-hidden">
                                <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150", cat.color.split(' ')[0])}></div>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl transition-colors", cat.color)}>
                                        {cat.icon}
                                    </div>
                                    <CardTitle className="text-lg font-bold">{cat.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                                    <div className="mt-6 flex items-center text-sm font-bold text-primary group-hover:gap-2 transition-all">
                                        Ask AI about this <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent)]"></div>
                        <HelpCircle className="w-16 h-16 mx-auto mb-6 text-blue-400" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline">Still have questions?</h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                            If you couldn't find what you were looking for, our support team is ready to help your school succeed.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="bg-white text-gray-900 hover:bg-blue-50 rounded-full px-8 font-bold" asChild>
                                <Link href="mailto:support@zipsma.com">Contact Support</Link>
                            </Button>
                            <Button size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900 rounded-full px-8 font-bold transition-all" asChild>
                                <Link href="mailto:sales@zipsma.com">Email Sales</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-white">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} ZipSMA. Empowering Education in West Africa.
                    </p>
                </div>
            </footer>
        </div>
    );
}
