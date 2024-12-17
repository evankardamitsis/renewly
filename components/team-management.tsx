"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

/**
 * Interface for team member data structure
 */
interface TeamMember {
  id: string;
  name: string;
  image?: string;
}

/**
 * TeamManagement Component
 * 
 * Manages the display and manipulation of team members.
 * Provides functionality to view, add, and manage team members.
 * 
 * @returns {JSX.Element} Team management interface with member list and add member functionality
 */
export function TeamManagement() {
  // State for managing team members and modal visibility
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "1", name: "John Doe", image: "/placeholder.svg" },
    { id: "2", name: "Jane Smith", image: "/placeholder.svg" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  /**
   * Handles adding a new team member
   * Creates a new member with unique ID if name is provided
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

  // Component JSX
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Team Members</h2>
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
        <Button variant="outline" onClick={() => setIsModalOpen(true)}>
          Add Member
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
    </div>
  );
}
