"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export function ChatCard() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Chat with AI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium">AI Assistant</p>
              <p className="text-sm text-muted-foreground">
                Hello! How can I help you today?
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid gap-1">
              <p className="text-sm font-medium">You</p>
              <p className="text-sm text-muted-foreground">
                I need help with my project.
              </p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Input placeholder="Type your message..." />
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
