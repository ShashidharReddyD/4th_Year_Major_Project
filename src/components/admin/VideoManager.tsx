import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Video, Play, Upload, Trash2 } from 'lucide-react';
import { xmlStorage, VideoLecture } from '../../data/xmlStorage';
import { useToast } from "@/hooks/use-toast";

interface VideoManagerProps {
  onDataUpdate: () => void;
}

const VideoManager: React.FC<VideoManagerProps> = ({ onDataUpdate }) => {
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    class: 1,
    videoUrl: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    const data = xmlStorage.loadData();
    setVideos(data.videos);
  };

  const getFilteredVideos = () => {
    if (selectedClass === 'all') {
      return videos;
    }
    return videos.filter(video => video.class === parseInt(selectedClass));
  };

  const handleCreateVideo = async () => {
    if (!newVideo.title.trim() || !newVideo.description.trim() || !newVideo.videoUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    if (!isValidUrl(newVideo.videoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    const video: VideoLecture = {
      videoId: '', // Will be set by xmlStorage
      title: newVideo.title,
      description: newVideo.description,
      class: newVideo.class,
      videoUrl: newVideo.videoUrl,
      uploadedAt: '' // Will be set by xmlStorage
    };

    const success = xmlStorage.addVideo(video);
    
    if (success) {
      toast({
        title: "Video Added",
        description: `Video "${video.title}" has been added for Class ${video.class}.`,
      });
      
      // Reset form
      setNewVideo({
        title: '',
        description: '',
        class: 1,
        videoUrl: ''
      });
      
      setIsCreateDialogOpen(false);
      loadVideos();
      onDataUpdate();
    } else {
      toast({
        title: "Error",
        description: "Failed to add video.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Use an object URL so the selected local file can play in-browser for this session
      const objectUrl = URL.createObjectURL(file);
      setNewVideo(prev => ({ ...prev, videoUrl: objectUrl }));
      
      toast({
        title: "File Selected",
        description: `Using local file "${file.name}" for this session.`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file.",
        variant: "destructive",
      });
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // If it's not a URL, check if it's a file path-like string
      return string.includes('.') && !string.includes(' ');
    }
  };

  // Helpers to support YouTube embeds
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

  const getVideoStats = () => {
    const filteredVideos = getFilteredVideos();
    const totalVideos = filteredVideos.length;
    
    // Count videos per class
    const videosByClass: { [key: number]: number } = {};
    for (let i = 1; i <= 7; i++) {
      videosByClass[i] = videos.filter(v => v.class === i).length;
    }
    
    return {
      totalVideos,
      videosByClass
    };
  };

  const deleteVideo = (videoId: string) => {
    const data = xmlStorage.loadData();
    data.videos = data.videos.filter((video: VideoLecture) => video.videoId !== videoId);
    
    if (xmlStorage.saveData(data)) {
      toast({
        title: "Video Deleted",
        description: "Video has been removed successfully.",
      });
      loadVideos();
      onDataUpdate();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const filteredVideos = getFilteredVideos();
  const stats = getVideoStats();

  return (
    <div className="space-y-6">
      {/* Video Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-educational">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalVideos}</div>
                <div className="text-sm text-muted-foreground">Total Videos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {[1, 2, 3].map(classNum => (
          <Card key={classNum} className="card-educational">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-secondary" />
                <div>
                  <div className="text-2xl font-bold text-secondary">{stats.videosByClass[classNum] || 0}</div>
                  <div className="text-sm text-muted-foreground">Class {classNum} Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Class Stats */}
      <Card className="card-educational">
        <CardHeader>
          <CardTitle>Videos Distribution by Class</CardTitle>
          <CardDescription>Number of video lectures available for each class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(classNum => (
              <div key={classNum} className="text-center p-4 border border-border rounded-lg bg-muted/30">
                <div className="text-xl font-bold text-primary">Class {classNum}</div>
                <div className="text-2xl font-semibold">{stats.videosByClass[classNum] || 0}</div>
                <div className="text-sm text-muted-foreground">videos</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Management */}
      <Card className="card-educational">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Lecture Management</CardTitle>
              <CardDescription>Upload and manage video lectures for all classes</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Video Lecture</DialogTitle>
                  <DialogDescription>
                    Upload a video file or provide a video URL for students to access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="form-group">
                    <label className="text-sm font-medium mb-2 block">Video Title</label>
                    <Input
                      placeholder="Enter video title..."
                      value={newVideo.title}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Enter video description..."
                      value={newVideo.description}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="text-sm font-medium mb-2 block">Class</label>
                    <Select
                      value={newVideo.class.toString()}
                      onValueChange={(value) => setNewVideo(prev => ({ ...prev, class: parseInt(value) }))}
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
                    <label className="text-sm font-medium mb-2 block">Video Source</label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Upload Video File</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="btn-secondary cursor-pointer inline-flex items-center space-x-2 px-4 py-2 text-sm rounded-lg"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Choose Video File</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Video URL</label>
                        <Input
                          placeholder="https://example.com/video.mp4 or YouTube URL..."
                          value={newVideo.videoUrl}
                          onChange={(e) => setNewVideo(prev => ({ ...prev, videoUrl: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="btn-hero" onClick={handleCreateVideo}>
                    Add Video
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

          {/* Video List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No videos found</p>
                <p className="text-sm text-muted-foreground">Add your first video lecture to get started</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <Card key={video.videoId} className="border border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center relative">
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Class {video.class}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg leading-tight">{video.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Added: {new Date(video.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="btn-hero flex items-center space-x-1">
                            <Play className="h-3 w-3" />
                            <span>Preview</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>{video.title}</DialogTitle>
                            <DialogDescription>{video.description}</DialogDescription>
                          </DialogHeader>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                                    description: "For local files, use the chooser. For online, use a direct http(s) video link or YouTube URL.",
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
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteVideo(video.videoId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManager;