'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface DevLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DevLoginModal({ open, onOpenChange }: DevLoginModalProps) {
  const { devLogin } = useAuthStore();
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;
    const ok = await devLogin(devEmail, devName);
    if (ok) {
      onOpenChange(false);
      setDevEmail('');
      setDevName('');
    }
  };

  const handleQuickLogin = async (email: string, name: string) => {
    await devLogin(email, name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-5 rounded-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Dev Mock Authentication
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in as any user to test RBAC and participant bill filtering immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Switch:</span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold justify-start"
                onClick={() => handleQuickLogin('alice@example.com', 'Alice (Owner)')}
              >
                Alice (Owner)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold justify-start"
                onClick={() => handleQuickLogin('bob@example.com', 'Bob (Participant)')}
              >
                Bob (Participant)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold justify-start"
                onClick={() => handleQuickLogin('charlie@example.com', 'Charlie (Viewer)')}
              >
                Charlie (Viewer)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold justify-start"
                onClick={() => handleQuickLogin('david@example.com', 'David')}
              >
                David
              </Button>
            </div>
          </div>

          <form onSubmit={handleDevSubmit} className="space-y-2 pt-2 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase">Custom Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase">Display Name</Label>
              <Input
                placeholder="Optional Name"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="w-full h-9 text-xs font-bold">
              Log In
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
