"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  image?: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "offline" | "busy";
}

const initialMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alex Smith",
    image: "/placeholder.svg",
    role: "Product Designer",
    email: "alex@renewly.com",
    phone: "+1 234 567 890",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    image: "/placeholder.svg",
    role: "Frontend Developer",
    email: "sarah@renewly.com",
    phone: "+1 234 567 890",
    status: "busy",
  },
  {
    id: "3",
    name: "Mike Brown",
    image: "/placeholder.svg",
    role: "Backend Developer",
    email: "mike@renewly.com",
    phone: "+1 234 567 890",
    status: "offline",
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({});

  const addMember = () => {
    if (newMember.name) {
      setMembers([
        ...members,
        {
          id: Date.now().toString(),
          name: newMember.name,
          role: newMember.role || "Team Member",
          email: newMember.email || "",
          phone: newMember.phone || "",
          status: "active",
        } as TeamMember,
      ]);
      setNewMember({});
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="bg-card/50">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
              <Badge
                variant={
                  member.status === "active"
                    ? "default"
                    : member.status === "busy"
                    ? "destructive"
                    : "secondary"
                }
              >
                {member.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                value={newMember.name || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="role">Role</label>
              <Input
                id="role"
                value={newMember.role || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, role: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={newMember.email || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="phone">Phone</label>
              <Input
                id="phone"
                type="tel"
                value={newMember.phone || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addMember}>Add Member</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
