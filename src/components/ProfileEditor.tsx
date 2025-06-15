
import React, { useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ProfileEditor: React.FC<Props> = ({ open, onOpenChange }) => {
  const { profile, updateProfile, uploadAvatar, loading } = useUser();
  const [name, setName] = useState(profile?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setName(profile?.name || "");
      setAvatarFile(null);
    }
  }, [open, profile]);

  const handleSave = async () => {
    setSaving(true);
    let avatar_url = profile?.avatar_url || null;
    if (avatarFile) {
      const { publicUrl, error } = await uploadAvatar(avatarFile);
      if (error) {
        toast({ title: "Avatar upload failed", description: error, variant: "destructive" });
        setSaving(false);
        return;
      }
      avatar_url = publicUrl;
    }
    const { error } = await updateProfile({ name, avatar_url });
    if (error) {
      toast({ title: "Profile update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Avatar Preview */}
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="mx-auto w-24 h-24 rounded-full object-cover border mb-2"
            />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={e => setAvatarFile(e.target.files?.[0] || null)}
            disabled={saving}
          />
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full Name"
            disabled={saving}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default ProfileEditor;
