

'use client';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  where,
  addDoc,
  limit,
  query,
  writeBatch,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, type FirebaseStorage } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User, UserCredential, onAuthStateChanged, type Auth, signInAnonymously, sendEmailVerification } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const studentsCollection = 'students';
const announcementsCollection = 'announcements';
const calendarCollection = 'schoolCalendar';
const staffCollection = 'staff';
const expenditureCollection = 'expenditure';
const debtsCollection = 'debts';
const homeworkCollection = 'homework';
const schoolsCollection = 'schools';
const staffDetailsCollection = 'staffDetails';
const periodsCollection = 'academicPeriods';
const reportSettingsCollection = 'reportSettings';
const studentReportsCollection = 'studentReports';
const feeCategoriesCollection = 'feeCategories';
const dailyFeeCategoriesCollection = 'dailyFeeCategories';
const pendingPaymentsCollection = 'pending_payments';



// --- INTERFACES ---
export interface FeeItem {
    id: number;
    item: string;
    amount: number;
    periodId?: string; // Optional for backward compatibility
}
export interface PaymentItem {
    id: number;
    date: string;
    amount: number;
    notes: string;
    periodId?: string;
}
export interface AttendanceRecord {
    id: number;
    date: string;
    attended: boolean;
    periodId?: string;
}

export interface LedgerTransaction {
    id: string;
    date: string;
    type: 'fee' | 'payment' | 'adjustment';
    category: string; // Dynamic fee category
    description: string;
    debit: number;  // Amount charged (+)
    credit: number; // Amount paid (-)
    recordedBy: string;
    periodId?: string;
    isVoided?: boolean;
    voidedReason?: string;
}

export interface FeeCategory {
    id: string;
    name: string;
    schoolId: string;
}

export interface DailyFeeCategory {
    id: string;
    name: string;
    schoolId: string;
}
export interface Student {
    // Core Info
    name: string;
    className: string;
    studentId: string; // This is the user-facing ID (e.g., S001)
    id?: string;       // This is the Firestore Document ID (e.g., SCHOOLA_S001)
    dateAdded: Date;
    profilePicture: string;
    schoolId: string;
    isArchived: boolean;

    // Personal Details
    dateOfBirth: string;
    gender: 'Male' | 'Female' | 'Other';

    // Contact Info
    parentId?: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    
    // Medical
    medicalNotes: string;

    // Financial Info (DEPRECATED - Use ledger instead)
    /** @deprecated Use ledger array */
    generalFees: FeeItem[];
    /** @deprecated Use ledger array */
    generalPayments: PaymentItem[];
    /** @deprecated Use ledger array */
    dailyFeedingCost: number;
    /** @deprecated Use ledger array */
    feedingFeePayments: PaymentItem[];
    /** @deprecated Use ledger array */
    transportationCost: number;
    /** @deprecated Use ledger array */
    transportationPayments: PaymentItem[];
    /** @deprecated Use ledger array */
    dailyFees?: { categoryId: string; rate: number }[];
    
    // Academic
    attendance: AttendanceRecord[];
    currentPeriodId?: string;
    ledger?: LedgerTransaction[];
    feeDiscount?: number; // Percentage discount (0-100)
}

export interface AcademicPeriod {
    id: string; // e.g., "2025-26-T1"
    year: string; // e.g., "2025/2026"
    term: 'First Term' | 'Second Term' | 'Third Term';
    schoolId: string;
    isCurrent: boolean;
    startDate: string;
    endDate: string;
    vacationDate?: string;
    nextTermBegins?: string;
}
export interface Announcement {
    id: string;
    subject: string;
    message: string;
    recipient: string; // 'all' or a studentId
    date: Date;
    schoolId: string;
    readBy: string[]; // studentId[]
}
export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // Keep as string for simplicity in form handling
    type: 'Event' | 'Holiday' | 'Exam';
    description: string;
    schoolId: string;
}
export type StaffRole = 'Teacher' | 'Assistant Teacher' | 'Administrator' | 'Principal' | 'Accountant' | 'Secretary' | 'Security' | 'Driver' | 'Cook' | 'Cleaner' | 'Other';

export interface StaffId {
    id: string;
    name: string;
    role: StaffRole;
    className?: string; // For teaching staff
    phone?: string;
    email?: string;
    dateAdded: Date;
    uid?: string;
    schoolId: string;
    isArchived: boolean;
}
export interface StaffDetails {
    id: string; // Same as StaffId
    schoolId: string;
    salary: number;
}
export interface Expenditure {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    schoolId: string;
    type: 'General' | 'Feeding' | 'Transportation';
    periodId?: string;
}
export interface Debt {
    id: string;
    creditor: string;
    description: string;
    amount: number;
    date: string;
    schoolId: string;
    periodId?: string;
}
export interface Homework {
    id:string;
    className: string;
    title: string;
    description: string;
    dueDate: string;
    dateAdded: Date;
    schoolId: string;
}
export interface BankAccount {
    id: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
}
export interface School {
    id: string;
    name: string;
    adminUid: string;
    adminEmail: string;
    dateCreated: Date;
    logoUrl: string;
    isLocked?: boolean;
    schoolPhone?: string;
    schoolEmail?: string;
    momoNumber?: string;
    momoName?: string;
    bankAccounts?: BankAccount[];
    hubtelMerchantNumber?: string;
    hubtelClientId?: string;
    hubtelClientSecret?: string;
    sendexaApiToken?: string;
    sendexaSenderId?: string;
    currentPeriodId?: string;
    settingsPin?: string;
}

// --- STUDENT REPORT INTERFACES ---
export interface ReportSubject {
  name: string;
  classAssessmentScore?: number; // max 50
  examScore?: number; // max 50
  totalScore?: number; // max 100
  grade?: string; // A, B, C, D, E, F
  remark?: string;
}

export interface ReportSkills {
  reading?: string; // Excellent, Very Good, Good, Needs Improvement
  writing?: string;
  numberWork?: string;
  speaking?: string;
  listening?: string;
  creativity?: string;
  socialInteraction?: string;
  personalHygiene?: string;
  obedience?: string;
  neatness?: string;
  punctuality?: string;
}

export interface ReportAffectiveSkills {
  attitudeToWork?: number; // 4, 3, 2, 1
  classParticipation?: number;
  respectForAuthority?: number;
  leadership?: number;
  teamwork?: number;
  initiative?: number;
  selfControl?: number;
}

export interface StudentReport {
  id: string; // Composite ID
  studentId: string;
  schoolId: string;
  periodId: string;
  academicYear: string;
  term: string;
  className: string;
  
  attendance: {
    daysOpened: number;
    daysPresent: number;
    daysAbsent: number;
  };

  subjects: ReportSubject[];
  skills: ReportSkills;
  affectiveSkills: ReportAffectiveSkills;
  
  remarks: {
    teacherRemark: string;
    headTeacherRemark: string;
  };
  
  promotion: {
    promotedTo: string;
    isRepeated: boolean;
  };
  
  summary: {
    totalMarks: number;
    averageScore: number;
    classPosition: string; 
    classSize: number;
    highestInClass: number;
    lowestInClass: number;
  };

  isLocked: boolean;
  lastUpdated: Date;
}

export interface ReportSettings {
  id: string; // same as schoolId
  schoolId: string;
  classGroups: {
    groupName: string;
    classes: string[]; 
    subjects: string[];
  }[];
}

// --- NEW AUTH HELPER ---
/**
 * Ensures the user is authenticated by waiting for the auth state to be confirmed.
 * This resolves race conditions where operations are attempted before the auth state is ready.
 * @returns A promise that resolves with the authenticated user object.
 * @throws An error if no user is authenticated after the check.
 */
const ensureUserAuthenticated = (auth: Auth): Promise<User> => {
  if (!auth) {
    console.error("[ensureUserAuthenticated] Auth object is undefined or null.");
    return Promise.reject(new Error("Authentication Service not available. Please refresh the page."));
  }
  if (auth.currentUser) {
      return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        console.warn("[ensureUserAuthenticated] No user found in onAuthStateChanged.");
        reject(new Error("Authentication Error: No user is signed in."));
      }
    }, (error) => {
      unsubscribe();
      reject(error);
    });
  });
};


// Helper to convert Firestore data to a serializable object
const toSerializableObject = (doc: any) => {
    const data = doc.data();
    const id = doc.id;
    const serializedData: { [key: string]: any } = { id };

    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            serializedData[key] = value.toDate().toISOString();
        } else {
            serializedData[key] = value;
        }
    }
    return serializedData;
}

// Helper to convert Firestore timestamp to a Date object if it exists
const convertTimestampToDate = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    // Handle cases where it might already be a string (e.g., from our serialization) or a Date object
    return new Date(timestamp);
};


// --- DATA ACCESS & MUTATION FUNCTIONS ---

export async function getStudents(db: Firestore, schoolId: string, includeArchived = false): Promise<Student[]> {
  if (!schoolId) return [];
  const studentsCol = collection(db, studentsCollection);
  
  const q = query(studentsCol, where("schoolId", "==", schoolId.toUpperCase()), orderBy('dateAdded', 'desc'));
  
  const studentSnapshot = await getDocs(q).catch(serverError => {
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: studentsCol.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    throw serverError;
  });

  const allStudents = studentSnapshot.docs
    .map(doc => ({
        ...toSerializableObject(doc),
        id: doc.id, // Explicitly set document ID
    } as any))
    .map(data => ({
        ...data,
        // If the document has a studentId field, use it. 
        // Otherwise, if the ID is composite (SCHOOLA_S123), extract the S123 part.
        studentId: data.studentId || (data.id.includes('_') ? data.id.split('_').slice(1).join('_') : data.id),
        dateAdded: convertTimestampToDate(data.dateAdded)
    } as Student));

  if(includeArchived) {
    return allStudents;
  }
  return allStudents.filter(student => !student.isArchived);
}

export async function getStudentsByClass(db: Firestore, schoolId: string, className: string): Promise<Student[]> {
    console.log(`[getStudentsByClass] Querying for schoolId: "${schoolId}", className: "${className}"`);
    if (!className || !schoolId) return [];

    const studentsCol = collection(db, studentsCollection);
    const q = query(studentsCol, where("schoolId", "==", schoolId.toUpperCase()), where("className", "==", className));
    
    const studentSnapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: studentsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const students = studentSnapshot.docs
        .map(doc => toSerializableObject(doc) as any)
        .map(data => ({
            ...data,
            studentId: data.id,
            dateAdded: convertTimestampToDate(data.dateAdded)
        } as Student));

    return students.filter(student => !student.isArchived).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStudentsByParentId(db: Firestore, schoolId: string, parentId: string): Promise<Student[]> {
    if (!schoolId || !parentId) return [];

    const studentsCol = collection(db, studentsCollection);
    const q = query(studentsCol, where("schoolId", "==", schoolId.toUpperCase()), where("parentId", "==", parentId));
    
    const studentSnapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: studentsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const students = studentSnapshot.docs
        .map(doc => toSerializableObject(doc) as any)
        .map(data => ({
            ...data,
            studentId: data.id,
            dateAdded: convertTimestampToDate(data.dateAdded)
        } as Student));

    return students.filter(student => !student.isArchived).sort((a, b) => a.name.localeCompare(b.name));
}


export async function getStudentById(db: Firestore, schoolId: string, studentId: string): Promise<Student | null> {
  if (!schoolId || !studentId) return null;

  const school = await getSchoolDetails(db, schoolId);
  if (school?.isLocked) {
      throw new Error("This school's account is currently locked. Please contact support.");
  }

  const upperSchoolId = schoolId.toUpperCase();
  const upperStudentId = studentId.toUpperCase();
  const compositeId = upperStudentId.startsWith(`${upperSchoolId}_`) 
    ? upperStudentId 
    : `${upperSchoolId}_${upperStudentId}`;
    
  const studentDocRef = doc(db, studentsCollection, compositeId);
  let studentSnap = await getDoc(studentDocRef).catch(serverError => {
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    throw serverError;
  });

  // Fallback for legacy IDs (non-prefixed)
  if (!studentSnap.exists()) {
    const legacyDocRef = doc(db, studentsCollection, studentId.toUpperCase());
    const legacySnap = await getDoc(legacyDocRef);
    if (legacySnap.exists() && legacySnap.data()?.schoolId === schoolId.toUpperCase()) {
        studentSnap = legacySnap;
    }
  }

  if (studentSnap.exists()) {
    const data = toSerializableObject(studentSnap) as any;
    if (data.schoolId !== schoolId.toUpperCase()) {
        console.warn(`Student found but belongs to a different school.`);
        return null;
    }

    return {
        ...data,
        studentId: studentSnap.id,
        dateAdded: convertTimestampToDate(data.dateAdded),
    } as Student;
  }
  return null;
}

export async function getStaffById(db: Firestore, schoolId: string, staffId: string): Promise<StaffId | null> {
  if (!schoolId || !staffId) return null;

  const school = await getSchoolDetails(db, schoolId);
  if (school?.isLocked) {
      throw new Error("This school's account is currently locked. Please contact support.");
  }

  const staffDocRef = doc(db, staffCollection, staffId.toUpperCase());
  const staffSnap = await getDoc(staffDocRef).catch(serverError => {
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: staffDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    throw serverError;
  });
  if (staffSnap.exists()) {
    const data = toSerializableObject(staffSnap) as any;
    if (data.schoolId !== schoolId.toUpperCase()) {
        console.warn(`Staff found but belongs to a different school.`);
        return null;
    }

    return {
        ...data,
        id: staffSnap.id,
        dateAdded: convertTimestampToDate(data.dateAdded),
    } as StaffId;
  }
  return null;
}

export async function addStudent(db: Firestore, auth: Auth, schoolId: string, newStudentData: Omit<Student, 'dateAdded' | 'profilePicture' | 'generalFees' | 'generalPayments' | 'dailyFeedingCost' | 'feedingFeePayments' | 'attendance' | 'transportationCost' | 'transportationPayments' | 'isArchived' | 'dailyFees' | 'ledger'> & { dailyFees?: { categoryId: string, rate: number }[] }) {
    if (!schoolId) throw new Error("School ID missing.");
    const { studentId, ...restOfData } = newStudentData;

    const upperCaseStudentId = studentId.trim().toUpperCase();
    const studentDocRef = getStudentDocRef(db, upperCaseStudentId, schoolId);

    const existingStudentSnap = await getDoc(studentDocRef);
    if (existingStudentSnap.exists()) {
        throw new Error('Student ID already exists.');
    }

    const newStudentForFirestore = {
        ...restOfData,
        schoolId: schoolId.toUpperCase(),
        profilePicture: '',
        dateAdded: Timestamp.now(),
        isArchived: false,
        attendance: [],
        dailyFees: restOfData.dailyFees || [],
        ledger: [],
        // Legacy fields initialized as empty for backward compatibility if needed
        generalFees: [],
        generalPayments: [],
        dailyFeedingCost: 0,
        feedingFeePayments: [],
        transportationCost: 0,
        transportationPayments: [],
    };
    
    await setDoc(studentDocRef, newStudentForFirestore).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'create',
            requestResourceData: newStudentForFirestore,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- Helper for composite IDs ---
function getStudentDocRef(db: Firestore, idOrStudentId: string, schoolId?: string) {
    if (!schoolId) return doc(db, studentsCollection, idOrStudentId);
    
    const upperSchoolId = schoolId.toUpperCase();
    const upperId = idOrStudentId.toUpperCase();
    
    const compositeId = upperId.startsWith(`${upperSchoolId}_`) 
        ? upperId 
        : `${upperSchoolId}_${upperId}`;
        
    return doc(db, studentsCollection, compositeId);
}

export async function archiveStudent(db: Firestore, auth: Auth, studentId: string, archive = true, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  await updateDoc(studentDocRef, { isArchived: archive }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'update',
        requestResourceData: { isArchived: archive },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}


export async function deleteStudent(db: Firestore, storage: FirebaseStorage, auth: Auth, studentId: string, schoolId?: string) {
  await ensureUserAuthenticated(auth);

  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  const studentSnap = await getDoc(studentDocRef);
  const studentData = studentSnap.data() as Student;

  // Delete profile picture if it exists
  if (studentData && studentData.profilePicture) {
    try {
        const oldLogoRef = ref(storage, studentData.profilePicture);
        // Not awaiting this, as it's not critical if it fails.
        // Let it run in the background.
        deleteObject(oldLogoRef).catch(err => {
          console.warn(`Failed to delete old student photo, but continuing:`, err);
        });
    } catch (err) {
        console.warn(`Could not create storage reference for old photo, but continuing:`, err);
    }
  }

  await deleteDoc(studentDocRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export async function updateStudentId(db: Firestore, auth: Auth, oldStudentId: string, newStudentId: string, schoolId?: string) {
    if (!oldStudentId || !newStudentId || oldStudentId === newStudentId) {
        throw new Error("Invalid or unchanged Student ID provided.");
    }
    
    await ensureUserAuthenticated(auth);
    const upperCaseNewStudentId = newStudentId.trim().toUpperCase();

    const newIdDocRef = getStudentDocRef(db, upperCaseNewStudentId, schoolId);
    const oldDocRef = getStudentDocRef(db, oldStudentId, schoolId);

    const newIdExistsDoc = await getDoc(newIdDocRef);
    if (newIdExistsDoc.exists()) {
        throw new Error(`The new Student ID "${upperCaseNewStudentId}" already exists.`);
    }
    
    const oldStudentDoc = await getDoc(oldDocRef);
    if (!oldStudentDoc.exists()) {
        throw new Error(`The original student record with ID "${oldStudentId}" was not found.`);
    }
    const oldStudentData = oldStudentDoc.data();

    const batch = writeBatch(db);
    
    batch.set(newIdDocRef, oldStudentData);
    batch.delete(oldDocRef);

    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: oldDocRef.path, // or newDocRef.path
            operation: 'write', // Represents batch write
            requestResourceData: oldStudentData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function updateStudentDetails(db: Firestore, storage: FirebaseStorage, auth: Auth, studentId: string, details: Partial<Omit<Student, 'studentId' | 'dateAdded'>>, photoFile: File | null, schoolId?: string) {
    const user = await ensureUserAuthenticated(auth);

    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const updateData: { [key: string]: any } = { ...details };

    if (photoFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}/${studentId}-${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        updateData.profilePicture = await getDownloadURL(storageRef);
    }
  
    await updateDoc(studentDocRef, updateData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function updateGeneralFees(db: Firestore, auth: Auth, studentId: string, fees: FeeItem[], schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  await updateDoc(studentDocRef, { generalFees: fees }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'update',
        requestResourceData: { generalFees: fees },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export async function addGeneralPayment(db: Firestore, auth: Auth, studentId: string, payment: Omit<PaymentItem, 'id'>, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  const studentSnap = await getDoc(studentDocRef);
  const student = studentSnap.data() as Student | undefined;

  if (student) {
    const newPayment = { ...payment, id: Date.now() };
    const updatedPayments = [...(student.generalPayments || []), newPayment];
    await updateDoc(studentDocRef, { generalPayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { generalPayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  }
}

export async function deleteGeneralPayment(db: Firestore, auth: Auth, studentId: string, paymentId: number, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  const studentSnap = await getDoc(studentDocRef);
  const student = studentSnap.data() as Student | undefined;

  if (student) {
    const updatedPayments = student.generalPayments.filter(p => p.id !== paymentId);
    await updateDoc(studentDocRef, { generalPayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { generalPayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  }
}

export async function updateDailyCost(db: Firestore, auth: Auth, studentId: string, cost: number, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  await updateDoc(studentDocRef, { dailyFeedingCost: cost }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'update',
        requestResourceData: { dailyFeedingCost: cost },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export async function addFeedingPayment(db: Firestore, auth: Auth, studentId: string, payment: Omit<PaymentItem, 'id'>, schoolId?: string) {
    await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;
    if (student) {
      const newPayment = { ...payment, id: Date.now() };
      const updatedPayments = [...(student.feedingFeePayments || []), newPayment];
      await updateDoc(studentDocRef, { feedingFeePayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { feedingFeePayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
    }
}

export async function deleteFeedingPayment(db: Firestore, auth: Auth, studentId: string, paymentId: number, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  const studentSnap = await getDoc(studentDocRef);
  const student = studentSnap.data() as Student | undefined;
  if (student) {
    const updatedPayments = student.feedingFeePayments.filter(p => p.id !== paymentId);
    await updateDoc(studentDocRef, { feedingFeePayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { feedingFeePayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  }
}

export async function updateTransportationCost(db: Firestore, auth: Auth, studentId: string, cost: number, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  await updateDoc(studentDocRef, { transportationCost: cost }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'update',
        requestResourceData: { transportationCost: cost },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export async function addTransportationPayment(db: Firestore, auth: Auth, studentId: string, payment: Omit<PaymentItem, 'id'>, schoolId?: string) {
    await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;
    if (student) {
      const newPayment = { ...payment, id: Date.now() };
      const updatedPayments = [...(student.transportationPayments || []), newPayment];
      await updateDoc(studentDocRef, { transportationPayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { transportationPayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
    }
}

export async function deleteTransportationPayment(db: Firestore, auth: Auth, studentId: string, paymentId: number, schoolId?: string) {
  await ensureUserAuthenticated(auth);
  const studentDocRef = getStudentDocRef(db, studentId, schoolId);
  const studentSnap = await getDoc(studentDocRef);
  const student = studentSnap.data() as Student | undefined;
  if (student) {
    const updatedPayments = (student.transportationPayments || []).filter(p => p.id !== paymentId);
    await updateDoc(studentDocRef, { transportationPayments: updatedPayments }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { transportationPayments: updatedPayments },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  }
}

export async function setAttendance(db: Firestore, auth: Auth, studentId: string, date: string, attended: boolean, periodId?: string, schoolId?: string) {
    const user = await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;
    if (student) {
        let newAttendance = student.attendance || [];
        const existingRecordIndex = newAttendance.findIndex(a => a.date === date);

        let statusChanged = false;
        if (existingRecordIndex > -1) {
            if (newAttendance[existingRecordIndex].attended !== attended) {
                statusChanged = true;
            }
            newAttendance[existingRecordIndex].attended = attended;
            if (periodId) newAttendance[existingRecordIndex].periodId = periodId;
        } else {
            newAttendance.push({ id: Date.now(), date, attended, periodId });
            statusChanged = true;
        }
        
        newAttendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        let newLedger = [...(student.ledger || [])];

        // --- AUTOMATED LEDGER UPDATES ---
        if (attended) {
            // 1. Feeding Fee
            if (Number(student.dailyFeedingCost) > 0) {
                const feedingExists = newLedger.some(t => t.date === date && t.category === 'feeding' && t.type === 'fee' && !t.isVoided);
                if (!feedingExists) {
                    newLedger.push({
                        id: `auto-feeding-${date}-${Date.now()}`,
                        date: date,
                        type: 'fee',
                        category: 'feeding',
                        description: 'Daily Feeding Fee',
                        debit: Number(student.dailyFeedingCost),
                        credit: 0,
                        recordedBy: user.uid,
                        periodId: periodId || student.currentPeriodId || undefined
                    });
                    statusChanged = true;
                }
            }

            // 2. Custom Daily Fees
            if (student.dailyFees && student.dailyFees.length > 0) {
                student.dailyFees.forEach(df => {
                    const feeExists = newLedger.some(t => t.date === date && t.category === df.categoryId && t.type === 'fee' && !t.isVoided);
                    if (!feeExists) {
                        newLedger.push({
                            id: `auto-df-${df.categoryId}-${date}-${Date.now()}`,
                            date: date,
                            type: 'fee',
                            category: df.categoryId,
                            description: `Daily Fee Deduction`,
                            debit: Number(df.rate),
                            credit: 0,
                            recordedBy: user.uid,
                            periodId: periodId || student.currentPeriodId || undefined
                        });
                        statusChanged = true;
                    }
                });
            }
        } else {
            // Remove auto-generated fees if marked absent
            const initialCount = newLedger.length;
            newLedger = newLedger.filter(t => !(t.date === date && t.id.startsWith('auto-')));
            if (newLedger.length !== initialCount) {
                statusChanged = true;
            }
        }

        if (statusChanged) {
            // Re-sort ledger by date
            newLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        await updateDoc(studentDocRef, { 
            attendance: newAttendance,
            ledger: newLedger 
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: studentDocRef.path,
                operation: 'update',
                requestResourceData: { attendance: newAttendance, ledger: newLedger },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    }
}

// --- FEE CATEGORY FUNCTIONS ---

export async function getFeeCategories(db: Firestore, schoolId: string) {
    if (!schoolId) return [];
    const categoriesCol = collection(db, feeCategoriesCollection);
    const q = query(categoriesCol, where("schoolId", "==", schoolId));
    const querySnapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') throw new FirestorePermissionError({ path: categoriesCol.path, operation: 'list' });
        throw serverError;
    });
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeCategory));
}

export async function addFeeCategory(db: Firestore, auth: Auth, schoolId: string, name: string) {
    await ensureUserAuthenticated(auth);
    const categoriesCol = collection(db, feeCategoriesCollection);
    const categoryData = { name, schoolId: schoolId.toUpperCase() };
    const docRef = await addDoc(categoriesCol, categoryData).catch(serverError => {
        throw new FirestorePermissionError({ path: categoriesCol.path, operation: 'write', requestResourceData: categoryData });
    });
    return { id: docRef.id, ...categoryData };
}

export async function deleteFeeCategory(db: Firestore, auth: Auth, id: string) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, feeCategoriesCollection, id);
    await deleteDoc(docRef).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
    });
}

export async function updateFeeCategory(db: Firestore, auth: Auth, id: string, name: string) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, feeCategoriesCollection, id);
    await updateDoc(docRef, { name }).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { name } });
    });
}

function safeDateString(dateInput: any): string {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
        return d.toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

export async function migrateToLedger(db: Firestore, auth: Auth, studentId: string, schoolId?: string) {
    const user = await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;

    if (!student) return;

    const ledger: LedgerTransaction[] = [...(student.ledger || [])];

    // Helper to check if a transaction already exists in ledger to avoid duplicates
    const transactionExists = (idPrefix: string, originalId: any) => 
        ledger.some(t => t.id === `${idPrefix}-${originalId}`);

    // Migrate General Fees
    (student.generalFees || []).forEach(f => {
        const migrationId = `mig-gf-${f.id}`;
        if (ledger.some(t => t.id === migrationId)) return;
        
        const entry: LedgerTransaction = {
            id: migrationId,
            date: safeDateString(student.dateAdded),
            type: 'fee',
            category: 'general',
            description: f.item || 'General Fee',
            debit: Number(f.amount || 0),
            credit: 0,
            recordedBy: user.uid,
        };
        if (f.periodId) entry.periodId = f.periodId;
        ledger.push(entry);
    });

    // Migrate General Payments
    (student.generalPayments || []).forEach(p => {
        const migrationId = `mig-gp-${p.id}`;
        if (ledger.some(t => t.id === migrationId)) return;

        const entry: LedgerTransaction = {
            id: migrationId,
            date: safeDateString(p.date),
            type: 'payment',
            category: 'general',
            description: p.notes || 'Payment Received',
            debit: 0,
            credit: Number(p.amount || 0),
            recordedBy: user.uid,
        };
        if (p.periodId) entry.periodId = p.periodId;
        ledger.push(entry);
    });

    // Migrate Feeding Payments
    (student.feedingFeePayments || []).forEach(p => {
        const migrationId = `mig-ffp-${p.id}`;
        if (ledger.some(t => t.id === migrationId)) return;

        const entry: LedgerTransaction = {
            id: migrationId,
            date: safeDateString(p.date),
            type: 'payment',
            category: 'feeding',
            description: p.notes || 'Feeding Payment',
            debit: 0,
            credit: Number(p.amount || 0),
            recordedBy: user.uid,
        };
        if (p.periodId) entry.periodId = p.periodId;
        ledger.push(entry);
    });

    // Migrate Transportation
    if (student.transportationCost && Number(student.transportationCost) > 0) {
        const migrationId = `mig-tc-${studentId}`;
        if (!ledger.some(t => t.id === migrationId)) {
            ledger.push({
                id: migrationId,
                date: safeDateString(student.dateAdded),
                type: 'fee',
                category: 'transportation',
                description: 'Transportation Fee',
                debit: Number(student.transportationCost),
                credit: 0,
                recordedBy: user.uid
            });
        }
    }

    (student.transportationPayments || []).forEach(p => {
        const migrationId = `mig-tp-${p.id}`;
        if (ledger.some(t => t.id === migrationId)) return;

        const entry: LedgerTransaction = {
            id: migrationId,
            date: safeDateString(p.date),
            type: 'payment',
            category: 'transportation',
            description: p.notes || 'Transportation Payment',
            debit: 0,
            credit: Number(p.amount || 0),
            recordedBy: user.uid,
        };
        if (p.periodId) entry.periodId = p.periodId;
        ledger.push(entry);
    });

    // Migrate Feeding Accruals
    if (student.dailyFeedingCost && Number(student.dailyFeedingCost) > 0) {
        const attendedDays = (student.attendance || []).filter(a => a.attended).length;
        if (attendedDays > 0) {
            const migrationId = `mig-fa-${studentId}`;
            if (!ledger.some(t => t.id === migrationId)) {
                ledger.push({
                    id: migrationId,
                    date: safeDateString(student.dateAdded),
                    type: 'fee',
                    category: 'feeding',
                    description: 'Feeding Fees (Historical Accrual)',
                    debit: Number(student.dailyFeedingCost) * attendedDays,
                    credit: 0,
                    recordedBy: user.uid
                });
            }
        }
    }

    // Migrate Custom Daily Fees
    if (student.dailyFees && (student.dailyFees || []).length > 0) {
        const attendedDays = (student.attendance || []).filter(a => a.attended).length;
        if (attendedDays > 0) {
            student.dailyFees.forEach(df => {
                const migrationId = `mig-df-${df.categoryId}-${studentId}`;
                if (!ledger.some(t => t.id === migrationId)) {
                    ledger.push({
                        id: migrationId,
                        date: safeDateString(student.dateAdded),
                        type: 'fee',
                        category: 'general',
                        description: `Daily Fee Accrual (Historical)`,
                        debit: (df.rate || 0) * attendedDays,
                        credit: 0,
                        recordedBy: user.uid
                    });
                }
            });
        }
    }

    // Sort by date
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Update student with new ledger AND clear old silos
    const updates: any = {
        ledger,
        generalFees: [],
        generalPayments: [],
        feedingFeePayments: [],
        transportationPayments: [],
        dailyFeedingCost: 0,
        transportationCost: 0,
        dailyFees: []
    };

    await updateDoc(studentDocRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'update',
            requestResourceData: { ledger },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function postLedgerTransaction(db: Firestore, auth: Auth, studentId: string, transaction: Omit<LedgerTransaction, 'id' | 'recordedBy'>, schoolId?: string) {
    const user = await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;

    if (student) {
        const newTransaction: LedgerTransaction = {
            ...transaction,
            date: safeDateString(transaction.date),
            id: Date.now().toString(),
            recordedBy: user.uid
        };

        // Safety: Remove undefined fields that crash Firestore
        Object.keys(newTransaction).forEach(key => {
            if (newTransaction[key] === undefined) delete newTransaction[key];
        });
        const updatedLedger = [...(student.ledger || []), newTransaction];
        // Keep it sorted
        updatedLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        await updateDoc(studentDocRef, { ledger: updatedLedger }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: studentDocRef.path,
                operation: 'update',
                requestResourceData: { ledger: updatedLedger },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    }
}

export async function postBulkClassLedgerTransaction(db: Firestore, auth: Auth, schoolId: string, className: string, transaction: Omit<LedgerTransaction, 'id' | 'recordedBy'>, applyDiscounts: boolean = true, studentIds?: string[]) {
    const user = await ensureUserAuthenticated(auth);
    const students = await getStudents(db, schoolId);
    let classStudents = students.filter(s => s.className === className);
    
    // If specific student IDs are provided, filter only those
    if (studentIds && studentIds.length > 0) {
        classStudents = classStudents.filter(s => studentIds.includes(s.studentId));
    }
    
    if (classStudents.length === 0) return;

    const batch = writeBatch(db);
    const timestamp = Date.now();

    classStudents.forEach((student, index) => {
        // Use student.id if available (actual Firestore document ID), otherwise fallback to getStudentDocRef
        const studentDocRef = student.id 
            ? doc(db, studentsCollection, student.id) 
            : getStudentDocRef(db, student.studentId, schoolId);
        const discount = applyDiscounts ? (student.feeDiscount || 0) : 0;
        const baseDebit = transaction.debit || 0;
        const finalDebit = discount > 0 ? baseDebit * (1 - discount / 100) : baseDebit;
        const finalDescription = (discount > 0 && transaction.type === 'fee')
            ? `${transaction.description} (${discount}% Discount)`
            : transaction.description;

        const newTransaction: LedgerTransaction = {
            ...transaction,
            debit: finalDebit,
            description: finalDescription,
            date: safeDateString(transaction.date),
            id: `${timestamp}-${index}`, // Unique ID for each student in the batch
            recordedBy: user.uid
        };

        // Safety: Remove undefined fields
        Object.keys(newTransaction as any).forEach(key => {
            if ((newTransaction as any)[key] === undefined) delete (newTransaction as any)[key];
        });

        const updatedLedger = [...(student.ledger || []), newTransaction];
        updatedLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        batch.update(studentDocRef, { ledger: updatedLedger });
    });

    await batch.commit().catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'write', path: 'bulk-ledger-update' }));
        throw serverError;
    });
}

export async function postBulkDailyPayments(db: Firestore, auth: Auth, schoolId: string, payments: { studentId: string, amount: number, date: string, category: string, description: string, periodId?: string }[]) {
    const user = await ensureUserAuthenticated(auth);
    if (payments.length === 0) return;

    const students = await getStudents(db, schoolId);
    const batch = writeBatch(db);
    const timestamp = Date.now();

    payments.forEach((payment, index) => {
        const student = students.find(s => s.studentId === payment.studentId);
        if (!student) return;

        // Use student.id if available (actual Firestore document ID), otherwise fallback to getStudentDocRef
        const studentDocRef = student.id 
            ? doc(db, studentsCollection, student.id) 
            : getStudentDocRef(db, student.studentId, schoolId);
        
        const newTransaction: LedgerTransaction = {
            id: `${timestamp}-${index}`,
            date: safeDateString(payment.date),
            type: 'payment',
            category: payment.category,
            description: payment.description,
            debit: 0,
            credit: payment.amount,
            recordedBy: user.uid,
            periodId: payment.periodId
        };

        // Safety: Remove undefined fields
        Object.keys(newTransaction as any).forEach(key => {
            if ((newTransaction as any)[key] === undefined) delete (newTransaction as any)[key];
        });

        const updatedLedger = [...(student.ledger || []), newTransaction];
        updatedLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        batch.update(studentDocRef, { ledger: updatedLedger });
    });

    await batch.commit().catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'write', path: 'bulk-daily-payments' }));
        throw serverError;
    });
}

export async function voidLedgerTransaction(db: Firestore, auth: Auth, studentId: string, transactionId: string, reason: string, schoolId?: string) {
    await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;

    if (student && student.ledger) {
        const updatedLedger = student.ledger.map(t => {
            if (t.id === transactionId) {
                return { ...t, isVoided: true, voidedReason: reason };
            }
            return t;
        });

        await updateDoc(studentDocRef, { ledger: updatedLedger }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: studentDocRef.path,
                operation: 'update',
                requestResourceData: { ledger: updatedLedger },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    }
}

export async function updateLedgerTransaction(db: Firestore, auth: Auth, studentId: string, transactionId: string, updates: Partial<LedgerTransaction>, schoolId?: string) {
    await ensureUserAuthenticated(auth);
    const studentDocRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.data() as Student | undefined;

    if (student && student.ledger) {
        const updatedLedger = student.ledger.map(t => {
            if (t.id === transactionId) {
                const updated = { ...t, ...updates };
                if (updates.date) updated.date = safeDateString(updates.date);
                return updated;
            }
            return t;
        });

        if (updates.date) {
            updatedLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        await updateDoc(studentDocRef, { ledger: updatedLedger }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: studentDocRef.path,
                operation: 'update',
                requestResourceData: { ledger: updatedLedger },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    }
}

export async function resetSchoolFinancials(db: Firestore, auth: Auth, schoolId: string) {
    await ensureUserAuthenticated(auth);
    const upperSchoolId = schoolId.toUpperCase();
    const students = await getStudents(db, schoolId, true);
    
    // 1. Reset Student Ledgers and Attendance
    const chunkSize = 500;
    for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(student => {
            const studentDocRef = student.id 
                ? doc(db, studentsCollection, student.id) 
                : getStudentDocRef(db, student.studentId, schoolId);
            batch.update(studentDocRef, {
                ledger: [],
                generalFees: [],
                generalPayments: [],
                feedingFeePayments: [],
                transportationPayments: [],
                attendance: [],
                dailyFeedingCost: 0,
                transportationCost: 0
            });
        });
        
        await batch.commit().catch(async (serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'write', path: 'reset-financials-students-chunk' }));
            throw serverError;
        });
    }

    // 2. Clear Expenditures
    const expQuery = query(collection(db, expenditureCollection), where('schoolId', '==', upperSchoolId));
    const expSnapshot = await getDocs(expQuery);
    for (let i = 0; i < expSnapshot.docs.length; i += chunkSize) {
        const chunk = expSnapshot.docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit().catch(() => {}); // Best effort
    }

    // 3. Clear Debts
    const debtQuery = query(collection(db, debtsCollection), where('schoolId', '==', upperSchoolId));
    const debtSnapshot = await getDocs(debtQuery);
    for (let i = 0; i < debtSnapshot.docs.length; i += chunkSize) {
        const chunk = debtSnapshot.docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit().catch(() => {}); // Best effort
    }

    // 4. Clear Pending Payments (Hubtel)
    const pendingQuery = query(collection(db, pendingPaymentsCollection), where('schoolId', '==', upperSchoolId));
    const pendingSnapshot = await getDocs(pendingQuery);
    for (let i = 0; i < pendingSnapshot.docs.length; i += chunkSize) {
        const chunk = pendingSnapshot.docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit().catch(() => {}); // Best effort
    }
}

// --- ANNOUNCEMENTS ---
export async function sendAnnouncement(db: Firestore, auth: Auth, schoolId: string, announcement: Omit<Announcement, 'id' | 'date' | 'schoolId' | 'readBy'>) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);
    const announcementsCol = collection(db, announcementsCollection);
    const announcementData = {
        ...announcement,
        schoolId: schoolId.toUpperCase(),
        date: Timestamp.now(),
        readBy: [],
    };
    await addDoc(announcementsCol, announcementData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: announcementsCol.path,
            operation: 'create',
            requestResourceData: announcementData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}


export async function getAnnouncementsForStudent(db: Firestore, schoolId: string, studentId: string): Promise<Announcement[]> {
    if (!schoolId) return [];
    const announcementsCol = collection(db, announcementsCollection);

    const q = query(announcementsCol, 
        where('schoolId', '==', schoolId.toUpperCase()),
        where('recipient', 'in', ['all', studentId]),
    );
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: announcementsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const announcements = snapshot.docs
        .map(doc => toSerializableObject(doc) as any)
        .map(data => ({
            ...data,
            id: data.id,
            date: convertTimestampToDate(data.date),
        } as Announcement));
        
    return announcements.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getAnnouncementsForAdmin(db: Firestore, schoolId: string): Promise<Announcement[]> {
    if (!schoolId) return [];
    const announcementsCol = collection(db, announcementsCollection);

    const q = query(announcementsCol, 
        where('schoolId', '==', schoolId.toUpperCase())
    );
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: announcementsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const announcements = snapshot.docs
        .map(doc => toSerializableObject(doc) as any)
        .map(data => ({
            ...data,
            id: data.id,
            date: convertTimestampToDate(data.date),
        } as Announcement));
        
    return announcements;
}


export async function markAnnouncementAsRead(db: Firestore, announcementId: string, studentId: string) {
    const announcementRef = doc(db, announcementsCollection, announcementId);
    const announcementSnap = await getDoc(announcementRef);

    if (announcementSnap.exists()) {
        const announcementData = announcementSnap.data();
        const readBy = announcementData.readBy || [];
        if (!readBy.includes(studentId)) {
            await updateDoc(announcementRef, {
                readBy: [...readBy, studentId]
            });
        }
    }
}

export async function deleteAnnouncement(db: Firestore, auth: Auth, announcementId: string) {
    const announcementDocRef = doc(db, announcementsCollection, announcementId);
    await deleteDoc(announcementDocRef).catch(async (serverError) => {
        const adminUid = auth?.currentUser?.uid;
        if (adminUid) {
            await setDoc(doc(db, 'errors', `deleteAnnouncement_${Date.now()}`), {
                error: serverError.message,
                adminUid,
                announcementId,
                timestamp: Timestamp.now()
            });
        }
        throw serverError;
    });
}


// --- CALENDAR ---
export async function getCalendarEvents(db: Firestore, schoolId: string): Promise<CalendarEvent[]> {
    if (!schoolId) return [];
    const calendarCol = collection(db, calendarCollection);
    const q = query(calendarCol, where('schoolId', '==', schoolId.toUpperCase()));
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: calendarCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const events = snapshot.docs
        .map(doc => {
            const data = toSerializableObject(doc) as any;
            if (data.date && typeof data.date === 'string') {
              const dateOnly = data.date.split('T')[0];
              return { ...data, id: doc.id, date: dateOnly } as CalendarEvent;
            }
            return data as CalendarEvent;
        });
    
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addCalendarEvent(db: Firestore, auth: Auth, schoolId: string, event: Omit<CalendarEvent, 'id' | 'schoolId'>) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);
    const calendarCol = collection(db, calendarCollection);
    const eventData = {
        ...event,
        schoolId: schoolId.toUpperCase()
    };
    await addDoc(calendarCol, eventData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: calendarCol.path,
            operation: 'create',
            requestResourceData: eventData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function deleteCalendarEvent(db: Firestore, auth: Auth, eventId: string) {
    await ensureUserAuthenticated(auth);
    const eventDocRef = doc(db, calendarCollection, eventId);
    await deleteDoc(eventDocRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- STAFF MANAGEMENT ---
export async function signInStaff(auth: Auth, db: Firestore, schoolId: string, staffId: string): Promise<StaffId> {
    const enteredId = staffId.trim().toUpperCase();
    const enteredSchoolId = schoolId.trim().toUpperCase();
    if (!enteredId || !enteredSchoolId) {
        throw new Error("School and Staff ID are required.");
    }
    
    const school = await getSchoolDetails(db, enteredSchoolId);
    if (school?.isLocked) {
        throw new Error("This school's account is currently locked. Please contact support.");
    }

    const staffDocRef = doc(db, staffCollection, enteredId);
    const docSnap = await getDoc(staffDocRef).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({ path: staffDocRef.path, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    if (docSnap.exists()) {
        const data = docSnap.data() as Omit<StaffId, 'id'>;
        if (data.schoolId !== enteredSchoolId) {
            throw new Error(`Invalid Staff ID for the provided School ID.`);
        }
        if (data.isArchived) {
            throw new Error('This Staff ID has been archived and cannot be used.');
        }

        return {
            id: docSnap.id,
            ...data,
            dateAdded: convertTimestampToDate(data.dateAdded),
        } as StaffId;
    } else {
        throw new Error("Invalid Staff ID.");
    }
}


export async function getStaffIds(db: Firestore, schoolId: string, includeArchived = false): Promise<StaffId[]> {
    if (!schoolId) return [];
    const staffCol = collection(db, staffCollection);
    
    const q = query(staffCol, where('schoolId', '==', schoolId.toUpperCase()));
    
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: staffCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const allStaff = snapshot.docs
        .map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dateAdded: convertTimestampToDate(data.dateAdded),
            } as StaffId;
        });

    if (includeArchived) {
        return allStaff;
    }
    
    return allStaff.filter(staff => !staff.isArchived);
}

export async function addStaffId(db: Firestore, auth: Auth, schoolId: string, name: string, role: StaffRole, staffId?: string, className?: string, phone?: string, email?: string) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);

    const staffData: Omit<StaffId, 'id' | 'dateAdded' | 'uid' | 'isArchived'> = { 
        name: name,
        role: role,
        schoolId: schoolId.toUpperCase(),
        phone: phone || '',
        email: email || '',
    };
    if (className && role === 'Teacher') {
        staffData.className = className;
    }

    const finalStaffData = {
        ...staffData,
        dateAdded: Timestamp.now(),
        isArchived: false,
    };

    if (staffId) {
        const upperCaseId = staffId.trim().toUpperCase();
        const staffDocRef = doc(db, staffCollection, upperCaseId);
        const docSnap = await getDoc(staffDocRef);
        if (docSnap.exists()) {
            throw new Error('Staff ID already exists.');
        }
        await setDoc(staffDocRef, finalStaffData).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: staffDocRef.path,
                operation: 'create',
                requestResourceData: finalStaffData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    } else {
        const staffCol = collection(db, staffCollection);
        await addDoc(staffCol, finalStaffData).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: staffCol.path,
                operation: 'create',
                requestResourceData: finalStaffData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    }
}

export async function archiveStaff(db: Firestore, auth: Auth, staffId: string, archive = true) {
    await ensureUserAuthenticated(auth);
    const staffDocRef = doc(db, staffCollection, staffId);
    await updateDoc(staffDocRef, { isArchived: archive }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: staffDocRef.path,
            operation: 'update',
            requestResourceData: { isArchived: archive },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function deleteStaffId(db: Firestore, auth: Auth, staffId: string) {
    await ensureUserAuthenticated(auth);
    
    const batch = writeBatch(db);
    const staffDocRef = doc(db, staffCollection, staffId);
    const staffDetailsDocRef = doc(db, staffDetailsCollection, staffId);
    
    batch.delete(staffDocRef);
    batch.delete(staffDetailsDocRef);

    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: staffCollection, // General path
            operation: 'write',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function updateStaffId(db: Firestore, auth: Auth, staffId: string, updates: Partial<Omit<StaffId, 'id' | 'dateAdded' | 'uid' | 'schoolId'>>) {
    if (!staffId) throw new Error("Staff ID missing.");
    await ensureUserAuthenticated(auth);
    const staffDocRef = doc(db, staffCollection, staffId);
    await updateDoc(staffDocRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: staffDocRef.path, operation: 'update', requestResourceData: updates });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function getStaffDetails(db: Firestore, schoolId: string): Promise<StaffDetails[]> {
    if (!schoolId) return [];
    const detailsCol = collection(db, staffDetailsCollection);
    const q = query(detailsCol, where('schoolId', '==', schoolId.toUpperCase()));
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: detailsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    return snapshot.docs.map(doc => toSerializableObject(doc) as StaffDetails);
}

export async function updateStaffSalary(db: Firestore, auth: Auth, schoolId: string, staffId: string, salary: number) {
    if (!schoolId || !staffId) throw new Error("Missing required info.");
    await ensureUserAuthenticated(auth);
    const detailsDocRef = doc(db, staffDetailsCollection, staffId);
    const salaryData = {
        schoolId: schoolId.toUpperCase(),
        salary: Number(salary) || 0,
    };
    // Use setDoc with merge to create or update the document.
    await setDoc(detailsDocRef, salaryData, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: detailsDocRef.path,
            operation: 'write',
            requestResourceData: salaryData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- EXPENDITURE ---
export async function getExpenditures(db: Firestore, schoolId: string, periodId?: string): Promise<Expenditure[]> {
    if (!schoolId) return [];
    const expenditureCol = collection(db, expenditureCollection);
    let q = query(expenditureCol, where('schoolId', '==', schoolId.toUpperCase()));
    
    if (periodId) {
        q = query(expenditureCol, where('schoolId', '==', schoolId.toUpperCase()), where('periodId', '==', periodId));
    }
    
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: expenditureCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const expenditures = snapshot.docs.map(doc => {
        const data = toSerializableObject(doc) as any;
        return {
            ...data,
            id: doc.id,
            date: data.date.split('T')[0]
        } as Expenditure;
    });
    
    return expenditures.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addExpenditure(db: Firestore, auth: Auth, schoolId: string, expenditure: Omit<Expenditure, 'id' | 'schoolId'>) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);
    const expenditureCol = collection(db, expenditureCollection);
    const expenditureData = {
        ...expenditure,
        schoolId: schoolId.toUpperCase(),
        date: expenditure.date,
        amount: Number(expenditure.amount), // Ensure amount is a number
        periodId: expenditure.periodId
    };
    await addDoc(expenditureCol, expenditureData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: expenditureCol.path,
            operation: 'create',
            requestResourceData: expenditureData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function deleteExpenditure(db: Firestore, auth: Auth, expenditureId: string) {
    await ensureUserAuthenticated(auth);
    const expenditureDocRef = doc(db, expenditureCollection, expenditureId);
    await deleteDoc(expenditureDocRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: expenditureDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- DEBTS & LIABILITIES ---
export async function getDebts(db: Firestore, schoolId: string, periodId?: string): Promise<Debt[]> {
    if (!schoolId) return [];
    const debtsCol = collection(db, debtsCollection);
    let q = query(debtsCol, where('schoolId', '==', schoolId.toUpperCase()));
    
    if (periodId) {
        q = query(debtsCol, where('schoolId', '==', schoolId.toUpperCase()), where('periodId', '==', periodId));
    }
    
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: debtsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const debts = snapshot.docs.map(doc => {
        const data = toSerializableObject(doc) as any;
        return {
            ...data,
            id: doc.id,
            date: data.date.split('T')[0]
        } as Debt;
    });

    return debts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addDebt(db: Firestore, auth: Auth, schoolId: string, debt: Omit<Debt, 'id' | 'schoolId'>) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);
    const debtsCol = collection(db, debtsCollection);
    const debtData = {
        ...debt,
        schoolId: schoolId.toUpperCase(),
        date: debt.date,
        amount: Number(debt.amount),
        periodId: debt.periodId
    };
    await addDoc(debtsCol, debtData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: debtsCol.path,
            operation: 'create',
            requestResourceData: debtData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function deleteDebt(db: Firestore, auth: Auth, debtId: string) {
    await ensureUserAuthenticated(auth);
    const debtDocRef = doc(db, debtsCollection, debtId);
    await deleteDoc(debtDocRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: debtDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- HOMEWORK ---
export async function getHomeworkForClass(db: Firestore, schoolId: string, className: string): Promise<Homework[]> {
    if (!schoolId || !className) return [];
    const homeworkCol = collection(db, homeworkCollection);
    const q = query(homeworkCol, where('schoolId', '==', schoolId.toUpperCase()), where('className', '==', className));
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: homeworkCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    const homework = snapshot.docs
        .map(doc => toSerializableObject(doc) as any)
        .map(data => ({
            ...data,
            id: data.id,
            dateAdded: convertTimestampToDate(data.dateAdded),
            dueDate: data.dueDate.split('T')[0]
        } as Homework));
        
    return homework.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function addHomework(db: Firestore, auth: Auth, schoolId: string, homework: Omit<Homework, 'id' | 'dateAdded' | 'schoolId'>) {
    if (!schoolId) throw new Error("School ID missing.");
    const homeworkCol = collection(db, homeworkCollection);
    const homeworkData = {
        ...homework,
        schoolId: schoolId.toUpperCase(),
        dateAdded: Timestamp.now(),
        dueDate: homework.dueDate
    };
    await addDoc(homeworkCol, homeworkData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: homeworkCol.path,
            operation: 'create',
            requestResourceData: homeworkData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function deleteHomework(db: Firestore, auth: Auth, homeworkId: string) {
    const homeworkDocRef = doc(db, homeworkCollection, homeworkId);
    await deleteDoc(homeworkDocRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: homeworkDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}


// --- AUTHENTICATION & SCHOOL ---
export async function signInUser(auth: Auth, email: string, pass: string): Promise<UserCredential> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user && !userCredential.user.emailVerified && userCredential.user.email !== process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
        await signOut(auth); // Sign out the user
        throw new Error("Email not verified. Please check your inbox for a verification link.");
    }
    return userCredential;
}


export async function signOutUser(auth: Auth) {
  return signOut(auth);
}

function generateSchoolId(schoolName: string): string {
    const namePart = schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
    const randomPart = Math.floor(100 + Math.random() * 900); // 3-digit random number
    return `${namePart}${randomPart}`;
}

export async function registerSchool(auth: Auth, db: Firestore, storage: FirebaseStorage, schoolName: string, email: string, pass: string, logoFile: File | null): Promise<{user: User, schoolId: string}> {
    // 1. Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // 2. Send verification email
    await sendEmailVerification(user);

    // 3. This is the critical step: wait for the auth state to be confirmed
    await ensureUserAuthenticated(auth);
    
    // 4. Prepare school data
    const schoolId = generateSchoolId(schoolName);
    const schoolDocRef = doc(db, schoolsCollection, schoolId);

    const schoolData: Omit<School, 'id' | 'logoUrl'> = {
        name: schoolName,
        adminUid: user.uid,
        adminEmail: email,
        dateCreated: new Date(),
        isLocked: false,
        schoolPhone: '',
        schoolEmail: email,
        momoNumber: '',
        momoName: '',
        bankAccounts: [],
        hubtelMerchantNumber: '',
        hubtelClientId: '',
        hubtelClientSecret: '',
    };

    // 5. Set the school document in Firestore (without the logo URL first)
    await setDoc(schoolDocRef, { ...schoolData, dateCreated: Timestamp.now(), logoUrl: '' }).catch(async (serverError) => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: schoolDocRef.path,
                operation: 'create',
                requestResourceData: schoolData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    // 6. Upload logo if it exists
    let logoUrl = '';
    if (logoFile) {
        try {
            const logoRef = ref(storage, `schoolLogos/${user.uid}/${logoFile.name}`);
            await uploadBytes(logoRef, logoFile);
            logoUrl = await getDownloadURL(logoRef);
            
            // 7. Update the school document with the logo URL
            await updateDoc(schoolDocRef, { logoUrl: logoUrl });

        } catch (error) {
            console.error("Logo upload failed:", error);
            // Don't throw an error here, the school is already created. 
            // The user can upload the logo later from the settings page.
        }
    }

    return { user, schoolId };
}

export async function getSchoolDetails(db: Firestore, schoolId: string): Promise<School | null> {
    if (!schoolId) return null;
    const schoolDocRef = doc(db, schoolsCollection, schoolId.toUpperCase());
    const docSnap = await getDoc(schoolDocRef).catch(serverError => {
         if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: schoolDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            dateCreated: convertTimestampToDate(data.dateCreated),
        } as School;
    }
    return null;
}

export async function updateSchoolDetails(db: Firestore, storage: FirebaseStorage, auth: Auth, schoolId: string, details: Partial<Omit<School, 'id' | 'adminUid' | 'dateCreated' | 'adminEmail'>>, logoFile: File | null) {
  
    const user = await ensureUserAuthenticated(auth);
    const schoolDocRef = doc(db, "schools", schoolId);
    const updateData: { [key: string]: any } = { ...details };

    if (logoFile) {
        const storageRef = ref(storage, `schoolLogos/${user.uid}/${schoolId}-${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        updateData.logoUrl = await getDownloadURL(storageRef);
    }
    
    await updateDoc(schoolDocRef, updateData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: schoolDocRef.path,
            operation: "update",
            requestResourceData: updateData,
        });
        errorEmitter.emit("permission-error", permissionError);
        throw permissionError;
    });
}

export async function getSchoolForAdmin(db: Firestore, adminUid: string): Promise<string | null> {
    
    const schoolsCol = collection(db, schoolsCollection);
    const q = query(schoolsCol, where('adminUid', '==', adminUid), limit(1));

    const schoolSnapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: schoolsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    if (!schoolSnapshot.empty) {
        const schoolDoc = schoolSnapshot.docs[0];
        const schoolData = schoolDoc.data() as School;
        if (schoolData.isLocked) {
            throw new Error("This school's account is currently locked. Please contact support.");
        }
        return schoolDoc.id;
    }
    return null;
}

// --- SUPER ADMIN ---

export async function getAllSchools(db: Firestore): Promise<School[]> {
    const schoolsCol = collection(db, schoolsCollection);
    const snapshot = await getDocs(schoolsCol).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: schoolsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreated: convertTimestampToDate(doc.data().dateCreated)
    } as School));
}

// --- ACADEMIC PERIODS ---

export async function getAcademicPeriods(db: Firestore, schoolId: string): Promise<AcademicPeriod[]> {
    if (!schoolId) return [];
    const periodsCol = collection(db, periodsCollection);
    const q = query(periodsCol, where('schoolId', '==', schoolId.toUpperCase()), orderBy('year', 'desc'));
    
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: periodsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
        throw serverError;
    });

    return snapshot.docs.map(doc => toSerializableObject(doc) as AcademicPeriod);
}

export async function addAcademicPeriod(db: Firestore, auth: Auth, schoolId: string, period: Omit<AcademicPeriod, 'id' | 'schoolId'>) {
    if (!schoolId) throw new Error("School ID missing.");
    await ensureUserAuthenticated(auth);
    const periodsCol = collection(db, periodsCollection);
    
    const periodId = `${period.year.replace('/', '-')}-${period.term.substring(0, 1)}${Date.now().toString().slice(-4)}`;
    const periodData = {
        ...period,
        id: periodId,
        schoolId: schoolId.toUpperCase(),
    };

    await setDoc(doc(db, periodsCollection, periodId), periodData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: periodsCol.path,
            operation: 'create',
            requestResourceData: periodData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

    return periodId;
}

export async function setAsCurrentPeriod(db: Firestore, auth: Auth, schoolId: string, periodId: string) {
    if (!schoolId || !periodId) throw new Error("Missing required info.");
    await ensureUserAuthenticated(auth);
    
    const batch = writeBatch(db);
    
    // 1. Update all periods for this school to isCurrent: false
    const periodsCol = collection(db, periodsCollection);
    const q = query(periodsCol, where('schoolId', '==', schoolId.toUpperCase()));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(pDoc => {
        batch.update(pDoc.ref, { isCurrent: false });
    });
    
    // 2. Update specific period to isCurrent: true
    const currentPeriodDocRef = doc(db, periodsCollection, periodId);
    batch.update(currentPeriodDocRef, { isCurrent: true });
    
    // 3. Update school profile with currentPeriodId
    const schoolDocRef = doc(db, schoolsCollection, schoolId.toUpperCase());
    batch.update(schoolDocRef, { currentPeriodId: periodId });
    
    await batch.commit().catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'write', path: 'batch-periods' }));
        throw serverError;
    });
}

export async function deleteAcademicPeriod(db: Firestore, auth: Auth, periodId: string) {
    if (!periodId) throw new Error("Period ID missing.");
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, periodsCollection, periodId);
    await deleteDoc(docRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export async function updateAcademicPeriod(db: Firestore, auth: Auth, periodId: string, updates: Partial<AcademicPeriod>) {
    if (!periodId) throw new Error("Period ID missing.");
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, periodsCollection, periodId);
    await updateDoc(docRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: updates });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}


export async function toggleSchoolLock(db: Firestore, auth: Auth, schoolId: string, isLocked: boolean) {
    await ensureUserAuthenticated(auth);
    const schoolDocRef = doc(db, schoolsCollection, schoolId);
    await updateDoc(schoolDocRef, { isLocked }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: schoolDocRef.path,
            operation: 'update',
            requestResourceData: { isLocked },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// --- STUDENT REPORTS ---
export async function getReportSettings(db: Firestore, schoolId: string): Promise<ReportSettings | null> {
    if (!schoolId) return null;
    const docRef = doc(db, reportSettingsCollection, schoolId.toUpperCase());
    const snap = await getDoc(docRef).catch(serverError => {
        if (serverError.code === 'permission-denied') throw new FirestorePermissionError({ path: docRef.path, operation: 'get' });
        throw serverError;
    });
    if (snap.exists()) {
        return toSerializableObject(snap) as ReportSettings;
    }
    return null;
}

export async function saveReportSettings(db: Firestore, auth: Auth, schoolId: string, settings: Omit<ReportSettings, 'id' | 'schoolId'>) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, reportSettingsCollection, schoolId.toUpperCase());
    const settingsData = { ...settings, id: schoolId.toUpperCase(), schoolId: schoolId.toUpperCase() };
    await setDoc(docRef, settingsData).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: settingsData });
    });
}

export async function getStudentReportsByClass(db: Firestore, schoolId: string, periodId: string, className: string): Promise<StudentReport[]> {
    if (!schoolId || !periodId || !className) return [];
    const reportsCol = collection(db, studentReportsCollection);
    const q = query(reportsCol, 
        where("schoolId", "==", schoolId.toUpperCase()),
        where("periodId", "==", periodId),
        where("className", "==", className)
    );
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') throw new FirestorePermissionError({ path: reportsCol.path, operation: 'list' });
        throw serverError;
    });
    return snapshot.docs.map(doc => {
        const data = toSerializableObject(doc);
        return { ...data, lastUpdated: convertTimestampToDate(data.lastUpdated) } as StudentReport;
    });
}

export async function getStudentReport(db: Firestore, schoolId: string, studentId: string, periodId: string): Promise<StudentReport | null> {
    if (!schoolId || !studentId || !periodId) return null;
    const reportsCol = collection(db, studentReportsCollection);
    const q = query(reportsCol, 
        where("schoolId", "==", schoolId.toUpperCase()),
        where("studentId", "==", studentId),
        where("periodId", "==", periodId)
    );
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') throw new FirestorePermissionError({ path: reportsCol.path, operation: 'list' });
        throw serverError;
    });
    if (!snapshot.empty) {
        const data = toSerializableObject(snapshot.docs[0]);
        return { ...data, lastUpdated: convertTimestampToDate(data.lastUpdated) } as StudentReport;
    }
    return null;
}

export async function saveStudentReport(db: Firestore, auth: Auth, report: StudentReport) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, studentReportsCollection, report.id);
    const reportData = { ...report, lastUpdated: Timestamp.now() };
    await setDoc(docRef, reportData, { merge: true }).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: reportData });
    });
}

// --- DAILY FEE CATEGORY FUNCTIONS ---

export async function getDailyFeeCategories(db: Firestore, schoolId: string): Promise<DailyFeeCategory[]> {
    if (!schoolId) return [];
    const categoriesCol = collection(db, dailyFeeCategoriesCollection);
    const q = query(categoriesCol, where("schoolId", "==", schoolId));
    const snapshot = await getDocs(q).catch(serverError => {
        if (serverError.code === 'permission-denied') throw new FirestorePermissionError({ path: categoriesCol.path, operation: 'list' });
        throw serverError;
    });
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyFeeCategory));
}

export async function addDailyFeeCategory(db: Firestore, auth: Auth, schoolId: string, name: string) {
    await ensureUserAuthenticated(auth);
    const categoriesCol = collection(db, dailyFeeCategoriesCollection);
    const categoryData = { name, schoolId: schoolId };
    await addDoc(categoriesCol, categoryData).catch(serverError => {
        throw new FirestorePermissionError({ path: categoriesCol.path, operation: 'write', requestResourceData: categoryData });
    });
}

export async function deleteDailyFeeCategory(db: Firestore, auth: Auth, categoryId: string) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, dailyFeeCategoriesCollection, categoryId);
    await deleteDoc(docRef).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
    });
}

export async function updateDailyFeeCategory(db: Firestore, auth: Auth, id: string, name: string) {
    await ensureUserAuthenticated(auth);
    const docRef = doc(db, dailyFeeCategoriesCollection, id);
    await updateDoc(docRef, { name }).catch(serverError => {
        throw new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { name } });
    });
}

export const reconcileDailyFees = async (db: any, auth: any, studentId: string, periodId?: string, schoolId?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const studentRef = getStudentDocRef(db, studentId, schoolId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) throw new Error("Student not found");

    const student = studentSnap.data() as Student;
    let newLedger = [...(student.ledger || [])];
    let changed = false;

    // Loop through attendance and check for missing fees
    (student.attendance || []).forEach(record => {
        if (!record.attended) return;
        if (periodId && record.periodId !== periodId) return;

        const date = record.date;

        // 1. Check Feeding Fee
        if (Number(student.dailyFeedingCost) > 0) {
            const feedingExists = newLedger.some(t => t.date === date && t.category === 'feeding' && t.type === 'fee' && !t.isVoided);
            if (!feedingExists) {
                newLedger.push({
                    id: `auto-feeding-${date}-${Date.now()}`,
                    date: date,
                    type: 'fee',
                    category: 'feeding',
                    description: 'Daily Feeding Fee',
                    debit: Number(student.dailyFeedingCost),
                    credit: 0,
                    recordedBy: user.uid,
                    periodId: record.periodId || periodId
                });
                changed = true;
            }
        }

        // 2. Check Custom Daily Fees
        (student.dailyFees || []).forEach(df => {
            if (Number(df.rate) > 0) {
                const feeExists = newLedger.some(t => t.date === date && t.category === df.categoryId && t.type === 'fee' && !t.isVoided);
                if (!feeExists) {
                    newLedger.push({
                        id: `auto-df-${df.categoryId}-${date}-${Date.now()}`,
                        date: date,
                        type: 'fee',
                        category: df.categoryId,
                        description: `Daily Fee Deduction`,
                        debit: Number(df.rate),
                        credit: 0,
                        recordedBy: user.uid,
                        periodId: record.periodId || periodId
                    });
                    changed = true;
                }
            }
        });
    });

    if (changed) {
        newLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        await updateDoc(studentRef, { ledger: newLedger });
    }

    return changed;
};
