import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

export function LoginChoicePage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Wedding Production Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose how you sign in</p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Admin login</CardTitle>
            <CardDescription>Events, tasks, team management, analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/login/admin">Continue as Admin</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Team member login</CardTitle>
            <CardDescription>Your assigned tasks and deadlines.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/login/team">Continue as Team Member</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Same credentials per role — pick the portal that matches your account.
      </p>
    </div>
  );
}
