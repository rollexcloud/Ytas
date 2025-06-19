import { Download } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">VideoDownloader Pro</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">How It Works</a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">Support</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
