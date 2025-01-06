"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from 'lucide-react';
import { FingerprintDialog } from "./signupDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function Signup() {
  const [lastname, setLastName] = useState("");
  const [firstname, setFirstName] = useState("");
  const [idnumber, setIdNumber] = useState("");
  const [contact, setContact] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [civilstatus, setCivilStatus] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");

  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Simulate existing accounts using a Set
  const existingAccounts = new Set(["existingUser1", "existingUser2"]);
  const { toast } = useToast()

  const handleRegisterFingerprint = () => {
    const requiredFields = [
      { name: 'Last Name', value: lastname },
      { name: 'First Name', value: firstname },
      { name: 'ID Number', value: idnumber },
      { name: 'Contact Number', value: contact },
      { name: 'Birthdate', value: birthdate },
      { name: 'Gender', value: gender },
      { name: 'Email', value: email },
      { name: 'Civil Status', value: civilstatus },
      { name: 'Address', value: address },
      { name: 'Username', value: username },
    ];

    const emptyFields = requiredFields.filter(field => !field.value);

    if (emptyFields.length > 0) {
      setErrorMessage(
        `Please fill in the following fields before registering your fingerprint`
      );
      toast({
        variant: "destructive",
        title: "Please fill all fields",
      });
      return;
    }

    // Check if the account already exists
    const accountExists = checkAccountExistence(username);
    if (accountExists) {
      setModalMessage("Account already exists!"); // Show modal if account exists
      return; // Do not proceed further
    }

    setErrorMessage(null);
    setIsDialogOpen(true); // Proceed with fingerprint registration if account doesn't exist
  };


  const checkAccountExistence = (username: string): boolean => {
    // Check if the username is in the existing accounts set
    return existingAccounts.has(username);
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

  const handleModalClose = () => {
    setModalMessage(null); // Close modal
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="lastname">Last Name</Label>
        <Input
          id="lastname"
          placeholder="Doe"
          value={lastname}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="firstname">First Name</Label>
        <Input
          id="firstname"
          placeholder="John"
          value={firstname}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="idnumber">ID Number</Label>
        <Input
          id="idnumber"
          placeholder="123456789"
          value={idnumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact Number</Label>
        <Input
          id="contact"
          type="tel"
          placeholder="+1234567890"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthdate">Birthdate</Label>
        <Input
          id="birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="civilstatus">Civil Status</Label>
        <Select value={civilstatus} onValueChange={setCivilStatus}>
          <SelectTrigger id="civilstatus">
            <SelectValue placeholder="Select civil status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Main St, City, Country"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="johndoe123"
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

      {/* Fingerprint Registration Dialog */}
      <FingerprintDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        username={username}
        firstname={firstname}
        lastname={lastname}
        idnumber={idnumber}
        contact={contact}
        birthdate={birthdate}
        gender={gender}
        email={email}
        civilstatus={civilstatus}
        address={address}
        onRegistrationComplete={handleRegistrationComplete}
      />

      {/* Modal for account existence */}
      {modalMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 space-y-4 text-center">
            <p className="text-lg font-semibold">{modalMessage}</p>
            <Button onClick={handleModalClose}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

