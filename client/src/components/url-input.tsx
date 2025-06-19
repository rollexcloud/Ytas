import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Youtube } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoData } from "@/pages/home";

interface UrlInputProps {
  onVideoAnalyzed: (data: VideoData) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export default function UrlInput({ onVideoAnalyzed, isAnalyzing, setIsAnalyzing }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/analyze", { url });
      return await response.json();
    },
    onSuccess: (data: VideoData) => {
      onVideoAnalyzed(data);
      setError("");
      toast({
        title: "Video analyzed successfully!",
        description: "Choose your preferred download format below.",
      });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to analyze video";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
    }
  });

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      return "Please enter a YouTube URL";
    }
    if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
      return "Please enter a valid YouTube URL";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setError("");
    analyzeMutation.mutate(url);
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
      <CardContent className="p-0">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enter YouTube URL</h3>
          <p className="text-gray-600">Paste the YouTube video link below to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 text-lg pr-12"
                disabled={isAnalyzing}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isAnalyzing}
              className="px-8 py-3 text-lg font-medium min-w-fit"
            >
              <Search className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          
          {error && (
            <div className="text-destructive text-sm">
              <span className="mr-1">⚠️</span>
              {error}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
