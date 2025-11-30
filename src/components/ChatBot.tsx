import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Mic, MicOff, Paperclip, MessageSquare, X, Minimize2, Maximize2, BookOpen, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { xmlStorage } from "@/data/xmlStorage";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  studentId: string;
  studentClass: string;
}

const ChatBot = ({ studentId, studentClass }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLearnMode, setIsLearnMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your PRESIDENCY PORTAL assistant. Ask me about your assignments, timetable, attendance, or switch to Learn Mode to ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Failed to recognize speech');
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      if (isLearnMode) {
        // Learn mode - ask any educational question
        const { data, error } = await supabase.functions.invoke('chat-assistant', {
          body: {
            message: userMessage,
            mode: 'learn'
          }
        });

        if (error) throw error;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || 'Sorry, I couldn\'t process that request.',
          timestamp: new Date()
        }]);
      } else {
        // Portal mode - student portal assistant
        const student = xmlStorage.getStudent(studentId);
        const classNumber = parseInt(studentClass);
        const assignments = xmlStorage.getAssignmentsByClass(classNumber);
        const attendance = xmlStorage.getStudentAttendance(studentId);
        const timetable = xmlStorage.getTimetableByClass(classNumber);

        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';

        const currentData = {
          student,
          assignments: assignments.map(a => ({
            title: a.title,
            description: a.description,
            deadline: a.deadline
          })),
          attendance: {
            percentage: attendancePercentage,
            totalDays,
            presentDays,
            absentDays: totalDays - presentDays
          },
          timetable: timetable.map(t => ({
            day: t.day,
            subject: t.subject,
            timeSlot: t.timeSlot,
            teacher: t.teacher
          }))
        };

        const { data, error } = await supabase.functions.invoke('chat-assistant', {
          body: {
            message: userMessage,
            studentId,
            studentClass,
            currentData,
            mode: 'portal'
          }
        });

        if (error) throw error;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || 'Sorry, I couldn\'t process that request.',
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      toast.info('Listening...');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.info(`File "${file.name}" selected. File uploads will be processed soon!`);
      // TODO: Implement file upload processing
    }
  };

  const handleModeSwitch = (checked: boolean) => {
    setIsLearnMode(checked);
    const modeMessage = checked 
      ? '🎓 Switched to Learn Mode! Ask me anything about maths, science, history, coding, or any topic you want to learn about!'
      : '📚 Switched to Portal Mode! I can help you with your assignments, timetable, and attendance.';
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: modeMessage,
      timestamp: new Date()
    }]);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 hover:scale-110"
      >
        <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed ${
      isMinimized 
        ? 'bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] max-w-xs md:w-80' 
        : 'bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-2rem)] md:h-[600px]'
    } shadow-2xl flex flex-col transition-all duration-300 z-50 border-2`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 md:p-4 border-b rounded-t-lg transition-colors duration-300 ${
        isLearnMode 
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
          : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
      }`}>
        <div className="flex items-center gap-2">
          {isLearnMode ? <GraduationCap className="h-4 w-4 md:h-5 md:w-5" /> : <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />}
          <span className="font-semibold text-sm md:text-base">{isLearnMode ? 'Learn Mode 🎓' : 'Portal Mode 📚'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mode Switch */}
      {!isMinimized && (
        <div className="px-3 md:px-4 py-2 md:py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <Label htmlFor="mode-switch" className="text-xs md:text-sm font-medium cursor-pointer">
                {isLearnMode ? 'Learning Assistant' : 'Portal Assistant'}
              </Label>
            </div>
            <Switch 
              id="mode-switch"
              checked={isLearnMode} 
              onCheckedChange={handleModeSwitch}
            />
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            {isLearnMode 
              ? 'Ask about any topic - maths, science, coding, history & more!'
              : 'Get help with assignments, timetable & attendance'}
          </p>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollAreaRef}>
            <div className="space-y-3 md:space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 shadow-sm ${
                      message.role === 'user'
                        ? isLearnMode 
                          ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                          : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                        : 'bg-muted border border-border'
                    }`}
                  >
                    <p className="text-xs md:text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-[10px] md:text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 md:p-4 border-t">
            <div className="flex gap-1.5 md:gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 h-9 w-9 md:h-10 md:w-10"
              >
                <Paperclip className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleRecording}
                className={`shrink-0 h-9 w-9 md:h-10 md:w-10 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Mic className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isLearnMode ? "Ask me anything..." : "Ask about assignments..."}
                disabled={isLoading}
                className="flex-1 text-xs md:text-sm h-9 md:h-10"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="shrink-0 h-9 w-9 md:h-10 md:w-10"
              >
                <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ChatBot;
