import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
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

export function Login() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();

  const handleFingerprintLogin = async () => {
    if (!username) {
      setErrorMessage("Please enter a username before authenticating.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Get authentication options from server
      const optionsResponse = await fetch(
        "http://localhost:3000/api/auth/webauthn/authentication-options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.error || "Failed to get authentication options");
      }

      const options = await optionsResponse.json();

      // 2. Create credentials
      const credential = (await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(options.challenge), (c) =>
            c.charCodeAt(0)
          ),
          allowCredentials: options.allowCredentials.map((cred: any) => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
          })),
        },
      })) as PublicKeyCredential;

      // 3. Get the authentication response
      const authData = credential.response as AuthenticatorAssertionResponse;

      // 4. Prepare verification data
      const verificationData = {
        username,
        assertionResponse: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            authenticatorData: btoa(
              String.fromCharCode(...new Uint8Array(authData.authenticatorData))
            ),
            clientDataJSON: btoa(
              String.fromCharCode(...new Uint8Array(authData.clientDataJSON))
            ),
            signature: btoa(
              String.fromCharCode(...new Uint8Array(authData.signature))
            ),
            userHandle: authData.userHandle
              ? btoa(
                  String.fromCharCode(...new Uint8Array(authData.userHandle))
                )
              : null,
          },
          type: credential.type,
        },
      };

      // 5. Verify with server
      const verificationResponse = await fetch(
        "http://localhost:3000/api/auth/webauthn/verify-authentication",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verificationData),
        }
      );

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Authentication failed");
      }

      const { verified, user } = await verificationResponse.json();

      if (verified && user) {
        setUserData(user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.firstname}!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Please try again",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
      });
      setErrorMessage(error.message || "Authentication failed");
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
              <span className="loader" />
            ) : (
              <Fingerprint className="h-12 w-12" />
            )}
          </Button>
          <div className="text-sm text-center mt-2">{errorMessage}</div>
        </div>
      </div>

      {/* User Data Modal */}
      {userData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 space-y-3 text-center w-auto mx-auto shadow-lg">
            <p className="text-xl font-semibold text-gray-800 mb-6">
              Welcome {userData.firstname} {userData.lastname}!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 text-left p-4">
              <div>
                <p>
                  <strong>ID Number:</strong>
                </p>
              </div>
              <div>
                <p>{userData.idnumber}</p>
              </div>

              <div>
                <p>
                  <strong>Contact:</strong>
                </p>
              </div>
              <div>
                <p>{userData.contact}</p>
              </div>

              <div>
                <p>
                  <strong>Birthdate:</strong>
                </p>
              </div>
              <div>
                <p>{userData.birthdate}</p>
              </div>

              <div>
                <p>
                  <strong>Gender:</strong>
                </p>
              </div>
              <div>
                <p>{userData.gender}</p>
              </div>

              <div>
                <p>
                  <strong>Email:</strong>
                </p>
              </div>
              <div>
                <p>{userData.email}</p>
              </div>

              <div>
                <p>
                  <strong>Civil Status:</strong>
                </p>
              </div>
              <div>
                <p>{userData.civilstatus}</p>
              </div>

              <div>
                <p>
                  <strong>Address:</strong>
                </p>
              </div>
              <div>
                <p>{userData.address}</p>
              </div>

              <div>
                <p>
                  <strong>Username:</strong>
                </p>
              </div>
              <div>
                <p>{userData.username}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => {
                  setUserData(null);
                  toast({
                    title: "Logout Successful",
                    description: "You have been logged out",
                  });
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
