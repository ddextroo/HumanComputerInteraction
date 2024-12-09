import { useState, useEffect } from "react";
import { Fingerprint } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FingerprintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onRegistrationComplete: (success: boolean) => void;
}

const randomString = (length = 32) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function FingerprintDialog({ isOpen, onOpenChange, username, onRegistrationComplete }: FingerprintDialogProps) {
  const [scanningState, setScanningState] = useState<'initial' | 'scanning' | 'complete' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanningState('initial');
      setErrorMessage(null);
      registerFingerprint();
    }
  }, [isOpen, username]);

  const registerFingerprint = async () => {
    try {
      setScanningState('scanning');

      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser.");
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error("No fingerprint sensor is available on this device.");
      }

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(
            // randomString(), c => c.charCodeAt(0)), 
            username, c => c.charCodeAt(0)),
        rp: {
          name: "Your App Name",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16), 
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      console.log(credential)

      console.log(publicKeyCredentialCreationOptions)


      const optionsResponse = await fetch('http://localhost:3000/api/auth/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'username': username, "challenge": publicKeyCredentialCreationOptions.challenge }),
      });
      

    } catch (error) {
      console.error("Error registering fingerprint:", error);
      setScanningState('error');
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred during fingerprint registration.");
      }
      onRegistrationComplete(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fingerprint Registration</DialogTitle>
          <DialogDescription>
            {scanningState === 'initial' && "Preparing to scan your fingerprint..."}
            {scanningState === 'scanning' && "Please follow your device's instructions to scan your fingerprint."}
            {scanningState === 'complete' && "Fingerprint registered successfully!"}
            {scanningState === 'error' && "An error occurred during registration."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center">
            <Fingerprint 
              className={`h-12 w-12 ${
                scanningState === 'scanning' ? 'animate-pulse text-primary' : 
                scanningState === 'complete' ? 'text-green-500' :
                scanningState === 'error' ? 'text-red-500' : ''
              }`} 
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

