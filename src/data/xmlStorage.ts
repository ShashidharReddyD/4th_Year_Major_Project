// XML-based data storage utility for the school management system

export interface Admin {
  adminId: string;
  name: string;
  email: string;
  password: string;
}

export interface Student {
  studentId: string;
  name: string;
  class: number;
  password: string;
  parentEmail?: string;
}

export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'present' | 'absent';
}

export interface Assignment {
  assignmentId: string;
  class: number;
  title: string;
  description: string;
  deadline: string;
  fileUrl?: string;
}

export interface Submission {
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  submittedAt: string;
}

export interface VideoLecture {
  videoId: string;
  class: number;
  title: string;
  description: string;
  videoUrl: string;
  uploadedAt: string;
}

export interface TimetableEntry {
  class: number;
  day: string;
  timeSlot: string;
  subject: string;
  teacher: string;
}

class XMLStorage {
  private storageKey = 'school_management_data';

  // Initialize default data structure
  private getDefaultData() {
    return {
      admins: [
        {
          adminId: 'admin001',
          name: 'School Administrator',
          email: 'admin@school.com',
          password: 'admin123'
        }
      ] as Admin[],
      students: this.generateDefaultStudents(),
      attendance: [] as AttendanceRecord[],
      assignments: [] as Assignment[],
      submissions: [] as Submission[],
      videos: [] as VideoLecture[],
      timetable: this.generateDefaultTimetable()
    };
  }

  // Generate 20 students per class (Classes 1-7)
  private generateDefaultStudents(): Student[] {
    const students: Student[] = [];
    const names = [
      'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya',
      'Aditi', 'Ananya', 'Aadhya', 'Kiara', 'Diya', 'Saanvi', 'Aarohi', 'Kavya', 'Myra', 'Pihu'
    ];

    for (let classNum = 1; classNum <= 7; classNum++) {
      for (let studentNum = 1; studentNum <= 20; studentNum++) {
        const studentId = `2025${classNum.toString().padStart(2, '0')}${studentNum.toString().padStart(2, '0')}`;
        const nameIndex = (studentNum - 1) % names.length;
        students.push({
          studentId,
          name: `${names[nameIndex]} (Class ${classNum})`,
          class: classNum,
          password: 'student123'
        });
      }
    }
    return students;
  }

  // Generate default timetable
  private generateDefaultTimetable(): TimetableEntry[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['09:00-10:00', '10:00-11:00', '11:30-12:30', '12:30-13:30', '14:30-15:30'];
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Art', 'Physical Education'];
    const teachers = ['Ms. Sharma', 'Mr. Kumar', 'Ms. Patel', 'Mr. Singh', 'Ms. Gupta', 'Mr. Verma', 'Ms. Joshi'];

    const timetable: TimetableEntry[] = [];

    for (let classNum = 1; classNum <= 7; classNum++) {
      days.forEach(day => {
        timeSlots.forEach((timeSlot, index) => {
          timetable.push({
            class: classNum,
            day,
            timeSlot,
            subject: subjects[index % subjects.length],
            teacher: teachers[index % teachers.length]
          });
        });
      });
    }

    return timetable;
  }

  // Load data from localStorage (simulating XML)
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.getDefaultData();
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getDefaultData();
    }
  }

  // Save data to localStorage (simulating XML)
  saveData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Initialize data if not exists
  initializeData() {
    const existingData = localStorage.getItem(this.storageKey);
    if (!existingData) {
      this.saveData(this.getDefaultData());
    }
  }

  // Authentication methods
  authenticateAdmin(adminId: string, password: string): Admin | null {
    const data = this.loadData();
    return data.admins.find((admin: Admin) => 
      admin.adminId === adminId && admin.password === password
    ) || null;
  }

  authenticateStudent(studentId: string, password: string): Student | null {
    const data = this.loadData();
    return data.students.find((student: Student) => 
      student.studentId === studentId && student.password === password
    ) || null;
  }

  // Student methods
  getStudentsByClass(classNum: number): Student[] {
    const data = this.loadData();
    return data.students.filter((student: Student) => student.class === classNum);
  }

  getStudent(studentId: string): Student | null {
    const data = this.loadData();
    return data.students.find((student: Student) => student.studentId === studentId) || null;
  }

  addStudent(student: Student) {
    const data = this.loadData();
    data.students.push(student);
    return this.saveData(data);
  }

  deleteStudent(studentId: string) {
    const data = this.loadData();
    data.students = data.students.filter((student: Student) => student.studentId !== studentId);
    // Also remove related data
    data.attendance = data.attendance.filter((record: AttendanceRecord) => record.studentId !== studentId);
    data.submissions = data.submissions.filter((sub: Submission) => sub.studentId !== studentId);
    return this.saveData(data);
  }

  updateStudentClass(studentId: string, newClass: number) {
    const data = this.loadData();
    const student = data.students.find((s: Student) => s.studentId === studentId);
    if (student) {
      student.class = newClass;
      return this.saveData(data);
    }
    return false;
  }

  updateStudentPassword(studentId: string, newPassword: string) {
    const data = this.loadData();
    const student = data.students.find((s: Student) => s.studentId === studentId);
    if (student) {
      student.password = newPassword;
      return this.saveData(data);
    }
    return false;
  }

  // Attendance methods
  markAttendance(studentId: string, date: string, status: 'present' | 'absent') {
    const data = this.loadData();
    
    // Remove existing attendance for same student and date
    data.attendance = data.attendance.filter((record: AttendanceRecord) => 
      !(record.studentId === studentId && record.date === date)
    );
    
    // Add new attendance record
    data.attendance.push({ studentId, date, status });
    return this.saveData(data);
  }

  getStudentAttendance(studentId: string): AttendanceRecord[] {
    const data = this.loadData();
    return data.attendance.filter((record: AttendanceRecord) => record.studentId === studentId);
  }

  getAttendanceByClass(classNum: number): AttendanceRecord[] {
    const data = this.loadData();
    const classStudents = this.getStudentsByClass(classNum);
    const studentIds = classStudents.map(s => s.studentId);
    return data.attendance.filter((record: AttendanceRecord) => studentIds.includes(record.studentId));
  }

  // Assignment methods
  addAssignment(assignment: Assignment) {
    const data = this.loadData();
    assignment.assignmentId = `assign_${Date.now()}`;
    data.assignments.push(assignment);
    return this.saveData(data);
  }

  getAssignmentsByClass(classNum: number): Assignment[] {
    const data = this.loadData();
    return data.assignments.filter((assignment: Assignment) => assignment.class === classNum);
  }

  // Video methods
  addVideo(video: VideoLecture) {
    const data = this.loadData();
    video.videoId = `video_${Date.now()}`;
    video.uploadedAt = new Date().toISOString();
    data.videos.push(video);
    return this.saveData(data);
  }

  getVideosByClass(classNum: number): VideoLecture[] {
    const data = this.loadData();
    return data.videos.filter((video: VideoLecture) => video.class === classNum);
  }

  // Timetable methods
  getTimetableByClass(classNum: number): TimetableEntry[] {
    const data = this.loadData();
    return data.timetable.filter((entry: TimetableEntry) => entry.class === classNum);
  }

  updateTimetable(classNum: number, timetableEntries: TimetableEntry[]) {
    const data = this.loadData();
    
    // Remove existing timetable for this class
    data.timetable = data.timetable.filter((entry: TimetableEntry) => entry.class !== classNum);
    
    // Add new timetable entries
    data.timetable.push(...timetableEntries);
    return this.saveData(data);
  }

  // Submission methods
  submitAssignment(submission: Submission) {
    const data = this.loadData();
    
    // Remove existing submission for same assignment and student
    data.submissions = data.submissions.filter((sub: Submission) => 
      !(sub.assignmentId === submission.assignmentId && sub.studentId === submission.studentId)
    );
    
    submission.submittedAt = new Date().toISOString();
    data.submissions.push(submission);
    return this.saveData(data);
  }

  getSubmissions(assignmentId: string): Submission[] {
    const data = this.loadData();
    return data.submissions.filter((sub: Submission) => sub.assignmentId === assignmentId);
  }

  getStudentSubmissions(studentId: string): Submission[] {
    const data = this.loadData();
    return data.submissions.filter((sub: Submission) => sub.studentId === studentId);
  }
}

export const xmlStorage = new XMLStorage();

// Initialize data on first load
xmlStorage.initializeData();