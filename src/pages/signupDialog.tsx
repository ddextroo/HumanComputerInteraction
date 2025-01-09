import { useState, useEffect } from "react";
import { Fingerprint } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  username: string;
  firstname: string;
  lastname: string;
  idnumber: string;
  contact: string;
  birthdate: string;
  gender: string;
  email: string;
  civilstatus: string;
  address: string;
}

interface FingerprintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData;
  onRegistrationComplete: (success: boolean) => void;
}

export function FingerprintDialog({
  isOpen,
  onOpenChange,
  userData,
  onRegistrationComplete,
}: FingerprintDialogProps) {
  const [scanningState, setScanningState] = useState<
    "initial" | "scanning" | "complete" | "error"
  >("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setScanningState("initial");
      setErrorMessage(null);
      registerFingerprint();
    }
  }, [isOpen]);

  const registerFingerprint = async () => {
    try {
      setScanningState("scanning");

      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser.");
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error("No fingerprint sensor is available on this device.");
      }

      // Get registration options from server
      const optionsResponse = await fetch(
        "http://localhost:3000/api/auth/webauthn/register-options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.error || "Failed to get registration options");
      }

      const options = await optionsResponse.json();

      // Create credentials
      const credential = (await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(options.challenge), (c) =>
            c.charCodeAt(0)
          ),
          user: {
            id: Uint8Array.from(userData.username, (c) => c.charCodeAt(0)),
            name: userData.username,
            displayName: `${userData.firstname} ${userData.lastname}`,
          },
          rp: {
            name: "Your App Name",
            id: window.location.hostname,
          },
        },
      })) as PublicKeyCredential;

      // Prepare verification data
      const attestationResponse =
        credential.response as AuthenticatorAttestationResponse;

      const verificationData = {
        username: userData.username,
        attestationResponse: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            attestationObject: btoa(
              String.fromCharCode(
                ...new Uint8Array(attestationResponse.attestationObject)
              )
            ),
            clientDataJSON: btoa(
              String.fromCharCode(
                ...new Uint8Array(attestationResponse.clientDataJSON)
              )
            ),
          },
          type: credential.type,
        },
      };

      // Verify registration with server
      const verificationResponse = await fetch(
        "http://localhost:3000/api/auth/webauthn/verify-registration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verificationData),
        }
      );

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Failed to verify registration");
      }

      const { verified } = await verificationResponse.json();

      if (verified) {
        setScanningState("complete");
        onRegistrationComplete(true);
        toast({
          title: "Registration Successful",
          description: "Your fingerprint has been registered successfully",
        });
        setTimeout(() => onOpenChange(false), 2000);
      } else {
        throw new Error("Registration verification failed");
      }
    } catch (error) {
      console.error("Error registering fingerprint:", error);
      setScanningState("error");
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "An unknown error occurred during fingerprint registration."
        );
      }
      onRegistrationComplete(false);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to register fingerprint",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fingerprint Registration</DialogTitle>
          <DialogDescription>
            {scanningState === "initial" &&
              "Preparing to scan your fingerprint..."}
            {scanningState === "scanning" &&
              "Please follow your device's instructions to scan your fingerprint."}
            {scanningState === "complete" &&
              "Fingerprint registered successfully!"}
            {scanningState === "error" &&
              "An error occurred during registration."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center">
            <Fingerprint
              className={`h-12 w-12 ${
                scanningState === "scanning"
                  ? "animate-pulse text-primary"
                  : scanningState === "complete"
                  ? "text-green-500"
                  : scanningState === "error"
                  ? "text-red-500"
                  : ""
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
