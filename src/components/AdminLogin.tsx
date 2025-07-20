"use client";

import { useState } from "react";
import { login } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (login(pwd)) {
      onSuccess();
    } else {
      setErr("Wrong password");
      setPwd("");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <p className="text-muted-foreground">
            Enter your password to access the admin panel
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {err && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {err}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={!pwd}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
