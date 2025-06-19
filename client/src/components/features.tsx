import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, Smartphone } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Download videos and audio at maximum speed with our optimized servers.",
      color: "text-primary bg-primary/10"
    },
    {
      icon: Shield,
      title: "100% Safe",
      description: "No malware, no ads, no tracking. Your privacy and security are our priority.",
      color: "text-accent bg-accent/10"
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Works perfectly on all devices - desktop, tablet, and mobile.",
      color: "text-purple-600 bg-purple-100"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Card key={index} className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">{feature.title}</h5>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
