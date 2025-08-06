
import { User, Mail, LogOut, Edit2, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
    
interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const handleLogout = () => {
    console.log('Logging out...');
    // Add logout logic here
    onClose();
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // Add edit profile logic here
  };

  const handleChangeAvatar = () => {
    console.log('Change avatar clicked');
    // Add change avatar logic here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">User Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Avatar Section */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
              <AvatarImage 
                src="https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400" 
                alt="Profile" 
              />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleChangeAvatar}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleEditProfile}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">john.doe@example.com</p>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleEditProfile}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="w-full" />

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEditProfile}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}