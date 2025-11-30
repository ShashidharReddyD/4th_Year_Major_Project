import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, Calendar, BookOpen, Video, ClipboardList, Upload, GraduationCap } from 'lucide-react';
import { xmlStorage, Student, AttendanceRecord, Assignment, VideoLecture, TimetableEntry, Submission } from '../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";
import ScrollToTop from './ScrollToTop';
import ChatBot from './ChatBot';

interface StudentDashboardProps {
  studentId: string;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId, onLogout }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = () => {
    const studentData = xmlStorage.getStudent(studentId);
    if (studentData) {
      setStudent(studentData);
      
      // Load student-specific data
      const attendanceRecords = xmlStorage.getStudentAttendance(studentId);
      const classAssignments = xmlStorage.getAssignmentsByClass(studentData.class);
      const classVideos = xmlStorage.getVideosByClass(studentData.class);
      const classTimetable = xmlStorage.getTimetableByClass(studentData.class);
      const studentSubmissions = xmlStorage.getStudentSubmissions(studentId);
      
      setAttendance(attendanceRecords);
      setAssignments(classAssignments);
      setVideos(classVideos);
      setTimetable(classTimetable);
      setSubmissions(studentSubmissions);
    }
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(record => record.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const getTodaysTimetable = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetable.filter(entry => entry.day === today);
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions.find(sub => sub.assignmentId === assignment.assignmentId);
    const isOverdue = new Date() > new Date(assignment.deadline);
    
    if (submission) return { status: 'submitted', color: 'success' };
    if (isOverdue) return { status: 'overdue', color: 'destructive' };
    return { status: 'pending', color: 'warning' };
  };

  // Video helpers: handle YouTube links
  const isYouTubeUrl = (url: string) => /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
  const toYouTubeEmbed = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      const v = new URL(url).searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : '';
    } catch {
      return '';
    }
  };

  const handleFileUpload = (assignmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Simulate file upload - in real implementation, you'd upload to server
      const fileUrl = `uploads/${studentId}_${assignmentId}_${file.name}`;
      
      const submission: Submission = {
        assignmentId,
        studentId,
        fileUrl,
        submittedAt: new Date().toISOString()
      };
      
      if (xmlStorage.submitAssignment(submission)) {
        toast({
          title: "Assignment Submitted",
          description: "Your assignment has been submitted successfully!",
        });
        loadStudentData(); // Refresh data
      } else {
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your assignment.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const attendancePercentage = calculateAttendancePercentage();
  const todaySchedule = getTodaysTimetable();

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
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate hidden sm:block">
                  PRESIDENCY PORTAL
                </h1>
              </button>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Badge variant="secondary" className="badge-info text-xs sm:text-sm">
                  {student.name.split(' ')[0]}
                </Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  Class {student.class}
                </Badge>
              </div>
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h2 className="text-xl sm:text-3xl font-bold mb-2">Welcome back, {student.name.split(' ')[0]}!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Here's your academic overview for Class {student.class}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-educational">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span>Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{attendancePercentage}%</span>
                  <Badge className={attendancePercentage >= 75 ? 'badge-success' : 'badge-warning'}>
                    {attendancePercentage >= 75 ? 'Good' : 'Improve'}
                  </Badge>
                </div>
                <Progress value={attendancePercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {attendance.filter(r => r.status === 'present').length} of {attendance.length} days
                </p>
              </div>
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
              <p className="text-sm text-muted-foreground">
                {submissions.length} submitted
              </p>
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
              <p className="text-sm text-muted-foreground">Available to watch</p>
            </CardContent>
          </Card>

          <Card className="card-educational">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-warning" />
                <span>Today's Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{todaySchedule.length}</div>
              <p className="text-sm text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Student Functions */}
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto mb-4 sm:mb-8">
            <TabsTrigger value="assignments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Video className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Videos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="animate-fade-in">
            <Card className="card-educational">
              <CardHeader>
                <CardTitle>My Assignments</CardTitle>
                <CardDescription>View and submit your assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No assignments available</p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => {
                      const status = getAssignmentStatus(assignment);
                      const submission = submissions.find(sub => sub.assignmentId === assignment.assignmentId);
                      const isOverdue = new Date() > new Date(assignment.deadline);
                      
                      return (
                        <div key={assignment.assignmentId} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <p className="text-muted-foreground text-sm">{assignment.description}</p>
                              <p className="text-sm mt-1">
                                <span className="font-medium">Due:</span> {new Date(assignment.deadline).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={`badge-${status.color}`}>
                              {status.status}
                            </Badge>
                          </div>
                          
                          {submission ? (
                            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                              <p className="text-sm text-success font-medium">
                                ✓ Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                File: {submission.fileUrl.split('/').pop()}
                              </p>
                            </div>
                          ) : !isOverdue ? (
                            <div className="flex items-center space-x-3">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(assignment.assignmentId, e)}
                                className="hidden"
                                id={`file-${assignment.assignmentId}`}
                              />
                              <label
                                htmlFor={`file-${assignment.assignmentId}`}
                                className="btn-hero cursor-pointer inline-flex items-center space-x-2 px-4 py-2 text-sm"
                              >
                                <Upload className="h-4 w-4" />
                                <span>Upload PDF</span>
                              </label>
                              <p className="text-xs text-muted-foreground">Only PDF files accepted</p>
                            </div>
                          ) : (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                              <p className="text-sm text-destructive font-medium">
                                Submission deadline has passed
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="animate-fade-in">
            <Card className="card-educational">
              <CardHeader>
                <CardTitle>My Attendance Record</CardTitle>
                <CardDescription>Your attendance history and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Overall Attendance</h3>
                      <p className="text-sm text-muted-foreground">
                        {attendance.filter(r => r.status === 'present').length} present out of {attendance.length} total days
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{attendancePercentage}%</div>
                      <Progress value={attendancePercentage} className="w-32 h-2 mt-2" />
                    </div>
                  </div>
                </div>

                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records available</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                        <Badge className={record.status === 'present' ? 'badge-success' : 'badge-warning'}>
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="animate-fade-in">
            <Card className="card-educational">
              <CardHeader>
                <CardTitle>Class Timetable</CardTitle>
                <CardDescription>Your weekly schedule for Class {student.class}</CardDescription>
              </CardHeader>
              <CardContent>
                {timetable.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No timetable available</p>
                ) : (
                  <div className="space-y-6">
                    {/* Today's Schedule Highlight */}
                    {todaySchedule.length > 0 && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <h3 className="font-semibold text-primary mb-3">Today's Schedule</h3>
                        <div className="space-y-2">
                          {todaySchedule.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between bg-card p-3 rounded-lg">
                              <div>
                                <span className="font-medium">{entry.subject}</span>
                                <p className="text-sm text-muted-foreground">{entry.teacher}</p>
                              </div>
                              <Badge variant="outline">{entry.timeSlot}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Week Schedule */}
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                      const daySchedule = timetable.filter(entry => entry.day === day);
                      return (
                        <div key={day} className="border border-border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-3">{day}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {daySchedule.map((entry, index) => (
                              <div key={index} className="bg-muted/30 p-3 rounded-lg">
                                <div className="font-medium">{entry.subject}</div>
                                <div className="text-sm text-muted-foreground">{entry.teacher}</div>
                                <div className="text-xs text-primary mt-1">{entry.timeSlot}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="animate-fade-in">
            <Card className="card-educational">
              <CardHeader>
                <CardTitle>Video Lectures</CardTitle>
                <CardDescription>Educational videos for Class {student.class}</CardDescription>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No video lectures available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <div key={video.videoId} className="border border-border rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                          {isYouTubeUrl(video.videoUrl) ? (
                            <iframe
                              src={toYouTubeEmbed(video.videoUrl)}
                              className="w-full h-full"
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : (
                            <video 
                              controls 
                              className="w-full h-full"
                              poster="/placeholder.svg"
                              crossOrigin="anonymous"
                              playsInline
                              onError={() =>
                                toast({
                                  title: "Video failed to load",
                                  description: "Use a direct http(s) video link or YouTube URL, or upload via the chooser.",
                                  variant: "destructive",
                                })
                              }
                            >
                              <source src={video.videoUrl} type="video/mp4" />
                              <source src={video.videoUrl} type="video/webm" />
                              <source src={video.videoUrl} type="video/ogg" />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                        <h3 className="font-semibold mb-2">{video.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{video.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(video.uploadedAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline">Class {student.class}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ScrollToTop />
      <ChatBot studentId={studentId} studentClass={student.class.toString()} />
    </div>
  );
};

export default StudentDashboard;