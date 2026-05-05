
import { UserCircle2, RefreshCw, GraduationCap, MapPin, CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentProfileProps {
  name: string;
  studentClass: string;
  studentId: string;
  profilePicture?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onEdit: () => void;
}

export default function StudentProfile({ name, studentClass, studentId, profilePicture, onRefresh, isRefreshing, onEdit }: StudentProfileProps) {
  return (
    <div className="mb-6 md:mb-24">
      {/* Banner */}
      <div className="h-40 md:h-64 w-full rounded-2xl overflow-hidden relative shadow-lg">
        <img 
          src="/student_hero.png" 
          alt="Dashboard Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile Card — stacks below banner on mobile, overlaps on md+ */}
      <div className="md:absolute md:left-1/2 md:-translate-x-1/2 md:-bottom-20 md:w-[95%] md:max-w-4xl -mt-6 md:mt-0 mx-3 md:mx-0 relative">
        <div className="bg-white/90 md:bg-white/80 backdrop-blur-xl border border-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl md:shadow-2xl flex flex-col md:flex-row items-center md:items-end justify-between gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
             <div className="relative group flex-shrink-0">
                <Avatar className="w-20 h-20 md:w-32 md:h-32 border-4 border-white shadow-xl ring-4 ring-primary/5">
                    <AvatarImage src={profilePicture} alt={name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10">
                        <UserCircle2 className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
                    </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 md:p-2 rounded-xl shadow-lg border-2 border-white">
                    <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                </div>
             </div>
             <div className="space-y-1.5 md:space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                    <h2 className="text-2xl md:text-4xl font-black font-headline text-gray-900 tracking-tight">{name}</h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                        Active Student
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-500 font-medium text-sm">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {studentClass}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-primary" /> ID: {studentId}</span>
                </div>
             </div>
          </div>
          
          <div className="flex gap-3 flex-shrink-0">
             <Button 
                variant="outline" 
                size="icon" 
                className="rounded-2xl w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-gray-50 border-gray-100 shadow-sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button className="rounded-2xl px-5 md:px-6 font-bold shadow-lg shadow-primary/20 h-10 md:h-12 text-sm md:text-base" onClick={onEdit}>
                Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}