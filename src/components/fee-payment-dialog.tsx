'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from 'next/dynamic';
const PayWithHubtel = dynamic(() => import('./pay-with-hubtel'), { ssr: false });
import { toast } from "@/hooks/use-toast";

interface FeePaymentDialogProps {
  outstandingBalance: number;
  studentId: string;
  studentName: string;
  schoolId: string;
  email?: string;
  hubtelMerchantNumber?: string;
  periodId: string;
}

export function FeePaymentDialog({
  outstandingBalance,
  studentId,
  studentName,
  schoolId,
  email,
  hubtelMerchantNumber,
  periodId,
}: FeePaymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [manualTxId, setManualTxId] = useState('');

  const refKey = `last_hubtel_ref_${schoolId}_${studentId}`;
  const lastRef = typeof window !== 'undefined' ? localStorage.getItem(refKey) : null;

  const handleVerify = async (refToUse?: string) => {
    const reference = refToUse || manualTxId;
    if (!reference) return;

    setIsVerifying(true);
    try {
        const isReference = reference.startsWith('REF') || reference.startsWith('PAY');
        const url = `/api/hubtel/status?schoolId=${schoolId}&studentId=${studentId}&periodId=${periodId}&${isReference ? `clientReference=${reference}` : `transactionId=${reference}`}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'success') {
            toast({
                title: "Success",
                description: data.message,
            });
            // If it was successful, we can clear the last ref
            if (reference === lastRef) localStorage.removeItem(refKey);
            setIsOpen(false); // Close dialog to refresh ledger
            window.location.reload(); // Refresh to show new ledger entry
        } else {
            toast({
                title: "Payment Status",
                description: data.message || "We couldn't confirm this payment yet. If you just paid, please wait 1-2 minutes.",
                variant: data.status === 'not_found' ? "destructive" : "default"
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to connect to verification service.",
            variant: "destructive"
        });
    } finally {
        setIsVerifying(false);
    }
  };

  const amountToPay = Number(customAmount);
  const isInvalidAmount = amountToPay <= 0 || (customAmount !== '' && amountToPay > outstandingBalance);
  const canPay = amountToPay > 0 && !isInvalidAmount;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button style={{ backgroundColor: '#04396d' }} className="w-full text-white py-6 text-lg">
          Pay Fees Online
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>School Fees Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Fee Summary Section */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
            <h3 className="font-semibold mb-2">Account Balance</h3>
            <div className="flex justify-between text-base font-bold border-b pb-2 mb-2">
              <span>Total Due</span>
              <span className="font-mono text-destructive">GH¢{outstandingBalance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Payments will be credited against your overall outstanding balance.</p>
          </div>

          {/* Payment Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Make a New Payment</h3>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="amount">Amount to Pay (GH¢)</Label>
                <div className="relative mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder={outstandingBalance > 0 ? outstandingBalance.toFixed(2) : "0.00"}
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="text-lg py-6"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
                <PayWithHubtel
                    amount={amountToPay}
                    email={email || `${studentId}@noemail.com`}
                    studentId={studentId}
                    studentName={studentName}
                    schoolId={schoolId}
                    periodId={periodId}
                    description={`Fee Payment: ${studentName}`}
                    onInitialize={() => setIsOpen(false)}
                    disabled={!canPay}
                    className="w-full py-6 text-lg"
                >
                    Pay GH¢{amountToPay > 0 ? amountToPay.toFixed(2) : '...'} Now
                </PayWithHubtel>
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                    <span>Mobile Money</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30 self-center" />
                    <span>Cards</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30 self-center" />
                    <span>Bank Account</span>
                </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="pt-6 border-t mt-4">
            <div className="flex flex-col gap-3">
                {lastRef && (
                    <Button 
                        variant="outline" 
                        onClick={() => handleVerify(lastRef)}
                        disabled={isVerifying}
                        className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    >
                        {isVerifying ? "Verifying..." : "Verify My Last Payment"}
                    </Button>
                )}

                <button 
                    onClick={() => setShowManualVerify(!showManualVerify)}
                    className="text-xs text-center text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                    {showManualVerify ? "Hide manual verification" : "Already paid? Verify with Transaction ID"}
                </button>

                {showManualVerify && (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-md animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="txId" className="text-xs">Hubtel Transaction ID</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="txId" 
                                placeholder="e.g. 1234567" 
                                value={manualTxId}
                                onChange={e => setManualTxId(e.target.value)}
                                className="h-8 text-xs"
                            />
                            <Button 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={() => handleVerify()}
                                disabled={isVerifying || !manualTxId}
                            >
                                {isVerifying ? "..." : "Verify"}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            Found in your payment confirmation SMS or Email.
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
