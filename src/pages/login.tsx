import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";

import { authenticateFingerprint } from "@/utils/webauthn";

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
      const authenticated = await authenticateFingerprint(username);
      if (!authenticated) {
        setErrorMessage("Fingerprint authentication failed.");
        return;
      }

      // Handle successful login
      console.log("Login successful for:", username);
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
