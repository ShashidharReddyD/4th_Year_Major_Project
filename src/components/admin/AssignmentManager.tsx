import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, BookOpen, Download, Users, Clock } from 'lucide-react';
import { format } from "date-fns";
import { xmlStorage, Assignment, Submission } from '../../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AssignmentManagerProps {
  onDataUpdate: () => void;
}

const AssignmentManager: React.FC<AssignmentManagerProps> = ({ onDataUpdate }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    class: 1,
    deadline: new Date()
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
    loadSubmissions();
  }, []);

  const loadAssignments = () => {
    const data = xmlStorage.loadData();
    setAssignments(data.assignments);
  };

  const loadSubmissions = () => {
    const data = xmlStorage.loadData();
    setSubmissions(data.submissions);
  };

  const getFilteredAssignments = () => {
    if (selectedClass === 'all') {
      return assignments;
    }
    return assignments.filter(assignment => assignment.class === parseInt(selectedClass));
  };

  const getAssignmentSubmissions = (assignmentId: string) => {
    return submissions.filter(sub => sub.assignmentId === assignmentId);
  };

  const getAssignmentStats = (assignment: Assignment) => {
    const assignmentSubmissions = getAssignmentSubmissions(assignment.assignmentId);
    const totalStudents = xmlStorage.getStudentsByClass(assignment.class).length;
    const submissionCount = assignmentSubmissions.length;
    const submissionRate = totalStudents > 0 ? Math.round((submissionCount / totalStudents) * 100) : 0;
    const isOverdue = new Date() > new Date(assignment.deadline);
    
    return {
      totalStudents,
      submissionCount,
      submissionRate,
      isOverdue,
      pending: totalStudents - submissionCount
    };
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const assignment: Assignment = {
      assignmentId: '', // Will be set by xmlStorage
      title: newAssignment.title,
      description: newAssignment.description,
      class: newAssignment.class,
      deadline: newAssignment.deadline.toISOString()
    };

    const success = xmlStorage.addAssignment(assignment);
    
    if (success) {
      toast({
        title: "Assignment Created",
        description: `Assignment "${assignment.title}" has been created for Class ${assignment.class}.`,
      });
      
      // Reset form
      setNewAssignment({
        title: '',
        description: '',
        class: 1,
        deadline: new Date()
      });
      
      setIsCreateDialogOpen(false);
      loadAssignments();
      onDataUpdate();
    } else {
      toast({
        title: "Error",
        description: "Failed to create assignment.",
        variant: "destructive",
      });
    }
  };

  const getOverallStats = () => {
    const filteredAssignments = getFilteredAssignments();
    const totalAssignments = filteredAssignments.length;
    const overdueAssignments = filteredAssignments.filter(a => new Date() > new Date(a.deadline)).length;
    const totalSubmissions = filteredAssignments.reduce((sum, assignment) => {
      return sum + getAssignmentSubmissions(assignment.assignmentId).length;
    }, 0);
    const totalPossibleSubmissions = filteredAssignments.reduce((sum, assignment) => {
      return sum + xmlStorage.getStudentsByClass(assignment.class).length;
    }, 0);
    
    const overallSubmissionRate = totalPossibleSubmissions > 0 ? 
      Math.round((totalSubmissions / totalPossibleSubmissions) * 100) : 0;

    return {
      totalAssignments,
      overdueAssignments,
      totalSubmissions,
      overallSubmissionRate
    };
  };

  const filteredAssignments = getFilteredAssignments();
  const overallStats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Assignment Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{overallStats.totalAssignments}</div>
                <div className="text-sm text-muted-foreground">Total Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{overallStats.totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">{overallStats.overdueAssignments}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold text-secondary">{overallStats.overallSubmissionRate}%</div>
                <div className="text-sm text-muted-foreground">Submission Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Management */}
      <Card className="card-educational">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assignment Management</CardTitle>
              <CardDescription>Create and manage assignments for all classes</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new assignment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="form-group">
                    <label className="text-sm font-medium mb-2 block">Assignment Title</label>
                    <Input
                      placeholder="Enter assignment title..."
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Enter assignment description and instructions..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="text-sm font-medium mb-2 block">Class</label>
                      <Select
                        value={newAssignment.class.toString()}
                        onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class: parseInt(value) }))}
                      >
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
                    
                    <div className="form-group">
                      <label className="text-sm font-medium mb-2 block">Deadline</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newAssignment.deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newAssignment.deadline ? format(newAssignment.deadline, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newAssignment.deadline}
                            onSelect={(date) => date && setNewAssignment(prev => ({ ...prev, deadline: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="btn-hero" onClick={handleCreateAssignment}>
                    Create Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Class Filter */}
          <div className="mb-6">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
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

          {/* Assignment List */}
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assignments found</p>
                <p className="text-sm text-muted-foreground">Create your first assignment to get started</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const stats = getAssignmentStats(assignment);
                return (
                  <Card key={assignment.assignmentId} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{assignment.title}</h3>
                            <Badge variant="outline">Class {assignment.class}</Badge>
                            {stats.isOverdue && (
                              <Badge className="badge-warning">Overdue</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{assignment.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Due: {format(new Date(assignment.deadline), 'PPP')}</span>
                            <span>•</span>
                            <span>{stats.submissionCount}/{stats.totalStudents} submitted</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Submission Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <div className="text-xl font-bold text-success">{stats.submissionCount}</div>
                          <div className="text-xs text-muted-foreground">Submitted</div>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <div className="text-xl font-bold text-warning">{stats.pending}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                          <div className="text-xl font-bold text-primary">{stats.submissionRate}%</div>
                          <div className="text-xs text-muted-foreground">Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentManager;