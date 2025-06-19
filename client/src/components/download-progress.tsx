import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";
import type { DownloadData } from "@/pages/home";

interface DownloadProgressProps {
  downloadData: DownloadData;
  onComplete: () => void;
}

export default function DownloadProgress({ downloadData, onComplete }: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState("0 MB/s");

  useEffect(() => {
    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15;
        const newProgress = Math.min(prev + increment, 100);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
        
        // Simulate speed
        setSpeed(`${(Math.random() * 3 + 0.5).toFixed(1)} MB/s`);
        
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <Card className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <CardContent className="p-0">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">Downloading...</h4>
          <p className="text-gray-600 mb-6">
            Processing: {downloadData.filename} - {downloadData.quality}
          </p>
          
          <Progress value={progress} className="w-full mb-4" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{Math.round(progress)}% Complete</span>
            <span>{speed}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
