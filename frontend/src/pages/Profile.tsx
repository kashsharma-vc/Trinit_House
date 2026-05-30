import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Phone, Camera, Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  useEffect(() => {
    // 1. Fetch user from local storage initially
    const userString = localStorage.getItem("user");
    if (userString) {
      const parsedUser = JSON.parse(userString);
      setUser(parsedUser);
      setFormData({
        first_name: parsedUser.first_name || "",
        last_name: parsedUser.last_name || "",
        phone_number: parsedUser.profile?.phone_number || "",
      });
    }
    
    // 2. Fetch fresh details from backend using the user's own ID
    const fetchFreshUserDetails = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        if (!token) return;

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!currentUser?.id) return;

        // Fetch directly by ID — no need to download all users
        const res = await fetch(`${API_BASE_URL}/setups/users/${currentUser.id}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        if (res.ok) {
          const freshData = await res.json();
          setUser(freshData);
          setFormData({
            first_name: freshData.first_name || "",
            last_name: freshData.last_name || "",
            phone_number: freshData.profile?.phone_number || "",
          });
          localStorage.setItem("user", JSON.stringify(freshData));
        }
      } catch (err) {
        console.error("Failed to fetch fresh user details", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFreshUserDetails();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const formDataToSend = new FormData();
      if (formData.first_name) formDataToSend.append("first_name", formData.first_name);
      if (formData.last_name) formDataToSend.append("last_name", formData.last_name);
      if (formData.phone_number) formDataToSend.append("phone_number", formData.phone_number);
      
      const res = await fetch(`${API_BASE_URL}/setups/profile/update/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}` },
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev: any) => ({ ...prev, ...data.user }));
        localStorage.setItem("user", JSON.stringify({ ...user, ...data.user }));
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error while updating profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        const photoData = new FormData();
        photoData.append("profile_picture", file);
        
        const res = await fetch(`${API_BASE_URL}/setups/profile/update/`, {
          method: "PATCH",
          headers: { Authorization: `Token ${token}` },
          body: photoData,
        });

        if (res.ok) {
          const data = await res.json();
          setUser((prev: any) => ({ ...prev, profile: { ...prev.profile, profile_picture: data.user.profile.profile_picture } }));
          
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          currentUser.profile = { ...currentUser.profile, profile_picture: data.user.profile.profile_picture };
          localStorage.setItem("user", JSON.stringify(currentUser));
          
          toast.success("Profile photo updated successfully!");
        } else {
          toast.error("Failed to upload photo.");
        }
      } catch (err) {
        toast.error("Network error while uploading photo.");
      } finally {
        setIsLoading(false);
      }
    };
    fileInput.click();
  };

  if (isLoading && !user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">Loading profile...</div>
      </MainLayout>
    );
  }

  const isAdmin = user?.is_superuser || user?.role === "Admin";
  const roleDisplay = user?.role || (isAdmin ? "Administrator" : "Technician");

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Photo & Role Badge */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative mb-4 group cursor-pointer" onClick={handlePhotoUpload}>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                    {user?.profile?.profile_picture ? (
                      <img 
                        src={user.profile.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900">
                  {user?.first_name || user?.username} {user?.last_name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
                
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Shield className="w-4 h-4" />
                  {roleDisplay}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="bg-indigo-50 border-indigo-100">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-indigo-900 mb-1">Admin Access</h4>
                  <p className="text-sm text-indigo-700 text-justify">
                    You have full access to system configuration, user management, and AI insights. 
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Edit Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input 
                        id="firstName" 
                        className="pl-9" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input 
                        id="lastName" 
                        className="pl-9" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      id="email" 
                      type="email"
                      className="pl-9 bg-slate-50 cursor-not-allowed" 
                      value={user?.email || ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="text-xs text-slate-500">Email cannot be changed directly.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      id="phone" 
                      className="pl-9" 
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
