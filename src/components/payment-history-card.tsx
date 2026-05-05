import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateReceipt } from "@/lib/receipt-utils";
import { School, Student, PaymentItem, AcademicPeriod } from "@/lib/data-store";

interface PaymentHistoryCardProps {
    payments: PaymentItem[];
    school: School | null;
    student: Student | null;
    periods?: AcademicPeriod[];
    title?: string;
    type?: 'General' | 'Feeding' | 'Transportation';
}

export default function PaymentHistoryCard({ payments, school, student, periods = [], title = "Payment History", type = 'General' }: PaymentHistoryCardProps) {
    const handleDownloadReceipt = (payment: PaymentItem) => {
        if (!school || !student) return;
        generateReceipt(school, student, payment, type, periods);
    };

    return (
        <Card className="shadow-md h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <History className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline">{title}</CardTitle>
                        <CardDescription>A log of all payments made.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="max-h-80 overflow-y-auto overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.slice().reverse().map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="font-medium">{payment.date}</div>
                                            <div className="text-xs text-muted-foreground">{payment.notes}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium whitespace-nowrap">GH¢{payment.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-primary"
                                                onClick={() => handleDownloadReceipt(payment)}
                                                disabled={!school || !student}
                                                title="Download Receipt"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
