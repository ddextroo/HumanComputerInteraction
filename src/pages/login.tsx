import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast, ToastAction } from "@/components/ui/toast";
import { Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Login() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{
    id: any;
    firstname: any;
    lastname: any;
    idnumber: any;
    contact: any;
    birthdate: any;
    gender: any;
    email: any;
    civilstatus: any;
    address: any;
    username: any;
    currentChallenge: any;
  } | null>(null);
  const { toast } = useToast()

  const handleFingerprintLogin = async () => {
    if (!username) {
      setErrorMessage("Please enter a username before authenticating.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(username, (c) => c.charCodeAt(0)),
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

      const optionsResponse = await fetch("http://localhost:3000/api/auth/webauthn/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, challenge: publicKeyCredentialCreationOptions.challenge }),
      });

      const { user } = await optionsResponse.json();

      if (user) {
        setModalMessage(user);
      } else {
        toast({
          variant: "destructive",
          title: "Account not exist!",
          description: "Please enter your username again",
        })
        setModalMessage(null);
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    //Alvin
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

      {/* Modal Popup */}
      {modalMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 space-y-3 text-center w-auto mx-auto shadow-lg">
            <p className="text-xl font-semibold text-gray-800 mb-6">
              Welcome {modalMessage.firstname} {modalMessage.lastname}!
            </p>

            {/* 4 Column Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 text-left p-4">
              <div>
                <p><strong>ID Number:</strong></p>
              </div>
              <div>
                <p>{modalMessage.idnumber}</p>
              </div>

              <div>
                <p><strong>Contact:</strong></p>
              </div>
              <div>
                <p>{modalMessage.contact}</p>
              </div>

              <div>
                <p><strong>Birthdate:</strong></p>
              </div>
              <div>
                <p>{modalMessage.birthdate}</p>
              </div>

              <div>
                <p><strong>Gender:</strong></p>
              </div>
              <div>
                <p>{modalMessage.gender}</p>
              </div>

              <div>
                <p><strong>Email:</strong></p>
              </div>
              <div>
                <p>{modalMessage.email}</p>
              </div>

              <div>
                <p><strong>Civil Status:</strong></p>
              </div>
              <div>
                <p>{modalMessage.civilstatus}</p>
              </div>

              <div>
                <p><strong>Address:</strong></p>
              </div>
              <div>
                <p>{modalMessage.address}</p>
              </div>

              <div>
                <p><strong>Username:</strong></p>
              </div>
              <div>
                <p>{modalMessage.username}</p>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => {
                  setModalMessage(null)
                  toast({
                    variant: "destructive",
                    title: "Logout Successful",
                    description: "You have been logout",
                  })
                }} 
                variant="destructive"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
