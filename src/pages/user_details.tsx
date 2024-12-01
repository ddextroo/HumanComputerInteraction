import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, User } from "lucide-react";

interface UserDetailsProps {
  name: string;
  email: string;
  onLogout: () => void;
}

export function UserDetails({ name, email, onLogout }: UserDetailsProps) {
  return (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <User className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium">{name}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>
        <Button onClick={onLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </CardContent>
    </Card>
  );
}
