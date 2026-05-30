import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { useSetupStore } from "@/store/setupStore";
import { MasterList } from "@/components/setup/MasterList";
import { MasterDetailModal } from "@/components/setup/MasterDetailModal";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import {  
  Users, Shield, Building2, MapPin, Wrench, Package, Clock,  
  FileText, Database, Tag, AlertTriangle, History, Layers
} from "lucide-react";

// Simplified tabs - only 9 sections as per requirements
const setupTabs = [  
  { id: "roles", label: "Roles & Permissions", description: "Manage user roles and access control", icon: Users },  
  { id: "zones", label: "Zone Masters", description: "Configure geographical zones", icon: MapPin },  
  { id: "workshops", label: "Workshop Masters", description: "Configure workshop locations", icon: Building2 },  
  { id: "categories", label: "Category Master", description: "Manage compressor categories", icon: Tag },  
  { id: "compressors", label: "Compressor Types", description: "Configure compressor categories", icon: Wrench },  
  { id: "sop_stages", label: "SOP Stages", description: "Manage dynamic SOP stages", icon: FileText },  
  { id: "checklists", label: "Checklists", description: "Manage stage checklists", icon: FileText },  
  { id: "sla", label: "SLA Settings", description: "Configure SLA thresholds and penalties", icon: Clock },  
  { id: "inventory", label: "Inventory Masters", description: "Manage spare parts catalog", icon: Package },  
  { id: "audit", label: "Audit & Compliance", description: "Configure audit settings", icon: History },
  { id: "app_features", label: "Feature Access", description: "Add modules for Role Matrix", icon: Layers },
];

export default function Setup() {  
  const [activeTab, setActiveTab] = useState("roles");  
  const [modalOpen, setModalOpen] = useState(false);  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');  
  const [selectedItem, setSelectedItem] = useState<any>(null);  
  const store = useSetupStore();  

  // --- 1. LIVE DATA STATES ---  
  const [liveCompressors, setLiveCompressors] = useState<any[]>([]);  
  const [liveCategories, setLiveCategories] = useState<any[]>([]);  
  const [liveZones, setLiveZones] = useState<any[]>([]);  
  const [liveWorkshops, setLiveWorkshops] = useState<any[]>([]);
  const [liveModules, setLiveModules] = useState<any[]>([]);
  const [liveFeatures, setLiveFeatures] = useState<any[]>([]);
  const [liveSOPStages, setLiveSOPStages] = useState<any[]>([]);
  const [liveChecklists, setLiveChecklists] = useState<any[]>([]);

  // --- 2. REUSABLE FETCH FUNCTION ---
  const fetchData = async () => {    
    try {      
      const headers = { "Authorization": `Token ${localStorage.getItem('token')}` };
      const [compRes, catRes, zoneRes, wsRes, modRes, featRes, sopRes, chkRes] = await Promise.all([        
        fetch(`${API_BASE_URL}/setups/compressors/`, { headers }),        
        fetch(`${API_BASE_URL}/setups/categories/`, { headers }),        
        fetch(`${API_BASE_URL}/setups/zones/`, { headers }),        
        fetch(`${API_BASE_URL}/setups/workshops/`, { headers }),
        fetch(`${API_BASE_URL}/setups/features-master/`, { headers }),
        fetch(`${API_BASE_URL}/setups/app-features/`, { headers }),
        fetch(`${API_BASE_URL}/setups/sop-templates/`, { headers }),
        fetch(`${API_BASE_URL}/setups/checklist-templates/`, { headers })
      ]);      

      const compData = await compRes.json();      
      const catData = await catRes.json();      
      const zoneData = await zoneRes.json();      
      const wsData = await wsRes.json();      
      const modData = await modRes.json();
      const featData = await featRes.json();
      const sopData = await sopRes.json();
      const chkData = await chkRes.json();

      // Safely extract arrays      
      const rawCompressors = Array.isArray(compData) ? compData : (compData.results || []);      
      const rawCategories = Array.isArray(catData) ? catData : (catData.results || []);      
      const rawZones = Array.isArray(zoneData) ? zoneData : (zoneData.results || []);      
      const rawWorkshops = Array.isArray(wsData) ? wsData : (wsData.results || []);
      const rawModules = Array.isArray(modData) ? modData : (modData.results || []);
      const rawFeatures = Array.isArray(featData) ? featData : (featData.results || []);      
      const rawSOP = Array.isArray(sopData) ? sopData : (sopData.results || []);      
      const rawChk = Array.isArray(chkData) ? chkData : (chkData.results || []);      

      // MAP 1: Categories      
      setLiveCategories(rawCategories.map((c: any) => ({        
        id: c.id,        
        categoryName: c.category_name || c.name,        
        status: c.status || "Active"      
      })));      

      // MAP 2: Zones      
      setLiveZones(rawZones.map((z: any) => ({        
        id: z.id,        
        zoneName: z.zone_name || z.name,        
        description: z.description || "",        
        status: z.status || "Active"      
      })));      

      // MAP 3: Workshops      
      setLiveWorkshops(rawWorkshops.map((w: any) => ({        
        id: w.id,        
        workshopName: w.workshop_name || w.name,        
        zoneName: w.zone_name || "Unknown Zone",
        zoneId: w.zone, // Kept for editing referencing
        location: w.location || "",        
        capacity: w.capacity || 0,        
        defaultSLA: w.default_sla || 0,        
        status: w.status || "Active"      
      })));      

      // MAP 4: Compressors      
      setLiveCompressors(rawCompressors.map((c: any) => ({        
        id: c.id,        
        compressorType: c.compressor_type || c.name || "Unknown",        
        model: c.model || "", 
        categoryId: c.category, // Kept for editing referencing
        categoryName: c.cat_name || "Unknown",
        penaltyApplicable: c.penalty_applicable ? "Yes" : "No",        
        status: c.status || "Active"      
      })));      

      setLiveModules(rawModules);
      setLiveFeatures(rawFeatures.map((f: any) => ({
        id: f.id,
        featureKey: f.feature_key,
        label: f.label,
        moduleId: f.module,
        moduleName: rawModules.find((m: any) => m.id === f.module)?.title || "Unknown Module"
      })));

      setLiveSOPStages(rawSOP.map((item: any) => ({
        id: item.id,
        applicableRequestType: item.applicable_request_type,
        name: item.name,
        sequence: item.sequence,
        purpose: item.purpose
      })));

      setLiveChecklists(rawChk.map((c: any) => ({
        id: c.id,
        stageId: c.stage_template,  // FK field name in model is stage_template
        stageName: rawSOP.find((s: any) => s.id === c.stage_template)?.name || "Unknown",
        itemText: c.text,            // model field is 'text' not 'item_text'
        requiresDoc: c.requires_doc ? "Yes" : "No",
        requiresPhoto: c.requires_photo ? "Yes" : "No",
        sequence: c.sequence
      })));

    } catch (error) {      
      console.error("Failed to fetch setup data from Django:", error);    
    }  
  };

  useEffect(() => {    
    fetchData();  
  }, []);  

  const handleAdd = () => {    
    setSelectedItem(null);    
    setModalMode('add');    
    setModalOpen(true);  
  };  

  const handleEdit = (item: any) => {    
    setSelectedItem(item);    
    setModalMode('edit');    
    setModalOpen(true);  
  };  

  const handleView = (item: any) => {    
    setSelectedItem(item);    
    setModalMode('view');    
    setModalOpen(true);  
  };  

  // --- 3. DYNAMIC DELETE FUNCTION ---
  const handleDelete = async (collection: string, id: string, name: string) => {    
    const isLiveEndpoint = ['zones', 'workshops', 'categories', 'compressors', 'app-features', 'sop-templates', 'checklist-templates'].includes(collection);

    if (isLiveEndpoint) {
      try {
        const res = await fetch(`${API_BASE_URL}/setups/${collection}/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        toast.success(`${name} deleted successfully`);
        fetchData(); // Refresh table
      } catch (err) {
        toast.error(`Failed to delete ${name}.`);
      }
    } else {
      // Local Store Fallback
      store.deleteItem(collection as any, id);    
      toast.success(`${name} deleted successfully`);  
    }
  };  

  // --- 4. DYNAMIC SAVE FUNCTION ---
  const handleSave = async (collection: string, data: any, mode: 'add' | 'edit' | 'view') => {    
    if (mode === 'view') {      
      setModalOpen(false);      
      return;    
    }    

    const isLiveEndpoint = ['zones', 'workshops', 'categories', 'compressors', 'app-features', 'sop-templates', 'checklist-templates'].includes(collection);
    
    // Convert boolean toggles to Active/Inactive strings if needed
    const statusVal = data.status === true || data.status === 'Active' ? 'Active' : 'Inactive';

    if (isLiveEndpoint) {
      const url = mode === 'add' 
        ? `${API_BASE_URL}/setups/${collection}/` 
        : `${API_BASE_URL}/setups/${collection}/${data.id}/`;
      const method = mode === 'add' ? "POST" : "PATCH";

      // Map Frontend camelCase data to Django snake_case
      let payload: any = {};
      if (collection === 'zones') {
        payload = { zone_name: data.zoneName, description: data.description, status: statusVal };
      } else if (collection === 'workshops') {
        payload = { workshop_name: data.workshopName, zone: data.zoneId, location: data.location, capacity: Number(data.capacity), default_sla: Number(data.defaultSLA), status: statusVal };
      } else if (collection === 'categories') {
        payload = { category_name: data.categoryName, status: statusVal };
      } else if (collection === 'compressors') {
        payload = { compressor_type: data.compressorType, model: data.model, category: data.categoryId, penalty_applicable: data.penaltyApplicable === true || data.penaltyApplicable === 'Yes', status: statusVal };
      } else if (collection === 'app-features') {
        payload = { 
          feature_key: data.featureKey, 
          label: data.label, 
          module: data.moduleId 
        };
      } else if (collection === 'sop-templates') {
        payload = {
          applicable_request_type: data.applicableRequestType || '',
          name: data.name,
          sequence: Number(data.sequence),
          purpose: data.purpose || ''
        };
      } else if (collection === 'checklist-templates') {
        payload = {
          stage_template: data.stageId,  // FK field is 'stage_template' in the model
          text: data.itemText,            // model field is 'text'
          requires_doc: data.requiresDoc === true || data.requiresDoc === 'Yes',
          requires_photo: data.requiresPhoto === true || data.requiresPhoto === 'Yes',
          sequence: Number(data.sequence)
        };
      }

      try {
        const response = await fetch(url, {
          method,
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Token ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          console.error("Backend Error:", errData);
          toast.error("Failed to save. Check inputs.");
          return;
        }

        toast.success(`Successfully ${mode === 'add' ? 'added' : 'updated'} ${collection}!`);
        setModalOpen(false);
        fetchData(); // REFRESH THE LIVE DATA IMMEDIATELY
      } catch (err) {
        toast.error("Network error saving to backend.");
      }
    } else {
      // Local Store logic for items without backend endpoints yet (SOP, SLA, Roles)
      const processedData = { ...data, status: statusVal };    
      if (mode === 'add') {      
        store.addItem(collection as any, {        
          ...processedData,        
          createdBy: 'Current Admin',        
          createdOn: new Date().toISOString().split('T')[0]      
        });      
        toast.success('Item created successfully');    
      } else {      
        store.updateItem(collection as any, processedData.id, processedData);      
        toast.success('Item updated successfully');    
      }    
      setModalOpen(false);  
    }
  };  

  const getOptions = (collection: any[], labelKey: string, valueKey: string = 'id') => {    
    return collection.map(item => ({      
      value: item[valueKey],      
      label: item[labelKey]    
    }));  
  };  

  const renderContent = () => {    
    switch (activeTab) {      
      case 'roles':        
        return (          
          <>            
            <MasterList              
              title="Roles & Permissions"              
              data={store.roles}              
              columns={[                
                { key: 'roleName', label: 'Role Name', sortable: true },                
                { key: 'description', label: 'Description' },                
                { key: 'userCount', label: 'Users' },                
                { key: 'status', label: 'Status', sortable: true },                
                { key: 'createdOn', label: 'Created On' },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => handleDelete('roles', id, 'Role')}              
              addButtonText="Add Role"              
              searchPlaceholder="Search roles..."              
              searchKeys={['roleName', 'description']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Role"              
              subtitle="Define system roles and access levels"              
              icon={<Shield className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="ROLE"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('roles', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'roleName', label: 'Role Name', type: 'text', required: true, placeholder: 'e.g., Admin', showLink: true },                
                { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Role description' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'zones':        
        return (          
          <>            
            <MasterList              
              title="Zone Masters"              
              data={liveZones}              
              columns={[                
                { key: 'zoneName', label: 'Zone Name', sortable: true },                
                { key: 'description', label: 'Description' },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => handleDelete('zones', id, 'Zone')}              
              addButtonText="Add Zone"              
              searchPlaceholder="Search zones..."              
              searchKeys={['zoneName', 'description']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Zone"              
              subtitle="Configure geographical zones"              
              icon={<MapPin className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="ZONE"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('zones', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'zoneName', label: 'Zone Name', type: 'text', required: true, placeholder: 'e.g., Northern' },                
                { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Zone description' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'workshops':        
        return (          
          <>            
            <MasterList              
              title="Workshop Masters"              
              data={liveWorkshops}              
              columns={[                
                { key: 'workshopName', label: 'Workshop Name', sortable: true },                
                { key: 'zoneName', label: 'Zone', sortable: true },                
                { key: 'location', label: 'Location' },                
                { key: 'capacity', label: 'Capacity' },                
                { key: 'defaultSLA', label: 'Default SLA (days)' },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => handleDelete('workshops', id, 'Workshop')}              
              addButtonText="Add Workshop"              
              searchPlaceholder="Search workshops..."              
              searchKeys={['workshopName', 'zoneName', 'location']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Workshop"              
              subtitle="Configure workshop locations"              
              icon={<Building2 className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="WS"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('workshops', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'workshopName', label: 'Workshop Name', type: 'text', required: true, placeholder: 'e.g., Delhi Workshop' },                
                { name: 'zoneId', label: 'Zone', type: 'select', required: true, options: getOptions(liveZones, 'zoneName'), showLink: true },                
                { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Okhla' },                
                { name: 'capacity', label: 'Capacity', type: 'number', placeholder: 'Max jobs allowed' },                
                { name: 'defaultSLA', label: 'Default SLA (Days)', type: 'number', placeholder: 'Standard TAT in days' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'categories':        
        return (          
          <>            
            <MasterList              
              title="Category Master"              
              data={liveCategories}              
              columns={[                
                { key: 'categoryName', label: 'Category Name', sortable: true },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => handleDelete('categories', id, 'Category')}              
              addButtonText="Add Category"              
              searchPlaceholder="Search categories..."              
              searchKeys={['categoryName']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Category"              
              subtitle="Manage compressor categories"              
              icon={<Tag className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="CAT"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('categories', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'categoryName', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g., Mechanical' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'compressors':        
        return (          
          <>            
            <MasterList              
              title="Compressor Types"              
              data={liveCompressors}              
              columns={[                
                { key: 'compressorType', label: 'Compressor Type', sortable: true },                
                { key: 'model', label: 'Model' },                
                { key: 'categoryName', label: 'Category' },                
                { key: 'penaltyApplicable', label: 'Penalty Applicable' },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => handleDelete('compressors', id, 'Compressor')}              
              addButtonText="Add Compressor"              
              searchPlaceholder="Search compressors..."              
              searchKeys={['compressorType', 'model', 'categoryName']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Compressor Type"              
              subtitle="Configure compressor categories"              
              icon={<Wrench className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="COMP"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('compressors', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'compressorType', label: 'Compressor Type', type: 'text', required: true, placeholder: 'e.g., ELGi W-Type' },                
                { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 15HP' },                
                { name: 'categoryId', label: 'Category', type: 'select', required: true, options: getOptions(liveCategories, 'categoryName'), showLink: true },                
                { name: 'penaltyApplicable', label: 'Penalty Applicable', type: 'toggle', defaultValue: true },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'sop_stages':        
        return (          
          <>            
            <MasterList              
              title="SOP Stages"              
              data={liveSOPStages}              
              columns={[                
                { key: 'applicableRequestType', label: 'Request Type', sortable: true },                
                { key: 'name', label: 'Stage Name' },                
                { key: 'sequence', label: 'Sequence' },                
                { key: 'purpose', label: 'Purpose' }              
              ]}              
              onAdd={handleAdd}
              onEdit={handleEdit}              
              onView={handleView}
              onDelete={(id) => handleDelete('sop-templates', id, 'SOP Stage')}
              addButtonText="Add SOP Stage"
              searchPlaceholder="Search SOP stages..."              
              searchKeys={['applicableRequestType', 'name']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="SOP Stage Template"              
              subtitle="Manage dynamic SOP stages"              
              icon={<FileText className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="SOP"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('sop-templates', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'applicableRequestType', label: 'Request Type (Leave blank for all)', type: 'text', placeholder: 'e.g., Repair, Inspection' },                
                { name: 'name', label: 'Stage Name', type: 'text', required: true, placeholder: 'e.g., Dismantling' },                
                { name: 'sequence', label: 'Sequence', type: 'number', required: true, placeholder: 'Order (e.g. 1)' },                
                { name: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'Details about this stage' }              
              ]}            
            />          
          </>        
        );      
      case 'checklists':        
        return (          
          <>            
            <MasterList              
              title="Checklist Templates"              
              data={liveChecklists}              
              columns={[                
                { key: 'stageName', label: 'SOP Stage', sortable: true },                
                { key: 'itemText', label: 'Checklist Item' },                
                { key: 'sequence', label: 'Sequence' },                
                { key: 'isMandatory', label: 'Mandatory' },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onView={handleView}              
              onDelete={(id) => handleDelete('checklist-templates', id, 'Checklist Item')}              
              addButtonText="Add Checklist Item"              
              searchPlaceholder="Search checklists..."              
              searchKeys={['stageName', 'itemText']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Checklist Item Template"              
              subtitle="Manage checks for SOP stages"              
              icon={<FileText className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="CHK"              
              initialData={selectedItem || {}}              
              onSave={(data) => handleSave('checklist-templates', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}              
              fields={[                
                { name: 'stageId', label: 'SOP Stage', type: 'select', required: true, options: getOptions(liveSOPStages, 'name'), showLink: true },                
                { name: 'itemText', label: 'Checklist Text', type: 'text', required: true, placeholder: 'e.g., Verify oil level' },                
                { name: 'sequence', label: 'Sequence', type: 'number', required: true, placeholder: 'Order (e.g. 1)' },
                { name: 'requiresDoc', label: 'Requires Document Upload?', type: 'toggle', defaultValue: false },
                { name: 'requiresPhoto', label: 'Requires Photo Evidence?', type: 'toggle', defaultValue: false },
              ]}            
            />          
          </>        
        );      
      case 'sla':        
        return (          
          <>            
            <MasterList              
              title="SLA Settings"              
              data={[...store.slaConfigs, ...store.penaltyRules.map(p => ({ ...p, type: 'penalty' }))]}              
              columns={[                
                { key: 'compressorType', label: 'Compressor Type', sortable: true },                
                { key: 'allowedTAT', label: 'Allowed TAT' },                
                { key: 'gracePeriod', label: 'Grace Period' },                
                { key: 'penaltyPerDay', label: 'Penalty/Day' },                
                { key: 'maxPenalty', label: 'Max Penalty' },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onDelete={(id) => {                
                if (store.slaConfigs.find(s => s.id === id)) {                  
                  handleDelete('slaConfigs', id, 'SLA Config');                
                } else {                  
                  handleDelete('penaltyRules', id, 'Penalty Rule');                
                }              
              }}              
              addButtonText="Add SLA Rule"              
              searchPlaceholder="Search SLA settings..."              
              searchKeys={['compressorType']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="SLA Configuration"              
              subtitle="Configure SLA thresholds and penalties"              
              icon={<Clock className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="SLA"              
              initialData={selectedItem || {}}              
              onSave={(data) => {                
                const compressor = liveCompressors.find(c => c.id === data.compressorId);                
                handleSave('slaConfigs', modalMode === 'edit' ? {                   
                  ...selectedItem, ...data, compressorType: compressor?.compressorType                 
                } : { ...data, compressorType: compressor?.compressorType }, modalMode);              
              }}              
              fields={[                
                { name: 'compressorId', label: 'Compressor Type', type: 'select', required: true, options: getOptions(liveCompressors, 'compressorType'), showLink: true },                
                { name: 'allowedTAT', label: 'Allowed TAT (Days)', type: 'number', required: true, placeholder: 'Maximum allowed TAT' },                
                { name: 'gracePeriod', label: 'Grace Period (Days)', type: 'number', placeholder: 'Days allowed beyond TAT' },                
                { name: 'penaltyPerDay', label: 'Penalty Per Day (₹)', type: 'number', placeholder: 'Daily penalty amount' },                
                { name: 'maxPenalty', label: 'Maximum Penalty (₹)', type: 'number', placeholder: 'Penalty cap' },                
                { name: 'escalationAfterDays', label: 'Escalation After (Days)', type: 'number', placeholder: 'Days for escalation' },                
                { name: 'applicableFrom', label: 'Applicable From', type: 'date' },                
                { name: 'applicableTo', label: 'Applicable To', type: 'date' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'inventory':        
        return (          
          <>            
            <MasterList              
              title="Inventory Masters"              
              data={store.inventorySafetyStock}              
              columns={[                
                { key: 'spareName', label: 'Spare Name', sortable: true },                
                { key: 'categoryName', label: 'Category' },                
                { key: 'unitOfMeasure', label: 'UoM' },                
                { key: 'safetyStockLevel', label: 'Safety Stock' },                
                { key: 'reorderPoint', label: 'Reorder Point' },                
                { key: 'vendorName', label: 'Preferred Vendor' },                
                { key: 'autoPOTrigger', label: 'Auto PO' },                
                { key: 'status', label: 'Status', sortable: true },              
              ]}              
              onAdd={handleAdd}              
              onEdit={handleEdit}              
              onView={handleView}              
              onDelete={(id) => handleDelete('inventorySafetyStock', id, 'Inventory Item')}              
              addButtonText="Add Inventory Item"              
              searchPlaceholder="Search inventory..."              
              searchKeys={['spareName', 'categoryName', 'vendorName']}            
            />            
            <MasterDetailModal              
              open={modalOpen}              
              onClose={() => setModalOpen(false)}              
              title="Inventory Safety Stock"              
              subtitle="Manage spare parts catalog"              
              icon={<Package className="w-5 h-5" />}              
              mode={modalMode}              
              idPrefix="INV"              
              initialData={selectedItem || {}}              
              onSave={(data) => {                
                const category = liveCategories.find(c => c.id === data.categoryId);                
                const vendor = store.vendors.find(v => v.id === data.vendorId);                
                handleSave('inventorySafetyStock', modalMode === 'edit' ? {                   
                  ...selectedItem, ...data, categoryName: category?.categoryName, vendorName: vendor?.vendorName                
                } : {                   
                  ...data, categoryName: category?.categoryName, vendorName: vendor?.vendorName                
                }, modalMode);              
              }}              
              fields={[                
                { name: 'spareName', label: 'Spare Name', type: 'text', required: true, placeholder: 'e.g., Piston Ring' },                
                { name: 'categoryId', label: 'Category', type: 'select', required: true, options: getOptions(liveCategories, 'categoryName'), showLink: true },                
                { name: 'unitOfMeasure', label: 'Unit of Measure', type: 'text', placeholder: 'e.g., pcs, kg, liters' },                
                { name: 'safetyStockLevel', label: 'Safety Stock Level', type: 'number', required: true, placeholder: 'Minimum quantity' },                
                { name: 'avgConsumptionPerMonth', label: 'Avg Consumption/Month', type: 'number', placeholder: 'Average monthly consumption' },                
                { name: 'leadTimeDays', label: 'Lead Time (Days)', type: 'number', placeholder: 'Supplier lead time' },                
                { name: 'vendorId', label: 'Preferred Vendor', type: 'select', options: getOptions(store.vendors, 'vendorName'), showLink: true },                
                { name: 'autoPOTrigger', label: 'Auto-PO Trigger', type: 'toggle', defaultValue: true },                
                { name: 'reorderPoint', label: 'Reorder Point', type: 'number', placeholder: 'Stock level for reorder' },                
                { name: 'maxStockLevel', label: 'Max Stock Level', type: 'number', placeholder: 'Upper limit' },                
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },              
              ]}            
            />          
          </>        
        );      
      case 'audit':        
        return (          
          <div className="space-y-6">            
            <div className="flex justify-between items-center">              
              <div>                
                <h2 className="text-2xl font-bold text-foreground">Audit & Compliance</h2>                
                <p className="text-muted-foreground">View system audit logs and compliance records</p>              
              </div>            
            </div>            
            <div className="bg-card rounded-xl shadow-soft-md overflow-hidden">              
              <div className="overflow-x-auto">                
                <table className="w-full">                  
                  <thead className="bg-muted/50">                    
                    <tr>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Event Type</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">User</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Module</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Action</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Description</th>                      
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>                    
                    </tr>                  
                  </thead>                  
                  <tbody>                    
                    {store.auditLogs.map((log) => (                      
                      <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">                        
                        <td className="p-4 text-sm">{log.timestamp}</td>                        
                        <td className="p-4">                          
                          <span className={cn(                            
                            "px-2 py-1 rounded-full text-xs font-medium",                            
                            log.eventType === 'Login' && "bg-blue-100 text-blue-700",                            
                            log.eventType === 'Data Change' && "bg-amber-100 text-amber-700",                            
                            log.eventType === 'Error' && "bg-red-100 text-red-700",                            
                            log.eventType === 'Approval' && "bg-green-100 text-green-700"                          
                          )}>                            
                            {log.eventType}                          
                          </span>                        
                        </td>                        
                        <td className="p-4 text-sm">{log.userName}</td>                        
                        <td className="p-4 text-sm">{log.moduleName}</td>                        
                        <td className="p-4 text-sm">{log.action}</td>                        
                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{log.eventDescription}</td>                        
                        <td className="p-4">                          
                          <span className={cn(                            
                            "px-2 py-1 rounded-full text-xs font-medium",                            
                            log.status === 'Success' && "bg-green-100 text-green-700",                            
                            log.status === 'Failure' && "bg-red-100 text-red-700"                          
                          )}>                            
                            {log.status}                          
                          </span>                        
                        </td>                      
                      </tr>                    
                    ))}                  
                  </tbody>                
                </table>              
              </div>            
            </div>          
          </div>        
        );

      case 'app_features':
        return (
          <>
            <MasterList
              title="App Features (Role Access)"
              data={liveFeatures}
              columns={[
                { key: 'label', label: 'Feature Name', sortable: true },
                { key: 'featureKey', label: 'Internal Key' },
                { key: 'moduleName', label: 'Assigned Module', sortable: true },
              ]}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={(id) => handleDelete('app-features', id, 'Feature')}
              addButtonText="Add New Feature"
              searchPlaceholder="Search features..."
              searchKeys={['label', 'featureKey', 'moduleName']}
            />
            <MasterDetailModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="System Feature"
              subtitle="Add new capabilities to the Role Access Matrix"
              icon={<Layers className="w-5 h-5" />}
              mode={modalMode}
              idPrefix="FEAT"
              initialData={selectedItem || {}}
              onSave={(data) => handleSave('app-features', modalMode === 'edit' ? { ...selectedItem, ...data } : data, modalMode)}
              fields={[
                { name: 'label', label: 'Feature Display Name', type: 'text', required: true, placeholder: 'e.g., Generate Reports' },
                { name: 'featureKey', label: 'Internal Key (No spaces)', type: 'text', required: true, placeholder: 'e.g., generate_reports' },
                { 
                  name: 'moduleId', 
                  label: 'Parent Module', 
                  type: 'select', 
                  required: true, 
                  options: getOptions(liveModules, 'title'), 
                  showLink: true 
                },
              ]}
            />
          </>
        );
      default:        
        return null;    
    }  
  };  

  return (    
    <MainLayout>      
      <div className="flex h-[calc(100vh-4rem)]">        
        {/* Sidebar */}        
        <div className="w-72 border-r border-border bg-card/50 overflow-y-auto">          
          <div className="p-4">            
            <h2 className="text-lg font-semibold text-foreground mb-4">Setup</h2>            
            <nav className="space-y-1">              
              {setupTabs.map((tab) => {                
                const Icon = tab.icon;                
                return (                  
                  <button                    
                    key={tab.id}                    
                    onClick={() => setActiveTab(tab.id)}                    
                    className={cn(                      
                      "w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all",                      
                      activeTab === tab.id                        
                        ? "bg-primary/10 text-primary border-l-4 border-primary"                        
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"                    
                    )}                  
                  >                    
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" />                    
                    <div>                      
                      <p className="font-medium text-sm">{tab.label}</p>                      
                      <p className="text-xs text-muted-foreground mt-0.5">{tab.description}</p>                    
                    </div>                  
                  </button>                
                );              
              })}            
            </nav>          
          </div>        
        </div>        
        {/* Main Content */}        
        <div className="flex-1 overflow-y-auto p-6">          
          <motion.div            
            key={activeTab}            
            initial={{ opacity: 0, y: 10 }}            
            animate={{ opacity: 1, y: 0 }}            
            transition={{ duration: 0.2 }}          
          >            
            {renderContent()}          
          </motion.div>        
        </div>      
      </div>    
    </MainLayout>  
  );
}