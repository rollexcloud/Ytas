import { Card, CardContent } from "@/components/ui/card";
import { Clock, Eye, User } from "lucide-react";
import type { VideoData } from "@/pages/home";

interface VideoInfoProps {
  videoData: VideoData;
}

export default function VideoInfo({ videoData }: VideoInfoProps) {
  return (
    <Card className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <img 
              src={videoData.thumbnail}
              alt="Video thumbnail"
              className="w-full rounded-xl shadow-md aspect-video object-cover"
            />
          </div>
          
          <div className="md:col-span-2">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {videoData.title}
            </h4>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{videoData.duration}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{videoData.views}</span>
              </span>
              <span className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{videoData.channel}</span>
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {videoData.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
