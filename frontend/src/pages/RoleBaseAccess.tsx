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
  Grid,
  List,
  Eye,
  X,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_KEYS = ["view", "create", "modify", "cancel", "delete"];

const MODULE_ACCESS_SECTIONS = [
  {
    id: "core",
    title: "Core Features",
    items: [
      { key: "my_tickets", label: "My Tickets" },
      { key: "staff", label: "Staff Management" },
      { key: "communication", label: "Communications" },
      { key: "vendors", label: "Vendor Management" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { key: "bookings", label: "Facility Bookings" },
      { key: "visitor_mgmt", label: "Visitor Management" },
      { key: "incidents", label: "Incident Reporting" },
      { key: "work_order", label: "Work Orders" },
      { key: "gatepass", label: "Gate Pass" },
    ],
  },
  {
    id: "financial",
    title: "Financial & Accounts",
    items: [
      { key: "accounting", label: "Accounting" },
      { key: "bills", label: "Billing & Invoicing" },
    ],
  },
  {
    id: "hr",
    title: "Human Resources",
    items: [
      { key: "attendance", label: "Attendance" },
      { key: "hrms", label: "HRMS" },
    ],
  },
  {
    id: "site_setup",
    title: "System Setup",
    items: [
      { key: "setup_tickets", label: "Ticket Configurations" },
      { key: "setup_incidents", label: "Incident Configurations" },
    ],
  },
];

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
  const [zones, setZones] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [allMappings, setAllMappings] = useState<any[]>([]);

  // Seed default mandatory sections directly to guarantee view layout
  const [moduleGroups, setModuleGroups] = useState<any[]>(MODULE_ACCESS_SECTIONS);

  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [permissions, setPermissions] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [isFetchingPermissions, setIsFetchingPermissions] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Layout states for summary section
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMappingForModal, setSelectedMappingForModal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    };
  };

  const fetchAllMappings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/`, {
        headers: getAuthHeaders(),
      });
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
      try {
        const roleRes = await fetch(`${API_BASE_URL}/setups/roles/`, { headers: getAuthHeaders() });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setRoles(Array.isArray(roleData) ? roleData : roleData.results || []);
        }

        try {
          const zoneRes = await fetch(`${API_BASE_URL}/setups/zones/`, { headers: getAuthHeaders() });
          if (zoneRes.ok) {
            const zoneData = await zoneRes.json();
            setZones(Array.isArray(zoneData) ? zoneData : zoneData.results || []);
          } else {
            setZones([{ id: "1", zone_name: "Main Zone" }]);
          }
        } catch {
          setZones([{ id: "1", zone_name: "Main Zone" }]);
        }

        try {
          const featureRes = await fetch(`${API_BASE_URL}/setups/features-master/`, { headers: getAuthHeaders() });
          if (featureRes.ok) {
            const featureData = await featureRes.json();
            const fetched = Array.isArray(featureData) ? featureData : featureData.results || [];
            if (fetched.length > 0) {
              setModuleGroups(fetched);
            }
          }
        } catch (err) {
          console.error("Using default static configurations.", err);
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
      try {
        const res = await fetch(
          `${API_BASE_URL}/setups/role-access-mappings/?site_id=${selectedZoneId}&role=${selectedRoleId}`,
          { headers: getAuthHeaders() }
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
    return moduleGroups.map((section: any) => {
      const features = (section.items || []).map((item: any) => ({
        key: item.key,
        label: item.label,
      }));
      return { id: section.id, title: section.title, features };
    });
  }, [moduleGroups]);

  const togglePermission = (featureKey: string, action: string, enabled: boolean) => {
    if (!isEditMode) return;
    setPermissions((prev: any) => {
      const currentFeaturePerms = prev[featureKey] || blankPermissions();
      return {
        ...prev,
        [featureKey]: { ...currentFeaturePerms, [action]: enabled },
      };
    });
  };

  const handleSaveMapping = async () => {
    if (!selectedZoneId || !selectedRoleId) return;
    try {
      const formattedRoleId = isNaN(Number(selectedRoleId)) ? selectedRoleId : Number(selectedRoleId);
      const formattedZoneId = isNaN(Number(selectedZoneId)) ? selectedZoneId : Number(selectedZoneId);

      const res = await fetch(`${API_BASE_URL}/setups/role-access-mappings/sync_mapping/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          role_id: formattedRoleId,
          zone_id: formattedZoneId,
          permissions,
        }),
      });

      if (res.ok) {
        setStatusMessage("Permissions securely saved and applied.");
        setIsSuccess(true);
        setIsEditMode(false);
        await fetchAllMappings();
        setTimeout(() => {
          setStatusMessage("");
          setIsSuccess(false);
        }, 4000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatusMessage(errorData.error || "Failed to save permissions.");
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
      group.features.forEach((feature: any) => {
        next[feature.key] = { view: true, create: true, modify: true, cancel: true, delete: true };
      });
    });
    setPermissions(next);
  };

  const handleClearAll = () => {
    const next: any = { ...permissions };
    siteModuleGroups.forEach((group) => {
      group.features.forEach((feature: any) => {
        next[feature.key] = blankPermissions();
      });
    });
    setPermissions(next);
  };

  const getZoneName = (id: string | number) => {
    const zone = zones.find((z) => String(z.id) === String(id));
    return zone ? zone.zone_name : `Zone ID: ${id}`;
  };

  const getRoleName = (id: string | number) => {
    const role = roles.find((r) => String(r.id) === String(id));
    return role ? role.role_name || role.name || `Role ID: ${id}` : `Role ID: ${id}`;
  };

  const countActiveFeatures = (permsObj: any) => {
    if (!permsObj) return 0;
    return Object.values(permsObj).filter((p: any) => Object.values(p).some((val) => val === true)).length;
  };

  // Add this right before your loading check and return statement
  const groupedMappings = useMemo(() => {
    const groups: Record<string, any> = {};

    allMappings.forEach((mapping) => {
      const rId = String(mapping.role);
      if (!groups[rId]) {
        groups[rId] = {
          roleId: rId,
          roleName: getRoleName(rId),
          mappings: [],
        };
      }
      groups[rId].mappings.push(mapping);
    });

    return Object.values(groups);
  }, [allMappings, roles, zones]);

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
      <div className="space-y-8 max-w-6xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Role Based Access Matrix
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure fine-grained page actions and application feature permissions by operational zone and user role.
            </p>
          </div>

          {statusMessage && (
            <div className={cn(
              "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium border shadow-sm",
              isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            )}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
              {statusMessage}
            </div>
          )}
        </div>

        {/* Selectors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Operating Zone</label>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
                <SelectValue placeholder="Choose an operating zone..." />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>{z.zone_name}</SelectItem>
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
                  <SelectItem key={r.id} value={String(r.id)}>{r.role_name || r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Matrix */}
        {selectedZoneId && selectedRoleId ? (
          isFetchingPermissions ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm text-slate-500 font-medium">Fetching access mapping permissions...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Toolbar */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={!isEditMode} className="text-xs bg-white">
                    Select All Actions
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll} disabled={!isEditMode} className="text-xs bg-white text-red-600 hover:text-red-700">
                    Clear All
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <Button onClick={() => setIsEditMode(true)} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs px-3 py-1.5 h-auto">
                      <Pencil className="w-3.5 h-3.5" /> Edit Matrix Permissions
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveMapping} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm px-3 py-1.5 h-auto">
                        <Save className="w-3.5 h-3.5" /> Save Configuration
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions Table */}
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
                      <React.Fragment key={group.id}>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={ACTION_KEYS.length + 1} className="p-3 font-bold text-slate-800 bg-slate-100/50">
                            {group.title}
                          </td>
                        </tr>
                        {group.features.map((feature: any) => (
                          <tr key={feature.key} className="hover:bg-slate-50/80 border-b border-slate-200 last:border-0">
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
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer disabled:cursor-not-allowed text-center mx-auto block"
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
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 flex flex-col items-center justify-center p-4">
            <Users className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No Zone or Role Selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please choose both an operating zone and a user role from the controls above to view or modify active configurations.
            </p>
          </div>
        )}

        {/* --- ASSIGNED ACCESS LIST SUMMARY SECTION --- */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Access List (By Role)</h2>
              <p className="text-xs text-slate-500">Overview of configured security permissions grouped by user role.</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {groupedMappings.length === 0 ? (
            <div className="text-center py-8 bg-white border rounded-xl text-slate-400 text-sm">
              No active permission profiles saved yet.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedMappings.map((group: any) => (
                <div key={group.roleId} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                  {/* Role Header */}
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{group.roleName}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                      {group.mappings.length} Zone(s)
                    </span>
                  </div>

                  {/* Assigned Zones List */}
                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configured Zones</p>
                    {group.mappings.map((mapping: any) => (
                      <div key={mapping.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-lg group hover:border-indigo-200 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{getZoneName(mapping.site_id)}</p>
                          <p className="text-[11px] text-emerald-600 font-medium">{countActiveFeatures(mapping.permissions)} features active</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedMappingForModal(mapping); setIsModalOpen(true); }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Permission Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5 w-1/3">Role / Zone</th>
                    <th className="p-3 text-center">Configured Features</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedMappings.map((group: any) => (
                    <React.Fragment key={group.roleId}>
                      {/* Role Group Row */}
                      <tr className="bg-indigo-50/50 border-b border-slate-200">
                        <td colSpan={3} className="p-3 pl-5 font-bold text-indigo-700 flex items-center gap-2">
                          <Users className="w-4 h-4" /> {group.roleName}
                        </td>
                      </tr>
                      {/* Sub-rows for each zone under this role */}
                      {group.mappings.map((mapping: any) => (
                        <tr key={mapping.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-3 pl-12 text-slate-700 font-medium flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {getZoneName(mapping.site_id)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-semibold">
                              {countActiveFeatures(mapping.permissions)} active
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedMappingForModal(mapping); setIsModalOpen(true); }}
                              className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 h-8 text-xs border-slate-200 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Matrix
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Breakdown Details Drawer/Modal */}
        {isModalOpen && selectedMappingForModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Active Matrix Config: {getRoleName(selectedMappingForModal.role)}
                  </h3>
                  <p className="text-xs text-slate-500">Zone Context: {getZoneName(selectedMappingForModal.site_id)}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                {siteModuleGroups.map((group) => {
                  const itemsWithPerms = group.features.filter((f: any) =>
                    selectedMappingForModal.permissions[f.key] &&
                    Object.values(selectedMappingForModal.permissions[f.key]).some(v => v === true)
                  );
                  if (itemsWithPerms.length === 0) return null;
                  return (
                    <div key={group.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/30">
                      <h4 className="text-xs font-bold text-slate-800 border-b pb-1.5 mb-2 uppercase tracking-wide">
                        {group.title}
                      </h4>
                      <div className="space-y-2">
                        {itemsWithPerms.map((f: any) => (
                          <div key={f.key} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-slate-200 shadow-2xs">
                            <span className="font-medium text-slate-700">{f.label}</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {ACTION_KEYS.map((action) => {
                                const active = selectedMappingForModal.permissions[f.key]?.[action] === true;
                                return active ? (
                                  <span key={action} className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                                    {action}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {countActiveFeatures(selectedMappingForModal.permissions) === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">No permissions configured for this matrix profile.</div>
                )}
              </div>
              <div className="p-3 border-t bg-slate-50 flex justify-end">
                <Button onClick={() => setIsModalOpen(false)} size="sm" className="text-xs bg-slate-900 text-white hover:bg-slate-800">
                  Close Breakdown
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}