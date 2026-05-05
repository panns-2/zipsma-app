

'use client';

import { useState, useMemo, useEffect, useCallback, forwardRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, MoreHorizontal, Edit, Trash2, PlusCircle, LayoutGrid, XCircle, Wallet, FileText, Landmark, Send, UtensilsCrossed, BookCopy, CalendarDays, Upload, Loader2, UserPlus, Search, Users, Receipt, AlertCircle as AlertCircleIcon, Banknote, CheckCheck, ShieldCheck, TrendingDown, Package, FilePlus, HandCoins, Notebook, Phone, Mail, UserCircle, Home, HeartPulse, ShieldAlert, School as SchoolIcon, Eye, EyeOff, DatabaseZap, Bus, DollarSign, Settings, Archive, ArchiveRestore, Menu, Check, ChevronsUpDown, Save, ArrowLeft, AlertTriangle, RefreshCcw, Pencil, X } from 'lucide-react';
import { ZipSMALogo } from '@/components/zipsma-logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getStudents, addStudent, deleteStudent, updateStudentDetails, updateDailyCost, setAttendance, Student, FeeItem, PaymentItem, signOutUser, updateStudentId, sendAnnouncement, getAnnouncementsForAdmin, deleteAnnouncement, Announcement, CalendarEvent, getCalendarEvents, addCalendarEvent, deleteCalendarEvent, StaffId, getStaffIds, addStaffId, deleteStaffId, updateStaffId, Expenditure, getExpenditures, addExpenditure, deleteExpenditure, Debt, getDebts, addDebt, deleteDebt, updateTransportationCost, getStaffDetails, StaffDetails, StaffRole, updateStaffSalary, School, getSchoolDetails, updateSchoolDetails, archiveStudent, archiveStaff, BankAccount, AcademicPeriod, getAcademicPeriods, addAcademicPeriod, setAsCurrentPeriod, deleteAcademicPeriod, updateAcademicPeriod, migrateToLedger, postLedgerTransaction, voidLedgerTransaction, updateLedgerTransaction, LedgerTransaction, getFeeCategories, addFeeCategory, deleteFeeCategory, updateFeeCategory, FeeCategory, getDailyFeeCategories, addDailyFeeCategory, deleteDailyFeeCategory, updateDailyFeeCategory, DailyFeeCategory, postBulkClassLedgerTransaction, postBulkDailyPayments, resetSchoolFinancials, reconcileDailyFees } from '@/lib/data-store';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GradientAvatar } from '@/components/gradient-avatar';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import FirebaseConfigError from '@/components/firebase-config-error';
import { Badge } from '@/components/ui/badge';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirebase, useAuth } from '@/firebase/client-provider';
import { FeesReminderSettings } from '@/components/fees-reminder-settings';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AcademicReportsTab } from '@/components/admin-dashboard/academic-reports-tab';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { generateReceipt } from '@/lib/receipt-utils';
import { LedgerTable } from '@/components/admin-dashboard/ledger-table';
import { RecordTransactionModal } from '@/components/admin-dashboard/record-transaction-modal';



const defaultAddStudentForm = {
    studentId: '',
    name: '',
    className: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    parentId: '',
    parentName: '',
    parentPhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    parentEmail: '',
    medicalNotes: '',
    feeDiscount: '' as any,
    dailyFees: [] as { categoryId: string, rate: number }[]
};
const defaultEditStudentForm: Omit<Student, 'dateAdded' | 'generalFees' | 'generalPayments' | 'dailyFeedingCost' | 'feedingFeePayments' | 'attendance' | 'transportationCost' | 'transportationPayments' | 'isArchived' | 'feeDiscount' | 'dailyFees'> & { feeDiscount?: string | number, dailyFees?: { categoryId: string, rate: number }[] } = {
    studentId: '',
    name: '',
    className: '',
    profilePicture: '',
    schoolId: '',
    dateOfBirth: '',
    gender: 'Male',
    parentId: '',
    parentName: '',
    parentPhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    parentEmail: '',
    medicalNotes: '',
    feeDiscount: 0,
    dailyFees: []
};

const defaultPaymentForm = { amount: '', notes: '', date: new Date().toISOString().split('T')[0] };
const defaultCommunicationForm = { recipient: 'all', subject: '', message: '', sendAsSMS: false };
const defaultCalendarEventForm = { title: '', date: '', type: 'Event' as 'Event' | 'Holiday' | 'Exam', description: '' };
const defaultAddStaffForm = { id: '', name: '', role: 'Teacher' as StaffRole, className: '', phone: '', email: '' };

const STAFF_ROLES: StaffRole[] = ['Teacher', 'Assistant Teacher', 'Administrator', 'Principal', 'Accountant', 'Secretary', 'Security', 'Driver', 'Cook', 'Cleaner', 'Other'];
const defaultExpenditureForm = { description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'General' as 'General' | 'Feeding' | 'Transportation' };
const defaultDebtForm = { creditor: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] };
const defaultSchoolSettingsForm = { 
    name: '', 
    schoolPhone: '', 
    schoolEmail: '', 
    momoNumber: '', 
    momoName: '', 
    bankAccounts: [] as BankAccount[],
    hubtelMerchantNumber: '',
    hubtelClientId: '',
    hubtelClientSecret: '',
    sendexaApiToken: '',
    sendexaSenderId: '',
    settingsPin: ''
};


const generalExpenditureCategories = ["Salaries", "Utilities (Water, Electricity)", "Rent/Mortgage", "Loan Repayment", "Taxes & Levies", "School Supplies (Stationery, etc.)", "Maintenance & Repairs", "Marketing & Advertising", "Technology (Software, Internet)", "Savings to Bank", "Other"];
const feedingExpenditureCategories = ["Food & Catering", "Kitchen Staff Salaries", "Utensils & Equipment", "Other"];
const transportationExpenditureCategories = ["Fuel", "Vehicle Maintenance", "Driver Salaries", "Loan Repayment", "Other"];


// This is a valid child for TooltipTrigger with asChild
const StudentInfoTrigger = forwardRef<HTMLDivElement, { student: Student, onClick: () => void }>(function StudentInfoTrigger({ student, onClick, ...props }, ref) {
    return (
        <div
            ref={ref}
            className="group cursor-pointer"
            onClick={onClick}
            {...props}
        >
            <p className="font-medium text-left transition-transform origin-left group-hover:scale-105">{student.name}</p>
            <p className="text-sm text-muted-foreground transition-transform origin-left group-hover:scale-105">{student.studentId}</p>
        </div>
    );
});




function AdminDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { auth, db, storage } = useFirebase();
    const { user, loading: authLoading } = useAuth();

    const schoolId = searchParams.get('schoolId');

    const [students, setStudents] = useState<Student[]>([]);
    const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [staffIds, setStaffIds] = useState<StaffId[]>([]);
    const [archivedStaff, setArchivedStaff] = useState<StaffId[]>([]);
    const [staffDetails, setStaffDetails] = useState<StaffDetails[]>([]);
    const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [schoolDetails, setSchoolDetails] = useState<School | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState<{[key: string]: boolean}>({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedClassForFees, setSelectedClassForFees] = useState<string>('all');
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showSendexaSecret, setShowSendexaSecret] = useState(false); // Add this line
    const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
    const [isAcademicSetupOpen, setIsAcademicSetupOpen] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsAuthOpen, setIsSettingsAuthOpen] = useState(false);
    const [settingsPinInput, setSettingsPinInput] = useState('');
    const [tempTab, setTempTab] = useState('');
    const [newPeriodForm, setNewPeriodForm] = useState({ 
        year: '', 
        term: 'First Term' as AcademicPeriod['term'],
        startDate: '',
        endDate: '',
        vacationDate: '',
        nextTermBegins: ''
    });
    const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<StaffId | null>(null);
    const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
    const [staffToArchive, setStaffToArchive] = useState<StaffId | null>(null);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [expenditureToDelete, setExpenditureToDelete] = useState<Expenditure | null>(null);
    const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
    const [dailyFeeCategories, setDailyFeeCategories] = useState<DailyFeeCategory[]>([]);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);


    const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
    const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
    const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);
    const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<StaffId | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newDailyCategoryName, setNewDailyCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingDailyCategoryId, setEditingDailyCategoryId] = useState<string | null>(null);
    const [editingDailyCategoryName, setEditingDailyCategoryName] = useState('');
    const [feesActiveSubTab, setFeesActiveSubTab] = useState('records');
    const [dailyFeeInternalTab, setDailyFeeInternalTab] = useState('summary');
    const [selectedDailyCategoryForPayments, setSelectedDailyCategoryForPayments] = useState<string>('');
    const [selectedPaymentDate, setSelectedPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [bulkDailyPaymentsSelection, setBulkDailyPaymentsSelection] = useState<Record<string, boolean>>({});

    const [addStudentForm, setAddStudentForm] = useState(defaultAddStudentForm);
    const [addStaffForm, setAddStaffForm] = useState(defaultAddStaffForm);
    const [editStudentForm, setEditStudentForm] = useState(defaultEditStudentForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [generalFeeForm, setGeneralFeeForm] = useState<FeeItem[]>([]);
    const [dailyCostInput, setDailyCostInput] = useState('');
    const [transportationCostInput, setTransportationCostInput] = useState('');
    const [editingRateId, setEditingRateId] = useState<string | null>(null);
    const [editingRateValue, setEditingRateValue] = useState<string>('');
    const [salaryForm, setSalaryForm] = useState({ amount: '' });
    const [expenditureForm, setExpenditureForm] = useState(defaultExpenditureForm);
    const [debtForm, setDebtForm] = useState(defaultDebtForm);
    const [schoolSettingsForm, setSchoolSettingsForm] = useState(defaultSchoolSettingsForm);
    const [communicationForm, setCommunicationForm] = useState(defaultCommunicationForm);
    const [calendarEventForm, setCalendarEventForm] = useState(defaultCalendarEventForm);
    const [isBulkFeeDialogOpen, setIsBulkFeeDialogOpen] = useState(false);
    const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<string[]>([]);
    const [isRecordTransactionModalOpen, setIsRecordTransactionModalOpen] = useState(false);
    const [transactionModalInitialType, setTransactionModalInitialType] = useState<'fee' | 'payment' | 'adjustment'>('payment');
    const [transactionToEdit, setTransactionToEdit] = useState<LedgerTransaction | null>(null);
    const [bulkFeeForm, setBulkFeeForm] = useState({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        periodId: '',
        applyDiscounts: true
    });

    const handleOpenBulkFee = () => {
        const classStudents = students.filter(s => s.className === selectedClassForFees);
        setSelectedBulkStudentIds(classStudents.map(s => s.studentId));
        setBulkFeeForm({
            category: '',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            periodId: selectedPeriodId || '',
            applyDiscounts: true
        });
        setIsBulkFeeDialogOpen(true);
    };

    const handlePostBulkTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassForFees || selectedClassForFees === 'all') {
            toast({ title: "Error", description: "Please select a specific class first.", variant: "destructive" });
            return;
        }
        if (!schoolId) return;

        setIsSubmitting(true);
        try {
            const amount = parseFloat(bulkFeeForm.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error("Please enter a valid amount.");
            }

            const selectedCategory = feeCategories.find(c => c.id === bulkFeeForm.category);
            const categoryName = selectedCategory ? selectedCategory.name : bulkFeeForm.category;

            const transactionData = {
                type: 'fee' as const,
                category: bulkFeeForm.category,
                description: bulkFeeForm.description || categoryName || 'Class Fee',
                debit: amount,
                credit: 0,
                date: bulkFeeForm.date,
                periodId: bulkFeeForm.periodId || selectedPeriodId || undefined
            };

            await postBulkClassLedgerTransaction(db, auth, schoolId, selectedClassForFees, transactionData, bulkFeeForm.applyDiscounts, selectedBulkStudentIds);
            await fetchAdminData();
            toast({ title: "Success", description: `Bulk fee recorded for all students in ${selectedClassForFees}.` });
            setIsBulkFeeDialogOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetFinancials = async () => {
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            await resetSchoolFinancials(db, auth, schoolId);
            await fetchAdminData();
            toast({ title: "Financial Records Reset", description: "All student fees, payments, ledgers, and attendance records have been cleared." });
            setIsResetDialogOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenTransactionModal = (type: 'fee' | 'payment' | 'adjustment' = 'payment') => {
        setTransactionModalInitialType(type);
        setTransactionToEdit(null);
        setIsRecordTransactionModalOpen(true);
    };

    const handleOpenAddFee = () => {
        handleOpenTransactionModal('fee');
    };

    const handleOpenRecordPayment = () => {
        handleOpenTransactionModal('payment');
    };

    const handleOpenQuickDailyPayment = (studentId: string, category: string) => {
        setSelectedStudentId(studentId);
        setTransactionModalInitialType('payment');
        // Note: For quick daily payments, we might want to pass the category to the modal.
        // The RecordTransactionModal doesn't currently support an initial category prop, 
        // but we can set it to edit mode with a partial transaction if needed, 
        // or just let the user select it since it's only one more click.
        // For now, we'll just open the modal.
        setIsRecordTransactionModalOpen(true);
    };


    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const selectedAttendanceDateFormatted = useMemo(() => new Date(selectedAttendanceDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), [selectedAttendanceDate]);

    const handleLogout = async () => {
        await signOutUser(auth);
        router.push('/');
        toast({ title: 'Logged Out', description: 'You have been logged out.' });
    };

    useIdleTimeout({ onIdle: handleLogout, timeout: 1000 * 60 * 15 }); // 15 minutes

    const handleSetActiveTab = (tab: string) => {
        if (tab === 'settings' && schoolDetails?.settingsPin) {
            setTempTab(tab);
            setIsSettingsAuthOpen(true);
            setSettingsPinInput('');
        } else {
            setActiveTab(tab);
        }
    };

    const handleVerifySettingsPin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (settingsPinInput === schoolDetails?.settingsPin) {
            setActiveTab(tempTab || 'settings');
            setIsSettingsAuthOpen(false);
            setSettingsPinInput('');
        } else {
            toast({ title: "Incorrect PIN", description: "You do not have permission to access settings.", variant: "destructive" });
        }
    };

    const fetchAdminData = useCallback(async () => {
        if (!db || !schoolId || !user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const schoolData = await getSchoolDetails(db, schoolId);
            const currentPeriod = selectedPeriodId || schoolData?.currentPeriodId;

            // Define fetchers with individual error handling to prevent one failure from blocking everything
            const safeFetch = async <T,>(promise: Promise<T>, label: string): Promise<T | null> => {
                try {
                    return await promise;
                } catch (e: any) {
                    console.warn(`Failed to fetch ${label}:`, e);
                    const link = e.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
                    if (link) {
                        toast({
                            title: `${label} Setup Required`,
                            description: (
                                <div className="space-y-2">
                                    <p>Database index missing for {label}.</p>
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white bg-destructive px-2 py-1 rounded inline-block uppercase">Fix Now</a>
                                </div>
                            ),
                            variant: "destructive"
                        });
                    }
                    return null;
                }
            };

            const [allStudents, allEvents, allStaff, allStaffDetails, allExpenditures, allDebts, allPeriods, allAnnouncements, allFeeCategories, allDailyFeeCategories] = await Promise.all([
                safeFetch(getStudents(db, schoolId, true), "Students"),
                safeFetch(getCalendarEvents(db, schoolId), "Calendar"),
                safeFetch(getStaffIds(db, schoolId, true), "Staff"),
                safeFetch(getStaffDetails(db, schoolId), "Staff Salaries"),
                safeFetch(getExpenditures(db, schoolId, currentPeriod || undefined), "Expenditures"),
                safeFetch(getDebts(db, schoolId, currentPeriod || undefined), "Debts"),
                safeFetch(getAcademicPeriods(db, schoolId), "Academic Periods"),
                safeFetch(getAnnouncementsForAdmin(db, schoolId), "Announcements"),
                safeFetch(getFeeCategories(db, schoolId), "Fee Categories"),
                safeFetch(getDailyFeeCategories(db, schoolId), "Daily Fee Categories")
            ]);

            if (schoolData) setSchoolDetails(schoolData);

            if (allStudents) {
                const activeStudents = allStudents.filter(s => !s.isArchived);
                setStudents(activeStudents);
                setArchivedStudents(allStudents.filter(s => s.isArchived));
                
                if (activeStudents.length > 0) {
                    const stillExists = activeStudents.some(s => s.studentId === selectedStudentId);
                    // If no student is selected or the previously selected one is gone, select the first one.
                    if (!selectedStudentId || !stillExists) {
                        setSelectedStudentId(activeStudents[0].studentId);
                    }
                } else {
                    setSelectedStudentId(null);
                }
            }

            if (allStaff) {
                setStaffIds(allStaff.filter(s => !s.isArchived).sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime()));
                setArchivedStaff(allStaff.filter(s => s.isArchived));
            }

            if (allEvents) setCalendarEvents(allEvents);
            if (allStaffDetails) setStaffDetails(allStaffDetails);
            if (allExpenditures) setExpenditures(allExpenditures);
            if (allDebts) setDebts(allDebts);
            if (allPeriods) setAcademicPeriods(allPeriods);
            if (allAnnouncements) setAnnouncements(allAnnouncements.sort((a, b) => b.date.getTime() - a.date.getTime()));
            if (allFeeCategories) setFeeCategories(allFeeCategories);
            if (allDailyFeeCategories) setDailyFeeCategories(allDailyFeeCategories);

            // Set default selected period if not set
            if (!selectedPeriodId && schoolData?.currentPeriodId) {
                setSelectedPeriodId(schoolData.currentPeriodId);
            } else if (!selectedPeriodId && allPeriods && allPeriods.length > 0) {
                const current = allPeriods.find(p => p.isCurrent) || allPeriods[0];
                setSelectedPeriodId(current.id);
            }

            if (schoolData) {
                setSchoolSettingsForm({ 
                    name: schoolData.name || '', 
                    schoolPhone: schoolData.schoolPhone || '',
                    schoolEmail: schoolData.schoolEmail || '',
                    momoNumber: schoolData.momoNumber || '',
                    momoName: schoolData.momoName || '',
                    bankAccounts: schoolData.bankAccounts || [],
                    hubtelMerchantNumber: schoolData.hubtelMerchantNumber || '',
                    hubtelClientId: schoolData.hubtelClientId || '',
                    hubtelClientSecret: schoolData.hubtelClientSecret || '',
                    sendexaApiToken: schoolData.sendexaApiToken || '',
                    sendexaSenderId: schoolData.sendexaSenderId || '',
                    settingsPin: schoolData.settingsPin || ''
                });
                setLogoPreview(schoolData.logoUrl);
            }


        } catch (error: any) {
            console.error("Critical Data Fetch Error:", error);
            
            // Exhaustive search for the Firebase Console link in all error properties
            let indexLink: string | undefined;
            const findLink = (obj: any): string | undefined => {
                if (!obj) return undefined;
                if (typeof obj === 'string') {
                    const match = obj.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                    return match ? match[0] : undefined;
                }
                if (typeof obj === 'object') {
                    for (const key in obj) {
                        const result = findLink(obj[key]);
                        if (result) return result;
                    }
                }
                return undefined;
            };

            indexLink = findLink(error) || findLink(error.stack);
            const errorString = error.message || String(error);
            
            if (indexLink) {
                toast({ 
                    title: "Database Setup Required", 
                    description: (
                        <div className="space-y-3">
                            <p>To load your school data, Firestore needs a one-time index creation.</p>
                            <a 
                                href={indexLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block w-full text-center px-4 py-3 bg-white text-destructive rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-md active:scale-95"
                            >
                                Fix Database Now
                            </a>
                        </div>
                    ), 
                    variant: "destructive", 
                    duration: 60000 
                });
            } else {
                toast({ 
                    title: "Data Loading Error", 
                    description: (
                        <div className="space-y-2">
                            <p>Could not fetch dashboard data. Please verify your internet and database setup.</p>
                            <div className="bg-black/20 p-2 rounded text-[10px] text-numeric break-all line-clamp-3">
                                {errorString}
                            </div>
                        </div>
                    ),
                    variant: "destructive", 
                    duration: 15000 
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [db, schoolId, toast, selectedPeriodId, user]); 
 
    useEffect(() => {
        if(db && schoolId && user) {
            fetchAdminData();
        }
    }, [db, schoolId, fetchAdminData, selectedPeriodId, user]); 

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        return students.filter(student =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const selectedStudent = useMemo(() => students.find(s => s.studentId === selectedStudentId) || null, [selectedStudentId, students]);

    const studentsByClass = useMemo(() => {
        return students.reduce((acc, student) => {
            const className = student.className?.trim() || 'Unassigned';
            if (!acc[className]) {
                acc[className] = [];
            }
            acc[className].push(student);
            return acc;
        }, {} as Record<string, Student[]>);
    }, [students]);

    const classes = useMemo(() => {
        return Object.keys(studentsByClass)
            .sort()
            .map(name => ({ id: name, name }));
    }, [studentsByClass]);

    const attendanceBreakdown = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return Object.entries(studentsByClass).map(([className, classStudents]) => {
            const present = classStudents.filter(s => 
                s.attendance?.some(a => a.date === today && a.attended)
            ).length;
            return {
                className,
                present,
                total: classStudents.length
            };
        }).sort((a, b) => a.className.localeCompare(b.className));
    }, [studentsByClass]);

    const uniqueClassNames = useMemo(() => {
        const classNames = new Set(students.map(s => s.className).filter(Boolean));
        return Array.from(classNames).sort();
    }, [students]);

    const filteredStudentsForFees = useMemo(() => {
        let list = students;
        if (selectedClassForFees !== 'all') {
            list = list.filter(s => s.className === selectedClassForFees);
        }
        return list;
    }, [students, selectedClassForFees]);


    useEffect(() => {
        if (selectedStudent) {
            setGeneralFeeForm(selectedStudent.generalFees || []);
            setDailyCostInput(String(selectedStudent.dailyFeedingCost || ''));
            setTransportationCostInput(String(selectedStudent.transportationCost || ''));
        } else {
            setGeneralFeeForm([]);
            setDailyCostInput('');
            setTransportationCostInput('');
        }
    }, [selectedStudent]);

    const handleSelectStudentForFeeds = (studentId: string) => {
        setSelectedStudentId(studentId);
        setActiveTab('fees');
    }

    const handleArchiveStudent = (student: Student) => setStudentToArchive(student);
    const confirmArchiveStudent = async () => {
        if (studentToArchive) {
            setIsSubmitting(true);
            try {
                await archiveStudent(db, auth, studentToArchive.studentId, true, schoolId || undefined);
                await fetchAdminData();
                toast({ title: "Student Archived", description: `${studentToArchive.name} has been moved to the archive.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to archive student.", variant: 'destructive'});
            } finally {
                setStudentToArchive(null);
                setIsSubmitting(false);
            }
        }
    };
    
    const handleRestoreStudent = async (studentId: string) => {
        setIsSubmitting(true);
        try {
            await archiveStudent(db, auth, studentId, false, schoolId || undefined);
            await fetchAdminData();
            toast({ title: "Student Restored", description: `The student has been restored to the active list.`});
        } catch (error) {
            toast({ title: "Error", description: "Failed to restore student.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStudent = (student: Student) => setStudentToDelete(student);
    const confirmDeleteStudent = async () => {
        if (studentToDelete) {
            setIsSubmitting(true);
            try {
                await deleteStudent(db, storage, auth, studentToDelete.studentId, schoolId || undefined);
                await fetchAdminData();
                toast({ title: "Student Deleted Permanently", description: `${studentToDelete.name} has been removed.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete student.", variant: 'destructive'});
            } finally {
                setStudentToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const handleArchiveStaff = (staff: StaffId) => setStaffToArchive(staff);
    const confirmArchiveStaff = async () => {
        if (staffToArchive) {
            setIsSubmitting(true);
            try {
                await archiveStaff(db, auth, staffToArchive.id, true);
                await fetchAdminData();
                toast({ title: "Staff Archived", description: `${staffToArchive.name} has been moved to the archive.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to archive staff.", variant: 'destructive'});
            } finally {
                setStaffToArchive(null);
                setIsSubmitting(false);
            }
        }
    };

    const handleRestoreStaff = async (staffId: string) => {
        setIsSubmitting(true);
        try {
            await archiveStaff(db, auth, staffId, false);
            await fetchAdminData();
            toast({ title: "Staff Restored", description: `Staff ID ${staffId} has been restored.`});
        } catch (error) {
            toast({ title: "Error", description: "Failed to restore staff.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = (staff: StaffId) => setStaffToDelete(staff);
    const confirmDeleteStaff = async () => {
        if (staffToDelete) {
            setIsSubmitting(true);
            try {
                await deleteStaffId(db, auth, staffToDelete.id);
                await fetchAdminData();
                toast({ title: "Staff Deleted Permanently", description: `Staff ID ${staffToDelete.id} has been revoked.`, variant: 'destructive'});
            } catch(error) {
                toast({ title: "Error", description: "Could not delete Staff ID.", variant: 'destructive' });
            } finally {
                setStaffToDelete(null);
                setIsSubmitting(false);
            }
        }
    }

    const handleDeleteExpenditure = (expenditure: Expenditure) => setExpenditureToDelete(expenditure);
    const confirmDeleteExpenditure = async () => {
        if (expenditureToDelete) {
            setIsSubmitting(true);
            try {
                await deleteExpenditure(db, auth, expenditureToDelete.id);
                toast({ title: "Expenditure Deleted", description: `The expenditure record has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete expenditure.", variant: 'destructive' });
            } finally {
                setExpenditureToDelete(null);
                setIsSubmitting(false);
            }
        }
    }

    const handleDeleteDebt = (debt: Debt) => setDebtToDelete(debt);
    const confirmDeleteDebt = async () => {
        if (debtToDelete) {
            setIsSubmitting(true);
            try {
                await deleteDebt(db, auth, debtToDelete.id);
                toast({ title: "Debt Deleted", description: `The debt record has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete debt.", variant: 'destructive' });
            } finally {
                setDebtToDelete(null);
                setIsSubmitting(false);
            }
        }
    }

    const handleOpenEditDialog = (student: Student) => {
        setSelectedStudentForEdit(student);
        const studentToEdit = {
            studentId: student.studentId,
            name: student.name || '',
            className: student.className || '',
            profilePicture: student.profilePicture || '',
            schoolId: student.schoolId || '',
            dateOfBirth: student.dateOfBirth || '',
            gender: student.gender || 'Male',
            parentId: student.parentId || '',
            parentName: student.parentName || '',
            parentPhone: student.parentPhone || '',
            address: student.address || '',
            emergencyContactName: student.emergencyContactName || '',
            emergencyContactPhone: student.emergencyContactPhone || '',
            parentEmail: student.parentEmail || '',
            medicalNotes: student.medicalNotes || '',
            dailyFees: student.dailyFees || []
        }
        setEditStudentForm(studentToEdit as any);
        setPhotoPreview(student.profilePicture);
        setPhotoFile(null);
        setIsEditDialogOpen(true);
    };

    const handleOpenViewDialog = (student: Student) => {
        setSelectedStudentForView(student);
        setIsViewDialogOpen(true);
    };
    
    const handleOpenSalaryDialog = (staff: StaffId) => {
        const details = staffDetails.find(d => d.id === staff.id);
        setSelectedStaffForSalary(staff);
        setSalaryForm({ amount: String(details?.salary || '') });
        setIsSalaryDialogOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleMigrateLedger = async () => {
        if (!selectedStudentId) return;
        setIsSubmitting(true);
        try {
            await migrateToLedger(db, auth, selectedStudentId, schoolId || undefined);
            await fetchAdminData();
            toast({ title: "Migration Successful", description: "All previous fees and payments have been moved to the Ledger." });
        } catch (error: any) {
            toast({ title: "Migration Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleConfirmAddCategory = async () => {
        if (!newCategoryName.trim() || !schoolId) return;
        setIsSubmitting(true);
        try {
            await addFeeCategory(db, auth, schoolId, newCategoryName.trim());
            await fetchAdminData();
            toast({ title: "Category Added", description: `"${newCategoryName}" is now available in your fee library.` });
            

            setNewCategoryName('');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!window.confirm(`Are you sure you want to delete the "${categoryName}" category? This will not remove historical transaction data, but you won't be able to select it for new transactions.`)) return;
        
        setIsSubmitting(true);
        try {
            await deleteFeeCategory(db, auth, categoryId);
            await fetchAdminData();
            toast({ title: "Category Deleted", description: `The category "${categoryName}" has been removed.` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveEditCategory = async (categoryId: string) => {
        if (!editingCategoryName.trim()) return;
        setIsSubmitting(true);
        try {
            await updateFeeCategory(db, auth, categoryId, editingCategoryName.trim());
            await fetchAdminData();
            toast({ title: 'Category Updated', description: `Category renamed to "${editingCategoryName.trim()}".` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setEditingCategoryId(null);
            setEditingCategoryName('');
            setIsSubmitting(false);
        }
    };

    const handleConfirmAddDailyCategory = async () => {
        if (!newDailyCategoryName.trim() || !schoolId) return;
        setIsSubmitting(true);
        try {
            await addDailyFeeCategory(db, auth, schoolId, newDailyCategoryName.trim());
            await fetchAdminData();
            toast({ title: "Daily Category Added", description: `"${newDailyCategoryName}" is now available in your daily fee library.` });
            setNewDailyCategoryName('');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordDailyPayments = async () => {
        if (!schoolId || !selectedDailyCategoryForPayments) {
            toast({ title: "Missing Information", description: "Please select a category first.", variant: "destructive" });
            return;
        }

        const selectedIds = Object.keys(bulkDailyPaymentsSelection).filter(id => bulkDailyPaymentsSelection[id]);
        if (selectedIds.length === 0) {
            toast({ title: "No Students Selected", description: "Please check the students you want to record payments for.", variant: "destructive" });
            return;
        }

        const category = dailyFeeCategories.find(c => c.id === selectedDailyCategoryForPayments) || { name: 'Feeding Fee', id: 'feeding' };
        
        const paymentsToRecord = selectedIds.map(sid => {
            const student = students.find(s => s.studentId === sid);
            let amount = 0;
            if (selectedDailyCategoryForPayments === 'feeding') {
                amount = Number(student?.dailyFeedingCost) || 0;
            } else {
                const df = student?.dailyFees?.find(f => f.categoryId === selectedDailyCategoryForPayments);
                amount = Number(df?.rate) || 0;
            }

            return {
                studentId: sid,
                amount,
                date: selectedPaymentDate,
                category: category.name,
                description: `${category.name} Payment`,
                periodId: selectedPeriodId || undefined
            };
        }).filter(p => p.amount > 0);

        if (paymentsToRecord.length === 0) {
            toast({ title: "Zero Amount", description: "Selected students have GH¢0.00 rate for this category.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await postBulkDailyPayments(db, auth, schoolId, paymentsToRecord);
            await fetchAdminData();
            toast({ title: "Payments Recorded", description: `Successfully logged daily fees for ${paymentsToRecord.length} students.` });
            setBulkDailyPaymentsSelection({});
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDeleteDailyCategory = async (categoryId: string, categoryName: string) => {
        if (!window.confirm(`Are you sure you want to delete the "${categoryName}" daily category? This will not remove existing student rates, but you won't be able to assign this category to new students.`)) return;
        
        setIsSubmitting(true);
        try {
            await deleteDailyFeeCategory(db, auth, categoryId);
            await fetchAdminData();
            toast({ title: "Daily Category Deleted", description: `The daily category "${categoryName}" has been removed.` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveEditDailyCategory = async (categoryId: string) => {
        if (!editingDailyCategoryName.trim()) return;
        setIsSubmitting(true);
        try {
            await updateDailyFeeCategory(db, auth, categoryId, editingDailyCategoryName.trim());
            await fetchAdminData();
            toast({ title: 'Category Updated', description: `Category renamed to "${editingDailyCategoryName.trim()}".` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setEditingDailyCategoryId(null);
            setEditingDailyCategoryName('');
            setIsSubmitting(false);
        }
    };

    const handleVoidTransaction = async (transactionId: string) => {
        if (!selectedStudentId) return;
        const reason = window.prompt("Reason for voiding this transaction?");
        if (!reason) return;
        
        setIsSubmitting(true);
        try {
            await voidLedgerTransaction(db, auth, selectedStudentId, transactionId, reason, schoolId || undefined);
            await fetchAdminData();
            toast({ title: "Transaction Voided", description: "The record has been updated." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleOpenEditTransaction = (t: LedgerTransaction) => {
        setTransactionToEdit(t);
        setTransactionModalInitialType(t.debit > 0 ? 'fee' : 'payment');
        setIsRecordTransactionModalOpen(true);
    };

    const handleUpdateDailyRate = async (studentId: string, categoryId: string, newRate: number) => {
        setIsSubmitting(true);
        try {
            const student = students.find(s => s.studentId === studentId);
            if (!student) return;

            const updates: any = {};
            if (categoryId === 'feeding') {
                updates.dailyFeedingCost = newRate;
            } else {
                const otherFees = (student.dailyFees || []).filter(df => df.categoryId !== categoryId);
                updates.dailyFees = [...otherFees, { categoryId, rate: newRate }];
            }

            await updateStudentDetails(db, storage, auth, studentId, updates, null, schoolId || undefined);
            
            // Sync past attendance with new rates
            await reconcileDailyFees(db, auth, studentId, selectedPeriodId || undefined, schoolId || undefined);
            
            await fetchAdminData();
            toast({ title: "Rate Updated", description: "The daily fee rate and past records have been synchronized." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update rate.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
            setEditingRateId(null);
        }
    };

    const handleSyncAllDailyFees = async () => {
        setIsSubmitting(true);
        let count = 0;
        try {
            for (const student of students) {
                const changed = await reconcileDailyFees(db, auth, student.studentId, selectedPeriodId || undefined, schoolId || undefined);
                if (changed) count++;
            }
            await fetchAdminData();
            toast({ 
                title: "Sync Complete", 
                description: `Successfully synchronized billing records for ${count} students.` 
            });
        } catch (error: any) {
            toast({ title: "Sync Error", description: error.message || "Failed to sync all records.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForEdit) return;

        setIsSubmitting(true);
        try {
            const { studentId, profilePicture, ...detailsToUpdateRaw } = editStudentForm;
            const detailsToUpdate = {
                ...detailsToUpdateRaw,
                feeDiscount: detailsToUpdateRaw.feeDiscount ? Number(detailsToUpdateRaw.feeDiscount) : 0
            };
            const upperCaseStudentId = studentId.trim().toUpperCase();
            const studentIdChanged = selectedStudentForEdit.studentId !== upperCaseStudentId;

            if (studentIdChanged) {
                 await updateStudentId(db, auth, selectedStudentForEdit.studentId, upperCaseStudentId, schoolId || undefined);
            }
            
            await updateStudentDetails(db, storage, auth, upperCaseStudentId, detailsToUpdate, photoFile, schoolId || undefined);

            await fetchAdminData();
            if (studentIdChanged) {
                setSelectedStudentId(upperCaseStudentId);
            }
            toast({ title: "Success", description: "Student information updated." });
            setIsEditDialogOpen(false);
            setSelectedStudentForEdit(null);
            setPhotoPreview(null);
            setPhotoFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not update student details.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            const studentData = {
                ...addStudentForm,
                schoolId: schoolId.toUpperCase(),
                studentId: addStudentForm.studentId.trim().toUpperCase()
            };
            await addStudent(db, auth, schoolId, studentData as any);
            await fetchAdminData();
            toast({ title: "Success", description: `${addStudentForm.name} has been added.` });
            setAddStudentForm(defaultAddStudentForm);
            setIsAddStudentDialogOpen(false);
            setActiveTab('students');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            if (editingStaffId) {
                // Ensure no undefined values are sent to Firestore
                const updates: any = {};
                if (addStaffForm.name) updates.name = addStaffForm.name;
                if (addStaffForm.role) updates.role = addStaffForm.role;
                updates.className = addStaffForm.className || '';
                updates.phone = addStaffForm.phone || '';
                updates.email = addStaffForm.email || '';

                await updateStaffId(db, auth, editingStaffId, updates);
                toast({ title: "Staff Updated", description: `${addStaffForm.name}'s details have been saved.` });
            } else {
                const staffId = addStaffForm.id.trim() || undefined;
                const className = addStaffForm.className === 'none' ? undefined : addStaffForm.className;
                await addStaffId(db, auth, schoolId, addStaffForm.name, addStaffForm.role, staffId, className, addStaffForm.phone, addStaffForm.email);
                toast({ title: "Staff Registered", description: `${addStaffForm.name} has been added to the system.` });
            }
            await fetchAdminData();
            setAddStaffForm(defaultAddStaffForm);
            setEditingStaffId(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSalarySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaffForSalary || !schoolId) return;
        setIsSubmitting(true);
        try {
            await updateStaffSalary(db, auth, schoolId, selectedStaffForSalary.id, Number(salaryForm.amount));
            await fetchAdminData();
            toast({ title: "Success", description: `Salary updated for ${selectedStaffForSalary.name}.` });
            setIsSalaryDialogOpen(false);
            setSelectedStaffForSalary(null);
        } catch (error: any) {
             toast({ title: "Error", description: error.message || "Could not update salary.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddAcademicPeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            if (editingPeriodId) {
                await updateAcademicPeriod(db, auth, editingPeriodId, newPeriodForm);
                toast({ title: "Term Updated", description: `${newPeriodForm.term} for ${newPeriodForm.year} has been updated.` });
            } else {
                await addAcademicPeriod(db, auth, schoolId, { ...newPeriodForm, isCurrent: false });
                toast({ title: "Term Created", description: `${newPeriodForm.term} for ${newPeriodForm.year} has been created.` });
            }
            await fetchAdminData();
            setNewPeriodForm({ 
                year: '', 
                term: 'First Term',
                startDate: '',
                endDate: '',
                vacationDate: '',
                nextTermBegins: ''
            });
            setEditingPeriodId(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetCurrentPeriod = async (periodId: string) => {
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            await setAsCurrentPeriod(db, auth, schoolId, periodId);
            setSelectedPeriodId(periodId);
            await fetchAdminData();
            toast({ title: "Current Term Updated", description: "The default term for all users has been updated." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAcademicPeriod = async (periodId: string) => {
        if (!schoolId) return;
        if (!auth?.currentUser) {
            console.error("No user signed in. Auth state:", auth);
            toast({ title: "Session Expired", description: "Please log in again to perform this action.", variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await deleteAcademicPeriod(db, auth, periodId);
            if (selectedPeriodId === periodId) {
                setSelectedPeriodId(null);
            }
            await fetchAdminData();
            toast({ title: "Term Deleted", description: "The academic period has been removed.", variant: 'destructive' });
        } catch (error: any) {
            console.error("Delete Academic Period Error:", error);
            toast({ title: "Error", description: error.message || "Could not delete period.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    

    const handleSaveSchoolSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            // Destructure all fields, including the new ones
            const { 
                name, schoolPhone, schoolEmail, momoNumber, momoName, 
                bankAccounts, hubtelMerchantNumber, hubtelClientId, hubtelClientSecret,
                sendexaApiToken, sendexaSenderId 
            } = schoolSettingsForm;
            
            // Pass all fields to the update function
            await updateSchoolDetails(db, storage, auth, schoolId, { 
                name, 
                schoolPhone, 
                schoolEmail, 
                momoNumber, 
                momoName, 
                bankAccounts,
                hubtelMerchantNumber,
                hubtelClientId,
                hubtelClientSecret,
                sendexaApiToken,
                sendexaSenderId,
                settingsPin: schoolSettingsForm.settingsPin
            }, logoFile);
    
            await fetchAdminData();
            toast({ title: "Success", description: "School settings have been updated." });
            setLogoFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not update school settings.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };        



    const handleToggleAttendance = async (studentId: string, isChecked: boolean) => {
        setIsAttendanceSubmitting(prev => ({...prev, [studentId]: true}));
        try {
            await setAttendance(db, auth, studentId, selectedAttendanceDate, isChecked, selectedPeriodId || undefined, schoolId || undefined);
            setStudents(prevStudents => prevStudents.map(s => {
                if (s.studentId === studentId) {
                    const attendance = [...(s.attendance || [])];
                    const recordIndex = attendance.findIndex(a => a.date === selectedAttendanceDate);
                    if (recordIndex > -1) {
                        attendance[recordIndex] = { ...attendance[recordIndex], attended: isChecked, periodId: selectedPeriodId || undefined };
                    } else {
                        attendance.push({ id: Date.now(), date: selectedAttendanceDate, attended: isChecked, periodId: selectedPeriodId || undefined });
                    }
                    return { ...s, attendance };
                }
                return s;
            }));
        } catch (error) {
            toast({ title: "Error", description: "Could not update attendance.", variant: "destructive" });
        } finally {
             setIsAttendanceSubmitting(prev => ({...prev, [studentId]: false}));
        }
    };

    const handleDeleteAnnouncement = async () => {
        if (!announcementToDelete || !auth || !db) return;
        setIsSubmitting(true);
        try {
            await deleteAnnouncement(db, auth, announcementToDelete.id);
            toast({ title: 'Announcement Deleted', description: 'The message has been removed from the portal.' });
            fetchAdminData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
            setAnnouncementToDelete(null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {

        e.preventDefault();
        if (!schoolId) {
            toast({ title: "Error", description: "School ID not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let announcementSent = false;
        
        // --- In-App Announcement Logic ---
        try {
            // We only send the announcement, not the SMS flag
            const announcementData = {
                recipient: communicationForm.recipient,
                subject: communicationForm.subject,
                message: communicationForm.message,
            };
            await sendAnnouncement(db, auth, schoolId, announcementData);
            announcementSent = true;
            toast({ title: "Success", description: "In-app announcement was sent." });

        } catch (error: any) {
            console.error("Failed to send announcement:", error);
            toast({
                title: "Error Sending Announcement",
                description: error.message || "An unknown error occurred with the in-app announcement.",
                variant: "destructive",
                duration: 9000
            });
        }

        // --- SMS Sending Logic ---
        if (communicationForm.sendAsSMS) {
            toast({ title: "Sending SMS...", description: "Please wait." });
            try {
                const smsResponse = await fetch('/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        schoolId: schoolId,
                        // Use the message from the form for the SMS body
                        message: communicationForm.message, 
                        // Determine the recipient for the API
                        recipient: communicationForm.recipient === 'all' ? 'all' : 'specific',
                        specificParent: communicationForm.recipient !== 'all' ? communicationForm.recipient : undefined
                    }),
                });

                const smsResult = await smsResponse.json();

                if (smsResponse.ok) {
                    toast({
                        title: "SMS Sent Successfully",
                        description: smsResult.message || `SMS was sent to the selected recipients.`,
                        variant: "default"
                    });
                } else {
                     toast({
                        title: "SMS Sending Failed",
                        description: smsResult.error || "The SMS could not be sent. Please check your Sendexa credentials in Settings and try again.",
                        variant: "destructive",
                        duration: 10000
                    });
                }
            } catch (error: any) {
                console.error("Failed to make SMS API request:", error);
                toast({
                    title: "SMS API Error",
                    description: "A network or server error occurred while trying to send the SMS.",
                    variant: "destructive",
                    duration: 10000
                });
            }
        }

        // Reset the form only if at least one operation was attempted
        if (announcementSent || communicationForm.sendAsSMS) {
             setCommunicationForm(defaultCommunicationForm);
        }
        
        setIsSubmitting(false);
    };
      

    const handleAddCalendarEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            await addCalendarEvent(db, auth, schoolId, calendarEventForm);
            toast({ title: "Success", description: "Calendar event added." });
            setCalendarEventForm(defaultCalendarEventForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add calendar event.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = (event: CalendarEvent) => setEventToDelete(event);
    const confirmDeleteEvent = async () => {
        if (eventToDelete) {
            setIsSubmitting(true);
            try {
                await deleteCalendarEvent(db, auth, eventToDelete.id);
                toast({ title: "Event Deleted", description: `The event "${eventToDelete.title}" has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete event.", variant: 'destructive' });
            } finally {
                setEventToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const handleAddExpenditure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        const newExpenditure = {
            description: expenditureForm.description,
            category: expenditureForm.category,
            amount: Number(expenditureForm.amount),
            date: expenditureForm.date,
            type: expenditureForm.type,
            periodId: selectedPeriodId || undefined
        };
        try {
            await addExpenditure(db, auth, schoolId, newExpenditure);
            toast({ title: "Success", description: "Expenditure recorded." });
            setExpenditureForm(defaultExpenditureForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add expenditure.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        const newDebt = {
            ...debtForm,
            amount: Number(debtForm.amount),
            periodId: selectedPeriodId || undefined
        };
        try {
            await addDebt(db, auth, schoolId, newDebt);
            toast({ title: "Success", description: "Debt recorded." });
            setDebtForm(defaultDebtForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add debt.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleBankAccountChange = (index: number, field: keyof Omit<BankAccount, 'id'>, value: string) => {
        const updatedAccounts = [...schoolSettingsForm.bankAccounts];
        updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
        setSchoolSettingsForm(prev => ({ ...prev, bankAccounts: updatedAccounts }));
    };

    const addBankAccount = () => {
        setSchoolSettingsForm(prev => ({
            ...prev,
            bankAccounts: [...prev.bankAccounts, { id: Date.now(), bankName: '', accountName: '', accountNumber: '' }]
        }));
    };

    const removeBankAccount = (index: number) => {
        setSchoolSettingsForm(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter((_, i) => i !== index)
        }));
    };



    const ledgerTotals = useMemo(() => {
        if (!selectedStudent) return { billed: 0, paid: 0, balance: 0 };
        
        const totals = (selectedStudent.ledger || [])
            .filter(t => !selectedPeriodId || t.periodId === selectedPeriodId)
            .reduce((acc, t) => {
                if (t.isVoided) return acc;
                acc.billed += (t.debit || 0);
                acc.paid += (t.credit || 0);
                return acc;
            }, { billed: 0, paid: 0 });

        return { 
            ...totals, 
            balance: totals.billed - totals.paid 
        };
    }, [selectedStudent, selectedPeriodId]);

    const overallTotals = useMemo(() => {
        const byCategory: Record<string, { billed: number; paid: number; accrued: number }> = {};
        
        // Initialize with all known categories
        feeCategories.forEach(cat => {
            byCategory[cat.name] = { billed: 0, paid: 0, accrued: 0 };
        });
        dailyFeeCategories.forEach(cat => {
            byCategory[cat.name] = { billed: 0, paid: 0, accrued: 0 };
        });
        
        // Helper to get consistent category name
        const getDisplayCategory = (catRef: string) => {
            if (catRef === 'feeding' || catRef === 'Feeding Fee') return 'Feeding Fee';
            const cat = [...feeCategories, ...dailyFeeCategories].find(c => c.id === catRef || c.name === catRef);
            return cat?.name || catRef || 'General';
        };

        students.forEach(student => {
            if (student.ledger) {
                student.ledger.forEach(t => {
                    if (t.isVoided) return;
                    if (!selectedPeriodId || t.periodId === selectedPeriodId) {
                        const displayCat = getDisplayCategory(t.category || '');
                        if (!byCategory[displayCat]) {
                            byCategory[displayCat] = { billed: 0, paid: 0, accrued: 0 };
                        }
                        
                        byCategory[displayCat].billed += (t.debit || 0);
                        byCategory[displayCat].paid += (t.credit || 0);
                    }
                });
            }
        });

        const totalIncome = Object.values(byCategory).reduce((sum, c) => sum + c.paid, 0);
        const totalExpenditure = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
        const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);

        return {
            byCategory,
            totalIncome,
            totalExpenditure,
            netSavings: totalIncome - totalExpenditure,
            totalDebt,
        };
    }, [students, expenditures, debts, selectedPeriodId, feeCategories, dailyFeeCategories]);

    
    const chartData = useMemo(() => {
        const incomeVsExpenditure = [
            { name: 'Total Income', value: overallTotals.totalIncome, fill: 'hsl(var(--success))' },
            { name: 'Total Expenditure', value: overallTotals.totalExpenditure, fill: 'hsl(var(--destructive))' },
        ];

        const arrearsByClass = Object.entries(studentsByClass)
            .map(([className, classStudents]) => {
                const totalArrears = classStudents.reduce((sum, student) => {
                    const balance = (student.ledger || [])
                        .filter(t => !t.isVoided && (!selectedPeriodId || t.periodId === selectedPeriodId))
                        .reduce((acc, t) => acc + ((t.debit || 0) - (t.credit || 0)), 0);
                    
                    return sum + (balance > 0 ? balance : 0);
                }, 0);
                return { name: className, arrears: totalArrears };
            })
            .filter(c => c.arrears > 0)
            .sort((a,b) => b.arrears - a.arrears);

        return { incomeVsExpenditure, arrearsByClass };
    }, [overallTotals, studentsByClass, selectedPeriodId]);

    const families = useMemo(() => {
        const familyGroups: Record<string, Student[]> = {};
        students.forEach(student => {
            const pid = student.parentId?.trim().toUpperCase();
            if (pid) {
                if (!familyGroups[pid]) familyGroups[pid] = [];
                familyGroups[pid].push(student);
            }
        });
        return familyGroups;
    }, [students]);

    const expenditureTotals = useMemo(() => {
        return expenditures.reduce((acc, exp) => {
            acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [expenditures]);

    const incomeTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        Object.entries(overallTotals.byCategory).forEach(([name, data]) => {
            totals[name] = data.paid;
        });
        return totals;
    }, [overallTotals]);

    const dailyFeeSummary = useMemo(() => {
        const summary: { 
            studentId: string,
            categoryId: string,
            studentName: string, 
            className: string,
            categoryName: string, 
            daysPresent: number, 
            dailyRate: number, 
            totalBilled: number,
            totalPaid: number,
            balance: number,
            status: 'Paid' | 'Partially Paid' | 'Unpaid'
        }[] = [];

        students.forEach(student => {
            if (selectedClassForFees !== 'all' && student.className !== selectedClassForFees) return;

            const getStatsForCategory = (catName: string, catId: string) => {
                let billed = 0;
                let paid = 0;
                
                const relevantTransactions = (student.ledger || []).filter(t => 
                    !t.isVoided && 
                    (!selectedPeriodId || t.periodId === selectedPeriodId) &&
                    (
                        t.category === catName || 
                        t.category === catId || 
                        (catId === 'feeding' && t.category === 'Feeding Fee') ||
                        (catName === 'Feeding Fee' && t.category === 'feeding')
                    )
                );

                billed = relevantTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
                paid = relevantTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);
                
                // Count actual attendance days for this period
                const attendanceCount = (student.attendance || []).filter(a => 
                    a.attended && 
                    (!selectedPeriodId || a.periodId === selectedPeriodId)
                ).length;
                
                return { billed, paid, feeCount: attendanceCount };
            };

            const processCategory = (catName: string, catId: string, rate: number) => {
                const stats = getStatsForCategory(catName, catId);
                const totalBilled = stats.billed;
                const totalPaid = stats.paid;
                const balance = totalPaid - totalBilled;
                
                let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
                if (balance >= 0 && totalBilled > 0) status = 'Paid';
                else if (totalPaid > 0 && totalPaid < totalBilled) status = 'Partially Paid';
                else if (totalBilled === 0 && totalPaid > 0) status = 'Paid';
                
                if (totalBilled > 0 || totalPaid > 0 || stats.feeCount > 0) {
                    summary.push({
                        studentName: student.name,
                        className: student.className || 'Unassigned',
                        categoryName: catName,
                        categoryId: catId,
                        daysPresent: stats.feeCount,
                        dailyRate: rate,
                        totalBilled,
                        totalPaid,
                        balance,
                        status,
                        studentId: student.studentId
                    });
                }
            };

            processCategory('Feeding Fee', 'feeding', Number(student.dailyFeedingCost) || 0);

            (student.dailyFees || []).forEach(df => {
                const category = dailyFeeCategories.find(c => c.id === df.categoryId);
                processCategory(category?.name || 'Custom Fee', df.categoryId, df.rate);
            });
        });
        return summary;
    }, [students, selectedPeriodId, dailyFeeCategories, selectedClassForFees]);

    const allFeeCategories = useMemo(() => {
        const combined = [...feeCategories, ...dailyFeeCategories];
        // Ensure "Feeding Fee" is explicitly available if not already in the list
        if (!combined.some(c => c.id === 'feeding' || c.name === 'Feeding Fee')) {
            combined.push({ id: 'feeding', name: 'Feeding Fee', schoolId: schoolId || '' });
        }
        return combined;
    }, [feeCategories, dailyFeeCategories, schoolId]);

    const selectedPeriod = academicPeriods.find(p => p.id === selectedPeriodId);

    if (!db) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!schoolId) {
        return (
             <main className="container mx-auto p-4 md:p-8">
                <Card className="w-full max-w-md mx-auto mt-10">
                    <CardHeader>
                        <CardTitle className="text-heading-md flex items-center gap-2">
                           <AlertCircleIcon className="w-6 h-6 text-destructive" /> Invalid Access
                        </CardTitle>
                        <CardDescription>
                            Please try to access the dashboard through your registration link.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
             </main>
        )
    }

    return (
        <TooltipProvider>
            <div className="h-screen w-full flex bg-background text-foreground overflow-hidden">
                <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={handleSetActiveTab}
                    feesActiveSubTab={feesActiveSubTab}
                    setFeesActiveSubTab={setFeesActiveSubTab}
                    handleLogout={handleLogout}
                    schoolName={schoolDetails?.name}
                    schoolId={schoolId ?? undefined}
                    logoUrl={schoolDetails?.logoUrl}
                />
                <div className="flex flex-col flex-1 min-w-0">
                    <header className="bg-card shadow-sm sticky top-0 z-40 border-b flex flex-wrap lg:flex-nowrap items-center px-4 py-2 gap-y-2 gap-x-4 min-h-[4rem]">
                        {/* Logo and Name Wrapper */}
                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 order-1">
                            {schoolDetails?.logoUrl ? (
                                <Avatar className="h-9 w-9 flex-shrink-0">
                                    <AvatarImage src={schoolDetails.logoUrl} alt={schoolDetails.name} />
                                    <AvatarFallback>{schoolDetails?.name?.charAt(0) || 'S'}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <ZipSMALogo className="h-8 w-8 flex-shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                                <h1 className="text-md font-bold text-primary truncate leading-tight">{schoolDetails?.name}</h1>
                                {selectedPeriod && <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{selectedPeriod.year} - {selectedPeriod.term}</p>}
                            </div>
                        </div>

                        {/* Term Selector Mobile: Move to next line (order-3), Desktop: Stay inline (order-2) */}
                        <div className="w-full lg:w-auto order-3 lg:order-2">
                            {/* Term Selector for both Desktop & Mobile */}
                            <Select value={selectedPeriodId || ''} onValueChange={(val) => {
                                setSelectedPeriodId(val);
                                // Automatically refresh data when term changes
                                // The useEffect at the bottom handles this if we add periodId to dependencies
                            }}>
                                <SelectTrigger className="w-full lg:w-[200px] h-9 text-xs md:text-sm bg-muted/50 border-primary/20">
                                    <CalendarDays className="w-3 h-3 md:w-4 md:h-4 mr-2 text-primary shrink-0" />
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2 text-[10px] font-semibold text-muted-foreground uppercase border-b mb-1">Academic Term</div>
                                    {academicPeriods.length === 0 ? (
                                        <SelectItem value="none" disabled>No Terms Setup</SelectItem>
                                    ) : (
                                        academicPeriods.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.year} - {p.term} {p.isCurrent && "(Current)"}
                                            </SelectItem>
                                        ))
                                    )}
                                    <div className="p-1 border-t mt-1">
                                        <Button variant="ghost" size="sm" className="w-full text-[10px] h-8 justify-start px-2" onClick={(e) => { e.stopPropagation(); setIsAcademicSetupOpen(true); }}>
                                            <Settings className="w-3 h-3 mr-2" /> Academic Setup
                                        </Button>
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sidebar Trigger */}
                        <div className="flex-shrink-0 order-2 lg:order-3">
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="flex-shrink-0 lg:hidden h-9 w-9">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-[280px] flex">
                                    <AdminSidebar
                                        activeTab={activeTab}
                                        setActiveTab={(tab) => {
                                            handleSetActiveTab(tab);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        feesActiveSubTab={feesActiveSubTab}
                                        setFeesActiveSubTab={setFeesActiveSubTab}
                                        handleLogout={handleLogout}
                                        schoolName={schoolDetails?.name}
                                        schoolId={schoolId ?? undefined}
                                        logoUrl={schoolDetails?.logoUrl}
                                        isMobile={true}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 dark:bg-transparent relative pb-8">
                        {/* Hero Banner */}
                        <div className="w-full h-32 md:h-48 lg:h-56 relative mb-6">
                            <Image 
                                src="/cover-placeholder.png" 
                                alt="School Cover" 
                                fill 
                                className="object-cover"
                                priority
                            />
                        </div>
                        
                        <div className="px-4 md:px-6 lg:px-8 -mt-20 md:-mt-28 relative z-10 drop-shadow-2xl">
                            <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="min-h-full drop-shadow-lg"
                            >
                        {activeTab === 'dashboard' && (
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="text-heading-md">School Overview</CardTitle>
                                    <CardDescription>A high-level view of school finances and enrollment.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="grid md:grid-cols-4 gap-4">
                                            <Skeleton className="h-24 w-full" />
                                            <Skeleton className="h-24 w-full" />
                                            <Skeleton className="h-24 w-full" />
                                            <Skeleton className="h-24 w-full" />
                                        </div>
                                    ) : (
                                        <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-heading-md">Total Students</CardTitle>
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold">{students.length}</div>
                                                    <p className="text-xs text-muted-foreground">Currently enrolled</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-heading-md">Total Income</CardTitle>
                                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-success">GH¢{overallTotals.totalIncome.toFixed(2)}</div>
                                                    <p className="text-xs text-muted-foreground">From all fee collections</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-heading-md">Total Expenditure</CardTitle>
                                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-destructive">GH¢{overallTotals.totalExpenditure.toFixed(2)}</div>
                                                    <p className="text-xs text-muted-foreground">Total recorded expenses</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-heading-md">Net Savings / Loss</CardTitle>
                                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className={`text-2xl font-bold ${overallTotals.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>GH¢{(overallTotals.netSavings || 0).toFixed(2)}</div>
                                                    <p className="text-xs text-muted-foreground">Income minus Expenditures</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                            <Card>
                                                <CardHeader><CardTitle className="text-heading-md">Income vs. Expenditure</CardTitle></CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={chartData.incomeVsExpenditure} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="name" />
                                                            <YAxis />
                                                            <ChartTooltip />
                                                            <Bar dataKey="value" name="Amount" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader><CardTitle className="text-heading-md">Fee Arrears by Class</CardTitle></CardHeader>
                                                <CardContent>
                                                {chartData.arrearsByClass.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={chartData.arrearsByClass} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="name" />
                                                            <YAxis />
                                                            <ChartTooltip />
                                                            <Bar dataKey="arrears" name="Arrears" fill='hsl(var(--destructive))' />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                        <CheckCheck className="w-8 h-8 mr-2" />
                                                        <p>No outstanding fee arrears. Well done!</p>
                                                    </div>
                                                )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                        <div className="mt-8">
                                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                                <CardHeader className="bg-slate-50/50 border-b border-primary/5 py-4 px-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                                                                <Users className="w-5 h-5" /> Class Attendance Summary
                                                            </CardTitle>
                                                            <CardDescription className="text-xs font-medium">Real-time attendance breakdown for all classes today.</CardDescription>
                                                        </div>
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-widest text-[10px] py-1 px-3">
                                                            Today
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 bg-white/50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {attendanceBreakdown.length === 0 ? (
                                                            <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                                <p className="font-semibold text-sm">No classes found to track attendance.</p>
                                                                <p className="text-[10px] mt-1">Assign students to classes to see live metrics here.</p>
                                                            </div>
                                                        ) : (
                                                            attendanceBreakdown.map((item) => (
                                                                <div key={item.className} className="p-4 bg-card border border-primary/5 rounded-2xl shadow-sm hover:shadow-md transition-all group hover:border-primary/20">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                                                {item.className}
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Attendance</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-lg font-black text-numeric text-primary leading-none">
                                                                                {item.present} <span className="text-xs text-muted-foreground font-medium">/ {item.total}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${item.total > 0 ? (item.present / item.total) * 100 : 0}%` }}
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-1000",
                                                                                item.present === item.total ? "bg-emerald-500" : 
                                                                                item.present === 0 ? "bg-slate-300" : "bg-primary"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    <div className="mt-2.5 flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                                                                        <span className={cn(item.present === item.total ? "text-emerald-600" : "text-muted-foreground")}>
                                                                            {item.present === item.total ? "FULL HOUSE" : `${item.total - item.present} ABSENT`}
                                                                        </span>
                                                                        <span className="text-numeric bg-primary/5 px-1.5 py-0.5 rounded text-primary">
                                                                            {item.total > 0 ? Math.round((item.present / item.total) * 100) : 0}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'students' && (
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-heading-md">Student List</CardTitle>
                                        <CardDescription>A list of all active students currently enrolled.</CardDescription>
                                    </div>
                                    <Button onClick={() => setIsAddStudentDialogOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Student
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Photo</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Class Level</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        </div>
                                    ) : students.length === 0 ? (
                                        <div className="flex flex-col items-center pb-8">
                                            <EmptyState 
                                                title="No Active Students Found" 
                                                description="Get started by adding your first student to the portal." 
                                            />
                                            <Button className="mt-2" onClick={() => setIsAddStudentDialogOpen(true)}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4 relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search by name or student ID..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-8 w-full"
                                                />
                                            </div>
                                            <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[60px]">Photo</TableHead>
                                                        <TableHead>Student</TableHead>
                                                        <TableHead>Class Level</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredStudents.map((student) => (
                                                        <TableRow key={student.studentId}>
                                                            <TableCell>
                                                                <GradientAvatar name={student.name} src={student.profilePicture} size="md" />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <StudentInfoTrigger student={student} onClick={() => handleOpenViewDialog(student)} />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Click to view student information</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TableCell>
                                                            <TableCell>{student.className}</TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleOpenViewDialog(student)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(student)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleSelectStudentForFeeds(student.studentId)}><Wallet className="mr-2 h-4 w-4"/> Manage All Fees</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleArchiveStudent(student)}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            </div>
                                            {filteredStudents.length === 0 && (
                                                <div className="text-center py-12 px-4">
                                                    <p className="text-muted-foreground">No students match your search.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {activeTab === 'families' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-heading-md">Family Groupings</CardTitle>
                                    <CardDescription>View families and aggregated fee records grouped by Parent ID.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {Object.keys(families).length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">No families have been grouped yet. Assign a Parent ID to students to group them.</div>
                                    ) : (
                                        <div className="space-y-8">
                                            {Object.entries(families).map(([parentId, children]) => {
                                                const generalBilled = children.reduce((sum, child) => sum + (child.generalFees || []).reduce((s, f) => s + Number(f.amount || 0), 0), 0);
                                                const generalPaid = children.reduce((sum, child) => sum + (child.generalPayments || []).reduce((s, p) => s + p.amount, 0), 0);
                                                const generalBalance = generalBilled - generalPaid;

                                                const transportBilled = children.reduce((sum, child) => sum + Number(child.transportationCost || 0), 0);
                                                const transportPaid = children.reduce((sum, child) => sum + (child.transportationPayments || []).reduce((s, p) => s + p.amount, 0), 0);
                                                const transportBalance = transportBilled - transportPaid;

                                                const feedingPaid = children.reduce((sum, child) => sum + (child.feedingFeePayments || []).reduce((s, p) => s + p.amount, 0), 0);
                                                const feedingDeducted = children.reduce((sum, child) => {
                                                    const attendedDays = (child.attendance || []).filter(a => a.attended).length;
                                                    return sum + (attendedDays * (Number(child.dailyFeedingCost) || 0));
                                                }, 0);
                                                const feedingBalance = feedingPaid - feedingDeducted;
                                                const feedingArrears = feedingBalance < 0 ? Math.abs(feedingBalance) : 0;

                                                const dailyDeducted = children.reduce((sum, child) => {
                                                    const attendedDays = (child.attendance || []).filter(a => a.attended).length;
                                                    const childDailyRate = (child.dailyFees || []).reduce((s, df) => s + (df.rate || 0), 0);
                                                    return sum + (attendedDays * childDailyRate);
                                                }, 0);
                                                const totalArrears = (generalBalance > 0 ? generalBalance : 0) + (transportBalance > 0 ? transportBalance : 0) + feedingArrears + dailyDeducted;

                                                return (
                                                    <Card key={parentId} className="border border-primary/20 bg-primary/5">
                                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4 md:gap-0">
                                                            <div>
                                                                <CardTitle className="text-heading-md flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> Family ID: {parentId}</CardTitle>
                                                                <CardDescription>Guardian: {children[0].parentName} ({children[0].parentPhone})</CardDescription>
                                                            </div>
                                                            <div className="text-left md:text-right">
                                                                <div className="text-sm text-muted-foreground">Total Family Arrears</div>
                                                                <div className={cn("font-bold text-xl", totalArrears > 0 ? "text-destructive" : "text-success")}>
                                                                    GH¢{(totalArrears || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                                <div className="p-3 bg-card border rounded-md shadow-sm">
                                                                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-1"><BookCopy className="w-4 h-4"/> General Fees</div>
                                                                    <div className="flex justify-between text-xs mb-1"><span>Billed:</span> <span>GH¢{(generalBilled || 0).toFixed(2)}</span></div>
                                                                    <div className={cn("text-lg font-bold mt-2", generalBalance > 0 ? "text-destructive" : "text-success")}>GH¢{(generalBalance || 0).toFixed(2)} {generalBalance > 0 ? 'Due' : 'Balance'}</div>
                                                                </div>
                                                                <div className="p-3 bg-card border rounded-md shadow-sm">
                                                                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Bus className="w-4 h-4"/> Transportation</div>
                                                                    <div className="flex justify-between text-xs mb-1"><span>Billed:</span> <span>GH¢{(transportBilled || 0).toFixed(2)}</span></div>
                                                                    <div className={cn("text-lg font-bold mt-2", transportBalance > 0 ? "text-destructive" : "text-success")}>GH¢{(transportBalance || 0).toFixed(2)} {transportBalance > 0 ? 'Due' : 'Balance'}</div>
                                                                </div>
                                                                <div className="p-3 bg-card border rounded-md shadow-sm">
                                                                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-1"><UtensilsCrossed className="w-4 h-4"/> Feeding Costs</div>
                                                                    <div className="flex justify-between text-xs mb-1"><span>Deducted based on attendance:</span> <span>GH¢{(feedingDeducted || 0).toFixed(2)}</span></div>
                                                                    <div className={cn("text-lg font-bold mt-2", feedingArrears > 0 ? "text-destructive" : "text-success")}>GH¢{(feedingArrears || 0).toFixed(2)} Arrears</div>
                                                                </div>
                                                                <div className="p-3 bg-card border rounded-md shadow-sm">
                                                                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-1"><CalendarDays className="w-4 h-4"/> Other Daily Fees</div>
                                                                    <div className="flex justify-between text-xs mb-1"><span>Deducted based on attendance:</span> <span>GH¢{(dailyDeducted || 0).toFixed(2)}</span></div>
                                                                    <div className={cn("text-lg font-bold mt-2", dailyDeducted > 0 ? "text-destructive" : "text-success")}>GH¢{(dailyDeducted || 0).toFixed(2)} Arrears</div>
                                                                </div>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <Table>
                                                                    <TableHeader><TableRow><TableHead>Child Name</TableHead><TableHead>Class</TableHead><TableHead>Student ID</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                                                    <TableBody>
                                                                        {children.map(child => (
                                                                            <TableRow key={child.studentId}>
                                                                                <TableCell className="font-medium">{child.name}</TableCell>
                                                                                <TableCell>{child.className}</TableCell>
                                                                                <TableCell>{child.studentId}</TableCell>
                                                                                <TableCell>
                                                                                    <Button variant="ghost" size="sm" onClick={() => { setActiveTab('students'); setSelectedStudentForView(child); setIsViewDialogOpen(true); }}>
                                                                                        <Eye className="h-4 w-4 mr-2" /> View
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {activeTab === 'fees' && (
                            <div className="space-y-6">
                                {/* Shared Filter Bar */}
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border border-primary/10 p-4 rounded-2xl shadow-sm transition-all">
                                    <div className="flex items-center gap-4 w-full lg:w-auto">
                                        <div className="p-2.5 bg-primary/10 rounded-xl">
                                            <Receipt className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-bold text-primary leading-tight">
                                                {feesActiveSubTab === 'records' ? 'Fee Category Records' : 'Daily Fee Category'}
                                            </h2>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fees Management</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                                        <Select value={selectedClassForFees} onValueChange={(val) => {
                                            setSelectedClassForFees(val);
                                            setSelectedStudentId(null);
                                            setBulkDailyPaymentsSelection({});
                                        }}>
                                            <SelectTrigger className="w-full md:w-[160px] h-10 rounded-xl border-primary/20 hover:bg-primary/5 transition-all font-bold text-xs">
                                                <SelectValue placeholder="All Classes" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                <SelectItem value="all" className="font-bold">All Classes</SelectItem>
                                                {uniqueClassNames.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                         {selectedClassForFees !== 'all' && feesActiveSubTab === 'records' && (
                                            <Button 
                                                onClick={handleOpenBulkFee}
                                                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 flex items-center gap-2 group transition-all"
                                            >
                                                <FilePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                Bulk Fee
                                            </Button>
                                        )}

                                        <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full md:w-[240px] justify-between h-10 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
                                                >
                                                    <span className="truncate font-bold text-xs">
                                                        {selectedStudentId
                                                            ? students.find((s) => s.studentId === selectedStudentId)?.name
                                                            : "Search Student..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[calc(100vw-2rem)] md:w-[320px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="end">
                                                <Command className="bg-white">
                                                    <CommandInput placeholder="Search student..." className="h-12" />
                                                    <CommandList className="max-h-[300px]">
                                                        <CommandEmpty>No student found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {filteredStudentsForFees.map((s) => (
                                                                <CommandItem
                                                                    key={s.studentId}
                                                                    value={`${s.name} ${s.studentId}`}
                                                                    onSelect={() => {
                                                                        setSelectedStudentId(s.studentId);
                                                                        setIsComboboxOpen(false);
                                                                    }}
                                                                    className="flex items-center justify-between py-3 px-4 cursor-pointer"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-sm">{s.name}</span>
                                                                        <span className="text-muted-foreground text-[10px]">ID: {s.studentId}</span>
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-[9px]">{s.className}</Badge>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        {selectedStudent && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    onClick={handleOpenRecordPayment}
                                                    className="h-10 px-4 rounded-xl font-bold gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                >
                                                    <Banknote className="w-4 h-4" /> <span>Payment</span>
                                                </Button>
                                                <Button 
                                                    onClick={handleOpenAddFee}
                                                    variant="outline"
                                                    className="h-10 px-4 rounded-xl font-bold gap-2 border-primary/20 hover:bg-primary/5 text-primary text-xs"
                                                >
                                                    <FilePlus className="w-4 h-4" /> <span>Fee</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {feesActiveSubTab === 'records' && (
                                    <div className="space-y-6 outline-none animate-in fade-in-50 duration-300">
                                    {selectedStudent && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center justify-between p-5 bg-blue-50/50 border-4 border-blue-500 rounded-2xl shadow-md transition-all hover:shadow-lg">
                                                <div>
                                                    <p className="text-label-caps text-blue-600/80 mb-0.5">Total Fees</p>
                                                    <p className="text-xl font-bold text-blue-900 text-numeric">GH¢{(ledgerTotals.billed || 0).toFixed(2)}</p>
                                                </div>
                                                <TrendingDown className="w-8 h-8 text-blue-500/30" />
                                            </div>
                                            <div className="flex items-center justify-between p-5 bg-emerald-50/50 border-4 border-emerald-500 rounded-2xl shadow-md transition-all hover:shadow-lg">
                                                <div>
                                                    <p className="text-label-caps text-emerald-600/80 mb-0.5">Total Paid</p>
                                                    <p className="text-xl font-bold text-emerald-900 text-numeric">GH¢{(ledgerTotals.paid || 0).toFixed(2)}</p>
                                                </div>
                                                <Banknote className="w-8 h-8 text-emerald-500/30" />
                                            </div>
                                            <div className={cn(
                                                "flex items-center justify-between p-5 border-4 rounded-2xl shadow-md transition-all hover:shadow-lg",
                                                ledgerTotals.balance > 0 ? "bg-red-50 border-red-500" : "bg-emerald-50 border-emerald-500"
                                            )}>
                                                <div>
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest mb-0.5",
                                                        ledgerTotals.balance > 0 ? "text-red-600/80" : "text-emerald-600/80"
                                                    )}>Balance Due</p>
                                                    <p className={cn(
                                                        "text-xl font-bold text-numeric",
                                                        ledgerTotals.balance > 0 ? "text-red-900" : "text-emerald-900"
                                                    )}>GH¢{(ledgerTotals.balance || 0).toFixed(2)}</p>
                                                </div>
                                                <Wallet className={cn(
                                                    "w-8 h-8",
                                                    ledgerTotals.balance > 0 ? "text-red-500/30" : "text-emerald-500/30"
                                                )} />
                                            </div>
                                        </div>
                                    )}

                                    {!selectedStudent ? (
                                        <div className="space-y-6">
                                            {selectedClassForFees !== 'all' ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight">
                                                                Class: {selectedClassForFees}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground font-medium">{filteredStudentsForFees.length} children found</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => setSelectedClassForFees('all')} className="text-xs font-bold text-primary hover:bg-primary/5 h-8">
                                                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Clear Filter
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {filteredStudentsForFees.map(student => (
                                                            <Card 
                                                                key={student.studentId} 
                                                                className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer group bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md rounded-2xl overflow-hidden" 
                                                                onClick={() => setSelectedStudentId(student.studentId)}
                                                            >
                                                                <CardContent className="p-4 flex items-center gap-4">
                                                                    <GradientAvatar name={student.name} src={student.profilePicture} size="md" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{student.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground truncate uppercase text-numeric tracking-tighter">ID: {student.studentId}</p>
                                                                    </div>
                                                                    <div className="p-2 rounded-xl bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                                        <Wallet className="h-4 w-4" />
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-32 border border-dashed rounded-[2rem] bg-muted/5 shadow-inner">
                                                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                                        <Search className="w-8 h-8 text-primary/40" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-muted-foreground">Select a class or student</h3>
                                                    <p className="text-xs text-muted-foreground/60 max-w-[250px] text-center mt-2 font-medium">Choose a class to see all children, or search by name to record fees.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6 pt-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-4">
                                                    {selectedClassForFees !== 'all' && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => setSelectedStudentId(null)}
                                                            className="h-8 px-2 text-primary font-bold hover:bg-primary/5"
                                                        >
                                                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                                                        </Button>
                                                    )}
                                                    <h3 className="text-label-caps">
                                                        <FileText className="w-4 h-4" /> Transaction History
                                                    </h3>
                                                </div>
                                                {!selectedStudent.ledger && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-[10px] font-black uppercase border-primary/30 hover:bg-primary hover:text-primary-foreground"
                                                        onClick={handleMigrateLedger}
                                                    >
                                                        <DatabaseZap className="w-3 h-3 mr-1.5" /> Initialize Ledger
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {(() => {
                                                // Build a set of all daily-fee category IDs so we can
                                                // exclude them from the Fee Category Records view.
                                                // They belong exclusively in the Daily Fee sub-tab.
                                                const dailyCategoryIds = new Set([
                                                    'feeding',
                                                    ...dailyFeeCategories.map(c => c.id),
                                                ]);

                                                const isFeeCategoryTransaction = (t: LedgerTransaction) =>
                                                    !dailyCategoryIds.has(t.category);

                                                const fullLedger = (selectedStudent.ledger || []).filter(isFeeCategoryTransaction);
                                                const sortedPeriods = [...academicPeriods].reverse();
                                                const currentPeriodIndex = sortedPeriods.findIndex(p => p.id === selectedPeriodId);
                                                
                                                const prevTransactions = fullLedger.filter(t => {
                                                    const tPeriodIndex = sortedPeriods.findIndex(p => p.id === t.periodId);
                                                    return tPeriodIndex < currentPeriodIndex && t.periodId !== selectedPeriodId;
                                                });
                                                
                                                const balanceBF = prevTransactions.reduce((sum, t) => sum + (t.isVoided ? 0 : (t.debit || 0) - (t.credit || 0)), 0);
                                                const currentLedger = fullLedger.filter(t => t.periodId === selectedPeriodId);
                                                
                                                const displayLedger = balanceBF !== 0 ? [
                                                    {
                                                        id: 'BF',
                                                        date: 'Opening',
                                                        description: 'Balance Brought Forward (Previous Terms)',
                                                        category: 'general',
                                                        debit: balanceBF > 0 ? balanceBF : 0,
                                                        credit: balanceBF < 0 ? Math.abs(balanceBF) : 0,
                                                        isVoided: false,
                                                        type: 'adjustment'
                                                    } as any,
                                                    ...currentLedger
                                                ] : currentLedger;

                                                return (
                                                    <LedgerTable 
                                                        ledger={displayLedger} 
                                                        onVoid={(id) => {
                                                            if (id === 'BF') return;
                                                            handleVoidTransaction(id);
                                                        }}
                                                        onEdit={handleOpenEditTransaction}
                                                        generateReceipt={generateReceipt}
                                                        schoolDetails={schoolDetails}
                                                        student={selectedStudent}
                                                        academicPeriods={academicPeriods}
                                                        feeCategories={allFeeCategories}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    )}
                                    </div>
                                )}

                                {feesActiveSubTab === 'daily' && (
                                    <div className="space-y-6 outline-none animate-in fade-in-50 duration-300">
                                        <div className="flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-primary/10 w-fit">
                                            <Button 
                                                variant={dailyFeeInternalTab === 'summary' ? 'default' : 'ghost'}
                                                onClick={() => setDailyFeeInternalTab('summary')}
                                                className={cn("h-9 rounded-xl font-bold text-xs px-6 transition-all", dailyFeeInternalTab === 'summary' && "shadow-lg shadow-primary/20")}
                                            >
                                                Summary View
                                            </Button>
                                            <Button 
                                                variant={dailyFeeInternalTab === 'record' ? 'default' : 'ghost'}
                                                onClick={() => setDailyFeeInternalTab('record')}
                                                className={cn("h-9 rounded-xl font-bold text-xs px-6 transition-all", dailyFeeInternalTab === 'record' && "shadow-lg shadow-primary/20")}
                                            >
                                                Record Daily Payments
                                            </Button>
                                        </div>

                                        {dailyFeeInternalTab === 'summary' ? (
                                    <Card className="border border-primary/10 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-heading-lg flex items-center gap-2">
                                                        <UtensilsCrossed className="w-6 h-6 text-primary" />
                                                        Daily Fee Usage Summary
                                                    </CardTitle>
                                                    <CardDescription className="font-medium">Total accumulated fees based on student attendance for the current term.</CardDescription>
                                                </div>
                                                 <div className="flex items-center gap-3">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-9 border-primary/20 hover:bg-primary/10 font-bold"
                                                        onClick={handleSyncAllDailyFees}
                                                        disabled={isSubmitting}
                                                    >
                                                        <RefreshCcw className={cn("w-4 h-4 mr-2 text-primary", isSubmitting && "animate-spin")} />
                                                        Re-sync All Fees
                                                    </Button>
                                                    <Badge variant="outline" className="bg-white font-black text-xs px-3 py-1 border-2 text-primary border-primary/20">
                                                        {dailyFeeSummary.length} Records
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow>
                                                        <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest pl-6">Student Name</TableHead>
                                                        <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Class</TableHead>
                                                        <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Fee Category</TableHead>
                                                        <TableHead className="text-center font-bold text-primary uppercase text-[10px] tracking-widest">Days Present</TableHead>
                                                        <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest">Daily Rate</TableHead>
                                                        <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest">Accrued</TableHead>
                                                        <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest">Paid</TableHead>
                                                        <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest">Balance</TableHead>
                                                        <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest pr-6">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dailyFeeSummary.length > 0 ? (
                                                        dailyFeeSummary.map((row, idx) => (
                                                            <TableRow key={`${row.studentName}-${row.categoryName}-${idx}`} className="hover:bg-primary/5 transition-colors border-primary/5">
                                                                <TableCell className="font-bold text-sm pl-6">{row.studentName}</TableCell>
                                                                <TableCell><Badge variant="secondary" className="text-[10px]">{row.className}</Badge></TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                                        <span className="text-sm font-medium">{row.categoryName}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center font-bold text-sm text-numeric">{row.daysPresent} Days</TableCell>
                                                                <TableCell className="text-right font-medium text-sm text-numeric">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {editingRateId === `${row.studentId}-${row.categoryId}` ? (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <Input 
                                                                                    autoFocus
                                                                                    type="number"
                                                                                    value={editingRateValue}
                                                                                    onChange={(e) => setEditingRateValue(e.target.value)}
                                                                                    className="w-24 h-8 text-right font-bold bg-white border-primary/30"
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') handleUpdateDailyRate(row.studentId, row.categoryId, Number(editingRateValue));
                                                                                        if (e.key === 'Escape') setEditingRateId(null);
                                                                                    }}
                                                                                />
                                                                                <Button 
                                                                                    size="icon" 
                                                                                    variant="ghost" 
                                                                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg" 
                                                                                    onClick={() => handleUpdateDailyRate(row.studentId, row.categoryId, Number(editingRateValue))}
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button 
                                                                                                size="icon" 
                                                                                                variant="ghost" 
                                                                                                className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                onClick={() => handleUpdateDailyRate(row.studentId, row.categoryId, row.dailyRate)}
                                                                                            >
                                                                                                <RefreshCcw className="w-3 h-3" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>Sync Billing with Attendance</TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                                <div 
                                                                                    className="flex items-center justify-end gap-2 cursor-pointer group hover:text-primary transition-all py-1"
                                                                                    onClick={() => {
                                                                                        setEditingRateId(`${row.studentId}-${row.categoryId}`);
                                                                                        setEditingRateValue(row.dailyRate.toString());
                                                                                    }}
                                                                                >
                                                                                    <span className="border-b border-dashed border-transparent group-hover:border-primary/30">GH¢{row.dailyRate.toFixed(2)}</span>
                                                                                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right font-bold text-sm text-numeric">GH¢{row.totalBilled.toFixed(2)}</TableCell>
                                                                <TableCell className="text-right font-medium text-sm text-numeric text-emerald-600">GH¢{row.totalPaid.toFixed(2)}</TableCell>
                                                                <TableCell className={`text-right font-black text-sm text-numeric ${row.balance >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                                                                    GH¢{row.balance.toFixed(2)}
                                                                </TableCell>
                                                                <TableCell className="text-right pr-6">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        onClick={() => handleOpenQuickDailyPayment(row.studentId, row.categoryName)}
                                                                        className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase gap-1.5"
                                                                    >
                                                                        <PlusCircle className="w-3 h-3" /> Pay
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="h-64 text-center">
                                                                <div className="flex flex-col items-center justify-center opacity-40">
                                                                    <Users className="w-12 h-12 mb-4" />
                                                                    <p className="font-bold">No daily fee records found for this period.</p>
                                                                    <p className="text-xs">Ensure attendance has been marked and daily rates are set for students.</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                        ) : (
                                            <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-card border border-primary/10 p-5 rounded-2xl shadow-sm">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">1. Select Category</Label>
                                            <Select value={selectedDailyCategoryForPayments} onValueChange={setSelectedDailyCategoryForPayments}>
                                                <SelectTrigger className="h-11 rounded-xl border-primary/20 bg-primary/5 font-bold">
                                                    <SelectValue placeholder="Choose daily category..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    <SelectItem value="feeding" className="font-bold">Feeding Fee</SelectItem>
                                                    {dailyFeeCategories.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">2. Select Date</Label>
                                            <Input 
                                                type="date" 
                                                className="h-11 rounded-xl border-primary/20 bg-primary/5 font-bold"
                                                value={selectedPaymentDate}
                                                onChange={(e) => setSelectedPaymentDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <Button 
                                                disabled={isSubmitting || !selectedDailyCategoryForPayments || Object.values(bulkDailyPaymentsSelection).filter(Boolean).length === 0}
                                                onClick={handleRecordDailyPayments}
                                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Record {Object.values(bulkDailyPaymentsSelection).filter(Boolean).length} Payments
                                            </Button>
                                        </div>
                                    </div>

                                    <Card className="border border-primary/10 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-heading-lg flex items-center gap-2">
                                                        <Banknote className="w-6 h-6 text-primary" />
                                                        Daily Payment Entry
                                                    </CardTitle>
                                                    <CardDescription className="font-medium">Check the students who paid for the selected date.</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="rounded-lg font-bold text-[10px] h-8 border-primary/20"
                                                        onClick={() => {
                                                            const newSelection: Record<string, boolean> = {};
                                                            filteredStudentsForFees.forEach(s => {
                                                                const category = dailyFeeCategories.find(c => c.id === selectedDailyCategoryForPayments) || { name: 'Feeding Fee', id: 'feeding' };
                                                                const hasPaid = s.ledger?.some(tx => 
                                                                    tx.date === selectedPaymentDate && 
                                                                    tx.type === 'payment' && 
                                                                    !tx.isVoided &&
                                                                    tx.category === category.name
                                                                ) || false;
                                                                if (!hasPaid) newSelection[s.studentId] = true;
                                                            });
                                                            setBulkDailyPaymentsSelection(newSelection);
                                                        }}
                                                    >
                                                        Select All Unpaid
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="rounded-lg font-bold text-[10px] h-8 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => {
                                                            const newSelection: Record<string, boolean> = {};
                                                            filteredStudentsForFees.forEach(s => {
                                                                const category = dailyFeeCategories.find(c => c.id === selectedDailyCategoryForPayments) || { name: 'Feeding Fee', id: 'feeding' };
                                                                const hasPaid = s.ledger?.some(tx => 
                                                                    tx.date === selectedPaymentDate && 
                                                                    tx.type === 'payment' && 
                                                                    !tx.isVoided &&
                                                                    tx.category === category.name
                                                                ) || false;
                                                                const attendance = s.attendance?.find(a => a.date === selectedPaymentDate);
                                                                const isPresent = attendance?.attended || false;
                                                                if (isPresent && !hasPaid) newSelection[s.studentId] = true;
                                                            });
                                                            setBulkDailyPaymentsSelection(newSelection);
                                                        }}
                                                    >
                                                        Select Present & Unpaid
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="rounded-lg font-bold text-[10px] h-8"
                                                        onClick={() => setBulkDailyPaymentsSelection({})}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-muted/30">
                                                        <TableRow>
                                                            <TableHead className="w-[50px] pl-6"></TableHead>
                                                            <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Student Name</TableHead>
                                                            <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Class</TableHead>
                                                            <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest">Assigned Rate</TableHead>
                                                            <TableHead className="text-right font-bold text-primary uppercase text-[10px] tracking-widest pr-6">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredStudentsForFees.length > 0 ? (
                                                            filteredStudentsForFees.map(student => {
                                                                let rate = 0;
                                                                const category = dailyFeeCategories.find(c => c.id === selectedDailyCategoryForPayments) || { name: 'Feeding Fee', id: 'feeding' };
                                                                
                                                                if (selectedDailyCategoryForPayments === 'feeding') {
                                                                    rate = Number(student.dailyFeedingCost) || 0;
                                                                } else {
                                                                    const df = student.dailyFees?.find(f => f.categoryId === selectedDailyCategoryForPayments);
                                                                    rate = Number(df?.rate) || 0;
                                                                }

                                                                const isSelected = bulkDailyPaymentsSelection[student.studentId] || false;
                                                                
                                                                // Check attendance for selected date
                                                                const attendance = student.attendance?.find(a => a.date === selectedPaymentDate);
                                                                const isPresent = attendance?.attended || false;
                                                                
                                                                // Check if already paid for this category on this date
                                                                const hasPaid = student.ledger?.some(tx => 
                                                                    tx.date === selectedPaymentDate && 
                                                                    tx.type === 'payment' && 
                                                                    !tx.isVoided &&
                                                                    tx.category === category.name
                                                                ) || false;

                                                                return (
                                                                    <TableRow key={student.studentId} className={cn(
                                                                        "hover:bg-primary/5 transition-colors border-primary/5",
                                                                        isSelected && "bg-primary/5",
                                                                        isPresent && !hasPaid && "bg-red-50/30"
                                                                    )}>
                                                                        <TableCell className="pl-6">
                                                                            <Checkbox 
                                                                                checked={isSelected}
                                                                                disabled={hasPaid}
                                                                                onCheckedChange={(checked) => {
                                                                                    setBulkDailyPaymentsSelection(prev => ({
                                                                                        ...prev,
                                                                                        [student.studentId]: !!checked
                                                                                    }));
                                                                                }}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className="font-bold text-sm">
                                                                            <div className="flex items-center gap-3">
                                                                                <GradientAvatar name={student.name} size="sm" />
                                                                                <div className="flex flex-col">
                                                                                    <span>{student.name}</span>
                                                                                    {isPresent ? (
                                                                                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Present</span>
                                                                                    ) : (
                                                                                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Absent / Not Marked</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell><Badge variant="secondary" className="text-[10px]">{student.className}</Badge></TableCell>
                                                                        <TableCell className="text-right font-bold text-sm text-numeric">
                                                                            {editingRateId === `${student.studentId}-${selectedDailyCategoryForPayments}` ? (
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    <Input 
                                                                                        autoFocus
                                                                                        type="number"
                                                                                        value={editingRateValue}
                                                                                        onChange={(e) => setEditingRateValue(e.target.value)}
                                                                                        className="w-20 h-8 text-right font-bold bg-white border-primary/30"
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') handleUpdateDailyRate(student.studentId, selectedDailyCategoryForPayments, Number(editingRateValue));
                                                                                            if (e.key === 'Escape') setEditingRateId(null);
                                                                                        }}
                                                                                    />
                                                                                    <Button 
                                                                                        size="icon" 
                                                                                        variant="ghost" 
                                                                                        className="h-8 w-8 text-emerald-600" 
                                                                                        onClick={() => handleUpdateDailyRate(student.studentId, selectedDailyCategoryForPayments, Number(editingRateValue))}
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div 
                                                                                    className="flex items-center justify-end gap-2 cursor-pointer group hover:text-primary transition-all py-1"
                                                                                    onClick={() => {
                                                                                        setEditingRateId(`${student.studentId}-${selectedDailyCategoryForPayments}`);
                                                                                        setEditingRateValue(rate.toString());
                                                                                    }}
                                                                                >
                                                                                    <span className="border-b border-dashed border-transparent group-hover:border-primary/30">GH¢{rate.toFixed(2)}</span>
                                                                                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-6">
                                                                            {hasPaid ? (
                                                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase border-none shadow-sm">Paid</Badge>
                                                                            ) : isPresent ? (
                                                                                <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase border-none shadow-sm animate-pulse">Unpaid</Badge>
                                                                            ) : (
                                                                                <Badge variant="outline" className="text-muted-foreground font-bold text-[10px] uppercase opacity-50">No Record</Badge>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="h-64 text-center">
                                                                    <div className="flex flex-col items-center justify-center opacity-40">
                                                                        <Users className="w-12 h-12 mb-4" />
                                                                        <p className="font-bold">No students found.</p>
                                                                        <p className="text-xs">Select a class to record daily fees.</p>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'attendance' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-heading-md">Daily Attendance</CardTitle>
                                    <CardDescription>Mark student attendance for {selectedAttendanceDateFormatted}.</CardDescription>
                                    <div className="pt-4 max-w-sm">
                                        <Label htmlFor="attendance-date">Change Date</Label>
                                        <Input
                                            id="attendance-date"
                                            type="date"
                                            value={selectedAttendanceDate}
                                            onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-8 w-1/4" />
                                            <Skeleton className="h-24 w-full" />
                                            <Skeleton className="h-8 w-1/4" />
                                            <Skeleton className="h-24 w-full" />
                                        </div>
                                    ) : Object.keys(studentsByClass).length === 0 ? (
                                         <div className="text-center py-12 px-4">
                                            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-medium">No Students Found</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">There are no students in the system.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {Object.keys(studentsByClass).sort().map(className => (
                                                <div key={className}>
                                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{className}</h2>
                                                    <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Student Name</TableHead>
                                                                <TableHead>Student ID</TableHead>
                                                                <TableHead className="text-center w-[120px]">Present</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {studentsByClass[className].map(student => {
                                                                const attendanceRecord = student.attendance?.find(a => a.date === selectedAttendanceDate);
                                                                const isAttended = !!attendanceRecord?.attended;
                                                                const studentIsSubmitting = isAttendanceSubmitting[student.studentId];
                                                                return (
                                                                    <TableRow key={student.studentId}>
                                                                        <TableCell className="font-medium">{student.name}</TableCell>
                                                                        <TableCell>{student.studentId}</TableCell>
                                                                        <TableCell className="text-center">
                                                                            {studentIsSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
                                                                            <Checkbox
                                                                                id={`att-${student.studentId}`}
                                                                                checked={isAttended}
                                                                                onCheckedChange={(checked) => handleToggleAttendance(student.studentId, !!checked)}
                                                                                className="h-5 w-5"
                                                                            />}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'finances' && (
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-heading-md flex items-center gap-2"><Wallet className="w-6 h-6"/> Financial Management</CardTitle>
                                    <CardDescription>Track school income, expenditures, and liabilities.</CardDescription>
                                </CardHeader>
                                 <CardContent>
                                    <Tabs defaultValue="summary" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2">
                                            <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
                                            <TabsTrigger value="income" className="text-xs sm:text-sm py-2">Income Analysis</TabsTrigger>
                                            <TabsTrigger value="expenditures" className="text-xs sm:text-sm py-2">Expenditures</TabsTrigger>
                                            <TabsTrigger value="daily_report" className="text-xs sm:text-sm py-2">Daily Fees Report</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="summary" className="mt-6">
                                            <Card className="bg-muted/30">
                                                <CardHeader><CardTitle className="text-heading-md">Overall Financial Summary</CardTitle></CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                                        <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Total Income</p><p className="text-2xl font-bold text-success text-numeric">GH¢{(overallTotals.totalIncome || 0).toFixed(2)}</p></div>
                                                        <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Total Expenditure</p><p className="text-2xl font-bold text-destructive text-numeric">GH¢{(overallTotals.totalExpenditure || 0).toFixed(2)}</p></div>
                                                        <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Net Savings / Loss</p><p className={`text-2xl font-bold ${overallTotals.netSavings >= 0 ? 'text-success' : 'text-destructive'} text-numeric`}>GH¢{(overallTotals.netSavings || 0).toFixed(2)}</p></div>
                                                        <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Total Debt</p><p className="text-2xl font-bold text-numeric">GH¢{(overallTotals.totalDebt || 0).toFixed(2)}</p></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="mt-6">
                                                <CardHeader><CardTitle className="text-heading-md">Manage Debts & Liabilities</CardTitle></CardHeader>
                                                <CardContent className="grid md:grid-cols-2 gap-8">
                                                     <Card>
                                                        <CardHeader><CardTitle className="text-heading-md flex items-center gap-2"><HandCoins className="w-5 h-5"/> Record a Debt</CardTitle></CardHeader>
                                                        <form onSubmit={handleAddDebt}>
                                                            <CardContent className="space-y-4">
                                                                <div className="space-y-2"><Label htmlFor="debt-creditor">Creditor</Label><Input id="debt-creditor" placeholder="e.g. ABC Bank" value={debtForm.creditor} onChange={e => setDebtForm({...debtForm, creditor: e.target.value})} required disabled={isSubmitting}/></div>
                                                                <div className="space-y-2"><Label htmlFor="debt-desc">Description</Label><Input id="debt-desc" placeholder="e.g. Loan for school bus" value={debtForm.description} onChange={e => setDebtForm({...debtForm, description: e.target.value})} required disabled={isSubmitting}/></div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2"><Label htmlFor="debt-amount">Amount (GH¢)</Label><Input id="debt-amount" type="number" placeholder="0.00" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                                                    <div className="space-y-2"><Label htmlFor="debt-date">Date Incurred</Label><Input id="debt-date" type="date" value={debtForm.date} onChange={e => setDebtForm({...debtForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                                                </div>
                                                            </CardContent>
                                                            <DialogFooter className="px-6 pb-6"><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Debt Record'}</Button></DialogFooter>
                                                        </form>
                                                    </Card>
                                                     <Card>
                                                        <CardHeader><CardTitle className="text-heading-md">Debt History</CardTitle></CardHeader>
                                                        <CardContent>
                                                            {isLoading ? <Skeleton className="h-40 w-full" /> : 
                                                            debts.length === 0 ? <p className="text-center text-muted-foreground py-8">No debts recorded.</p> : (
                                                                <div className="overflow-x-auto">
                                                                <Table><TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                                                    <TableBody>
                                                                        {debts.map(debt => (
                                                                            <TableRow key={debt.id}>
                                                                                <TableCell><div className="font-medium">{debt.creditor}</div><div className="text-xs text-muted-foreground">{debt.description} &bull; {new Date(debt.date).toLocaleDateString('en-GB')}</div></TableCell>
                                                                                <TableCell className="text-right text-numeric">GH¢{debt.amount.toFixed(2)}</TableCell>
                                                                                <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteDebt(debt)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="income" className="mt-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-heading-md">Income Analysis by Category</CardTitle>
                                                    <CardDescription>Breakdown of billed, accrued, and paid amounts for all fee types.</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Category</TableHead>
                                                                <TableHead className="text-right">Billed (Termly)</TableHead>
                                                                <TableHead className="text-right">Accrued (Daily)</TableHead>
                                                                <TableHead className="text-right">Total Paid</TableHead>
                                                                <TableHead className="text-right">Arrears</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(overallTotals.byCategory).map(([name, data]) => {
                                                                const totalExpected = data.billed + data.accrued;
                                                                const arrears = Math.max(0, totalExpected - data.paid);
                                                                return (
                                                                    <TableRow key={name}>
                                                                        <TableCell className="font-medium">{name}</TableCell>
                                                                        <TableCell className="text-right text-numeric">GH¢{data.billed.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right text-numeric">GH¢{data.accrued.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right text-numeric text-success font-bold">GH¢{data.paid.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right text-numeric text-destructive font-bold">GH¢{arrears.toFixed(2)}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="expenditures" className="mt-6">
                                            <div className="space-y-6">
                                                <ExpenditureSection 
                                                    title="General Expenditures"
                                                    description="Track spending related to general school operations like salaries, utilities, and supplies."
                                                    expenditureType="General"
                                                    income={incomeTotals.General || 0}
                                                    totalExpenditure={expenditureTotals.General || 0}
                                                    expenditures={expenditures.filter(e => e.type === 'General')}
                                                    categories={generalExpenditureCategories}
                                                    onAddExpenditure={handleAddExpenditure}
                                                    onDeleteExpenditure={handleDeleteExpenditure}
                                                    formState={{ expenditureForm, setExpenditureForm }}
                                                    isSubmitting={isSubmitting}
                                                />
                                                <ExpenditureSection 
                                                    title="Feeding Program Expenditures"
                                                    description="Track all spending related to the school's feeding program."
                                                    expenditureType="Feeding"
                                                    income={incomeTotals.Feeding || 0}
                                                    totalExpenditure={expenditureTotals.Feeding || 0}
                                                    expenditures={expenditures.filter(e => e.type === 'Feeding')}
                                                    categories={feedingExpenditureCategories}
                                                    onAddExpenditure={handleAddExpenditure}
                                                    onDeleteExpenditure={handleDeleteExpenditure}
                                                    formState={{ expenditureForm, setExpenditureForm }}
                                                    isSubmitting={isSubmitting}
                                                />
                                                <ExpenditureSection 
                                                    title="Transportation Expenditures"
                                                    description="Track all spending related to school transportation, like fuel and maintenance."
                                                    expenditureType="Transportation"
                                                    income={incomeTotals.Transportation || 0}
                                                    totalExpenditure={expenditureTotals.Transportation || 0}
                                                    expenditures={expenditures.filter(e => e.type === 'Transportation')}
                                                    categories={transportationExpenditureCategories}
                                                    onAddExpenditure={handleAddExpenditure}
                                                    onDeleteExpenditure={handleDeleteExpenditure}
                                                    formState={{ expenditureForm, setExpenditureForm }}
                                                    isSubmitting={isSubmitting}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="daily_report" className="mt-6">
                                            <Card>
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <CardTitle className="text-heading-md">Daily Fees Accrual Report</CardTitle>
                                                            <CardDescription>Detailed report of daily fees (Feeding, etc.) accrued based on attendance.</CardDescription>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Filter Class:</Label>
                                                            <Select value={selectedClassForFees} onValueChange={setSelectedClassForFees}>
                                                                <SelectTrigger className="w-[150px] h-8 text-xs">
                                                                    <SelectValue placeholder="All Classes" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">All Classes</SelectItem>
                                                                    {classes.map(c => (
                                                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Student</TableHead>
                                                                    <TableHead>Class</TableHead>
                                                                    <TableHead>Fee Type</TableHead>
                                                                    <TableHead className="text-right">Days</TableHead>
                                                                    <TableHead className="text-right">Rate</TableHead>
                                                                    <TableHead className="text-right">Accrued</TableHead>
                                                                    <TableHead className="text-right">Paid</TableHead>
                                                                    <TableHead className="text-right">Credit/Arrears</TableHead>
                                                                    <TableHead className="text-right">Status</TableHead>
                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {dailyFeeSummary.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No daily fee records for the selected period/class.</TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    dailyFeeSummary.map((item, idx) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell className="font-medium">{item.studentName}</TableCell>
                                                                            <TableCell>{item.className}</TableCell>
                                                                            <TableCell>{item.categoryName}</TableCell>
                                                                            <TableCell className="text-right">{item.daysPresent}</TableCell>
                                                                            <TableCell className="text-right text-numeric">GH¢{item.dailyRate.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right text-numeric">GH¢{item.totalBilled.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right text-numeric text-emerald-600 font-medium">GH¢{item.totalPaid.toFixed(2)}</TableCell>
                                                                            <TableCell className={`text-right text-numeric font-bold ${item.balance >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                                                                                {item.balance >= 0 ? `+GH¢${item.balance.toFixed(2)}` : `-GH¢${Math.abs(item.balance).toFixed(2)}`}
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Badge variant="outline" className={item.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : item.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' : 'bg-destructive/10 text-destructive border-destructive/20 font-bold'}>
                                                                                    {item.status === 'Paid' && item.balance > 0 ? 'Pre-paid' : item.status}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="sm" 
                                                                                    onClick={() => handleOpenQuickDailyPayment(item.studentId, item.categoryName)}
                                                                                    className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase gap-1"
                                                                                >
                                                                                    <PlusCircle className="w-3 h-3" /> Pay
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
                                        </TabsContent>
                                    </Tabs>
                                 </CardContent>
                            </Card>
                        )}

                        {activeTab === 'staff' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="border-4 border-primary">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-heading-md uppercase text-primary/60">Total Staff</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{staffIds.length}</div>
                                            <p className="text-xs text-muted-foreground">{staffIds.filter(s => s.role === 'Teacher' || s.role === 'Assistant Teacher').length} Teaching • {staffIds.filter(s => s.role !== 'Teacher' && s.role !== 'Assistant Teacher').length} Support</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-4 border-emerald-600">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-heading-md uppercase text-emerald-600/60">Monthly Payroll</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold text-emerald-600">GH¢{staffIds.reduce((sum, s) => sum + (staffDetails.find(d => d.id === s.id)?.salary || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            <p className="text-xs text-muted-foreground">Estimated total monthly expenditure</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-4 border-amber-600">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-heading-md uppercase text-amber-600/60">Active Roles</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{new Set(staffIds.map(s => s.role)).size}</div>
                                            <p className="text-xs text-muted-foreground">Distinct job categories</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-6">
                                    <Card className="border-2 shadow-lg h-fit">
                                        <CardHeader>
                                            <CardTitle className="text-heading-md flex items-center gap-2">
                                                {editingStaffId ? <Edit className="w-5 h-5"/> : <UserPlus className="w-5 h-5"/>} 
                                                {editingStaffId ? 'Edit Staff Details' : 'Register Staff'}
                                            </CardTitle>
                                            <CardDescription>{editingStaffId ? 'Update information for this employee.' : 'Enter details to add a new employee.'}</CardDescription>
                                        </CardHeader>
                                        <form onSubmit={handleAddStaff}>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-name" className="text-xs font-bold uppercase">Full Name</Label>
                                                    <Input id="add-staff-name" placeholder="e.g. John Doe" className="border-2" value={addStaffForm.name} onChange={e => setAddStaffForm({ ...addStaffForm, name: e.target.value })} required disabled={isSubmitting}/>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="add-staff-role" className="text-xs font-bold uppercase">Role</Label>
                                                        <Select value={addStaffForm.role} onValueChange={(val: StaffRole) => setAddStaffForm({...addStaffForm, role: val})} disabled={isSubmitting}>
                                                            <SelectTrigger id="add-staff-role" className="border-2">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {STAFF_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="add-staff-id" className="text-xs font-bold uppercase">Staff ID</Label>
                                                        <Input id="add-staff-id" placeholder="Optional" className="border-2" value={addStaffForm.id} onChange={e => setAddStaffForm({ ...addStaffForm, id: e.target.value.toUpperCase() })} disabled={isSubmitting}/>
                                                    </div>
                                                </div>

                                                {(addStaffForm.role === 'Teacher' || addStaffForm.role === 'Assistant Teacher') && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                                        <Label htmlFor="add-staff-class" className="text-xs font-bold uppercase">Assigned Class</Label>
                                                        <Input
                                                            id="add-staff-class"
                                                            list="staff-class-list"
                                                            placeholder="Select or type a class"
                                                            className="border-2"
                                                            value={addStaffForm.className || ''}
                                                            onChange={e => setAddStaffForm({ ...addStaffForm, className: e.target.value })}
                                                            disabled={isSubmitting}
                                                        />
                                                        <datalist id="staff-class-list">
                                                            {uniqueClassNames.map(name => <option key={name} value={name} />)}
                                                        </datalist>
                                                        <p className="text-[10px] text-muted-foreground">You can type a new class name or select from existing ones.</p>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-phone" className="text-xs font-bold uppercase">Phone Number</Label>
                                                    <Input id="add-staff-phone" type="tel" placeholder="024XXXXXXX" className="border-2" value={addStaffForm.phone} onChange={e => setAddStaffForm({ ...addStaffForm, phone: e.target.value })} disabled={isSubmitting}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-email" className="text-xs font-bold uppercase">Email Address</Label>
                                                    <Input id="add-staff-email" type="email" placeholder="staff@example.com" className="border-2" value={addStaffForm.email} onChange={e => setAddStaffForm({ ...addStaffForm, email: e.target.value })} disabled={isSubmitting}/>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex gap-2">
                                                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary font-bold uppercase tracking-widest h-12">
                                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : (editingStaffId ? <><Save className="mr-2 h-4 w-4" /> Save Changes</> : <><UserPlus className="mr-2 h-4 w-4" /> Add to System</>)}
                                                </Button>
                                                {editingStaffId && (
                                                    <Button type="button" variant="outline" className="h-12" onClick={() => {
                                                        setEditingStaffId(null);
                                                        setAddStaffForm({ name: '', role: 'Teacher', id: '', className: '', phone: '', email: '' });
                                                    }}>Cancel</Button>
                                                )}
                                            </CardFooter>
                                        </form>
                                    </Card>

                                    <Card className="lg:col-span-2 border-2 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle className="text-heading-md">Active Personnel</CardTitle>
                                                <CardDescription>Manage your current staff members.</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Search className="w-4 h-4 text-muted-foreground" />
                                                <Input placeholder="Search staff..." className="w-48 h-8 text-sm" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-hidden rounded-xl border">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead className="font-bold uppercase text-[10px]">Staff Profile</TableHead>
                                                            <TableHead className="font-bold uppercase text-[10px]">Role/Class</TableHead>
                                                            <TableHead className="font-bold uppercase text-[10px]">Contact Info</TableHead>
                                                            <TableHead className="font-bold uppercase text-[10px]">Salary</TableHead>
                                                            <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {staffIds.length === 0 ? (
                                                            <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No staff found.</TableCell></TableRow>
                                                        ) : (
                                                            staffIds.map((staff) => {
                                                            const details = staffDetails.find(d => d.id === staff.id);
                                                            return (
                                                                <TableRow key={staff.id} className="hover:bg-muted/30">
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-3">
                                                                            <GradientAvatar name={staff.name} size="sm" />
                                                                            <div>
                                                                                <p className="font-bold text-sm leading-none">{staff.name}</p>
                                                                                <p className="text-[10px] text-muted-foreground text-numeric mt-1">{staff.id}</p>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className={cn(
                                                                            "font-bold uppercase text-[9px] border-2",
                                                                            (staff.role === 'Teacher' || staff.role === 'Assistant Teacher') ? "border-blue-200 text-blue-700 bg-blue-50" :
                                                                            staff.role === 'Administrator' ? "border-purple-200 text-purple-700 bg-purple-50" : "border-gray-200"
                                                                        )}>
                                                                            {staff.role} {staff.className ? `(${staff.className})` : ''}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                         <div className="space-y-1">
                                                                             {staff.phone && (
                                                                                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                     <Phone className="w-3 h-3" />
                                                                                     <span>{staff.phone}</span>
                                                                                 </div>
                                                                             )}
                                                                             {staff.email && (
                                                                                 <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                                     <Mail className="w-3 h-3" />
                                                                                     <span className="truncate max-w-[120px]">{staff.email}</span>
                                                                                 </div>
                                                                             )}
                                                                             {!staff.phone && !staff.email && <span className="text-muted-foreground italic text-[10px]">No contact info</span>}
                                                                         </div>
                                                                     </TableCell>
                                                                    <TableCell>
                                                                        <div className="font-bold text-sm">
                                                                            {details?.salary ? `GH¢${details.salary.toFixed(2)}` : <span className="text-muted-foreground italic font-normal text-xs">Not Set</span>}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                 <DropdownMenuItem onClick={() => {
                                                                                    setEditingStaffId(staff.id);
                                                                                    setAddStaffForm({
                                                                                        name: staff.name || '',
                                                                                        role: staff.role || 'Teacher',
                                                                                        id: staff.id,
                                                                                        className: staff.className || '',
                                                                                        phone: staff.phone || '',
                                                                                        email: staff.email || ''
                                                                                    });
                                                                                }}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => handleOpenSalaryDialog(staff)}><DollarSign className="mr-2 h-4 w-4" /> Set Salary</DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleArchiveStaff(staff)}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })
                                                        )}
                                                    </TableBody>
                                                    </Table>
                                                    </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                        )}

                        {activeTab === 'calendar' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-heading-md flex items-center gap-2"><CalendarDays className="w-6 h-6"/> School Calendar</CardTitle>
                                    <CardDescription>Manage important dates for the school term.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle className="text-heading-md">Add New Event</CardTitle></CardHeader>
                                            <form onSubmit={handleAddCalendarEvent}>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event-title">Event Title</Label>
                                                        <Input id="event-title" placeholder="e.g. Mid-term Break" value={calendarEventForm.title} onChange={e => setCalendarEventForm({...calendarEventForm, title: e.target.value})} required disabled={isSubmitting} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="event-date">Date</Label>
                                                            <Input id="event-date" type="date" value={calendarEventForm.date} onChange={e => setCalendarEventForm({...calendarEventForm, date: e.target.value})} required disabled={isSubmitting} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="event-type">Event Type</Label>
                                                            <Select value={calendarEventForm.type} onValueChange={(value: 'Event' | 'Holiday' | 'Exam') => setCalendarEventForm({...calendarEventForm, type: value})} required disabled={isSubmitting}>
                                                                <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Event">Event</SelectItem>
                                                                    <SelectItem value="Holiday">Holiday</SelectItem>
                                                                    <SelectItem value="Exam">Exam</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event-description">Description (Optional)</Label>
                                                        <Textarea id="event-description" placeholder="Additional details about the event..." value={calendarEventForm.description} onChange={e => setCalendarEventForm({...calendarEventForm, description: e.target.value})} disabled={isSubmitting}/>
                                                    </div>
                                                </CardContent>
                                                <DialogFooter className="px-6 pb-6">
                                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                        {isSubmitting ? <><Loader2 className="animate-spin" /> Adding Event...</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Event to Calendar</>}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </Card>
                                    </div>
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle className="text-heading-md">Upcoming Events</CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="divide-y divide-border">
                                                    {calendarEvents.length === 0 ? (
                                                        <p className="text-center text-muted-foreground py-8">No calendar events found.</p>
                                                    ) : (
                                                        calendarEvents.map(event => (
                                                             <div key={event.id} className="p-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-4">
                                                                <div>
                                                                    <p className="font-medium">{event.title}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                                <Badge variant={
                                                                    event.type === 'Holiday' ? 'destructive' :
                                                                    event.type === 'Exam' ? 'secondary' : 'default'
                                                                }>{event.type}</Badge>
                                                                <div className="self-center">
                                                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteEvent(event)} disabled={isSubmitting}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'communication' && (
                            <div className="space-y-6">
                                <Card className="max-w-3xl mx-auto border-4 border-primary">
                                    <CardHeader>
                                        <CardTitle className="text-heading-md flex items-center gap-2"><Send className="w-6 h-6"/> Communication Center</CardTitle>
                                        <CardDescription>Send announcements to parents. They will appear on the parent's dashboard and can optionally be sent as an SMS.</CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleSendMessage}>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="recipient">Recipient</Label>
                                                <Select name="recipient" value={communicationForm.recipient} onValueChange={(value) => setCommunicationForm({...communicationForm, recipient: value})} required disabled={isSubmitting}>
                                                    <SelectTrigger id="recipient" className="border-2">
                                                        <SelectValue placeholder="Select a recipient" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Parents</SelectItem>
                                                        {students.map(student => (
                                                            <SelectItem key={student.studentId} value={student.studentId}>
                                                                Parent of {student.name} ({student.studentId})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject</Label>
                                                <Input id="subject" placeholder="e.g. Upcoming School Event" className="border-2" value={communicationForm.subject} onChange={e => setCommunicationForm({...communicationForm, subject: e.target.value})} required disabled={isSubmitting}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea id="message" placeholder="Type your announcement here..." className="border-2" rows={5} value={communicationForm.message} onChange={e => setCommunicationForm({...communicationForm, message: e.target.value})} required disabled={isSubmitting}/>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Checkbox 
                                                    id="sendAsSMS" 
                                                    checked={communicationForm.sendAsSMS} 
                                                    onCheckedChange={(checked) => setCommunicationForm({...communicationForm, sendAsSMS: !!checked})}
                                                    disabled={isSubmitting}
                                                />
                                                <label
                                                    htmlFor="sendAsSMS"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Send as SMS
                                                </label>
                                            </div>
                                        </CardContent>
                                        <DialogFooter className="px-6 pb-6">
                                            <Button type="submit" className="w-full font-black uppercase tracking-widest" disabled={isSubmitting}>
                                                {isSubmitting ? <><Loader2 className="animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Announcement</>}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Card>

                                <Card className="max-w-3xl mx-auto border-2">
                                    <CardHeader>
                                        <CardTitle className="text-heading-md font-headline">Recent Announcements</CardTitle>
                                        <CardDescription>View and manage previously sent messages.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {announcements.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground italic">No announcements sent yet.</div>
                                            ) : announcements.map((announcement) => (
                                                <div key={announcement.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-sm">{announcement.subject}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-lg">{announcement.message}</p>
                                                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-tighter text-primary/60 pt-1">
                                                            <span>To: {announcement.recipient === 'all' ? 'All Parents' : announcement.recipient.startsWith('class:') ? announcement.recipient.split(':')[1] : `Parent (${announcement.recipient})`}</span>
                                                            <span>•</span>
                                                            <span>{announcement.date.toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                        onClick={() => setAnnouncementToDelete(announcement)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        
                        {activeTab === 'archive' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-heading-md flex items-center gap-2"><Archive className="w-6 h-6"/> Archive</CardTitle>
                                    <CardDescription>View archived students and staff. You can restore them or delete them permanently.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="archived-students" className="w-full">
                                         <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="archived-students">Archived Students</TabsTrigger>
                                            <TabsTrigger value="archived-staff">Archived Staff</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="archived-students" className="mt-6">
                                            <Card>
                                                <CardHeader><CardTitle className="text-heading-md">Archived Student List</CardTitle></CardHeader>
                                                <CardContent>
                                                    {isLoading ? <Skeleton className="h-40 w-full" /> : 
                                                    archivedStudents.length === 0 ? <p className="text-center text-muted-foreground py-8">No students have been archived.</p> : (
                                                        <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                            <TableBody>
                                                                {archivedStudents.map(student => (
                                                                    <TableRow key={student.studentId}>
                                                                        <TableCell>
                                                                            <div className="font-medium">{student.name}</div>
                                                                            <div className="text-xs text-muted-foreground">{student.studentId}</div>
                                                                        </TableCell>
                                                                        <TableCell>{student.className}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleRestoreStudent(student.studentId)} disabled={isSubmitting}><ArchiveRestore className="mr-2 h-4 w-4"/> Restore</Button>
                                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student)} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                         <TabsContent value="archived-staff" className="mt-6">
                                            <Card>
                                                <CardHeader><CardTitle className="text-heading-md">Archived Staff List</CardTitle></CardHeader>
                                                <CardContent>
                                                    {isLoading ? <Skeleton className="h-40 w-full" /> :
                                                    archivedStaff.length === 0 ? <p className="text-center text-muted-foreground py-8">No staff have been archived.</p> : (
                                                        <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader><TableRow><TableHead>Staff Member</TableHead><TableHead>Assigned Class</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                            <TableBody>
                                                                {archivedStaff.map(staff => (
                                                                    <TableRow key={staff.id}>
                                                                        <TableCell>
                                                                            <p className="font-medium">{staff.name}</p>
                                                                            <p className="text-sm text-muted-foreground text-numeric">{staff.id}</p>
                                                                        </TableCell>
                                                                        <TableCell>{staff.className}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleRestoreStaff(staff.id)} disabled={isSubmitting}><ArchiveRestore className="mr-2 h-4 w-4"/> Restore</Button>
                                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteStaff(staff)} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'academic-reports' && (
                            <AcademicReportsTab schoolId={schoolId} />
                        )}

                        {activeTab === 'settings' && (
                            <div className="max-w-4xl mx-auto">
                                <Card className="mb-8 border-amber-200 bg-amber-50/30">
                                    <CardHeader>
                                        <CardTitle className="text-heading-md flex items-center gap-2 text-amber-800"><ShieldCheck className="w-6 h-6"/> Security Settings</CardTitle>
                                        <CardDescription>Protect your sensitive gateway credentials with a security PIN. This PIN will be required to access this settings tab in the future.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="max-w-xs space-y-2">
                                            <Label htmlFor="settingsPin">4-Digit Security PIN</Label>
                                            <Input 
                                                id="settingsPin" 
                                                type="password"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={4}
                                                placeholder={schoolDetails?.settingsPin ? "****" : "Set 4-digit PIN"} 
                                                value={schoolSettingsForm.settingsPin || ''} 
                                                onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, settingsPin: e.target.value })} 
                                                disabled={isSubmitting} 
                                                className="text-lg tracking-widest"
                                            />
                                            <p className="text-xs text-muted-foreground">Keep this PIN safe. It prevents unauthorized access to your API keys.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mb-8 border-green-200 bg-green-50/30">
                                    <CardHeader>
                                        <CardTitle className="text-heading-md flex items-center gap-2 text-green-800"><Send className="w-6 h-6"/> SMS Gateway Settings (Sendexa)</CardTitle>
                                        <CardDescription>Enter your Sendexa API credentials to send manual and automated SMS announcements.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sendexaApiToken">API TOKEN (BASE64)</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="sendexaApiToken" 
                                                    type={showSendexaSecret ? "text" : "password"}
                                                    placeholder="Your Sendexa API Token" 
                                                    value={schoolSettingsForm.sendexaApiToken || ''} 
                                                    onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, sendexaApiToken: e.target.value })} 
                                                    disabled={isSubmitting} 
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSendexaSecret(!showSendexaSecret)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showSendexaSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sendexaSenderId">Sendexa Sender ID</Label>
                                            <Input 
                                                id="sendexaSenderId" 
                                                placeholder="Your Sender ID (e.g. ZipSMA)" 
                                                value={schoolSettingsForm.sendexaSenderId || ''} 
                                                onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, sendexaSenderId: e.target.value })} 
                                                disabled={isSubmitting} 
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mb-8 border-blue-200 bg-blue-50/30">
                                    <CardHeader>
                                        <CardTitle className="text-heading-md flex items-center gap-2 text-blue-800"><Wallet className="w-6 h-6"/> Payment Gateway Settings (Hubtel)</CardTitle>
                                        <CardDescription>Configure your Hubtel Merchant credentials to enable online fee payments for parents.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hubtelMerchantNumber">Merchant Account Number</Label>
                                                <Input 
                                                    id="hubtelMerchantNumber" 
                                                    placeholder="HM..." 
                                                    value={schoolSettingsForm.hubtelMerchantNumber || ''} 
                                                    onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, hubtelMerchantNumber: e.target.value })} 
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hubtelClientId">Client ID</Label>
                                                <Input 
                                                    id="hubtelClientId" 
                                                    placeholder="Your Client ID" 
                                                    value={schoolSettingsForm.hubtelClientId || ''} 
                                                    onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, hubtelClientId: e.target.value })} 
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hubtelClientSecret">Client Secret</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="hubtelClientSecret" 
                                                    type={showSecretKey ? "text" : "password"}
                                                    placeholder="Your Client Secret" 
                                                    value={schoolSettingsForm.hubtelClientSecret || ''} 
                                                    onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, hubtelClientSecret: e.target.value })} 
                                                    disabled={isSubmitting} 
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-heading-md flex items-center gap-2"><Settings className="w-6 h-6"/> School Information</CardTitle>
                                        <CardDescription>Manage your school's public details and payment information.</CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleSaveSchoolSettings}>
                                        <CardContent className="space-y-8">
                                            <div className="space-y-4">
                                                <Label>School Logo</Label>
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-20 w-20">
                                                        <AvatarImage src={logoPreview || undefined} alt="School Logo" />
                                                        <AvatarFallback><SchoolIcon /></AvatarFallback>
                                                    </Avatar>
                                                    <Label htmlFor="edit-logo" className="cursor-pointer flex items-center gap-2 border p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                                                        <Upload className="h-4 w-4" />
                                                        <span>Change Logo</span>
                                                    </Label>
                                                    <Input id="edit-logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="schoolName">School Name</Label>
                                                    <Input id="schoolName" value={schoolSettingsForm.name} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, name: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="schoolPhone">School Phone Number</Label>
                                                    <Input id="schoolPhone" type="tel" placeholder="e.g. 0302123456" value={schoolSettingsForm.schoolPhone} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, schoolPhone: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="schoolEmail">School Email</Label>
                                                <Input id="schoolEmail" type="email" placeholder="e.g. info@yourschool.com" value={schoolSettingsForm.schoolEmail} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, schoolEmail: e.target.value })} disabled={isSubmitting} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                 <div className="space-y-2">
                                                    <Label htmlFor="momoName">Mobile Money (MoMo) Name</Label>
                                                    <Input id="momoName" placeholder="e.g. John Doe" value={schoolSettingsForm.momoName} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, momoName: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="momoNumber">Mobile Money (MoMo) Number</Label>
                                                    <Input id="momoNumber" type="tel" placeholder="e.g. 0244123456" value={schoolSettingsForm.momoNumber} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, momoNumber: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <Label>Bank Account Details</Label>
                                                <div className="space-y-4">
                                                    {schoolSettingsForm.bankAccounts.map((account, index) => (
                                                        <div key={account.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 border rounded-md relative">
                                                            <div className="space-y-2"><Label htmlFor={`bankName-${index}`}>Bank Name</Label><Input id={`bankName-${index}`} value={account.bankName} onChange={(e) => handleBankAccountChange(index, 'bankName', e.target.value)} placeholder="e.g. GCB Bank" disabled={isSubmitting}/></div>
                                                            <div className="space-y-2"><Label htmlFor={`accountName-${index}`}>Account Name</Label><Input id={`accountName-${index}`} value={account.accountName} onChange={(e) => handleBankAccountChange(index, 'accountName', e.target.value)} placeholder="e.g. ZipSMA School" disabled={isSubmitting}/></div>
                                                            <div className="space-y-2"><Label htmlFor={`accountNumber-${index}`}>Account Number</Label><Input id={`accountNumber-${index}`} value={account.accountNumber} onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)} placeholder="e.g. 1234567890123" disabled={isSubmitting}/></div>
                                                            <Button type="button" variant="ghost" size="icon" className="text-destructive self-end mb-1" onClick={() => removeBankAccount(index)} disabled={isSubmitting}><Trash2 /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button type="button" variant="outline" size="sm" onClick={addBankAccount} className="mt-2" disabled={isSubmitting}><PlusCircle className="mr-2"/> Add Bank Account</Button>
                                            </div>
                                        </CardContent>
                                        <DialogFooter className="px-6 pb-6">
                                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                {isSubmitting ? <><Loader2 className="animate-spin" /> Saving Settings...</> : 'Save School Information'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Card>

                                <div className="mt-8">
                                    <FeesReminderSettings schoolId={schoolId || ''} />
                                </div>

                                <Card className="mt-8 border-2 shadow-lg overflow-hidden group">
                                    <CardHeader className="bg-primary/5 border-b-2 border-primary/10 py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-heading-lg flex items-center gap-2">
                                                    <DollarSign className="w-6 h-6 text-primary" />
                                                    Fee Category Library
                                                </CardTitle>
                                                <CardDescription className="font-medium">Define and manage custom fee types for your school ledger.</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-white font-black text-xs px-3 py-1 border-2">
                                                {feeCategories.length} Categories
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="flex gap-3 max-w-2xl">
                                            <div className="relative flex-1">
                                                <Input 
                                                    placeholder="New Category Name (e.g. Uniform Fees)" 
                                                    value={newCategoryName} 
                                                    onChange={e => setNewCategoryName(e.target.value)} 
                                                    className="h-14 border-2 pl-12 rounded-2xl font-bold bg-muted/20 focus:bg-white transition-all"
                                                    onKeyDown={e => e.key === 'Enter' && handleConfirmAddCategory()}
                                                />
                                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                            </div>
                                            <Button 
                                                onClick={handleConfirmAddCategory} 
                                                disabled={isSubmitting || !newCategoryName.trim()} 
                                                className="h-14 px-8 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                                                Add
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {feeCategories.map(cat => (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={cat.id} 
                                                    className="flex items-center justify-between p-5 rounded-2xl border-2 bg-white hover:border-primary/30 hover:shadow-md transition-all group/item"
                                                >
                                                    {editingCategoryId === cat.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                autoFocus
                                                                value={editingCategoryName}
                                                                onChange={e => setEditingCategoryName(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditCategory(cat.id); if (e.key === 'Escape') { setEditingCategoryId(null); setEditingCategoryName(''); } }}
                                                                className="h-9 flex-1 font-bold"
                                                            />
                                                            <Button size="icon" className="h-9 w-9 rounded-xl" onClick={() => handleSaveEditCategory(cat.id)} disabled={isSubmitting}>
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}>
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                                                    <Package className="w-6 h-6" />
                                                                </div>
                                                                <span className="font-bold text-sm tracking-tight capitalize">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl" onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}>
                                                                                <Pencil className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Edit Category</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleConfirmDeleteCategory(cat.id, cat.name)}>
                                                                                <Trash2 className="w-5 h-5" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Delete Category</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {feeCategories.length === 0 && (
                                                <div className="col-span-full py-16 text-center border-4 border-dashed rounded-[2.5rem] bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <DatabaseZap className="w-8 h-8 text-muted-foreground/40" />
                                                    </div>
                                                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No Custom Categories Defined</p>
                                                    <p className="text-muted-foreground/60 text-sm mt-1 font-medium">Add your first category using the field above.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-8 border-2 shadow-lg overflow-hidden group">
                                    <CardHeader className="bg-amber-500/5 border-b-2 border-amber-500/10 py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-heading-lg flex items-center gap-2">
                                                    <Bus className="w-6 h-6 text-amber-600" />
                                                    Daily Fee Category Library
                                                </CardTitle>
                                                <CardDescription className="font-medium">Define fees calculated per day of attendance (e.g. Afternoon Care, Lunch).</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-white font-black text-xs px-3 py-1 border-2 text-amber-600 border-amber-200">
                                                {dailyFeeCategories.length} Categories
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="flex gap-3 max-w-2xl">
                                            <div className="relative flex-1">
                                                <Input 
                                                    placeholder="New Daily Category (e.g. Lunch Fee)" 
                                                    value={newDailyCategoryName} 
                                                    onChange={e => setNewDailyCategoryName(e.target.value)} 
                                                    className="h-14 border-2 pl-12 rounded-2xl font-bold bg-muted/20 focus:bg-white transition-all border-amber-100 focus:border-amber-500"
                                                    onKeyDown={e => e.key === 'Enter' && handleConfirmAddDailyCategory()}
                                                />
                                                <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 w-5 h-5" />
                                            </div>
                                            <Button 
                                                onClick={handleConfirmAddDailyCategory} 
                                                disabled={isSubmitting || !newDailyCategoryName.trim()} 
                                                className="h-14 px-8 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                                                Add
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dailyFeeCategories.map(cat => (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={cat.id} 
                                                    className="flex items-center justify-between p-5 rounded-2xl border-2 bg-white hover:border-amber-500/30 hover:shadow-md transition-all group/item"
                                                >
                                                    {editingDailyCategoryId === cat.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                autoFocus
                                                                value={editingDailyCategoryName}
                                                                onChange={e => setEditingDailyCategoryName(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditDailyCategory(cat.id); if (e.key === 'Escape') { setEditingDailyCategoryId(null); setEditingDailyCategoryName(''); } }}
                                                                className="h-9 flex-1 font-bold border-amber-300 focus:border-amber-500"
                                                            />
                                                            <Button size="icon" className="h-9 w-9 rounded-xl bg-amber-600 hover:bg-amber-700" onClick={() => handleSaveEditDailyCategory(cat.id)} disabled={isSubmitting}>
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => { setEditingDailyCategoryId(null); setEditingDailyCategoryName(''); }}>
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors">
                                                                    <Bus className="w-6 h-6" />
                                                                </div>
                                                                <span className="font-bold text-sm tracking-tight capitalize">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-amber-600 hover:bg-amber-100 rounded-xl" onClick={() => { setEditingDailyCategoryId(cat.id); setEditingDailyCategoryName(cat.name); }}>
                                                                                <Pencil className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Edit Category</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleConfirmDeleteDailyCategory(cat.id, cat.name)}>
                                                                                <Trash2 className="w-5 h-5" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Delete Category</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {dailyFeeCategories.length === 0 && (
                                                <div className="col-span-full py-16 text-center border-4 border-dashed rounded-[2.5rem] bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors border-amber-100">
                                                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Bus className="w-8 h-8 text-amber-600" />
                                                    </div>
                                                    <p className="text-amber-600 font-black uppercase tracking-widest text-xs">No Daily Categories Defined</p>
                                                    <p className="text-amber-600/60 text-sm mt-1 font-medium">Add categories that charge per day of attendance.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-8 border-destructive/20 bg-destructive/5 overflow-hidden">
                                    <CardHeader className="py-6 border-b border-destructive/10">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="w-6 h-6" />
                                            <CardTitle className="text-heading-md">Danger Zone: Reset Financial Records</CardTitle>
                                        </div>
                                        <CardDescription className="text-destructive/80 font-medium">Permanently clear all student ledgers, fee records, payments, and attendance history.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-destructive">This action is irreversible.</p>
                                                <p className="text-xs text-muted-foreground max-w-xl">Use this feature when starting a new academic term or if you need to wipe all financial data to start over. This will also reset all student feeding and transportation rates to 0.00.</p>
                                            </div>
                                            <Button 
                                                variant="destructive" 
                                                className="h-12 px-6 font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                                                onClick={() => setIsResetDialogOpen(true)}
                                                disabled={isSubmitting}
                                            >
                                                <RefreshCcw className="mr-2 h-4 w-4" />
                                                Reset All Records
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                            </motion.div>
                        </AnimatePresence>
                        </div>
                    </main>
                </div>

                <Dialog open={isSettingsAuthOpen} onOpenChange={setIsSettingsAuthOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" /> Settings Authentication</DialogTitle>
                            <DialogDescription>Please enter your security PIN to access school settings.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleVerifySettingsPin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-pin">Security PIN</Label>
                                <Input 
                                    id="settings-pin" 
                                    type="password" 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    placeholder="Enter 4-digit PIN" 
                                    value={settingsPinInput} 
                                    onChange={(e) => setSettingsPinInput(e.target.value)} 
                                    className="text-center text-2xl tracking-[1em]"
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">Verify & Access</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <AlertDialogContent className="max-w-md border-2 border-destructive">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-heading-md flex items-center gap-2 text-destructive">
                                <AlertTriangle className="w-6 h-6" />
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3 pt-2">
                                <p className="font-bold text-foreground">This action will PERMANENTLY DELETE:</p>
                                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                    <li>All student ledger transactions</li>
                                    <li>Legacy fee and payment records</li>
                                    <li>Student attendance history</li>
                                    <li>Feeding and transportation rates (reset to 0.00)</li>
                                </ul>
                                <p className="text-xs text-destructive font-bold pt-2">This cannot be undone. All financial aggregated data on the Families page will also be reset to zero.</p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel disabled={isSubmitting} className="font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleResetFinancials();
                                }} 
                                disabled={isSubmitting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-widest"
                            >
                                {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Resetting...</> : 'Yes, Reset Everything'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>Enter the details for the new student.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStudent}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="add-studentId">Student ID</Label><Input id="add-studentId" value={addStudentForm.studentId} onChange={(e) => setAddStudentForm({...addStudentForm, studentId: e.target.value.toUpperCase()})} placeholder="e.g. FAM-J01" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-name">Student's Full Name</Label><Input id="add-name" value={addStudentForm.name} onChange={(e) => setAddStudentForm({...addStudentForm, name: e.target.value})} placeholder="e.g. John Doe" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add-className">Class Level</Label>
                                        <Input
                                            id="add-className"
                                            list="class-names-list-add"
                                            placeholder="Select or type a class"
                                            value={addStudentForm.className}
                                            onChange={e => setAddStudentForm({ ...addStudentForm, className: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                        />
                                        <datalist id="class-names-list-add">
                                            {uniqueClassNames.map(name => <option key={name} value={name} />)}
                                        </datalist>
                                        <p className="text-xs text-muted-foreground">You can select an existing class or type a new one.</p>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="add-dob">Date of Birth</Label><Input id="add-dob" type="date" value={addStudentForm.dateOfBirth} onChange={(e) => setAddStudentForm({...addStudentForm, dateOfBirth: e.target.value})} required disabled={isSubmitting} /></div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add-gender">Gender</Label>
                                        <Select value={addStudentForm.gender} onValueChange={(value: 'Male' | 'Female' | 'Other') => setAddStudentForm({...addStudentForm, gender: value})} required disabled={isSubmitting}>
                                            <SelectTrigger id="add-gender"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="add-address">Home Address</Label><Textarea id="add-address" value={addStudentForm.address} onChange={(e) => setAddStudentForm({...addStudentForm, address: e.target.value})} placeholder="e.g. 123 School Lane, Accra" required disabled={isSubmitting}/></div>
                                </div>

                                 {/* Column 2 */}
                                 <div className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="add-parentId">Parent ID (for grouping families)</Label><Input id="add-parentId" value={addStudentForm.parentId} onChange={(e) => setAddStudentForm({...addStudentForm, parentId: e.target.value.toUpperCase()})} placeholder="e.g. FAM-DOE-01" disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-parentName">Parent/Guardian Name</Label><Input id="add-parentName" value={addStudentForm.parentName} onChange={(e) => setAddStudentForm({...addStudentForm, parentName: e.target.value})} placeholder="e.g. Jane Doe" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-parentPhone">Parent/Guardian Phone</Label><Input id="add-parentPhone" type="tel" value={addStudentForm.parentPhone} onChange={(e) => setAddStudentForm({...addStudentForm, parentPhone: e.target.value})} placeholder="e.g. 0244123456" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-emergencyName">Emergency Contact Name</Label><Input id="add-emergencyName" value={addStudentForm.emergencyContactName} onChange={(e) => setAddStudentForm({...addStudentForm, emergencyContactName: e.target.value})} placeholder="e.g. Mary Smith" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-emergencyPhone">Emergency Contact Phone</Label><Input id="add-emergencyPhone" type="tel" value={addStudentForm.emergencyContactPhone} onChange={(e) => setAddStudentForm({...addStudentForm, emergencyContactPhone: e.target.value})} placeholder="e.g. 0200123456" required disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><Label htmlFor="add-medical">Medical Notes (Allergies, etc.)</Label><Textarea id="add-medical" value={addStudentForm.medicalNotes} onChange={(e) => setAddStudentForm({...addStudentForm, medicalNotes: e.target.value})} placeholder="e.g. Allergic to peanuts" disabled={isSubmitting}/></div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add-discount" className="text-primary font-bold">Fee Discount (%)</Label>
                                        <Input 
                                            id="add-discount" 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            value={addStudentForm.feeDiscount} 
                                            onChange={(e) => setAddStudentForm({...addStudentForm, feeDiscount: e.target.value === '' ? '' : Number(e.target.value)})} 
                                            placeholder="e.g. 20 for 20% off" 
                                            disabled={isSubmitting} 
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">Applied automatically to bulk class fees.</p>
                                    </div>
                                 </div>
                            </div>

                            {dailyFeeCategories.length > 0 && (
                                <div className="mt-6 border-t pt-6">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                        <Bus className="w-4 h-4" /> Daily Fee Rates
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {dailyFeeCategories.map(cat => {
                                            const existingFee = addStudentForm.dailyFees?.find(df => df.categoryId === cat.id);
                                            return (
                                                <div key={cat.id} className="space-y-2 p-4 rounded-xl border bg-muted/20">
                                                    <Label htmlFor={`add-df-${cat.id}`} className="font-bold">{cat.name} (GH¢)</Label>
                                                    <Input 
                                                        id={`add-df-${cat.id}`}
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={existingFee?.rate || ''}
                                                        onChange={(e) => {
                                                            const rate = e.target.value === '' ? 0 : Number(e.target.value);
                                                            const otherFees = (addStudentForm.dailyFees || []).filter(df => df.categoryId !== cat.id);
                                                            setAddStudentForm({
                                                                ...addStudentForm,
                                                                dailyFees: [...otherFees, { categoryId: cat.id, rate }]
                                                            });
                                                        }}
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="pt-6">
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Student'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader><DialogTitle>Edit Student Details</DialogTitle></DialogHeader>
                        <form onSubmit={handleEditSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                 <div className="space-y-4 md:col-span-2">
                                    <Label>Profile Picture</Label>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={photoPreview || undefined} alt="Student avatar" data-ai-hint="person portrait" />
                                            <AvatarFallback>{editStudentForm.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Label htmlFor="edit-photo" className="cursor-pointer flex items-center gap-2 border p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                                            <Upload className="h-4 w-4" />
                                            <span>Change Photo</span>
                                        </Label>
                                        <Input id="edit-photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </div>
                                </div>

                                <div className="space-y-2"><Label htmlFor="edit-studentId">Student ID</Label><Input id="edit-studentId" value={editStudentForm.studentId} onChange={(e) => setEditStudentForm({...editStudentForm, studentId: e.target.value.toUpperCase()})} required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editStudentForm.name} onChange={(e) => setEditStudentForm({...editStudentForm, name: e.target.value})} required disabled={isSubmitting} /></div>
                                 <div className="space-y-2">
                                    <Label htmlFor="edit-class">Class Level</Label>
                                    <Input
                                        id="edit-class"
                                        list="class-names-list-edit"
                                        placeholder="Select or type a class"
                                        value={editStudentForm.className}
                                        onChange={e => setEditStudentForm({ ...editStudentForm, className: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <datalist id="class-names-list-edit">
                                        {uniqueClassNames.map(name => <option key={name} value={name} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-2"><Label htmlFor="edit-dob">Date of Birth</Label><Input id="edit-dob" type="date" value={editStudentForm.dateOfBirth} onChange={(e) => setEditStudentForm({...editStudentForm, dateOfBirth: e.target.value})} required disabled={isSubmitting} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-gender">Gender</Label>
                                    <Select value={editStudentForm.gender} onValueChange={(value: 'Male' | 'Female' | 'Other') => setEditStudentForm({...editStudentForm, gender: value})} required disabled={isSubmitting}>
                                        <SelectTrigger id="edit-gender"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2 md:col-span-2"><Label htmlFor="edit-address">Home Address</Label><Textarea id="edit-address" value={editStudentForm.address} onChange={(e) => setEditStudentForm({...editStudentForm, address: e.target.value})} required disabled={isSubmitting}/></div>

                                 <div className="space-y-2"><Label htmlFor="edit-parentId">Parent ID (for grouping families)</Label><Input id="edit-parentId" value={editStudentForm.parentId} onChange={(e) => setEditStudentForm({...editStudentForm, parentId: e.target.value.toUpperCase()})} placeholder="e.g. FAM-DOE-01" disabled={isSubmitting} /></div>
                                 <div className="space-y-2"><Label htmlFor="edit-parentName">Parent/Guardian Name</Label><Input id="edit-parentName" value={editStudentForm.parentName} onChange={(e) => setEditStudentForm({...editStudentForm, parentName: e.target.value})} required disabled={isSubmitting} /></div>
                                 <div className="space-y-2"><Label htmlFor="edit-parentPhone">Parent/Guardian Phone</Label><Input id="edit-parentPhone" type="tel" value={editStudentForm.parentPhone} onChange={(e) => setEditStudentForm({...editStudentForm, parentPhone: e.target.value})} required disabled={isSubmitting} /></div>
                                 <div className="space-y-2"><Label htmlFor="edit-emergencyName">Emergency Contact Name</Label><Input id="edit-emergencyName" value={editStudentForm.emergencyContactName} onChange={(e) => setEditStudentForm({...editStudentForm, emergencyContactName: e.target.value})} required disabled={isSubmitting} /></div>
                                 <div className="space-y-2"><Label htmlFor="edit-emergencyPhone">Emergency Contact Phone</Label><Input id="edit-emergencyPhone" type="tel" value={editStudentForm.emergencyContactPhone} onChange={(e) => setEditStudentForm({...editStudentForm, emergencyContactPhone: e.target.value})} required disabled={isSubmitting} /></div>

                                 <div className="space-y-2 md:col-span-2"><Label htmlFor="edit-medical">Medical Notes</Label><Textarea id="edit-medical" value={editStudentForm.medicalNotes} onChange={(e) => setEditStudentForm({...editStudentForm, medicalNotes: e.target.value})} disabled={isSubmitting}/></div>
                                 <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="edit-discount" className="text-primary font-bold">Fee Discount (%)</Label>
                                    <Input 
                                        id="edit-discount" 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        value={editStudentForm.feeDiscount} 
                                        onChange={(e) => setEditStudentForm({...editStudentForm, feeDiscount: e.target.value === '' ? 0 : Number(e.target.value)})} 
                                        disabled={isSubmitting} 
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Applied automatically to bulk class fees.</p>
                                 </div>
                                 {dailyFeeCategories.length > 0 && (
                                     <div className="md:col-span-2 mt-6 border-t pt-6">
                                         <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                             <Bus className="w-4 h-4" /> Daily Fee Rates
                                         </h3>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             {dailyFeeCategories.map(cat => {
                                                 const existingFee = editStudentForm.dailyFees?.find(df => df.categoryId === cat.id);
                                                 return (
                                                     <div key={cat.id} className="space-y-2 p-4 rounded-xl border bg-muted/20">
                                                         <Label htmlFor={`edit-df-${cat.id}`} className="font-bold">{cat.name} (GH¢)</Label>
                                                         <Input 
                                                             id={`edit-df-${cat.id}`}
                                                             type="number"
                                                             placeholder="0.00"
                                                             value={existingFee?.rate || ''}
                                                             onChange={(e) => {
                                                                 const rate = e.target.value === '' ? 0 : Number(e.target.value);
                                                                 const otherFees = (editStudentForm.dailyFees || []).filter(df => df.categoryId !== cat.id);
                                                                 setEditStudentForm({
                                                                     ...editStudentForm,
                                                                     dailyFees: [...otherFees, { categoryId: cat.id, rate }]
                                                                 });
                                                             }}
                                                             disabled={isSubmitting}
                                                         />
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 )}
                             </div>
                             <DialogFooter className="pt-6"><DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Student Details</DialogTitle>
                            <DialogDescription>
                                Viewing the complete profile for {selectedStudentForView?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedStudentForView && (
                            <div className="py-4 space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <Avatar className="w-24 h-24 text-lg">
                                        <AvatarImage src={selectedStudentForView.profilePicture} alt={selectedStudentForView.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{selectedStudentForView.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold">{selectedStudentForView.name}</h2>
                                        <p className="text-muted-foreground">{selectedStudentForView.className} • ID: {selectedStudentForView.studentId}</p>
                                        <p className="text-sm text-muted-foreground">Born on {selectedStudentForView.dateOfBirth ? new Date(selectedStudentForView.dateOfBirth + 'T00:00:00').toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                                        <DetailItem icon={UserCircle} label="Parent/Guardian" value={selectedStudentForView.parentName} />
                                        <DetailItem icon={Phone} label="Parent Phone" value={selectedStudentForView.parentPhone} />
                                        <DetailItem icon={Mail} label="Parent Email" value="Not Available" />
                                        <DetailItem icon={Home} label="Home Address" value={selectedStudentForView.address} />
                                    </div>
                                    <div className="space-y-4">
                                         <h3 className="font-semibold text-lg border-b pb-2">Emergency &amp; Medical</h3>
                                        <DetailItem icon={ShieldAlert} label="Emergency Contact" value={`${selectedStudentForView.emergencyContactName} (${selectedStudentForView.emergencyContactPhone})`} />
                                        <DetailItem icon={HeartPulse} label="Medical Notes" value={selectedStudentForView.medicalNotes || "None"} />
                                        <DetailItem icon={TrendingDown} label="Fee Discount" value={selectedStudentForView.feeDiscount ? `${selectedStudentForView.feeDiscount}%` : "None"} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Salary for {selectedStaffForSalary?.name}</DialogTitle>
                            <DialogDescription>Enter the monthly salary amount for this staff member.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSalarySubmit}>
                            <div className="py-4">
                                <Label htmlFor="salary-amount" className="sr-only">Salary Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">GH¢</span>
                                    <Input 
                                        id="salary-amount"
                                        type="number" 
                                        placeholder="0.00" 
                                        className="pl-10"
                                        value={salaryForm.amount}
                                        onChange={(e) => setSalaryForm({ amount: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Salary'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                
                <AlertDialog open={!!studentToArchive} onOpenChange={(isOpen) => !isOpen && setStudentToArchive(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Archive Student?</AlertDialogTitle><AlertDialogDescription>This will move the student to the archive. You can restore them later.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmArchiveStudent} disabled={isSubmitting}>Archive</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog open={!!studentToDelete} onOpenChange={(isOpen) => !isOpen && setStudentToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Permanently Delete?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete the student's record.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Permanently</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={!!staffToArchive} onOpenChange={(isOpen) => !isOpen && setStaffToArchive(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Archive Staff?</AlertDialogTitle><AlertDialogDescription>This will move <span className="font-semibold">{staffToArchive?.name}</span> to the archive and prevent them from logging in. You can restore them later.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmArchiveStaff} disabled={isSubmitting}>Archive</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog open={!!staffToDelete} onOpenChange={(isOpen) => !isOpen && setStaffToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Permanently Delete?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <span className="font-semibold">{staffToDelete?.name}</span> and all associated data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStaff} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Permanently</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                 <AlertDialog open={!!expenditureToDelete} onOpenChange={(isOpen) => !isOpen && setExpenditureToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the expenditure record for "{expenditureToDelete?.description}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteExpenditure} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Expenditure</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={!!debtToDelete} onOpenChange={(isOpen) => !isOpen && setDebtToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the debt record for "{debtToDelete?.creditor}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDebt} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Debt</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                 <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the calendar event "{eventToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Event</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Unified Ledger Transaction Modal */}
                <RecordTransactionModal 
                    isOpen={isRecordTransactionModalOpen}
                    onClose={() => setIsRecordTransactionModalOpen(false)}
                    student={selectedStudent}
                    initialType={transactionModalInitialType}
                    transactionToEdit={transactionToEdit}
                    academicPeriods={academicPeriods}
                    feeCategories={feeCategories}
                    onSuccess={fetchAdminData}
                    db={db}
                    auth={auth}
                />


                {/* Bulk Class Fee Dialog */}
                <Dialog open={isBulkFeeDialogOpen} onOpenChange={setIsBulkFeeDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                        <DialogHeader className="p-8 bg-primary text-white font-jakarta">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                <FilePlus className="w-8 h-8" /> Record Class Fee
                            </DialogTitle>
                            <DialogDescription className="text-white/80 font-medium">
                                Apply this fee to ALL students currently in <strong>{selectedClassForFees}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePostBulkTransaction} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                                    <Select value={bulkFeeForm.category} onValueChange={(val: any) => setBulkFeeForm({...bulkFeeForm, category: val})} required>
                                        <SelectTrigger className="h-12 border-primary/20 focus:ring-primary shadow-sm bg-muted/30 font-bold">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {feeCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Amount (GH¢)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={bulkFeeForm.amount} 
                                        onChange={e => setBulkFeeForm({...bulkFeeForm, amount: e.target.value})} 
                                        required 
                                        className="h-12 border-primary/20 shadow-sm bg-muted/30 text-numeric text-lg font-black"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                                <Checkbox 
                                    id="applyDiscounts" 
                                    checked={bulkFeeForm.applyDiscounts} 
                                    onCheckedChange={(checked) => setBulkFeeForm({...bulkFeeForm, applyDiscounts: checked as boolean})}
                                    className="h-5 w-5 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label 
                                        htmlFor="applyDiscounts" 
                                        className="text-xs font-black uppercase tracking-widest text-primary cursor-pointer select-none"
                                    >
                                        Respect student-specific discounts
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        If checked, students with an assigned discount percentage (e.g. 50%) will be charged the discounted rate instead of the full amount.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
                                <Input 
                                    placeholder="e.g. Second Term Tuition" 
                                    value={bulkFeeForm.description} 
                                    onChange={e => setBulkFeeForm({...bulkFeeForm, description: e.target.value})} 
                                    className="h-12 border-primary/20 shadow-sm bg-muted/30 font-medium"
                                />
                            </div>

                            <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-primary/10">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Students to Charge</Label>
                                    <span className="text-[10px] font-bold text-muted-foreground">{selectedBulkStudentIds.length} of {students.filter(s => s.className === selectedClassForFees).length} Selected</span>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {students.filter(s => s.className === selectedClassForFees).map(student => {
                                        const discount = student.feeDiscount || 0;
                                        return (
                                            <div key={student.studentId} className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-xl transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        id={`bulk-${student.studentId}`} 
                                                        checked={selectedBulkStudentIds.includes(student.studentId)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedBulkStudentIds(prev => [...prev, student.studentId]);
                                                            } else {
                                                                setSelectedBulkStudentIds(prev => prev.filter(id => id !== student.studentId));
                                                            }
                                                        }}
                                                        className="h-4 w-4 border-primary/30"
                                                    />
                                                    <Label htmlFor={`bulk-${student.studentId}`} className="text-sm font-bold cursor-pointer">{student.name}</Label>
                                                </div>
                                                {discount > 0 && (
                                                    <Badge variant="outline" className="text-[9px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        {discount}% Discount
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-primary/5 mt-2">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedBulkStudentIds(students.filter(s => s.className === selectedClassForFees).map(s => s.studentId))}
                                        className="text-[9px] h-6 uppercase font-black tracking-tighter"
                                    >
                                        Select All
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedBulkStudentIds([])}
                                        className="text-[9px] h-6 uppercase font-black tracking-tighter text-destructive hover:text-destructive"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                                    <Input 
                                        type="date" 
                                        value={bulkFeeForm.date} 
                                        onChange={e => setBulkFeeForm({...bulkFeeForm, date: e.target.value})} 
                                        required 
                                        className="h-12 border-primary/20 shadow-sm bg-muted/30 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Academic Term</Label>
                                    <Select value={bulkFeeForm.periodId} onValueChange={(val: any) => setBulkFeeForm({...bulkFeeForm, periodId: val})}>
                                        <SelectTrigger className="h-12 border-primary/20 focus:ring-primary shadow-sm bg-muted/30 font-bold">
                                            <SelectValue placeholder="Select Term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicPeriods.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="font-bold">
                                                    {p.year} - {p.term}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                                <AlertCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                                    This will create a ledger entry for every student in this class. Individual overrides can still be made later if needed.
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-2xl font-jakarta" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Processing...</> : 'Apply to Class'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* --- ACADEMIC SETUP DIALOG --- */}

                <Dialog open={isAcademicSetupOpen} onOpenChange={setIsAcademicSetupOpen}>
                    <DialogContent className="max-w-2xl overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-jakarta text-xl font-bold"><CalendarDays className="w-6 h-6 text-primary"/> Academic Periods Setup</DialogTitle>
                            <DialogDescription className="text-sm">Define your school's academic years and terms. Switching terms will filter all financial records accordingly.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid md:grid-cols-2 gap-8 py-6">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    {editingPeriodId ? <Edit className="w-4 h-4 text-primary" /> : <PlusCircle className="w-4 h-4 text-primary" />}
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{editingPeriodId ? 'Edit Term' : 'New Term'}</h3>
                                </div>
                                <Card className="border-primary/20 bg-primary/5 shadow-none">
                                    <CardContent className="pt-6">
                                        <form onSubmit={handleAddAcademicPeriod} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Academic Year</Label>
                                                <Input placeholder="e.g. 2025/2026" value={newPeriodForm.year} onChange={e => setNewPeriodForm({...newPeriodForm, year: e.target.value})} required disabled={isSubmitting} className="h-10 bg-background/50 border-primary/10 transition-all focus:border-primary"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Term Name</Label>
                                                <Select value={newPeriodForm.term} onValueChange={(val: any) => setNewPeriodForm({...newPeriodForm, term: val})}>
                                                    <SelectTrigger className="h-10 bg-background/50 border-primary/10"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="First Term">First Term</SelectItem>
                                                        <SelectItem value="Second Term">Second Term</SelectItem>
                                                        <SelectItem value="Third Term">Third Term</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold">Start Date</Label>
                                                    <Input type="date" value={newPeriodForm.startDate} onChange={e => setNewPeriodForm({...newPeriodForm, startDate: e.target.value})} required disabled={isSubmitting} className="h-10 bg-background/50 border-primary/10 transition-all focus:border-primary"/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold">End Date</Label>
                                                    <Input type="date" value={newPeriodForm.endDate} onChange={e => setNewPeriodForm({...newPeriodForm, endDate: e.target.value})} required disabled={isSubmitting} className="h-10 bg-background/50 border-primary/10 transition-all focus:border-primary"/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Vacation Date</Label>
                                                <Input type="date" value={newPeriodForm.vacationDate} onChange={e => setNewPeriodForm({...newPeriodForm, vacationDate: e.target.value})} disabled={isSubmitting} className="h-10 bg-background/50 border-primary/10 transition-all focus:border-primary"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Next Term Begins</Label>
                                                <Input type="date" value={newPeriodForm.nextTermBegins} onChange={e => setNewPeriodForm({...newPeriodForm, nextTermBegins: e.target.value})} disabled={isSubmitting} className="h-10 bg-background/50 border-primary/10 transition-all focus:border-primary"/>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit" className="flex-1 h-10 mt-2 shadow-sm font-semibold" disabled={isSubmitting}>
                                                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Saving...</> : (editingPeriodId ? "Update Term" : "Add to Schedule")}
                                                </Button>
                                                {editingPeriodId && (
                                                    <Button type="button" variant="outline" className="h-10 mt-2" onClick={() => {
                                                        setEditingPeriodId(null);
                                                        setNewPeriodForm({ year: '', term: 'First Term', startDate: '', endDate: '', vacationDate: '', nextTermBegins: '' });
                                                    }}>Cancel</Button>
                                                )}
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </section>
                            
                            <section className="space-y-4 flex flex-col">
                                <div className="flex items-center gap-2 px-1">
                                    <LayoutGrid className="w-4 h-4 text-primary" />
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Setup History</h3>
                                </div>
                                <div className="flex-1 max-h-[280px] overflow-y-auto border border-primary/10 rounded-xl divide-y bg-card/30 backdrop-blur-sm">
                                    {academicPeriods.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-xs text-muted-foreground italic">No periods defined yet.</p>
                                        </div>
                                    ) : (
                                        academicPeriods.map(p => (
                                            <div key={p.id} className={cn("p-4 flex items-center justify-between transition-all group", p.isCurrent ? "bg-primary/10" : "hover:bg-primary/5")}>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-bold text-sm tracking-tight">{p.year}</p>
                                                    <p className="text-xs text-muted-foreground font-medium">{p.term}</p>
                                                    {p.isCurrent && (
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                                            </span>
                                                            <span className="text-[10px] font-bold text-success-foreground bg-success/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">Active Now</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!p.isCurrent && (
                                                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 shadow-sm" onClick={() => handleSetCurrentPeriod(p.id)} disabled={isSubmitting}>
                                                            Activate
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10" onClick={() => {
                                                        setEditingPeriodId(p.id);
                                                        setNewPeriodForm({
                                                            year: p.year,
                                                            term: p.term,
                                                            startDate: p.startDate || '',
                                                            endDate: p.endDate || '',
                                                            vacationDate: p.vacationDate || '',
                                                            nextTermBegins: p.nextTermBegins || ''
                                                        });
                                                    }} disabled={isSubmitting}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10" onClick={() => {
                                                        if (confirm(`Are you sure you want to delete the ${p.term} for ${p.year}? This might affect records linked to this term.`)) {
                                                            handleDeleteAcademicPeriod(p.id);
                                                        }
                                                    }} disabled={isSubmitting}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <AlertDialog open={!!announcementToDelete} onOpenChange={(isOpen) => !isOpen && setAnnouncementToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-4 border-destructive">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black font-headline">Permanently Delete Announcement?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-bold">
                            This will remove the message "{announcementToDelete?.subject}" from all parent dashboards. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-full border-2">Keep Message</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAnnouncement} className="bg-destructive hover:bg-destructive/90 rounded-full font-bold px-8" disabled={isSubmitting}>
                            Delete Forever
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
        </TooltipProvider>
    );
}


const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    </div>
);

interface ExpenditureSectionProps {
    title: string;
    description: string;
    expenditureType: 'General' | 'Feeding' | 'Transportation';
    income: number;
    totalExpenditure: number;
    expenditures: Expenditure[];
    categories: string[];
    onAddExpenditure: (e: React.FormEvent) => Promise<void>;
    onDeleteExpenditure: (exp: Expenditure) => void;
    formState: {
        expenditureForm: typeof defaultExpenditureForm;
        setExpenditureForm: React.Dispatch<React.SetStateAction<typeof defaultExpenditureForm>>;
    };
    isSubmitting: boolean;
}

const ExpenditureSection: React.FC<ExpenditureSectionProps> = ({
    title,
    description,
    expenditureType,
    income,
    totalExpenditure,
    expenditures,
    categories,
    onAddExpenditure,
    onDeleteExpenditure,
    formState,
    isSubmitting,
}) => {
    const { expenditureForm, setExpenditureForm } = formState;
    const net = income - totalExpenditure;

    const handleFormSubmit = (e: React.FormEvent) => {
        // Prevent default form submission which reloads the page
        e.preventDefault();
        
        // Update the form state with the correct type right before submission
        setExpenditureForm(prev => ({...prev, type: expenditureType}));

        // We need a slight delay to ensure the state is updated before calling the main handler
        setTimeout(() => {
            onAddExpenditure(e);
        }, 0);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-heading-md">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="text-heading-md font-jakarta">Financial Snapshot</CardTitle></CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Total Income</p><p className="text-xl font-bold text-success text-numeric">GH¢{(income || 0).toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Total Expenditure</p><p className="text-xl font-bold text-destructive text-numeric">GH¢{(totalExpenditure || 0).toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground font-jakarta font-medium">Net</p><p className={`text-xl font-bold ${net >= 0 ? 'text-success' : 'text-destructive'} text-numeric`}>GH¢{(net || 0).toFixed(2)}</p></div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-heading-md">Record New Expenditure</CardTitle></CardHeader>
                        <form onSubmit={handleFormSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Description</Label><Input placeholder="e.g. Purchase of new textbooks" value={expenditureForm.description} onChange={e => setExpenditureForm({...expenditureForm, description: e.target.value})} required disabled={isSubmitting}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Amount (GH¢)</Label><Input type="number" placeholder="0.00" value={expenditureForm.amount} onChange={e => setExpenditureForm({...expenditureForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={expenditureForm.date} onChange={e => setExpenditureForm({...expenditureForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                </div>
                                <div className="space-y-2"><Label>Category</Label>
                                    <Select value={expenditureForm.category} onValueChange={(value) => setExpenditureForm({...expenditureForm, category: value})} required disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <DialogFooter className="px-6 pb-6"><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Recording...</> : 'Record Expenditure'}</Button></DialogFooter>
                        </form>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-heading-md">Expenditure History</CardTitle></CardHeader>
                        <CardContent>
                            {expenditures.length === 0 ? <EmptyState title="No Expenditures" description="Records added will display here." /> : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {expenditures.map(exp => (
                                            <TableRow key={exp.id}>
                                                <TableCell><div className="font-medium">{exp.description}</div><div className="text-xs text-muted-foreground">{exp.category} &bull; {new Date(exp.date).toLocaleDateString('en-GB')}</div></TableCell>
                                                <TableCell className="text-right text-numeric">GH¢{exp.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => onDeleteExpenditure(exp)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
};

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
            <AdminDashboard />
        </Suspense>
    )
}

    
