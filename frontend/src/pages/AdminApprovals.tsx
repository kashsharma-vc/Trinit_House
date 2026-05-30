import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, UserCircle2, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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

export default function AdminApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Track selected role for each user
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});

  const fetchData = async () => {
    try {
      const headers = { "Authorization": `Token ${localStorage.getItem("token")}` };
      
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/setups/user-approvals/pending/`, { headers }),
        fetch(`${API_BASE_URL}/setups/roles/`, { headers })
      ]);
      
      if (usersRes.ok && rolesRes.ok) {
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        
        setUsers(usersData);
        
        // Handle paginated or unpaginated roles
        const rawRoles = Array.isArray(rolesData) ? rolesData : (rolesData.results || []);
        setRoles(rawRoles);
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

  const handleAction = async (userId: number, action: 'approve' | 'decline') => {
    // If approving, make sure a role is selected
    const selectedRole = selectedRoles[userId];
    if (action === 'approve' && !selectedRole) {
      toast.error("Please assign a role to the user before approving.");
      return;
    }

    setActionLoading(userId);
    try {
      const payload = action === 'approve' ? { role: selectedRole } : {};
      
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

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-slate-900">User Approvals</h1>
        <p className="text-slate-500 mt-1">
          Review registrations and assign system roles before approving.
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <UserCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Pending Approvals</h3>
          <p className="text-slate-500">All user accounts have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-sm">
                  <th className="p-4 font-bold">Username</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Assign Role</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{user.username}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <select 
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                        value={selectedRoles[user.id] || ""}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="" disabled>Select a Role...</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.role_name}>{role.role_name}</option>
                        ))}
                      </select>
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
    </MainLayout>
  );
}
