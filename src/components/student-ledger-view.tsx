
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Student, LedgerTransaction, AcademicPeriod, FeeCategory, isDailyTransaction } from '@/lib/data-store';
import { cn } from '@/lib/utils';
import { Landmark, TrendingUp, TrendingDown, Receipt, Utensils, UtensilsCrossed } from 'lucide-react';

interface StudentLedgerViewProps {
    student: Student;
    periods: AcademicPeriod[];
    selectedPeriodId: string;
    feeCategories: FeeCategory[];
    schoolId?: string;
}

export const StudentLedgerView: React.FC<StudentLedgerViewProps> = ({ student, periods, selectedPeriodId, feeCategories, schoolId }) => {
    const { totals, displayLedger, balanceBF, feeBreakdown, dailyFeeBreakdown } = useMemo(() => {
        const fullLedger = (student.ledger || []).filter(t => !t.isVoided);
        
        // Match Admin Portal's Period Sorting and Indexing
        const sortedPeriodsForIndex = [...periods].reverse();
        const currentPeriodIndex = sortedPeriodsForIndex.findIndex(p => p.id === selectedPeriodId);

        // Split ledger into Daily and Main
        const dailyLedger = fullLedger.filter(t => isDailyTransaction(t, feeCategories));
        const mainLedger = fullLedger.filter(t => !isDailyTransaction(t, feeCategories));

        const getPeriodBalances = (ledger: LedgerTransaction[]) => {
            const prevTransactions = ledger.filter(t => {
                if (!t.periodId) return false;
                const tPeriodIndex = sortedPeriodsForIndex.findIndex(p => p.id === t.periodId);
                return tPeriodIndex < currentPeriodIndex && t.periodId !== selectedPeriodId;
            });

            const bf = prevTransactions.reduce((sum, t) => sum + (Number(t.debit) || 0) - (Number(t.credit) || 0), 0);
            const currentTransactions = ledger.filter(t => !selectedPeriodId || t.periodId === selectedPeriodId);
            
            const billed = currentTransactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
            const paid = currentTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
            
            const adminBilled = (bf > 0 ? bf : 0) + billed;
            const adminPaid = (bf < 0 ? Math.abs(bf) : 0) + paid;
            const balance = adminBilled - adminPaid;

            return { bf, billed, paid, balance, currentTransactions };
        };

        const dailyData = getPeriodBalances(dailyLedger);
        const mainData = getPeriodBalances(mainLedger);

        // Attendance-based daily accrued (Source of Truth)
        const attendance = student.attendance || [];
        
        // Identify the "real" feeding category ID from database for strict exclusion
        const dynamicFeedingCat = feeCategories.find(c => c.isDaily && (
            c.name.toLowerCase().trim() === 'feeding fee' || 
            c.name.toLowerCase().trim() === 'feeding' ||
            c.id.toLowerCase().trim() === 'feeding'
        ));
        const dynamicFeedingId = dynamicFeedingCat?.id.toLowerCase().trim();

        let dailyAccruedInfo = 0;
        let accruedFeeding = 0;
        const daysPresentInPeriod = attendance.filter(a => a.attended && (!selectedPeriodId || a.periodId === selectedPeriodId)).length;

        const dailyFeeBreakdown: Record<string, number> = {};

        // 1. Process Feeding Fee specifically using student.dailyFeedingCost (Canonical Source)
        if (student.dailyFeedingCost > 0) {
            const amount = daysPresentInPeriod * student.dailyFeedingCost;
            dailyAccruedInfo += amount;
            accruedFeeding += amount;
            dailyFeeBreakdown['Feeding Fee'] = amount;
        }
        
        // 2. Process other dynamic daily fee categories using the official category list
        // This loop matches Admin deduplication by skipping any category that matches the main feeding fee
        feeCategories.filter(c => c.isDaily).forEach(cat => {
            const normName = cat.name.toLowerCase().trim();
            const normId = cat.id.toLowerCase().trim();
            
            // Skip if it's a variant of the main feeding fee (already processed via dailyFeedingCost)
            if (normName === 'feeding fee' || normName === 'feeding' || normId === 'feeding' || (dynamicFeedingId && normId === dynamicFeedingId)) return;

            const studentRate = (student.dailyFees || []).find(f => 
                (f.categoryId && f.categoryId.toLowerCase().trim() === normId)
            )?.rate || 0;

            const amount = daysPresentInPeriod * Number(studentRate);
            if (amount > 0) {
                dailyAccruedInfo += amount;
                dailyFeeBreakdown[cat.name] = (dailyFeeBreakdown[cat.name] || 0) + amount;
            }
        });

        // 3. Aggregate Total Balance per User Specification: Main Fee Sum + Total Daily Accrued
        // Note: mainData.balance already includes Main BF, Main Billed, and ALL Payments (Main + Daily)
        // because isDailyTransaction might not catch all daily payments, but catch all daily debits.
        // To be safe and strictly follow user formula:
        const totalOutstanding = mainData.balance + dailyAccruedInfo;

        // Calculate Term Feeding Total (from ledger debits - for info only)
        const termFeedingTotalLedger = [...dailyData.currentTransactions, ...mainData.currentTransactions]
            .filter(t => t.debit > 0 && (
                t.category === 'feeding' || 
                t.category?.toLowerCase() === 'feeding fee' || 
                t.description?.toLowerCase().includes('feeding')
            ))
            .reduce((sum, t) => sum + (Number(t.debit) || 0), 0);

        const feeBreakdown = [...dailyData.currentTransactions, ...mainData.currentTransactions]
            .filter(t => t.debit > 0)
            .reduce((acc, t) => {
                const cat = t.category || 'General';
                acc[cat] = (acc[cat] || 0) + t.debit;
                return acc;
            }, {} as Record<string, number>);

        return {
            balanceBF: mainData.bf + dailyData.bf,
            displayLedger: [...dailyData.currentTransactions, ...mainData.currentTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            feeBreakdown,
            dailyFeeBreakdown,
            totals: {
                billed: mainData.billed + dailyData.billed,
                paid: mainData.paid + dailyData.paid,
                outstanding: totalOutstanding,
                mainOutstanding: mainData.balance,
                dailyOutstanding: dailyData.balance,
                dailyAccrued: dailyAccruedInfo,
                accruedFeeding: accruedFeeding,
                termFeedingTotal: termFeedingTotalLedger
            }
        };
    }, [student.ledger, student.attendance, student.dailyFees, student.dailyFeedingCost, periods, selectedPeriodId, feeCategories, schoolId]);

    return (
        <div className="space-y-6">
            {/* High-Contrast Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-[2px] border-primary shadow-sm bg-card">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground">Main Fee Sum</p>
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <p className="text-lg md:text-2xl font-bold font-sans">GH¢{totals.mainOutstanding.toFixed(2)}</p>
                        <p className="text-[8px] md:text-[10px] mt-1 text-muted-foreground italic">Term Fees + Arrears</p>
                    </CardContent>
                </Card>

                <Card className="border-[2px] shadow-sm bg-card border-purple-500">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground">Total Daily Accrued</p>
                            <Receipt className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                        </div>
                        <p className="text-lg md:text-2xl font-bold font-sans text-purple-500">
                            GH¢{totals.dailyAccrued.toFixed(2)}
                        </p>
                        <p className="text-[8px] md:text-[10px] mt-1 text-muted-foreground italic">Total daily fees accrued for this period</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-[2px] shadow-sm bg-card",
                    totals.outstanding > 0 ? "border-destructive bg-destructive/5" : "border-success bg-success/5"
                )}>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground">Total Balance</p>
                            <Landmark className={cn("w-4 h-4 md:w-5 md:h-5", totals.outstanding > 0 ? "text-destructive" : "text-success")} />
                        </div>
                        <p className={cn(
                            "text-lg md:text-2xl font-bold font-sans",
                            totals.outstanding > 0 ? "text-destructive" : "text-success"
                        )}>
                            GH¢{totals.outstanding.toFixed(2)}
                        </p>
                        <p className="text-[8px] md:text-[10px] mt-1 text-muted-foreground font-medium">Net balance to date</p>
                    </CardContent>
                </Card>
            </div>

            {/* Total Daily Fee Info */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-muted-foreground/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg shadow-xs">
                        <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Term Feeding Total</p>
                        <p className="text-sm font-bold text-primary">GH¢{totals.termFeedingTotal.toFixed(2)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground italic">Cumulative attendance fees</p>
                </div>
            </div>
            
            {/* Fee Breakdown Summary */}
            {(Object.keys(feeBreakdown).length > 0 || Object.keys(dailyFeeBreakdown).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(feeBreakdown).length > 0 && (
                        <div className="p-4 bg-muted/20 border-2 border-dashed rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Term Fee Breakdown
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(feeBreakdown).map(([desc, amount], i) => (
                                    <Badge key={i} variant="outline" className="bg-background text-primary border-primary/20 py-1.5 px-3 shadow-sm font-sans">
                                        <span className="font-medium mr-2">{desc}:</span>
                                        <span className="font-black">GH¢{amount.toFixed(2)}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {Object.keys(dailyFeeBreakdown).length > 0 && (
                        <div className="p-4 bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mb-3 flex items-center gap-2">
                                <Receipt className="w-3 h-3" /> Daily Fee Breakdown (Attendance)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(dailyFeeBreakdown).map(([desc, amount], i) => (
                                    <Badge key={i} variant="outline" className="bg-background text-indigo-500 border-indigo-500/20 py-1.5 px-3 shadow-sm font-sans">
                                        <span className="font-medium mr-2">{desc}:</span>
                                        <span className="font-black">GH¢{amount.toFixed(2)}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ledger Table */}
            <Card className="border-2 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg font-sans font-bold flex items-center gap-2">
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
                                                {(() => {
                                                    let displayDesc = t.description;
                                                    if (displayDesc === 'Daily Fee Deduction' && t.category) {
                                                        const catObj = feeCategories.find(c => c.id === t.category || c.name === t.category);
                                                        if (catObj) {
                                                            displayDesc = `Daily ${catObj.name}`;
                                                        } else if (t.category !== 'daily' && t.category !== 'feeding') {
                                                            displayDesc = `Daily Fee: ${t.category.charAt(0).toUpperCase() + t.category.slice(1).replace(/_/g, ' ')}`;
                                                        }
                                                    }
                                                    return <span className="font-bold text-sm tracking-tight">{displayDesc}</span>;
                                                })()}
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
