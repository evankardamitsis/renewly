import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export function ChatCard() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Team Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                Hey team, how's the progress on the new feature?
              </p>
            </div>
          </div>
          <div className="flex items-start justify-end gap-3">
            <div className="rounded-lg bg-primary p-3">
              <p className="text-sm text-primary-foreground">
                It's going well! We're about 70% done.
              </p>
            </div>
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Type a message..." />
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
