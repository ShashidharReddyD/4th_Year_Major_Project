import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Download, Users } from 'lucide-react';
import { format } from "date-fns";
import { xmlStorage, Student, AttendanceRecord } from '../../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AttendanceManagerProps {
  onDataUpdate: () => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ onDataUpdate }) => {
  const [selectedClass, setSelectedClass] = useState<string>('1');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: string]: boolean }>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClassStudents();
  }, [selectedClass]);

  useEffect(() => {
    loadExistingAttendance();
  }, [selectedClass, selectedDate]);

  const loadClassStudents = () => {
    const classStudents = xmlStorage.getStudentsByClass(parseInt(selectedClass));
    setStudents(classStudents);
    
    // Initialize attendance state
    const initialAttendance: { [studentId: string]: boolean } = {};
    classStudents.forEach(student => {
      initialAttendance[student.studentId] = false;
    });
    setAttendance(initialAttendance);
  };

  const loadExistingAttendance = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const classAttendance = xmlStorage.getAttendanceByClass(parseInt(selectedClass));
    const dayAttendance = classAttendance.filter(record => record.date === dateStr);
    
    setExistingAttendance(dayAttendance);
    
    // Update attendance state with existing records
    const updatedAttendance = { ...attendance };
    dayAttendance.forEach(record => {
      updatedAttendance[record.studentId] = record.status === 'present';
    });
    setAttendance(updatedAttendance);
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
  };

  const markAllPresent = () => {
    const allPresent: { [studentId: string]: boolean } = {};
    students.forEach(student => {
      allPresent[student.studentId] = true;
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: { [studentId: string]: boolean } = {};
    students.forEach(student => {
      allAbsent[student.studentId] = false;
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      let successCount = 0;
      
      for (const student of students) {
        const status = attendance[student.studentId] ? 'present' : 'absent';
        const success = xmlStorage.markAttendance(student.studentId, dateStr, status);
        if (success) successCount++;
      }
      
      if (successCount === students.length) {
        toast({
          title: "Attendance Saved",
          description: `Attendance for Class ${selectedClass} on ${format(selectedDate, 'PPP')} has been saved successfully.`,
        });
        
        onDataUpdate();
        loadExistingAttendance();
      } else {
        toast({
          title: "Partial Save",
          description: `${successCount} out of ${students.length} attendance records saved.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const presentCount = Object.values(attendance).filter(Boolean).length;
    const totalCount = students.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
    
    return { presentCount, totalCount, percentage };
  };

  const getMonthlyStats = () => {
    const currentMonth = format(selectedDate, 'yyyy-MM');
    const data = xmlStorage.loadData();
    const classStudents = students.map(s => s.studentId);
    
    const monthAttendance = data.attendance.filter((record: AttendanceRecord) => 
      classStudents.includes(record.studentId) && record.date.startsWith(currentMonth)
    );
    
    const totalDays = new Set(monthAttendance.map(r => r.date)).size;
    const totalPresent = monthAttendance.filter(r => r.status === 'present').length;
    const totalPossible = totalDays * students.length;
    
    return {
      totalDays,
      averageAttendance: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0
    };
  };

  const stats = getAttendanceStats();
  const monthlyStats = getMonthlyStats();

  return (
    <div className="space-y-6">
      {/* Attendance Controls */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select class and date to mark student attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(classNum => (
                    <SelectItem key={classNum} value={classNum.toString()}>
                      Class {classNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <Users className="h-4 w-4 mr-2" />
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAbsent}>
              Mark All Absent
            </Button>
          </div>

          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.presentCount}</div>
              <div className="text-sm text-muted-foreground">Present Today</div>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.totalCount - stats.presentCount}</div>
              <div className="text-sm text-muted-foreground">Absent Today</div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.percentage}%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance List */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Class {selectedClass} - {format(selectedDate, 'PPP')}</CardTitle>
          <CardDescription>
            {existingAttendance.length > 0 ? 'Attendance already marked for this date. You can update it below.' : 'Mark attendance for each student'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            {students.map((student) => {
              const isPresent = attendance[student.studentId] || false;
              return (
                <div key={student.studentId} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {student.name.split(' ')[0].charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={isPresent ? 'badge-success' : 'badge-warning'}>
                      {isPresent ? 'Present' : 'Absent'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`attendance-${student.studentId}`}
                        checked={isPresent}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(student.studentId, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`attendance-${student.studentId}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Present
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {stats.presentCount} of {stats.totalCount} students marked present ({stats.percentage}%)
            </div>
            <Button 
              onClick={saveAttendance} 
              disabled={isLoading || students.length === 0}
              className="btn-success"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Monthly Overview - Class {selectedClass}</CardTitle>
          <CardDescription>Attendance statistics for {format(selectedDate, 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{monthlyStats.totalDays}</div>
              <div className="text-sm text-muted-foreground">Days with attendance marked</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-3xl font-bold text-secondary mb-2">{monthlyStats.averageAttendance}%</div>
              <div className="text-sm text-muted-foreground">Average class attendance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManager;