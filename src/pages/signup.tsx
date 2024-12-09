"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from 'lucide-react';
import { FingerprintDialog } from "./signupDialog";

export function Signup() {
  const [username, setUserName] = useState("");
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRegisterFingerprint = () => {
    if (!username) {
      setErrorMessage(
        "Please enter a username before registering your fingerprint."
      );
      return;
    }
    setErrorMessage(null);
    setIsDialogOpen(true);
  };

  const handleRegistrationComplete = (success: boolean) => {
    if (success) {
      setIsFingerprintEnabled(true);
      setErrorMessage(null);
    } else {
      setIsFingerprintEnabled(false);
      setErrorMessage("Fingerprint registration failed. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
      </div>
      <div className="mt-6 space-y-4">
        <div className="grid place-items-center">
          <Button
            variant="outline"
            size="icon"
            className="w-24 h-24 rounded-full"
            onClick={handleRegisterFingerprint}
            disabled={isFingerprintEnabled}
          >
            <Fingerprint className="h-12 w-12" />
          </Button>
          <p className="text-sm text-center mt-2">
            {isFingerprintEnabled
              ? "Fingerprint registered successfully."
              : errorMessage || "Click to register your fingerprint."}
          </p>
        </div>
      </div>

      <FingerprintDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        username={username}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </div>
  );
}

