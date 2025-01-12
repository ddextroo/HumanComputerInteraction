import { Login } from "./pages/login";
import { Signup } from "./pages/signup";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen font-poppins bg-gray-100">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Login or sign up using your fingerprint or credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-x-3">
              <TabsTrigger
                value="login"
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md transition-all hover:bg-gray-200 focus:outline-none data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md transition-all hover:bg-gray-200 focus:outline-none data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Login />
            </TabsContent>
            <TabsContent value="signup">
              <Signup />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
