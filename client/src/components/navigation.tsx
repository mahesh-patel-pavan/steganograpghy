import { Link, useLocation } from "wouter";
import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ledger", label: "Public Ledger" },
    { href: "/verification", label: "Verify Image" },
    { href: "/metadata", label: "Metadata" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-gray-900">StegoAuth</span>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  location === item.href
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Authentication
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
