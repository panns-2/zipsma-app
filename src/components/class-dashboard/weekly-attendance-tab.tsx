import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Loader2 } from 'lucide-react';
import { Student, AcademicPeriod } from '@/lib/data-store';

interface WeeklyAttendanceTabProps {
    students: Student[];
    isLoading: boolean;
    decodedClassName: string;
    isAttendanceSubmitting: { [key: string]: boolean };
    onToggleAttendance: (studentId: string, date: string, isChecked: boolean) => void;
    activePeriod: AcademicPeriod | null;
}

export function WeeklyAttendanceTab({ students, isLoading, decodedClassName, isAttendanceSubmitting, onToggleAttendance, activePeriod }: WeeklyAttendanceTabProps) {
    const last5Weekdays = useMemo(() => {
        const weekdays: string[] = [];
        let currentDate = new Date();
        while (weekdays.length < 5) {
            const dayOfWeek = currentDate.getDay(); // Sunday is 0, Saturday is 6
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdays.push(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return weekdays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, []);

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Weekly Attendance Overview</CardTitle>
                <CardDescription>A log of student attendance for the last 5 school days.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : students.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Students in this Class</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no students assigned to {decodedClassName}.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px] sticky left-0 bg-card">Student Name</TableHead>
                                    {last5Weekdays.map(day => (
                                        <TableHead key={day} className="text-center">
                                            {new Date(day + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    return (
                                        <TableRow key={student.studentId} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium sticky left-0 bg-card group-hover:bg-muted/50 transition-colors">{student.name}</TableCell>
                                            {last5Weekdays.map(day => {
                                                const attendanceRecord = student.attendance?.find(a => a.date === day && (!activePeriod || a.periodId === activePeriod.id));
                                                const isAttended = !!attendanceRecord?.attended;
                                                const key = `${student.studentId}-${day}`;
                                                const studentIsSubmitting = isAttendanceSubmitting[key];
                                                return (
                                                    <TableCell key={day} className="text-center">
                                                        {studentIsSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /> :
                                                        <Checkbox
                                                            id={`att-${key}`}
                                                            checked={isAttended}
                                                            onCheckedChange={(checked) => onToggleAttendance(student.studentId, day, !!checked)}
                                                            className="h-5 w-5 mx-auto transition-transform active:scale-95"
                                                        />}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
