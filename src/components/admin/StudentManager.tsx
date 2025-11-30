import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Edit, Trash2, Key, UserCog, Mail } from 'lucide-react';
import { xmlStorage, Student } from '../../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";

interface StudentManagerProps {
  onDataUpdate: () => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ onDataUpdate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', class: '1', studentId: '', password: 'student123', parentEmail: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newClass, setNewClass] = useState('1');
  const [parentEmail, setParentEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedClass, searchTerm]);

  const loadStudents = () => {
    const data = xmlStorage.loadData();
    setStudents(data.students);
  };

  const filterStudents = () => {
    let filtered = students;

    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => student.class === parseInt(selectedClass));
    }

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
  };

  const getClassStats = () => {
    const stats = [];
    for (let classNum = 1; classNum <= 7; classNum++) {
      const classStudents = students.filter(s => s.class === classNum);
      stats.push({
        class: classNum,
        count: classStudents.length
      });
    }
    return stats;
  };

  const resetPassword = (studentId: string) => {
    if (xmlStorage.updateStudentPassword(studentId, 'student123')) {
      toast({
        title: "Password Reset",
        description: `Password reset to 'student123' for student ${studentId}`,
      });
      loadStudents();
      onDataUpdate();
    }
  };

  const setCustomPassword = () => {
    if (!selectedStudent || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive"
      });
      return;
    }

    if (xmlStorage.updateStudentPassword(selectedStudent.studentId, newPassword)) {
      toast({
        title: "Password Updated",
        description: `Password updated for ${selectedStudent.name}`,
      });
      setShowPasswordDialog(false);
      setNewPassword('');
      setSelectedStudent(null);
      loadStudents();
      onDataUpdate();
    }
  };

  const addStudent = () => {
    if (!newStudent.name || !newStudent.studentId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const student: Student = {
      studentId: newStudent.studentId,
      name: newStudent.name,
      class: parseInt(newStudent.class),
      password: newStudent.password,
      parentEmail: newStudent.parentEmail || undefined
    };

    if (xmlStorage.addStudent(student)) {
      toast({
        title: "Student Added",
        description: `${student.name} has been added to Class ${student.class}`,
      });
      setShowAddDialog(false);
      setNewStudent({ name: '', class: '1', studentId: '', password: 'student123', parentEmail: '' });
      loadStudents();
      onDataUpdate();
    }
  };

  const deleteStudent = (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student.name}? This will remove all their data.`)) {
      if (xmlStorage.deleteStudent(student.studentId)) {
        toast({
          title: "Student Deleted",
          description: `${student.name} has been removed from the system`,
        });
        loadStudents();
        onDataUpdate();
      }
    }
  };

  const changeStudentClass = () => {
    if (!selectedStudent) return;

    if (xmlStorage.updateStudentClass(selectedStudent.studentId, parseInt(newClass))) {
      toast({
        title: "Class Changed",
        description: `${selectedStudent.name} moved to Class ${newClass}`,
      });
      setShowClassDialog(false);
      setSelectedStudent(null);
      loadStudents();
      onDataUpdate();
    }
  };

  const updateParentEmail = () => {
    if (!selectedStudent) return;

    const data = xmlStorage.loadData();
    const studentIndex = data.students.findIndex((s: Student) => s.studentId === selectedStudent.studentId);
    
    if (studentIndex !== -1) {
      data.students[studentIndex].parentEmail = parentEmail || undefined;
      if (xmlStorage.saveData(data)) {
        toast({
          title: "Parent Email Updated",
          description: `Email updated for ${selectedStudent.name}`,
        });
        setShowEmailDialog(false);
        setSelectedStudent(null);
        setParentEmail('');
        loadStudents();
        onDataUpdate();
      }
    }
  };

  const classStats = getClassStats();

  return (
    <div className="space-y-6">
      {/* Class Statistics Overview */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Student Distribution by Class</CardTitle>
          <CardDescription>Overview of student enrollment across all classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {classStats.map((stat) => (
              <div key={stat.class} className="text-center p-4 border border-border rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">Class {stat.class}</div>
                <div className="text-lg font-semibold">{stat.count}</div>
                <div className="text-sm text-muted-foreground">students</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Management */}
      <Card className="card-educational">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>View and manage all student accounts</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Enter the details of the new student</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter full name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="e.g., 20250101"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentClass">Class</Label>
                    <Select value={newStudent.class} onValueChange={(value) => setNewStudent({ ...newStudent, class: value })}>
                      <SelectTrigger>
                        <SelectValue />
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
                  <div className="space-y-2">
                    <Label htmlFor="studentPassword">Default Password</Label>
                    <Input
                      id="studentPassword"
                      type="text"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      placeholder="parent@example.com"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={addStudent}>Add Student</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map(classNum => (
                  <SelectItem key={classNum} value={classNum.toString()}>
                    Class {classNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found matching your criteria
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.studentId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {student.name.split(' ')[0].charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {student.studentId}</span>
                        <Badge variant="outline">Class {student.class}</Badge>
                        {student.parentEmail && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.parentEmail}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setParentEmail(student.parentEmail || '');
                        setShowEmailDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      <span className="hidden sm:inline">Parent Email</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setNewPassword('');
                        setShowPasswordDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Key className="h-3 w-3" />
                      <span className="hidden sm:inline">Password</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setNewClass(student.class.toString());
                        setShowClassDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <UserCog className="h-3 w-3" />
                      <span className="hidden sm:inline">Class</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteStudent(student)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Student Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Total Students: <strong>{students.length}</strong></span>
              <span>Showing: <strong>{filteredStudents.length}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Custom Password</DialogTitle>
            <DialogDescription>
              Set a custom password for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="text"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={setCustomPassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Class Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Student Class</DialogTitle>
            <DialogDescription>
              Move {selectedStudent?.name} to a different class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newClass">Select New Class</Label>
              <Select value={newClass} onValueChange={setNewClass}>
                <SelectTrigger>
                  <SelectValue />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClassDialog(false)}>Cancel</Button>
            <Button onClick={changeStudentClass}>Change Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parent Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Parent Email</DialogTitle>
            <DialogDescription>
              Set or update the parent email for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parentEmailInput">Parent Email Address</Label>
              <Input
                id="parentEmailInput"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This email will be used to send weekly progress reports
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={updateParentEmail}>Update Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student ID Format Guide */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Student ID Format Guide</CardTitle>
          <CardDescription>Understanding the student ID structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">ID Format: 2025CCSS</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>2025</strong> - Academic Year</li>
                <li><strong>CC</strong> - Class Number (01-07)</li>
                <li><strong>SS</strong> - Student Number (01-20)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Examples:</h3>
              <ul className="space-y-1 text-sm font-mono">
                <li>20250101 - Class 1, Student 1</li>
                <li>20250120 - Class 1, Student 20</li>
                <li>20250201 - Class 2, Student 1</li>
                <li>20250720 - Class 7, Student 20</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManager;