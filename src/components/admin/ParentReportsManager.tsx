import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Mail, TrendingUp, TrendingDown, Minus, FileText, BarChart3, Send, Users, Eye, Edit } from 'lucide-react';
import { xmlStorage, Student, AttendanceRecord, Assignment, Submission } from '../../data/xmlStorage';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ParentReportsManagerProps {
  onDataUpdate: () => void;
}

interface StudentReport {
  student: Student;
  attendancePercentage: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  assignmentsTotal: number;
  assignmentsSubmitted: number;
  assignmentsPending: number;
  chatbotUsage: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  focusAreas: string[];
}

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--primary))'];

const ParentReportsManager: React.FC<ParentReportsManagerProps> = ({ onDataUpdate }) => {
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [reportData, setReportData] = useState<StudentReport | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [generatingForStudent, setGeneratingForStudent] = useState<string>('');

  useEffect(() => {
    loadStudents();
  }, [selectedClass]);

  const loadStudents = () => {
    const classStudents = xmlStorage.getStudentsByClass(selectedClass);
    setStudents(classStudents);
    setReportData(null);
  };

  const generateReportData = (studentId: string): StudentReport => {
    const data = xmlStorage.loadData();
    const student = xmlStorage.getStudent(studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }

    // Calculate attendance
    const attendance = xmlStorage.getStudentAttendance(studentId);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentAttendance = attendance.filter(record => 
      new Date(record.date) >= last30Days
    );
    
    const presentDays = recentAttendance.filter(r => r.status === 'present').length;
    const totalDays = recentAttendance.length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate assignments
    const classAssignments = xmlStorage.getAssignmentsByClass(student.class);
    const studentSubmissions = xmlStorage.getStudentSubmissions(studentId);
    const assignmentsSubmitted = studentSubmissions.length;
    const assignmentsPending = classAssignments.length - assignmentsSubmitted;

    // Simulate chatbot usage (in a real app, this would be tracked)
    const chatbotUsage = Math.floor(Math.random() * 50) + 10; // 10-60 interactions

    // Determine weekly trend
    const lastWeekAttendance = recentAttendance.slice(-7);
    const lastWeekPresent = lastWeekAttendance.filter(r => r.status === 'present').length;
    const lastWeekPercentage = lastWeekAttendance.length > 0 
      ? (lastWeekPresent / lastWeekAttendance.length) * 100 
      : 0;
    
    let weeklyTrend: 'up' | 'down' | 'stable' = 'stable';
    if (lastWeekPercentage > attendancePercentage + 5) weeklyTrend = 'up';
    else if (lastWeekPercentage < attendancePercentage - 5) weeklyTrend = 'down';

    // Determine focus areas
    const focusAreas: string[] = [];
    if (attendancePercentage < 75) focusAreas.push('Improve Attendance');
    if (assignmentsPending > classAssignments.length * 0.3) focusAreas.push('Complete Pending Assignments');
    if (chatbotUsage < 20) focusAreas.push('Increase Learning Engagement');
    if (focusAreas.length === 0) focusAreas.push('Maintain Excellent Performance');

    return {
      student,
      attendancePercentage,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      assignmentsTotal: classAssignments.length,
      assignmentsSubmitted,
      assignmentsPending,
      chatbotUsage,
      weeklyTrend,
      focusAreas
    };
  };

  const handleGenerateReport = (studentId: string) => {
    setGeneratingForStudent(studentId);
    try {
      const report = generateReportData(studentId);
      setReportData(report);
      setShowReportDialog(true);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setGeneratingForStudent('');
    }
  };

  const handleOpenEmailDialog = (student: Student) => {
    setSelectedStudentId(student.studentId);
    setParentEmail(student.parentEmail || '');
    setShowEmailDialog(true);
  };

  const saveParentEmail = () => {
    if (!selectedStudentId || !parentEmail) return;
    
    const data = xmlStorage.loadData();
    const studentIndex = data.students.findIndex(s => s.studentId === selectedStudentId);
    
    if (studentIndex !== -1) {
      data.students[studentIndex].parentEmail = parentEmail;
      xmlStorage.saveData(data);
      toast.success('Parent email saved successfully');
      setShowEmailDialog(false);
      loadStudents();
      onDataUpdate();
    }
  };

  const generatePDF = (report: StudentReport): jsPDF => {
    const doc = new jsPDF();
    const { student, attendancePercentage, presentDays, totalDays, assignmentsSubmitted, assignmentsTotal, chatbotUsage, focusAreas } = report;

    // Header
    doc.setFillColor(66, 133, 244); // Primary color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('PRESIDENCY SCHOOL', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Weekly Progress Report', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 33, { align: 'center' });

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Student Information', 20, 55);
    
    doc.setFontSize(11);
    doc.text(`Name: ${student.name}`, 20, 65);
    doc.text(`Student ID: ${student.studentId}`, 20, 72);
    doc.text(`Class: ${student.class}`, 20, 79);

    // Performance Summary
    doc.setFontSize(16);
    doc.text('Performance Summary', 20, 95);

    const summaryData = [
      ['Metric', 'Value', 'Status'],
      ['Attendance Rate', `${attendancePercentage.toFixed(1)}%`, attendancePercentage >= 75 ? 'Good' : 'Needs Improvement'],
      ['Days Present', `${presentDays}/${totalDays}`, '-'],
      ['Assignments Submitted', `${assignmentsSubmitted}/${assignmentsTotal}`, assignmentsSubmitted >= assignmentsTotal * 0.7 ? 'Good' : 'Needs Improvement'],
      ['Learning Engagement', `${chatbotUsage} interactions`, chatbotUsage >= 30 ? 'Excellent' : 'Good']
    ];

    autoTable(doc, {
      startY: 100,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244] },
      styles: { fontSize: 10 }
    });

    // Focus Areas
    const finalY = (doc as any).lastAutoTable.finalY || 160;
    doc.setFontSize(16);
    doc.text('Recommended Focus Areas', 20, finalY + 15);
    
    doc.setFontSize(11);
    focusAreas.forEach((area, index) => {
      doc.text(`${index + 1}. ${area}`, 25, finalY + 25 + (index * 7));
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an automated report generated by the Presidency School Portal', 105, 280, { align: 'center' });
    doc.text('For queries, please contact the school administration', 105, 285, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = (studentId: string) => {
    try {
      const report = generateReportData(studentId);
      const doc = generatePDF(report);
      doc.save(`${report.student.name.replace(/\s+/g, '_')}_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error(error);
    }
  };

  const handleEmailReport = async (studentId: string, email?: string) => {
    const student = xmlStorage.getStudent(studentId);
    const emailToUse = email || student?.parentEmail;
    
    if (!emailToUse) {
      toast.error('Please add parent email address first');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    
    try {
      const report = generateReportData(studentId);
      const doc = generatePDF(report);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const { data, error } = await supabase.functions.invoke('send-parent-report', {
        body: {
          to: emailToUse,
          studentName: report.student.name,
          className: report.student.class.toString(),
          pdfBase64,
          customMessage: customMessage || undefined,
          reportData: {
            attendancePercentage: report.attendancePercentage,
            presentDays: report.presentDays,
            totalDays: report.totalDays,
            assignmentsSubmitted: report.assignmentsSubmitted,
            assignmentsTotal: report.assignmentsTotal,
            chatbotUsage: report.chatbotUsage,
            weeklyTrend: report.weeklyTrend,
            focusAreas: report.focusAreas,
          },
        },
      });

      if (error) throw error;

      toast.success(`Report sent successfully to ${emailToUse}`);
      setCustomMessage('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkEmailReports = async () => {
    const classStudents = xmlStorage.getStudentsByClass(selectedClass);
    const studentsWithEmails = classStudents.filter(s => s.parentEmail);

    if (studentsWithEmails.length === 0) {
      toast.error('No students in this class have parent emails configured');
      return;
    }

    const confirmSend = window.confirm(
      `Send reports to ${studentsWithEmails.length} parent(s) in Class ${selectedClass}?`
    );

    if (!confirmSend) return;

    setIsSendingBulk(true);
    let successCount = 0;
    let failCount = 0;

    toast.info(`Sending reports to ${studentsWithEmails.length} parents...`);

    for (const student of studentsWithEmails) {
      try {
        const report = generateReportData(student.studentId);
        const doc = generatePDF(report);
        const pdfBase64 = doc.output('datauristring').split(',')[1];

        const { error } = await supabase.functions.invoke('send-parent-report', {
          body: {
            to: student.parentEmail!,
            studentName: student.name,
            className: student.class.toString(),
            pdfBase64,
            customMessage: customMessage || undefined,
            reportData: {
              attendancePercentage: report.attendancePercentage,
              presentDays: report.presentDays,
              totalDays: report.totalDays,
              assignmentsSubmitted: report.assignmentsSubmitted,
              assignmentsTotal: report.assignmentsTotal,
              chatbotUsage: report.chatbotUsage,
              weeklyTrend: report.weeklyTrend,
              focusAreas: report.focusAreas,
            },
          },
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to send report for ${student.name}:`, error);
        failCount++;
      }
    }

    setIsSendingBulk(false);
    
    if (successCount > 0) {
      toast.success(`Successfully sent ${successCount} report(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send ${failCount} report(s)`);
    }
  };

  const getAttendanceChartData = () => {
    if (!reportData) return [];
    return [
      { name: 'Present', value: reportData.presentDays, fill: COLORS[0] },
      { name: 'Absent', value: reportData.absentDays, fill: COLORS[2] }
    ];
  };

  const getAssignmentChartData = () => {
    if (!reportData) return [];
    return [
      { name: 'Submitted', value: reportData.assignmentsSubmitted },
      { name: 'Pending', value: reportData.assignmentsPending }
    ];
  };

  const getTrendIcon = () => {
    if (!reportData) return null;
    switch (reportData.weeklyTrend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      default:
        return <Minus className="h-5 w-5 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-educational">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span>Parent Dashboard & Weekly Progress Reports</span>
            </div>
            <Button
              onClick={handleBulkEmailReports}
              disabled={isSendingBulk || students.filter(s => s.parentEmail).length === 0}
              className="btn-hero"
            >
              <Users className="h-4 w-4 mr-2" />
              {isSendingBulk ? 'Sending to All...' : 'Email All in Class'}
            </Button>
          </CardTitle>
          <CardDescription>
            Generate and send comprehensive weekly reports to parents showing student performance and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Class</label>
            <Select value={selectedClass.toString()} onValueChange={(value) => setSelectedClass(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((classNum) => (
                  <SelectItem key={classNum} value={classNum.toString()}>
                    Class {classNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No students found in Class {selectedClass}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>
                        {student.parentEmail ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {student.parentEmail}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEmailDialog(student)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReport(student.studentId)}
                            disabled={generatingForStudent === student.studentId}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {generatingForStudent === student.studentId ? 'Loading...' : 'View'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(student.studentId)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEmailReport(student.studentId)}
                            disabled={!student.parentEmail || isSending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Edit Parent Email</DialogTitle>
            <DialogDescription>
              Enter the parent's email address to send progress reports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parent-email">Parent Email</Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveParentEmail}>
                Save Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Progress Report Preview</DialogTitle>
            <DialogDescription>
              Review the report before downloading or sending
            </DialogDescription>
          </DialogHeader>

          {reportData && (
            <div className="space-y-6 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="card-educational">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-primary">
                        {reportData.attendancePercentage.toFixed(1)}%
                      </div>
                      {getTrendIcon()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {reportData.presentDays}/{reportData.totalDays} days present
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-educational">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">
                      {reportData.assignmentsSubmitted}/{reportData.assignmentsTotal}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {reportData.assignmentsPending} pending
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-educational">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Learning Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success">
                      {reportData.chatbotUsage}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      AI chatbot interactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-educational">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon()}
                      <span className="text-2xl font-bold capitalize">
                        {reportData.weeklyTrend}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Compared to last week
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-educational">
                  <CardHeader>
                    <CardTitle>Attendance Overview</CardTitle>
                    <CardDescription>Last 30 days attendance breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getAttendanceChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getAttendanceChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="card-educational">
                  <CardHeader>
                    <CardTitle>Assignment Progress</CardTitle>
                    <CardDescription>Submitted vs pending assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getAssignmentChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Focus Areas */}
              <Card className="card-educational">
                <CardHeader>
                  <CardTitle>Recommended Focus Areas</CardTitle>
                  <CardDescription>Areas that need attention this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.focusAreas.map((area, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm font-medium">{area}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Configuration & Actions */}
              <Card className="card-educational">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="form-group">
                    <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Add a personal message for the parent..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => reportData && handleDownloadPDF(reportData.student.studentId)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      onClick={() => reportData && handleEmailReport(reportData.student.studentId)}
                      disabled={!reportData?.student.parentEmail || isSending}
                      className="flex-1 btn-hero"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Sending...' : 'Email Report'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentReportsManager;
