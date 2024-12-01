import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { registerFingerprint } from "@/utils/webauthn";

export function Signup() {
  const [username, setUserName] = useState("");
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegisterFingerprint = async () => {
    if (!username) {
      setErrorMessage(
        "Please enter a username before registering your fingerprint."
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supported = await registerFingerprint(username);
      if (!supported) {
        setErrorMessage(
          "Fingerprint authentication is not supported on this device."
        );
        return;
      }

      setIsFingerprintEnabled(true);
    } catch (error) {
      setErrorMessage("Error during fingerprint registration.");
    } finally {
      setIsLoading(false);
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
            disabled={isLoading || isFingerprintEnabled}
          >
            {isLoading ? (
              <span className="loader" /> // Replace with your loading spinner
            ) : (
              <Fingerprint className="h-12 w-12" />
            )}
          </Button>
          <p className="text-sm text-center mt-2">
            {isFingerprintEnabled
              ? "Fingerprint registered successfully."
              : errorMessage || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
