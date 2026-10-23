'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { IS_DEV } from '@/lib/env';

export function AuthButton() {
  const { user, isLoading, signInWithGoogle, signOut, devLogin } = useAuthStore();
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://ledger.mudoker.com');
  const prodOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://ledger.mudoker.com';
  const prodRedirect = `${prodOrigin}/api/auth/callback/google`;
  const localRedirect = `${currentOrigin}/api/auth/callback/google`;

  const copyToClipboard = (text: string, type: 'origin' | 'redirect') => {
    navigator.clipboard.writeText(text);
    if (type === 'origin') {
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    } else {
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2000);
    }
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;
    const ok = await devLogin(devEmail, devName);
    if (ok) {
      setIsDevLoginOpen(false);
      setDevEmail('');
      setDevName('');
    }
  };

  const handleQuickLogin = async (email: string, name: string) => {
    await devLogin(email, name);
    setIsDevLoginOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-9 w-24 rounded-xl bg-foreground/5 animate-pulse" />
    );
  }

  if (user) {
    const initials = user.name
      ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : user.email.slice(0, 2).toUpperCase();

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 px-2.5 sm:px-3 rounded-xl border-foreground/15 hover:bg-foreground/5 font-bold transition-all text-xs"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || user.email}
                className="w-5 h-5 rounded-full object-cover border border-foreground/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                {initials}
              </div>
            )}
            <span className="max-w-[100px] sm:max-w-[140px] truncate">
              {user.name || user.email.split('@')[0]}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 bg-card/95 backdrop-blur-xl border-border rounded-2xl shadow-xl" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || user.email}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-bold gap-2 text-muted-foreground hover:text-foreground h-8"
                onClick={() => setIsSetupModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" />
                OAuth Setup Details
              </Button>

              {IS_DEV && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-bold gap-2 text-muted-foreground hover:text-foreground h-8"
                  onClick={() => setIsDevLoginOpen(true)}
                >
                  <Sparkles className="w-4 h-4" />
                  Switch Dev Account
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-bold gap-2 text-destructive hover:bg-destructive/10 h-8"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          onClick={signInWithGoogle}
          size="sm"
          className="h-9 px-3 gap-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all text-xs active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden xs:inline">Sign In with Google</span>
          <span className="xs:hidden">Sign In</span>
        </Button>

        {IS_DEV && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            onClick={() => setIsDevLoginOpen(true)}
            title="Dev Mock Login"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* OAuth Setup Info Modal */}
      <Dialog open={isSetupModalOpen} onOpenChange={setIsSetupModalOpen}>
        <DialogContent className="max-w-lg p-5 rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Google OAuth 2.0 Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure these in Google Cloud Console &gt; APIs &amp; Services &gt; Credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Authorized JavaScript Origins
              </Label>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted font-mono text-[11px] border border-border">
                <span className="truncate">{prodOrigin}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 ml-2"
                  onClick={() => copyToClipboard(prodOrigin, 'origin')}
                >
                  {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Authorized Redirect URIs
              </Label>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted font-mono text-[11px] border border-border">
                <span className="truncate">{prodRedirect}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 ml-2"
                  onClick={() => copyToClipboard(prodRedirect, 'redirect')}
                >
                  {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                For local dev: <code className="bg-muted px-1 py-0.5 rounded">{localRedirect}</code>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dev Login Modal */}
      <Dialog open={isDevLoginOpen} onOpenChange={setIsDevLoginOpen}>
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
    </>
  );
}
