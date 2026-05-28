import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  Pencil,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Decided core application features based on pages & setup modules
const MODULE_ACCESS_SECTIONS = [
  {
    id: "core",
    title: "Core Operational Pages",
    items: [
      { key: "dashboard", label: "Dashboard Analytics" },
      { key: "requests", label: "Service Requests & SOP Execution" },
      { key: "inventory", label: "Inventory Management" },
      { key: "penalty", label: "Penalty War Room Cases" },
      { key: "invoice", label: "Invoice & Work Closure" },
      { key: "warranty", label: "Warranty Calls Management" },
    ],
  },
  {
    id: "setup",
    title: "System Setup & Administration Masters",
    items: [
      { key: "setup_masters", label: "Master Configurations (Zones, Workshops, Categories, Compressor Types, SOP, SLA)" },
      { key: "role_access", label: "Role Based Access Control (RBAC)" },
    ],
  },
];

const ACTION_KEYS = ["view", "create", "modify", "cancel", "delete"];

function blankPermissions() {
  return {
    view: false,
    create: false,
    modify: false,
    cancel: false,
    delete: false,
  };
}

export default function RoleBaseAccessPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [allMappings, setAllMappings] = useState<any[]>([]);

  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [permissions, setPermissions] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [isFetchingPermissions, setIsFetchingPermissions] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 🌟 NEW: Helper function to get Auth Headers safely
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`,
    };
  };

  const fetchAllMappings = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/`, { headers });

      if (res.ok) {
        const data = await res.json();
        setAllMappings(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to load mappings summary", err);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        const roleRes = await fetch(`${API_BASE_URL}/setups/roles/`, { headers });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setRoles(Array.isArray(roleData) ? roleData : roleData.results || []);
        }

        try {
          const zoneRes = await fetch(`${API_BASE_URL}/setups/zones/`, { headers });
          if (zoneRes.ok) {
            const zoneData = await zoneRes.json();
            setZones(Array.isArray(zoneData) ? zoneData : zoneData.results || []);
          } else {
            setZones([{ id: "1", zone_name: "Main Zone" }]);
          }
        } catch {
          setZones([{ id: "1", zone_name: "Main Zone" }]);
        }

        await fetchAllMappings();
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!selectedZoneId || !selectedRoleId) {
      setPermissions({});
      setIsEditMode(false);
      return;
    }

    const fetchPermissions = async () => {
      setIsFetchingPermissions(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/setups/role-access-mappings/?zone_id=${selectedZoneId}&role=${selectedRoleId}`,
          { headers }
        );

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
  }, [selectedZoneId, selectedRoleId]);

  const siteModuleGroups = useMemo(() => {
    return MODULE_ACCESS_SECTIONS.map((section) => {
      const features = section.items.map((item) => ({
        key: `${section.id}:${item.key}`,
        label: item.label,
      }));

      return {
        title: section.title,
        features,
      };
    });
  }, []);

  const togglePermission = (featureKey: string, action: string, enabled: boolean) => {
    if (!isEditMode) return;
    setPermissions((prev: any) => ({
      ...prev,
      [featureKey]: {
        ...blankPermissions(),
        ...(prev[featureKey] || {}),
        [action]: enabled,
      },
    }));
  };

  const handleSaveMapping = async () => {
    if (!selectedZoneId || !selectedRoleId) return;
    
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/setups/role-access-mappings/sync_mapping/`,
        {
          method: "POST",
          headers: headers, // 🌟 FIXED: Attached headers here to solve the 500 error!
          body: JSON.stringify({
            role_id: selectedRoleId,
            zone_id: selectedZoneId,
            permissions,
          }),
        }
      );

      if (res.ok) {
        setStatusMessage("Permissions securely saved and applied.");
        setIsSuccess(true);
        setIsEditMode(false);

        fetchAllMappings();

        setTimeout(() => {
          setStatusMessage("");
          setIsSuccess(false);
        }, 4000);
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh] text-slate-500 font-medium">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading Configurations...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto p-2 pb-12">
        
        {/* Header Title Section & Status Feedback Message */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" /> Role Based Access Matrix
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure fine-grained page actions and setup feature permissions by operating zone and user role.
            </p>
          </div>
          
          {statusMessage && (
            <div
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all shadow-sm border",
                isSuccess 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
              {statusMessage}
            </div>
          )}
        </div>

        {/* Operating Zone & Role Selection Dropdowns Row */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Operating Zone</label>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
                <SelectValue placeholder="Choose an operating zone..." />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>
                    {z.zone_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Role</label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
                <SelectValue placeholder="Choose a user role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name || r.role_name || r.title || `Role ID: ${r.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Permissions Data Grid Matrix Matrix Box */}
        {selectedZoneId && selectedRoleId ? (
          isFetchingPermissions ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm text-slate-500 font-medium">Fetching access mapping permissions...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Matrix Table Toolbar Controls */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll} 
                    disabled={!isEditMode}
                    className="text-xs bg-white border-slate-200 hover:bg-slate-50"
                  >
                    Select All Actions
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearAll} 
                    disabled={!isEditMode}
                    className="text-xs bg-white border-slate-200 hover:bg-slate-50 text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <Button 
                      onClick={() => setIsEditMode(true)} 
                      className="gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs px-4"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Matrix Permissions
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditMode(false)}
                        className="text-xs bg-white border-slate-200"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveMapping} 
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Configuration
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Access Grid Data Matrix Table Element */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4 border-r border-slate-200 w-2/5">Feature / Page Module</th>
                      {ACTION_KEYS.map((action) => (
                        <th key={action} className="p-4 text-center capitalize border-r border-slate-200 last:border-r-0">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {siteModuleGroups.map((group) => (
                      <React.Fragment key={group.title}>
                        {/* Section Header Row Label */}
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={ACTION_KEYS.length + 1} className="p-3 font-bold text-slate-800 tracking-wide bg-slate-100/50">
                            {group.title}
                          </td>
                        </tr>
                        {/* Individual Item Module Action Checkbox Rows */}
                        {group.features.map((feature) => (
                          <tr key={feature.key} className="hover:bg-slate-50/80 transition-colors border-b border-slate-200 last:border-0">
                            <td className="p-4 border-r border-slate-200 font-medium text-slate-700 pl-8">
                              {feature.label}
                            </td>
                            {ACTION_KEYS.map((action) => {
                              const isChecked = permissions[feature.key]?.[action] === true;
                              return (
                                <td key={action} className="p-4 text-center border-r border-slate-200 last:border-r-0">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditMode}
                                    checked={isChecked}
                                    onChange={(e) => togglePermission(feature.key, action, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed transition-all"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty/Initial Selection State Window */
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 flex flex-col items-center justify-center p-4">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-lg text-slate-700">No Zone or Role Selected</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Please choose both an operating zone and a user role from the controls above to view or modify the active access matrix grid.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}