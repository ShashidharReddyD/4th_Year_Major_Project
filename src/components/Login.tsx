import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { xmlStorage } from '../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";
interface LoginProps {
  onAdminLogin: (adminId: string) => void;
  onStudentLogin: (studentId: string) => void;
}
const Login: React.FC<LoginProps> = ({
  onAdminLogin,
  onStudentLogin
}) => {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const admin = xmlStorage.authenticateAdmin(adminId, adminPassword);
      if (admin) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${admin.name}!`
        });
        onAdminLogin(admin.adminId);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid admin credentials. Try adminId: admin001, password: admin123",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const student = xmlStorage.authenticateStudent(studentId, studentPassword);
      if (student) {
        toast({
          title: "Login Successful",
          description: `Welcome, ${student.name}!`
        });
        onStudentLogin(student.studentId);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid student credentials. Try studentId: 20250101, password: student123",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-3 sm:p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">PRESIDENCY PORTAL</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Interactive Software Tool for Primary School</p>
        </div>

        <Card className="card-educational">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="text-sm">Student Login</TabsTrigger>
                <TabsTrigger value="admin" className="text-sm">Admin Login</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="studentId" className="text-sm font-medium text-foreground mb-2 block">
                      Student ID
                    </label>
                    <Input id="studentId" type="text" placeholder="e.g., 20250101" value={studentId} onChange={e => setStudentId(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="studentPassword" className="text-sm font-medium text-foreground mb-2 block">
                      Password
                    </label>
                    <Input id="studentPassword" type="password" placeholder="Enter your password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)} className="form-input" required />
                  </div>
                  <Button type="submit" className="btn-hero w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In as Student'}
                  </Button>
                </form>
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Student ID: 20250101 (Class 1, Student 1)</p>
                  <p>Password: student123</p>
                </div>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="adminId" className="text-sm font-medium text-foreground mb-2 block">
                      Admin ID
                    </label>
                    <Input id="adminId" type="text" placeholder="Enter admin ID" value={adminId} onChange={e => setAdminId(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminPassword" className="text-sm font-medium text-foreground mb-2 block">
                      Password
                    </label>
                    <Input id="adminPassword" type="password" placeholder="Enter your password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="form-input" required />
                  </div>
                  <Button type="submit" className="btn-secondary w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In as Admin'}
                  </Button>
                </form>
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Admin ID: admin001</p>
                  <p>Password: admin123</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground px-2">
          <p className="mb-1">Class Structure: 20 students per class (Classes 1-7)</p>
          <p className="break-words">Student IDs: 20250101-20250120 (Class 1), 20250201-20250220 (Class 2), etc.</p>
        </div>
      </div>
    </div>;
};
export default Login;