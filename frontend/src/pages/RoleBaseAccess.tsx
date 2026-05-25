import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Save, Loader2, CheckCircle2, Pencil, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULE_ACCESS_SECTIONS = [
  { 
    id: "core", title: "Core Features", 
    items: [{ key: "my_tickets", label: "My Tickets" }, { key: "staff", label: "Staff Management" }, { key: "communication", label: "Communications" }, { key: "vendors", label: "Vendor Management" }] 
  },
  { 
    id: "operations", title: "Operations", 
    items: [{ key: "bookings", label: "Facility Bookings" }, { key: "visitor_mgmt", label: "Visitor Management" }, { key: "incidents", label: "Incident Reporting" }, { key: "work_order", label: "Work Orders" }, { key: "gatepass", label: "Gate Pass" }] 
  },
  { 
    id: "financial", title: "Financial & Accounts", 
    items: [{ key: "accounting", label: "Accounting" }, { key: "bills", label: "Billing & Invoicing" }] 
  },
  { 
    id: "hr", title: "Human Resources", 
    items: [{ key: "attendance", label: "Attendance" }, { key: "hrms", label: "HRMS" }] 
  },
  { 
    id: "site_setup", title: "System Setup", 
    items: [{ key: "setup_tickets", label: "Ticket Configurations" }, { key: "setup_incidents", label: "Incident Configurations" }] 
  }
];

const ACTION_KEYS = ["view", "create", "modify", "cancel", "delete"];

function blankPermissions() {
  return { view: false, create: false, modify: false, cancel: false, delete: false };
}

export default function RoleBaseAccessPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]); 
  
  // NEW: State to hold all existing mappings for the overview table
  const [allMappings, setAllMappings] = useState<any[]>([]);
  
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [permissions, setPermissions] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [isFetchingPermissions, setIsFetchingPermissions] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Fetch Initial Data & All Mappings
  const fetchAllMappings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/`);
      if (res.ok) {
        const data = await res.json();
        setAllMappings(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to load mappings summary");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const roleRes = await fetch(`${API_BASE_URL}/setups/roles/`);
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setRoles(Array.isArray(roleData) ? roleData : roleData.results || []);
        }

        try {
            const siteRes = await fetch(`${API_BASE_URL}/setups/sites/`);
            if (siteRes.ok) {
                const siteData = await siteRes.json();
                setSites(Array.isArray(siteData) ? siteData : siteData.results || []);
            } else {
                setSites([{ id: "1", siteName: "Main HQ" }]);
            }
        } catch {
            setSites([{ id: "1", siteName: "Main HQ" }]);
        }

        await fetchAllMappings(); // Fetch the overview data!

      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  // 2. Fetch specific permissions when dropdowns change
  useEffect(() => {
    if (!selectedSiteId || !selectedRoleId) {
      setPermissions({});
      setIsEditMode(false);
      return;
    }

    const fetchPermissions = async () => {
      setIsFetchingPermissions(true);
      try {
        const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/?site_id=${selectedSiteId}&role=${selectedRoleId}`);
        if (res.ok) {
          const data = await res.json();
          const mappings = Array.isArray(data) ? data : data.results || [];
          
          if (mappings.length > 0 && mappings[0].permissions && Object.keys(mappings[0].permissions).length > 0) {
            setPermissions(mappings[0].permissions);
            setIsEditMode(false);
          } else {
            setPermissions({});
            setIsEditMode(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions", err);
      } finally {
        setIsFetchingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, [selectedSiteId, selectedRoleId]);

  const siteModuleGroups = useMemo(() => {
    return MODULE_ACCESS_SECTIONS.map((section) => {
      const features = section.items.map((item) => ({ key: `${section.id}:${item.key}`, label: item.label }));
      return { title: section.title, features };
    });
  }, []);

  const togglePermission = (featureKey: string, action: string, enabled: boolean) => {
    if (!isEditMode) return;
    setPermissions((prev: any) => ({
      ...prev,
      [featureKey]: { ...blankPermissions(), ...(prev[featureKey] || {}), [action]: enabled },
    }));
  };

  const handleSaveMapping = async () => {
    if (!selectedSiteId || !selectedRoleId) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/sync_mapping/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          site_id: selectedSiteId,
          permissions: permissions
        })
      });

      if (res.ok) {
        setStatusMessage("Permissions securely saved and applied.");
        setIsSuccess(true);
        setIsEditMode(false);
        fetchAllMappings(); // Refresh the top table instantly!
        setTimeout(() => { setStatusMessage(""); setIsSuccess(false); }, 4000);
      } else {
        setStatusMessage("Failed to save permissions.");
        setIsSuccess(false);
      }
    } catch (err) {
      setStatusMessage("Network error while saving.");
      setIsSuccess(false);
    }
  };

  const handleSelectAll = () => {
    const next: any = { ...permissions };
    siteModuleGroups.forEach((group) => {
      group.features.forEach((feature) => {
        next[feature.key] = { view: true, create: true, modify: true, cancel: true, delete: true };
      });
    });
    setPermissions(next);
  };

  const handleClearAll = () => {
    const next: any = { ...permissions };
    siteModuleGroups.forEach((group) => {
      group.features.forEach((feature) => {
        next[feature.key] = blankPermissions();
      });
    });
    setPermissions(next);
  };

  // Helper to get Site Name for the table
  const getSiteName = (id: string) => {
    const site = sites.find(s => String(s.id) === String(id));
    return site ? site.siteName : `Site ID: ${id}`;
  };

  // Helper to count active permissions
  const countActivePermissions = (permsObj: any) => {
    if (!permsObj) return 0;
    return Object.values(permsObj).filter((p: any) => Object.values(p).some(val => val === true)).length;
  };

  if (loading) return <MainLayout><div className="flex justify-center items-center h-[60vh] text-slate-500 font-medium"><Loader2 className="w-6 h-6 animate-spin mr-2"/> Loading Configurations...</div></MainLayout>;

  const hasNoPermissions = Object.keys(permissions).length === 0;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" /> Role Based Access
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Dynamically configure module access for organizational roles.</p>
        </div>
      </div>

      {/* --- NEW OVERVIEW TABLE: Shows who currently has access! --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-500" />
          <h2 className="font-bold text-slate-800 uppercase tracking-tight">Active Role Assignments</h2>
        </div>
        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left text-sm">
            <thead className="bg-white sticky top-0 z-10 font-black uppercase text-[10px] text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4">Target Site</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Features Granted</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allMappings.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500 font-medium">No roles have been assigned permissions yet.</td></tr>
              ) : (
                allMappings.map((mapItem) => (
                  <tr key={mapItem.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-800">{getSiteName(mapItem.site_id)}</td>
                    <td className="p-4 font-bold text-primary">{mapItem.role_name || `Role ID: ${mapItem.role}`}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {countActivePermissions(mapItem.permissions)} Active Modules
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          setSelectedSiteId(String(mapItem.site_id));
                          setSelectedRoleId(String(mapItem.role));
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="font-bold text-xs uppercase text-slate-500 mb-2 block">1. Select Target Site</label>
            <Select value={selectedSiteId} onValueChange={(v) => { setSelectedSiteId(v); setSelectedRoleId(""); }}>
              <SelectTrigger className="border-slate-300"><SelectValue placeholder="Choose a site..." /></SelectTrigger>
              <SelectContent>
                {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.siteName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-bold text-xs uppercase text-slate-500 mb-2 block">2. Select Role</label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={!selectedSiteId}>
              <SelectTrigger className={cn("border-slate-300", !selectedSiteId && "bg-slate-50")}><SelectValue placeholder="Choose an organizational role..." /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.role_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <Button variant={isEditMode ? "destructive" : "outline"} onClick={() => setIsEditMode(!isEditMode)} disabled={!selectedSiteId || !selectedRoleId || isFetchingPermissions}>
            {isEditMode ? "Cancel Editing" : "Enable Edit Mode"}
          </Button>
          <Button variant="outline" onClick={handleSelectAll} disabled={!isEditMode || !selectedRoleId}>Grant All</Button>
          <Button variant="outline" onClick={handleClearAll} disabled={!isEditMode || !selectedRoleId}>Revoke All</Button>
          <div className="flex-1" />
          
          {statusMessage && (
            <span className={cn("text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-full transition-all", isSuccess ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50")}>
              {isSuccess && <CheckCircle2 className="w-4 h-4"/>} {statusMessage}
            </span>
          )}
          
          <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all" onClick={handleSaveMapping} disabled={!isEditMode || !selectedRoleId}>
            <Save className="w-4 h-4" /> Save Permissions
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isFetchingPermissions && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-600 font-bold">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary"/>
            Fetching Role Data...
          </div>
        )}

        {!selectedSiteId || !selectedRoleId ? (
          <div className="p-12 text-center text-slate-500 font-medium">Please select a Site and a Role to view or edit permissions.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 font-black uppercase text-[11px] text-slate-500 border-b">
              <tr>
                <th className="p-4">Module / Feature</th>
                {ACTION_KEYS.map(act => <th key={act} className="p-4 text-center">{act}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {!isEditMode && hasNoPermissions && !isFetchingPermissions && (
                <tr>
                  <td colSpan={6} className="p-8 text-center bg-amber-50/50">
                    <p className="text-amber-800 font-bold mb-1">No permissions are assigned to this role yet.</p>
                    <p className="text-amber-700/80 text-xs">Click "Enable Edit Mode" above to start configuring access.</p>
                  </td>
                </tr>
              )}

              {siteModuleGroups.map((group) => (
                <React.Fragment key={group.title}>
                  <tr className="bg-slate-50/80 border-y border-slate-200">
                    <td className="p-3 font-black text-slate-800 uppercase text-xs tracking-wider" colSpan={6}>{group.title}</td>
                  </tr>
                  {group.features.map((feature: any) => {
                    const fPerms = permissions[feature.key] || blankPermissions();
                    return (
                      <tr key={feature.key} className={cn("transition-colors", isEditMode ? "hover:bg-slate-50" : "opacity-80")}>
                        <td className="p-4 font-medium text-slate-700 pl-8 border-r border-slate-100">{feature.label}</td>
                        {ACTION_KEYS.map((action) => (
                          <td key={`${feature.key}-${action}`} className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              className={cn(
                                "w-4 h-4 rounded transition-all",
                                isEditMode ? "cursor-pointer accent-primary" : "cursor-not-allowed grayscale opacity-50"
                              )}
                              checked={!!fPerms[action]} 
                              onChange={(e) => togglePermission(feature.key, action, e.target.checked)}
                              disabled={!isEditMode}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}