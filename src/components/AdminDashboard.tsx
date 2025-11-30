import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Calendar, BookOpen, Video, ClipboardList, GraduationCap, FileText } from 'lucide-react';
import { xmlStorage, Student, AttendanceRecord, Assignment, VideoLecture } from '../data/xmlStorage';
import AttendanceManager from './admin/AttendanceManager';
import StudentManager from './admin/StudentManager';
import AssignmentManager from './admin/AssignmentManager';
import VideoManager from './admin/VideoManager';
import TimetableManager from './admin/TimetableManager';
import ParentReportsManager from './admin/ParentReportsManager';
import ScrollToTop from './ScrollToTop';

interface AdminDashboardProps {
  adminId: string;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminId, onLogout }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const data = xmlStorage.loadData();
    setStudents(data.students);
    setAssignments(data.assignments);
    setVideos(data.videos);
    
    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = data.attendance.filter((record: AttendanceRecord) => record.date === today);
    setTodayAttendance(todayRecords);
  };

  const getClassStats = () => {
    const stats = [];
    for (let classNum = 1; classNum <= 7; classNum++) {
      const classStudents = students.filter(s => s.class === classNum);
      const classAssignments = assignments.filter(a => a.class === classNum);
      const classVideos = videos.filter(v => v.class === classNum);
      const classAttendance = todayAttendance.filter(a => {
        const student = students.find(s => s.studentId === a.studentId);
        return student?.class === classNum;
      });
      
      stats.push({
        class: classNum,
        totalStudents: classStudents.length,
        assignments: classAssignments.length,
        videos: classVideos.length,
        presentToday: classAttendance.filter(a => a.status === 'present').length,
        totalAttendanceMarked: classAttendance.length
      });
    }
    return stats;
  };

  const classStats = getClassStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity min-w-0"
              >
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  PRESIDENCY PORTAL
                </h1>
              </button>
              <Badge variant="secondary" className="badge-info text-xs sm:text-sm whitespace-nowrap">
                {adminId}
              </Badge>
            </div>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Dashboard Overview */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-fade-in">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-educational">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Total Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{students.length}</div>
                <p className="text-sm text-muted-foreground">Across 7 classes</p>
              </CardContent>
            </Card>

            <Card className="card-educational">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  <span>Assignments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{assignments.length}</div>
                <p className="text-sm text-muted-foreground">Total uploaded</p>
              </CardContent>
            </Card>

            <Card className="card-educational">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Video className="h-5 w-5 text-success" />
                  <span>Video Lectures</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{videos.length}</div>
                <p className="text-sm text-muted-foreground">Available for students</p>
              </CardContent>
            </Card>

            <Card className="card-educational">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-warning" />
                  <span>Today's Attendance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{todayAttendance.length}</div>
                <p className="text-sm text-muted-foreground">Records marked</p>
              </CardContent>
            </Card>
          </div>

          {/* Class Statistics */}
          <Card className="card-educational mb-8">
            <CardHeader>
              <CardTitle>Class Statistics</CardTitle>
              <CardDescription>Overview of all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {classStats.map((stat) => (
                  <div key={stat.class} className="p-4 border border-border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-lg mb-2">Class {stat.class}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Students:</span>
                        <span className="font-medium">{stat.totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assignments:</span>
                        <span className="font-medium">{stat.assignments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Videos:</span>
                        <span className="font-medium">{stat.videos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Present Today:</span>
                        <span className="font-medium text-success">
                          {stat.presentToday}/{stat.totalAttendanceMarked}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Functions */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto mb-4 sm:mb-8">
            <TabsTrigger value="students" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Video className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="animate-fade-in">
            <StudentManager onDataUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="attendance" className="animate-fade-in">
            <AttendanceManager onDataUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="assignments" className="animate-fade-in">
            <AssignmentManager onDataUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="videos" className="animate-fade-in">
            <VideoManager onDataUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="timetable" className="animate-fade-in">
            <TimetableManager />
          </TabsContent>

          <TabsContent value="reports" className="animate-fade-in">
            <ParentReportsManager onDataUpdate={loadDashboardData} />
          </TabsContent>
        </Tabs>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default AdminDashboard;