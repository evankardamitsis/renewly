import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { teamsApi } from '@/services/api'
import { useAsync } from '@/hooks/use-async'

interface InviteMemberModalProps {
  teamId: string
  isOpen: boolean
  onClose: () => void
}

export function InviteMemberModal({ teamId, isOpen, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const { loading, execute } = useAsync()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await execute(
        teamsApi.invite(teamId, email, 'member'),
        'Invitation sent successfully'
      )
      onClose()
    } catch (error) {
      // Error is handled by useAsync
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 