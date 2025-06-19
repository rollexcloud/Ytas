import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Music, Download } from "lucide-react";
import type { VideoData, DownloadData } from "@/pages/home";

interface DownloadOptionsProps {
  videoData: VideoData;
  onDownloadStart: (data: DownloadData) => void;
}

export default function DownloadOptions({ videoData, onDownloadStart }: DownloadOptionsProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const videoFormats = videoData.formats.filter(f => f.type === 'video');
  const audioFormats = videoData.formats.filter(f => f.type === 'audio');

  const handleDownload = (format: any) => {
    const filename = `${videoData.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50)}.${format.type === 'audio' ? 'mp3' : 'mp4'}`;
    
    onDownloadStart({
      videoId: videoData.videoId,
      itag: format.itag,
      format: format.type,
      quality: format.quality,
      filename
    });

    // Trigger actual download
    const downloadUrl = `/api/download`;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = downloadUrl;
    
    const videoIdInput = document.createElement('input');
    videoIdInput.type = 'hidden';
    videoIdInput.name = 'videoId';
    videoIdInput.value = videoData.videoId;
    
    const itagInput = document.createElement('input');
    itagInput.type = 'hidden';
    itagInput.name = 'itag';
    itagInput.value = format.itag.toString();
    
    const formatInput = document.createElement('input');
    formatInput.type = 'hidden';
    formatInput.name = 'format';
    formatInput.value = format.type;
    
    form.appendChild(videoIdInput);
    form.appendChild(itagInput);
    form.appendChild(formatInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "~Unknown";
    const size = parseInt(bytes);
    if (size > 1024 * 1024) {
      return `~${(size / (1024 * 1024)).toFixed(0)}MB`;
    }
    return `~${(size / 1024).toFixed(0)}KB`;
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <CardContent className="p-0">
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Download Options</h4>
        
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
          <Button
            variant={activeTab === 'video' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('video')}
            className="flex-1"
          >
            <Video className="h-4 w-4 mr-2" />
            Video (MP4)
          </Button>
          <Button
            variant={activeTab === 'audio' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('audio')}
            className="flex-1"
          >
            <Music className="h-4 w-4 mr-2" />
            Audio (MP3)
          </Button>
        </div>

        <div className="space-y-3">
          {activeTab === 'video' && videoFormats.map((format, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors">
              <div className="flex items-center space-x-3">
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-gray-900">{format.quality}</div>
                  <div className="text-sm text-gray-600">MP4 • {formatFileSize(format.filesize)}</div>
                </div>
              </div>
              <Button onClick={() => handleDownload(format)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}

          {activeTab === 'audio' && audioFormats.map((format, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors">
              <div className="flex items-center space-x-3">
                <Music className="h-5 w-5 text-accent" />
                <div>
                  <div className="font-medium text-gray-900">{format.quality}</div>
                  <div className="text-sm text-gray-600">MP3 • {formatFileSize(format.filesize)}</div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => handleDownload(format)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
