import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Verification from "@/pages/verification";
import Ledger from "@/pages/ledger";
import Reports from "@/pages/reports";
import Metadata from "@/pages/metadata";
import Navigation from "@/components/navigation";

function Router() {
  return (
    <div className="min-h-screen bg-surface">
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/verification" component={Verification} />
        <Route path="/ledger" component={Ledger} />
        <Route path="/reports" component={Reports} />
        <Route path="/metadata" component={Metadata} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
