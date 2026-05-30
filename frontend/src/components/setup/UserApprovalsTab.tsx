import { useState, useEffect } from "react";
import { Check, X, Loader2, UserCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface PendingUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

interface Role {
  id: number;
  role_name: string;
}

interface Zone {
  id: number;
  zone_name: string;
}

export function UserApprovalsTab() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Track selected role and zone for each user
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [selectedZones, setSelectedZones] = useState<Record<number, string>>({});

  const fetchData = async () => {
    try {
      const headers = { "Authorization": `Token ${localStorage.getItem("token")}` };
      
      const [usersRes, rolesRes, zonesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/setups/user-approvals/pending/`, { headers }),
        fetch(`${API_BASE_URL}/setups/roles/`, { headers }),
        fetch(`${API_BASE_URL}/setups/zones/`, { headers })
      ]);
      
      if (usersRes.ok && rolesRes.ok && zonesRes.ok) {
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        const zonesData = await zonesRes.json();
        
        setUsers(usersData);
        
        // Handle paginated or unpaginated roles/zones
        const rawRoles = Array.isArray(rolesData) ? rolesData : (rolesData.results || []);
        setRoles(rawRoles);
        
        const rawZones = Array.isArray(zonesData) ? zonesData : (zonesData.results || []);
        setZones(rawZones);
      } else {
        setError("Failed to load data.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = (userId: number, roleName: string) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: roleName
    }));
  };

  const handleZoneChange = (userId: number, zoneId: string) => {
    setSelectedZones(prev => ({
      ...prev,
      [userId]: zoneId
    }));
  };

  const handleAction = async (userId: number, action: 'approve' | 'decline') => {
    // If approving, make sure a role and zone are selected
    const selectedRole = selectedRoles[userId];
    const selectedZone = selectedZones[userId];
    
    if (action === 'approve' && (!selectedRole || !selectedZone)) {
      toast.error("Please assign a role and a zone to the user before approving.");
      return;
    }

    setActionLoading(userId);
    try {
      const payload = action === 'approve' ? { role: selectedRole, zone_id: selectedZone } : {};
      
      const response = await fetch(`${API_BASE_URL}/setups/user-approvals/${userId}/${action}/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        
        // Clean up selected role state
        const newRoles = { ...selectedRoles };
        delete newRoles[userId];
        setSelectedRoles(newRoles);
        
        toast.success(`User successfully ${action}d!`);
      } else {
        toast.error("Action failed. Please try again.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Approvals</h2>
          <p className="text-muted-foreground">Review registrations and assign system roles before approving.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl shadow-soft-sm border border-border text-center">
          <UserCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Pending Approvals</h3>
          <p className="text-muted-foreground">All user accounts have been processed.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-soft-md overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm">
                  <th className="p-4 font-medium">Username</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Assign Role & Zone</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{user.username}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <select 
                          className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedRoles[user.id] || ""}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="" disabled>Select a Role...</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.role_name}>{role.role_name}</option>
                          ))}
                        </select>
                        <select 
                          className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedZones[user.id] || ""}
                          onChange={(e) => handleZoneChange(user.id, e.target.value)}
                        >
                          <option value="" disabled>Select a Zone...</option>
                          {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.zone_name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleAction(user.id, 'decline')}
                          disabled={actionLoading === user.id}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                          Decline
                        </Button>
                        <Button 
                          onClick={() => handleAction(user.id, 'approve')}
                          disabled={actionLoading === user.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
