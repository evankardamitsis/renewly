"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

/**
 * Interface for team member data
 */
interface TeamMember {
  id: string;
  name: string;
  image?: string;
}

/**
 * TeamManagementCard Component
 *
 * A card-based interface for team member management.
 * Displays team members in a grid layout with avatar representations
 * and provides functionality to add new team members.
 *
 * @returns {JSX.Element} Card component with team management interface
 */
export function TeamManagementCard() {
  // State management for team members and modal
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "1", name: "John Doe", image: "/placeholder.svg" },
    { id: "2", name: "Jane Smith", image: "/placeholder.svg" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  /**
   * Handles the addition of a new team member
   */
  const handleAddMember = () => {
    if (newMemberName) {
      setMembers([
        ...members,
        { id: Date.now().toString(), name: newMemberName },
      ]);
      setNewMemberName("");
      setIsModalOpen(false);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {members.map((member) => (
            <Avatar key={member.id}>
              <AvatarImage src={member.image} alt={member.name} />
              <AvatarFallback>
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsModalOpen(true)}
          >
            +
          </Button>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name">Name</label>
                <Input
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddMember}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
