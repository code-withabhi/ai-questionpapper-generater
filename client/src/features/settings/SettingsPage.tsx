import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Lock, Cpu, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim() });
      toast({ title: 'Success', description: res.data.message || 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast({ title: 'Success', description: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-xs text-muted-foreground">Manage profile, security credentials, and AI options.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /><CardTitle>Profile</CardTitle></div>
            <CardDescription>Update name and view account info</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /><CardTitle>Security</CardTitle></div>
            <CardDescription>Update your login password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change Password'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /><CardTitle>System & Services</CardTitle></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded border">
              <div className="text-xs text-muted-foreground">AI Engine</div>
              <div className="font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Google Gemini</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs text-muted-foreground">Paper Generator</div>
              <div className="font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Constraint Engine</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs text-muted-foreground">PDF Generator</div>
              <div className="font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> PDFKit Engine</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
