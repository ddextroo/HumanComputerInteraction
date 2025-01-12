import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { client, server } from "@passwordless-id/webauthn";

interface UserData {
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();

  const handleFingerprintLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const challenge = server.randomChallenge();

    await client.authenticate({
      challenge: challenge,
    });
  };

  return (
    <div className="space-y-4">
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
