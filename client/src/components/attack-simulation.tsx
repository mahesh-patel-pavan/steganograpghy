import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bug, Play, Zap, Scissors, RotateCw, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const attackTypes = [
  {
    id: "jpeg_compression",
    name: "JPEG Compression",
    description: "Quality reduction attack",
    icon: Zap,
  },
  {
    id: "gaussian_noise",
    name: "Gaussian Noise",
    description: "Random noise injection",
    icon: Bug,
  },
  {
    id: "cropping",
    name: "Cropping Attack",
    description: "Partial image removal",
    icon: Scissors,
  },
  {
    id: "rotation",
    name: "Rotation Attack",
    description: "Image rotation and scaling",
    icon: RotateCw,
  },
  {
    id: "scaling",
    name: "Scaling Attack",
    description: "Image resize operations",
    icon: Maximize,
  },
];

export function AttackSimulation() {
  const { toast } = useToast();
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // Fetch recent images for simulation
  const { data: recentImages } = useQuery({
    queryKey: ["/api/ledger"],
    select: (data) => data?.items?.slice(0, 5) || [],
  });

  // Attack simulation mutation
  const simulationMutation = useMutation({
    mutationFn: async (data: { imageId: number; attackTypes: string[] }) => {
      const response = await fetch('/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Attack simulation failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attack simulation completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run attack simulation",
        variant: "destructive",
      });
    },
  });

  const handleAttackToggle = (attackId: string) => {
    setSelectedAttacks(prev =>
      prev.includes(attackId)
        ? prev.filter(id => id !== attackId)
        : [...prev, attackId]
    );
  };

  const handleRunSimulation = () => {
    if (!selectedImageId) {
      toast({
        title: "Error",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    if (selectedAttacks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one attack type",
        variant: "destructive",
      });
      return;
    }

    simulationMutation.mutate({
      imageId: selectedImageId,
      attackTypes: selectedAttacks,
    });
  };

  // Listen for attack simulation trigger from verification results
  useState(() => {
    const handleTrigger = (event: CustomEvent) => {
      setSelectedImageId(event.detail.imageId);
      setSelectedAttacks(["jpeg_compression", "gaussian_noise"]);
    };

    window.addEventListener('runAttackSimulation', handleTrigger as EventListener);
    return () => window.removeEventListener('runAttackSimulation', handleTrigger as EventListener);
  });

  return (
    <Card className="mb-8">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center">
          <Bug className="text-accent mr-3" />
          Attack Simulation Dashboard
        </CardTitle>
        <p className="text-text-secondary">Test image robustness against various attack vectors</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Image Selection & Attack Types */}
          <div className="lg:col-span-1">
            <h3 className="font-medium text-gray-900 mb-4">Select Image</h3>
            {recentImages && recentImages.length > 0 ? (
              <div className="space-y-2 mb-6">
                {recentImages.map((image: any) => (
                  <div
                    key={image.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedImageId === image.id
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedImageId(image.id)}
                  >
                    <p className="font-medium text-sm">{image.artworkTitle}</p>
                    <p className="text-xs text-text-secondary">{image.artistName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-4">
                <p>No authenticated images available</p>
                <p className="text-sm">Authenticate an image first</p>
              </div>
            )}

            <h3 className="font-medium text-gray-900 mb-4">Attack Vectors</h3>
            <div className="space-y-3">
              {attackTypes.map((attack) => {
                const IconComponent = attack.icon;
                return (
                  <div
                    key={attack.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAttackToggle(attack.id)}
                  >
                    <div className="flex items-center">
                      <IconComponent className="text-text-secondary mr-3 w-4 h-4" />
                      <div>
                        <p className="font-medium text-sm">{attack.name}</p>
                        <p className="text-xs text-text-secondary">{attack.description}</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedAttacks.includes(attack.id)}
                      onCheckedChange={() => handleAttackToggle(attack.id)}
                    />
                  </div>
                );
              })}
            </div>
            
            <Button
              onClick={handleRunSimulation}
              disabled={simulationMutation.isPending || !selectedImageId || selectedAttacks.length === 0}
              className="w-full mt-4 bg-error text-white hover:bg-red-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {simulationMutation.isPending ? "Running..." : "Execute Attack Simulation"}
            </Button>
          </div>

          {/* Simulation Results */}
          <div className="lg:col-span-2">
            <h3 className="font-medium text-gray-900 mb-4">Simulation Results</h3>
            
            {simulationMutation.data ? (
              <div className="space-y-4">
                {simulationMutation.data.map((result: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Bug className={`mr-3 w-4 h-4 ${result.verificationPassed ? "text-secondary" : "text-error"}`} />
                        <span className="font-medium">{result.attackType.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm font-medium text-white ${
                        result.verificationPassed ? "bg-secondary" : "bg-error"
                      }`}>
                        {result.verificationPassed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Signature Integrity</p>
                        <p className={`font-medium ${result.verificationPassed ? "text-secondary" : "text-error"}`}>
                          {result.integrityLoss}% {result.verificationPassed ? "Intact" : "Corrupted"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Extraction Rate</p>
                        <p className={`font-medium ${result.extractionSuccessful ? "text-secondary" : "text-error"}`}>
                          {result.extractionSuccessful ? "Success" : "Failed"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">PSNR</p>
                        <p className="font-medium">{result.psnr} dB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8">
                <Bug className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No simulation results yet</p>
                <p className="text-sm">Run an attack simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
