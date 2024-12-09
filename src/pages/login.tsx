import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";

export function Login() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFingerprintLogin = async () => {
    if (!username) {
      setErrorMessage("Please enter a username before authenticating.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {

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

      const optionsResponse = await fetch('http://localhost:3000/api/auth/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'username': username, "challenge": publicKeyCredentialCreationOptions.challenge }),
      });

      const { user } = await optionsResponse.json();

      if (user) {
        console.log("Login successful for:", username);
      }
      else {
        console.log("Account not exist:", username);
      }

      
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="mt-6 space-y-4">
        <div className="grid place-items-center">
          <Button
            variant="outline"
            size="icon"
            className="w-24 h-24 rounded-full"
            onClick={handleFingerprintLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loader" /> // Replace with your loading spinner
            ) : (
              <Fingerprint className="h-12 w-12" />
            )}
          </Button>
          <div className="text-sm text-center mt-2">{errorMessage}</div>
        </div>
      </div>
    </div>
  );
}
