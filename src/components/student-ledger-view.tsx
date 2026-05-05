
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Student, LedgerTransaction, AcademicPeriod } from '@/lib/data-store';
import { cn } from '@/lib/utils';
import { Landmark, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface StudentLedgerViewProps {
    student: Student;
    periods: AcademicPeriod[];
    selectedPeriodId: string;
}

export const StudentLedgerView: React.FC<StudentLedgerViewProps> = ({ student, periods, selectedPeriodId }) => {
    const { totals, displayLedger, balanceBF, feeBreakdown } = useMemo(() => {
        const fullLedger = student.ledger || [];
        const currentPeriod = periods.find(p => p.id === selectedPeriodId);

        const isDateInPeriod = (date: string, period: AcademicPeriod) => {
            if (!period.startDate || !period.endDate) return false;
            const d = new Date(date + "T00:00:00");
            const start = new Date(period.startDate + "T00:00:00");
            const end = new Date(period.endDate + "T23:59:59");
            return d >= start && d <= end;
        };

        const currentTransactions = fullLedger.filter(t => {
            if (t.isVoided) return false;
            
            // Priority 1: Date check
            if (currentPeriod && currentPeriod.startDate && currentPeriod.endDate) {
                return isDateInPeriod(t.date, currentPeriod);
            }
            
            // Priority 2: Fallback to periodId
            return t.periodId === selectedPeriodId;
        });

        const prevTransactions = fullLedger.filter(t => {
            if (t.isVoided) return false;
            
            if (currentPeriod && currentPeriod.startDate) {
                const tDate = new Date(t.date + "T00:00:00");
                const periodStart = new Date(currentPeriod.startDate + "T00:00:00");
                return tDate < periodStart;
            }
            
            // Fallback for periods without dates
            return t.periodId !== selectedPeriodId;
        });

        const bf = prevTransactions.reduce((sum, t) => sum + (t.debit - t.credit), 0);
        const termBilled = currentTransactions.reduce((sum, t) => sum + t.debit, 0);
        const termPaid = currentTransactions.reduce((sum, t) => sum + t.credit, 0);
        const totalOutstanding = bf + termBilled - termPaid;

        // Dynamic Fee Breakdown
        const breakdown = currentTransactions
            .filter(t => t.debit > 0)
            .reduce((acc: Record<string, number>, t) => {
                acc[t.description] = (acc[t.description] || 0) + t.debit;
                return acc;
            }, {});

        return {
            balanceBF: bf,
            displayLedger: currentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            feeBreakdown: breakdown,
            totals: {
                billed: termBilled,
                paid: termPaid,
                outstanding: totalOutstanding
            }
        };
    }, [student.ledger, periods, selectedPeriodId]);

    return (
        <div className="space-y-6">
            {/* High-Contrast Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-[4px] border-primary shadow-md overflow-hidden bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Billable</p>
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-3xl font-black text-numeric">GH¢{(totals.billed + (balanceBF > 0 ? balanceBF : 0)).toFixed(2)}</p>
                        <p className="text-[10px] mt-1 text-muted-foreground font-bold">Includes Term Fees + Arrears</p>
                    </CardContent>
                </Card>

                <Card className="border-[4px] border-success shadow-md overflow-hidden bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Paid</p>
                            <Receipt className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-3xl font-black text-numeric text-success">GH¢{totals.paid.toFixed(2)}</p>
                        <p className="text-[10px] mt-1 text-muted-foreground font-bold">Payments made this term</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-[4px] shadow-md overflow-hidden bg-card",
                    totals.outstanding > 0 ? "border-[#900b02]" : "border-success"
                )}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Outstanding</p>
                            <Landmark className={cn("w-5 h-5", totals.outstanding > 0 ? "text-[#900b02]" : "text-success")} />
                        </div>
                        <p className={cn(
                            "text-3xl font-black text-numeric",
                            totals.outstanding > 0 ? "text-[#900b02]" : "text-success"
                        )}>
                            GH¢{totals.outstanding.toFixed(2)}
                        </p>
                        <p className="text-[10px] mt-1 text-muted-foreground font-bold">Current Closing Balance</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Fee Breakdown Summary */}
            {Object.keys(feeBreakdown).length > 0 && (
                <div className="p-4 bg-muted/20 border-2 border-dashed rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> Term Fee Breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(feeBreakdown).map(([desc, amount], i) => (
                            <Badge key={i} variant="outline" className="bg-background text-primary border-primary/20 py-1.5 px-3 shadow-sm font-jakarta">
                                <span className="font-medium mr-2">{desc}:</span>
                                <span className="font-black">GH¢{amount.toFixed(2)}</span>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <Card className="border-2 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg font-jakarta font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5" /> Detailed Statement
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="font-bold">Description</TableHead>
                                <TableHead className="font-bold text-right">Amount Billed</TableHead>
                                <TableHead className="font-bold text-right">Amount Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {balanceBF !== 0 && (
                                <TableRow className="bg-primary/5 italic">
                                    <TableCell className="font-medium text-xs">-</TableCell>
                                    <TableCell className="font-bold text-xs uppercase tracking-tight">Balance Brought Forward</TableCell>
                                    <TableCell className="text-right text-numeric font-bold text-xs">{balanceBF > 0 ? `GH¢${balanceBF.toFixed(2)}` : '-'}</TableCell>
                                    <TableCell className="text-right text-numeric font-bold text-xs">{balanceBF < 0 ? `GH¢${Math.abs(balanceBF).toFixed(2)}` : '-'}</TableCell>
                                </TableRow>
                            )}
                            {displayLedger.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                        No transactions recorded for this term.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayLedger.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-xs whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-GB')}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{t.description}</span>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                    {t.type === 'payment' ? 'Payment Received' : 
                                                     t.type === 'adjustment' ? 'Adjustment' :
                                                     (t.description.toLowerCase().includes('daily') || ['feeding', 'transportation'].includes(t.category?.toLowerCase() || '')) ? 'Daily Fee' : 'Term Fee'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-numeric font-bold text-destructive">
                                            {t.debit > 0 ? `GH¢${t.debit.toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-numeric font-bold text-success">
                                            {t.credit > 0 ? `GH¢${t.credit.toFixed(2)}` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
