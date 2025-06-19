import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Paste URL",
      description: "Copy and paste the YouTube video URL into the input field above."
    },
    {
      number: "2", 
      title: "Choose Format",
      description: "Select your preferred format (MP4 video or MP3 audio) and quality."
    },
    {
      number: "3",
      title: "Download",
      description: "Click download and save the file directly to your device."
    }
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-12">
      <CardContent className="p-0">
        <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">{step.number}</span>
              </div>
              <h6 className="font-semibold text-gray-900 mb-2">{step.title}</h6>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
