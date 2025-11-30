import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Clock, User, BookOpen, Save, Edit } from 'lucide-react';
import { xmlStorage, TimetableEntry } from '../../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";

const TimetableManager: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('1');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  
  // Form state for editing
  const [entryForm, setEntryForm] = useState({
    day: '',
    timeSlot: '',
    subject: '',
    teacher: ''
  });
  
  const { toast } = useToast();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:30-12:30', '12:30-13:30', '14:30-15:30'];
  const subjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 
    'Art & Craft', 'Physical Education', 'Computer Science', 'Music', 'Drawing'
  ];
  const teachers = [
    'Ms. Sharma', 'Mr. Kumar', 'Ms. Patel', 'Mr. Singh', 'Ms. Gupta', 
    'Mr. Verma', 'Ms. Joshi', 'Mr. Agarwal', 'Ms. Rao', 'Mr. Mehta'
  ];

  useEffect(() => {
    loadTimetable();
  }, [selectedClass]);

  const loadTimetable = () => {
    const classTimetable = xmlStorage.getTimetableByClass(parseInt(selectedClass));
    setTimetable(classTimetable);
  };

  const getTimetableMatrix = () => {
    const matrix: { [key: string]: TimetableEntry } = {};
    
    timetable.forEach(entry => {
      const key = `${entry.day}-${entry.timeSlot}`;
      matrix[key] = entry;
    });
    
    return matrix;
  };

  const handleEditEntry = (day: string, timeSlot: string) => {
    const matrix = getTimetableMatrix();
    const key = `${day}-${timeSlot}`;
    const existingEntry = matrix[key];
    
    if (existingEntry) {
      setEditingEntry(existingEntry);
      setEntryForm({
        day: existingEntry.day,
        timeSlot: existingEntry.timeSlot,
        subject: existingEntry.subject,
        teacher: existingEntry.teacher
      });
    } else {
      setEditingEntry(null);
      setEntryForm({
        day,
        timeSlot,
        subject: '',
        teacher: ''
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const handleSaveEntry = () => {
    if (!entryForm.subject.trim() || !entryForm.teacher.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select both subject and teacher.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: TimetableEntry = {
      class: parseInt(selectedClass),
      day: entryForm.day,
      timeSlot: entryForm.timeSlot,
      subject: entryForm.subject,
      teacher: entryForm.teacher
    };

    // Get current timetable for the class
    const currentTimetable = xmlStorage.getTimetableByClass(parseInt(selectedClass));
    
    // Remove existing entry for this day/time slot if it exists
    const filteredTimetable = currentTimetable.filter(entry => 
      !(entry.day === entryForm.day && entry.timeSlot === entryForm.timeSlot)
    );
    
    // Add the new entry
    const updatedTimetable = [...filteredTimetable, newEntry];
    
    // Save to storage
    const success = xmlStorage.updateTimetable(parseInt(selectedClass), updatedTimetable);
    
    if (success) {
      toast({
        title: "Timetable Updated",
        description: `${entryForm.subject} scheduled for ${entryForm.day} at ${entryForm.timeSlot}`,
      });
      
      setIsEditDialogOpen(false);
      loadTimetable();
    } else {
      toast({
        title: "Error",
        description: "Failed to update timetable.",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = (day: string, timeSlot: string) => {
    const currentTimetable = xmlStorage.getTimetableByClass(parseInt(selectedClass));
    const filteredTimetable = currentTimetable.filter(entry => 
      !(entry.day === day && entry.timeSlot === timeSlot)
    );
    
    const success = xmlStorage.updateTimetable(parseInt(selectedClass), filteredTimetable);
    
    if (success) {
      toast({
        title: "Entry Deleted",
        description: `Removed entry for ${day} at ${timeSlot}`,
      });
      loadTimetable();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      });
    }
  };

  const generateDefaultTimetable = () => {
    const newTimetable: TimetableEntry[] = [];
    
    days.forEach((day, dayIndex) => {
      timeSlots.forEach((timeSlot, slotIndex) => {
        const subjectIndex = (dayIndex * timeSlots.length + slotIndex) % subjects.length;
        const teacherIndex = (dayIndex * timeSlots.length + slotIndex) % teachers.length;
        
        newTimetable.push({
          class: parseInt(selectedClass),
          day,
          timeSlot,
          subject: subjects[subjectIndex],
          teacher: teachers[teacherIndex]
        });
      });
    });
    
    const success = xmlStorage.updateTimetable(parseInt(selectedClass), newTimetable);
    
    if (success) {
      toast({
        title: "Default Timetable Generated",
        description: `Generated default timetable for Class ${selectedClass}`,
      });
      loadTimetable();
    } else {
      toast({
        title: "Error",
        description: "Failed to generate default timetable.",
        variant: "destructive",
      });
    }
  };

  const timetableMatrix = getTimetableMatrix();

  return (
    <div className="space-y-6">
      {/* Timetable Overview */}
      <Card className="card-educational">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Timetable Management</CardTitle>
              <CardDescription>Manage weekly schedules for all classes</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-32">
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
              <Button 
                variant="outline" 
                onClick={generateDefaultTimetable}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Default</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Timetable Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-center font-semibold">
                  Time / Day
                </div>
                {days.map(day => (
                  <div key={day} className="p-3 bg-primary/10 rounded-lg text-center font-semibold">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Timetable Rows */}
              {timeSlots.map(timeSlot => (
                <div key={timeSlot} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="p-3 bg-muted/50 rounded-lg text-center font-medium text-sm">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    {timeSlot}
                  </div>
                  {days.map(day => {
                    const key = `${day}-${timeSlot}`;
                    const entry = timetableMatrix[key];
                    
                    return (
                      <div
                        key={key}
                        className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer min-h-[80px]"
                        onClick={() => handleEditEntry(day, timeSlot)}
                      >
                        {entry ? (
                          <div className="text-center">
                            <div className="font-semibold text-sm mb-1">{entry.subject}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <User className="h-3 w-3 mr-1" />
                              {entry.teacher}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Plus className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <div className="text-xs">Add Class</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Click on any time slot to add or edit a class
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Class {selectedClass} Weekly Schedule</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Class' : 'Add Class'}
            </DialogTitle>
            <DialogDescription>
              {entryForm.day} at {entryForm.timeSlot} - Class {selectedClass}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="form-group">
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select
                value={entryForm.subject}
                onValueChange={(value) => setEntryForm(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="form-group">
              <label className="text-sm font-medium mb-2 block">Teacher</label>
              <Select
                value={entryForm.teacher}
                onValueChange={(value) => setEntryForm(prev => ({ ...prev, teacher: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher} value={teacher}>
                      {teacher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {editingEntry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteEntry(entryForm.day, entryForm.timeSlot)}
                  className="text-destructive hover:text-destructive"
                >
                  Delete Entry
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-success" onClick={handleSaveEntry}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timetable Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{timetable.length}</div>
                <div className="text-sm text-muted-foreground">Classes Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {new Set(timetable.map(t => t.teacher)).size}
                </div>
                <div className="text-sm text-muted-foreground">Teachers Assigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">
                  {new Set(timetable.map(t => t.subject)).size}
                </div>
                <div className="text-sm text-muted-foreground">Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">
                  {Math.round((timetable.length / (days.length * timeSlots.length)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Schedule Filled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimetableManager;