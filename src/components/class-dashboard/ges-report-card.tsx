import React from 'react';
import { StudentReport, Student, School, AcademicPeriod } from '@/lib/data-store';

interface GESReportCardProps {
  report: StudentReport;
  student: Student;
  school: School | null;
  period?: AcademicPeriod | null;
}

export const GESReportCard = React.forwardRef<HTMLDivElement, GESReportCardProps>(
  ({ report, student, school, period }, ref) => {
    
    // Safety checks
    if (!report || !student) return null;

    return (
      <div 
        ref={ref} 
        className="w-full bg-white text-black p-8 mx-auto"
        style={{
            maxWidth: '210mm',
            minHeight: '297mm', // A4 sizing
            boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center border-b-4 border-double border-gray-800 pb-4 mb-6">
          {school?.logoUrl && (
            <img src={school.logoUrl} alt="School Logo" className="w-24 h-24 object-contain mb-2" />
          )}
          <h1 className="text-2xl font-bold uppercase text-center mb-1">{school?.name || 'School Name'}</h1>
          <p className="text-sm text-center italic mb-2">{school?.schoolEmail} | {school?.schoolPhone}</p>
          <h2 className="text-xl font-bold bg-gray-200 px-6 py-1 border border-gray-800 rounded uppercase tracking-widest mt-2">
            Terminal Report
          </h2>
        </div>

        {/* Student Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6 border border-gray-400 p-4 rounded bg-gray-50/30">
          <div><span className="font-semibold w-32 inline-block">Student Name:</span> <span className="uppercase font-bold">{student.name}</span></div>
          <div><span className="font-semibold w-32 inline-block">Term:</span> {report.term}</div>
          
          <div><span className="font-semibold w-32 inline-block">Admission No:</span> {student.studentId}</div>
          <div><span className="font-semibold w-32 inline-block">Academic Year:</span> {report.academicYear}</div>
          
          <div><span className="font-semibold w-32 inline-block">Class:</span> {report.className}</div>
          <div><span className="font-semibold w-32 inline-block">Attendance:</span> {report.attendance?.daysPresent} out of {report.attendance?.daysOpened} days</div>
          
          <div><span className="font-semibold w-32 inline-block">Date of Birth:</span> {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</div>
          <div><span className="font-semibold w-32 inline-block">Gender:</span> {student.gender}</div>
        </div>

        {/* Academic Performance Table */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2 border-b-2 border-gray-600 inline-block uppercase">Academic Performance</h3>
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 p-2 text-left w-1/3">Subject</th>
                <th className="border border-gray-800 p-2">Class Marks (50)</th>
                <th className="border border-gray-800 p-2">Exam Marks (50)</th>
                <th className="border border-gray-800 p-2">Total Score (100)</th>
                <th className="border border-gray-800 p-2">Grade</th>
                <th className="border border-gray-800 p-2 w-1/4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects?.map((sub, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-800 p-2 font-medium">{sub.name}</td>
                  <td className="border border-gray-800 p-2 text-center">{sub.classAssessmentScore}</td>
                  <td className="border border-gray-800 p-2 text-center">{sub.examScore}</td>
                  <td className="border border-gray-800 p-2 text-center font-bold">{sub.totalScore}</td>
                  <td className="border border-gray-800 p-2 text-center font-bold">{sub.grade}</td>
                  <td className="border border-gray-800 p-2 text-xs">{sub.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overall Academic Summary */}
        <div className="flex gap-4 text-sm font-bold mb-6 justify-between bg-gray-100 p-3 border border-gray-400">
          <div>Total Marks: <span className="text-lg">{report.summary?.totalMarks}</span></div>
          <div>Average Score: <span className="text-lg">{report.summary?.averageScore}%</span></div>
          <div>Class Position: <span className="text-lg">{report.summary?.classPosition || 'N/A'}</span> out of {report.summary?.classSize || 'N/A'}</div>
        </div>

        {/* Skills and Behaviour Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-bold mb-2 border-b-2 border-gray-600 inline-block uppercase text-sm">Core Skills</h3>
            <table className="w-full border-collapse border border-gray-800 text-xs">
              <tbody>
                {['Reading', 'Writing', 'Number Work', 'Creativity'].map(skill => (
                  <tr key={skill}>
                    <td className="border border-gray-800 p-1.5 font-semibold w-1/2">{skill}</td>
                    <td className="border border-gray-800 p-1.5">{(report.skills as any)?.[skill.toLowerCase().replace(' ', '')] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-bold mb-2 border-b-2 border-gray-600 inline-block uppercase text-sm">Affective & Behaviour</h3>
            <table className="w-full border-collapse border border-gray-800 text-xs">
              <tbody>
                {['Obedience', 'Neatness', 'Punctuality'].map(skill => (
                  <tr key={skill}>
                    <td className="border border-gray-800 p-1.5 font-semibold w-1/2">{skill}</td>
                    <td className="border border-gray-800 p-1.5">{(report.skills as any)?.[skill.toLowerCase().replace(' ', '')] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Term Dates Section */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 border border-gray-400 bg-blue-50/20 rounded">
            <div className="text-sm">
                <span className="font-bold">Vacation Date:</span> 
                <span className="ml-2 font-mono">{period?.vacationDate ? new Date(period.vacationDate).toDateString() : 'To Be Announced'}</span>
            </div>
            <div className="text-sm">
                <span className="font-bold">Next Term Resumes:</span> 
                <span className="ml-2 font-mono">{period?.nextTermBegins ? new Date(period.nextTermBegins).toDateString() : 'To Be Announced'}</span>
            </div>
        </div>

        {/* Remarks and Signatures */}
        <div className="space-y-4 mb-8 text-sm">
          <div className="border border-gray-400 p-3 rounded">
            <span className="font-bold italic">Class Teacher's Remarks:</span> 
            <p className="mt-1 min-h-[40px] border-b border-dotted border-gray-400">{report.remarks?.teacherRemark}</p>
            <div className="mt-4 flex justify-between items-end">
              <div>Signature: _______________________</div>
              <div>Date: ________________</div>
            </div>
          </div>
          
          <div className="border border-gray-400 p-3 rounded">
            <span className="font-bold italic">Head Teacher's Remarks:</span> 
            <p className="mt-1 min-h-[40px] border-b border-dotted border-gray-400">{report.remarks?.headTeacherRemark}</p>
            <div className="mt-4 flex justify-between items-end">
              <div>Signature: _______________________</div>
              <div>Date: ________________</div>
            </div>
          </div>
          
          <div className="bg-gray-100 border border-gray-400 p-3 rounded flex items-center gap-2">
            <span className="font-bold">Promoted To / Next Class:</span> 
            <span className="font-bold uppercase text-lg border-b border-black flex-1 min-h-[24px]">
               {report.promotion?.promotedTo || ''}
            </span>
          </div>
        </div>

        {/* GES Grading Scale Legend */}
        <div className="mt-auto border-t border-gray-800 pt-4 text-[10px]">
          <span className="font-bold mr-2 uppercase">GES Grading System:</span>
          <span className="mr-3"><span className="font-bold">80-100:</span> A (Excellent)</span>
          <span className="mr-3"><span className="font-bold">70-79:</span> B (Very Good)</span>
          <span className="mr-3"><span className="font-bold">60-69:</span> C (Good)</span>
          <span className="mr-3"><span className="font-bold">50-59:</span> D (Credit)</span>
          <span className="mr-3"><span className="font-bold">40-49:</span> E (Pass)</span>
          <span><span className="font-bold">0-39:</span> F (Fail)</span>
        </div>
      </div>
    );
  }
);

GESReportCard.displayName = 'GESReportCard';
