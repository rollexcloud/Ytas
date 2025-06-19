import Header from "@/components/header";
import Hero from "@/components/hero";
import UrlInput from "@/components/url-input";
import VideoInfo from "@/components/video-info";
import DownloadOptions from "@/components/download-options";
import DownloadProgress from "@/components/download-progress";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import Footer from "@/components/footer";
import { useState } from "react";

export interface VideoData {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
  description: string;
  formats: Array<{
    quality: string;
    container: string;
    filesize?: string;
    itag: number;
    type: 'video' | 'audio';
  }>;
}

export interface DownloadData {
  videoId: string;
  itag: number;
  format: 'video' | 'audio';
  quality: string;
  filename: string;
}

export default function Home() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleVideoAnalyzed = (data: VideoData) => {
    setVideoData(data);
  };

  const handleDownloadStart = (data: DownloadData) => {
    setDownloadData(data);
  };

  const handleDownloadComplete = () => {
    setDownloadData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <UrlInput 
          onVideoAnalyzed={handleVideoAnalyzed}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />
        
        {videoData && (
          <>
            <VideoInfo videoData={videoData} />
            <DownloadOptions 
              videoData={videoData}
              onDownloadStart={handleDownloadStart}
            />
          </>
        )}
        
        {downloadData && (
          <DownloadProgress 
            downloadData={downloadData}
            onComplete={handleDownloadComplete}
          />
        )}
        
        <Features />
        <HowItWorks />
      </main>
      
      <Footer />
    </div>
  );
}
