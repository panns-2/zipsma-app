import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Student, AcademicPeriod } from '@/lib/data-store';

interface TermAttendanceTabProps {
    students: Student[];
    isLoading: boolean;
    decodedClassName: string;
    activePeriod: AcademicPeriod | null;
}

export function TermAttendanceTab({ students, isLoading, decodedClassName, activePeriod }: TermAttendanceTabProps) {
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Term Attendance</CardTitle>
                <CardDescription>Total attendance for each student for the current term.</CardDescription>
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
                                    <TableHead className="w-[250px]">Student Name</TableHead>
                                    <TableHead className="text-right">Days Attended</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const daysAttended = student.attendance?.filter(a => a.attended && (!activePeriod || a.periodId === activePeriod.id)).length || 0;
                                    return (
                                        <TableRow key={student.studentId} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell className="text-right font-semibold">{daysAttended}</TableCell>
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
