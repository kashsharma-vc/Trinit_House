import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { useSetupStore } from "@/store/setupStore";
import { MasterList } from "@/components/setup/MasterList";
import { MasterDetailModal } from "@/components/setup/MasterDetailModal";
import { toast } from "sonner";
import {
  Users, Shield, Building2, MapPin, Wrench, Package, Clock,
  FileText, Database, Tag, AlertTriangle, History
} from "lucide-react";

// Simplified tabs - only 9 sections as per requirements
const setupTabs = [
  { id: "roles", label: "Roles & Permissions", description: "Manage user roles and access control", icon: Users },
  { id: "zones", label: "Zone Masters", description: "Configure geographical zones", icon: MapPin },
  { id: "workshops", label: "Workshop Masters", description: "Configure workshop locations", icon: Building2 },
  { id: "categories", label: "Category Master", description: "Manage compressor categories", icon: Tag },
  { id: "compressors", label: "Compressor Types", description: "Configure compressor categories", icon: Wrench },
  { id: "sop", label: "SOP Settings", description: "Manage SOP templates and versions", icon: FileText },
  { id: "sla", label: "SLA Settings", description: "Configure SLA thresholds and penalties", icon: Clock },
  { id: "inventory", label: "Inventory Masters", description: "Manage spare parts catalog", icon: Package },
  { id: "audit", label: "Audit & Compliance", description: "Configure audit settings", icon: History },
];

export default function Setup() {
  const [activeTab, setActiveTab] = useState("roles");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const store = useSetupStore();

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

  const handleDelete = (collection: string, id: string, name: string) => {
    store.deleteItem(collection as any, id);
    store.logAction({
      eventType: 'Data Change',
      eventDescription: `Deleted ${name} from ${collection}`,
      userId: '1',
      userName: 'Current User',
      roleName: 'Admin',
      moduleName: 'Setup',
      action: 'Delete',
      ipAddress: '127.0.0.1',
      deviceType: 'Desktop',
      browserOS: 'Chrome',
      status: 'Success'
    });
    toast.success(`${name} deleted successfully`);
  };

  const handleSave = (collection: string, data: any, mode: 'add' | 'edit' | 'view') => {
    if (mode === 'view') {
      setModalOpen(false);
      return;
    }
    
    const processedData = {
      ...data,
      status: typeof data.status === 'boolean' 
        ? (data.status ? 'Active' : 'Inactive') 
        : (data.status || 'Active')
    };
    
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
    store.logAction({
      eventType: 'Data Change',
      eventDescription: `${mode === 'add' ? 'Created' : 'Updated'} item in ${collection}`,
      userId: '1',
      userName: 'Current Admin',
      roleName: 'Admin',
      moduleName: 'Setup',
      action: mode === 'add' ? 'Create' : 'Edit',
      ipAddress: '127.0.0.1',
      deviceType: 'Desktop',
      browserOS: 'Chrome',
      status: 'Success'
    });
    setModalOpen(false);
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
              data={store.zones}
              columns={[
                { key: 'zoneName', label: 'Zone Name', sortable: true },
                { key: 'description', label: 'Description' },
                { key: 'workshopCount', label: 'Workshops' },
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
              data={store.workshops}
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
              onSave={(data) => {
                const zone = store.zones.find(z => z.id === data.zoneId);
                handleSave('workshops', modalMode === 'edit' ? { 
                  ...selectedItem, ...data, zoneName: zone?.zoneName 
                } : { ...data, zoneName: zone?.zoneName }, modalMode);
              }}
              fields={[
                { name: 'workshopName', label: 'Workshop Name', type: 'text', required: true, placeholder: 'e.g., Delhi Workshop' },
                { name: 'zoneId', label: 'Zone', type: 'select', required: true, options: getOptions(store.zones, 'zoneName'), showLink: true },
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
              data={store.categories}
              columns={[
                { key: 'categoryName', label: 'Category Name', sortable: true },
                { key: 'status', label: 'Status', sortable: true },
                { key: 'createdOn', label: 'Created On' },
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
              data={store.compressors}
              columns={[
                { key: 'compressorType', label: 'Compressor Type', sortable: true },
                { key: 'model', label: 'Model' },
                { key: 'categoryName', label: 'Category' },
                { key: 'standardTAT', label: 'Standard TAT (days)' },
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
              onSave={(data) => {
                const category = store.categories.find(c => c.id === data.categoryId);
                handleSave('compressors', modalMode === 'edit' ? { 
                  ...selectedItem, ...data, categoryName: category?.categoryName 
                } : { ...data, categoryName: category?.categoryName }, modalMode);
              }}
              fields={[
                { name: 'compressorType', label: 'Compressor Type', type: 'text', required: true, placeholder: 'e.g., ELGi W-Type' },
                { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 15HP' },
                { name: 'categoryId', label: 'Category', type: 'select', required: true, options: getOptions(store.categories, 'categoryName'), showLink: true },
                { name: 'standardTAT', label: 'Standard TAT (Days)', type: 'number', placeholder: 'Allowed days' },
                { name: 'penaltyApplicable', label: 'Penalty Applicable', type: 'toggle', defaultValue: true },
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },
              ]}
            />
          </>
        );

      case 'sop':
        return (
          <>
            <MasterList
              title="SOP Settings"
              data={store.sops}
              columns={[
                { key: 'sopReference', label: 'SOP Reference', sortable: true },
                { key: 'compressorType', label: 'Compressor Type' },
                { key: 'version', label: 'Version' },
                { key: 'title', label: 'Title' },
                { key: 'totalSteps', label: 'Steps' },
                { key: 'sopStatus', label: 'SOP Status' },
                { key: 'effectiveDate', label: 'Effective Date' },
              ]}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={(id) => handleDelete('sops', id, 'SOP')}
              addButtonText="Add SOP"
              searchPlaceholder="Search SOPs..."
              searchKeys={['sopReference', 'compressorType', 'title']}
            />
            <MasterDetailModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="SOP Version Control"
              subtitle="Manage SOP templates and versions"
              icon={<FileText className="w-5 h-5" />}
              mode={modalMode}
              idPrefix="SOP"
              initialData={selectedItem || {}}
              onSave={(data) => {
                const compressor = store.compressors.find(c => c.id === data.compressorId);
                const role = store.roles.find(r => r.id === data.approvedById);
                handleSave('sops', modalMode === 'edit' ? { 
                  ...selectedItem, ...data, 
                  compressorType: compressor?.compressorType,
                  approvedBy: role?.roleName
                } : { 
                  ...data, 
                  compressorType: compressor?.compressorType,
                  approvedBy: role?.roleName
                }, modalMode);
              }}
              fields={[
                { name: 'sopReference', label: 'SOP Reference', type: 'text', required: true, placeholder: 'e.g., SOP-ELG-01' },
                { name: 'compressorId', label: 'Compressor Type', type: 'select', required: true, options: getOptions(store.compressors, 'compressorType'), showLink: true },
                { name: 'version', label: 'Version', type: 'text', required: true, placeholder: 'e.g., v2.1' },
                { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'SOP title' },
                { name: 'totalSteps', label: 'Total Steps', type: 'number', placeholder: 'Number of steps' },
                { name: 'stepDetails', label: 'Step Details', type: 'textarea', placeholder: 'Step 1: Disconnect power...' },
                { name: 'approvedById', label: 'Approved By', type: 'select', options: getOptions(store.roles, 'roleName'), showLink: true },
                { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
                { name: 'reviewCycle', label: 'Review Cycle (Months)', type: 'number', placeholder: '12' },
                { name: 'sopStatus', label: 'SOP Status', type: 'select', options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Retired', label: 'Retired' },
                ] },
                { name: 'status', label: 'Status', type: 'toggle', defaultValue: true },
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
                const compressor = store.compressors.find(c => c.id === data.compressorId);
                handleSave('slaConfigs', modalMode === 'edit' ? { 
                  ...selectedItem, ...data, compressorType: compressor?.compressorType 
                } : { ...data, compressorType: compressor?.compressorType }, modalMode);
              }}
              fields={[
                { name: 'compressorId', label: 'Compressor Type', type: 'select', required: true, options: getOptions(store.compressors, 'compressorType'), showLink: true },
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
                const category = store.categories.find(c => c.id === data.categoryId);
                const vendor = store.vendors.find(v => v.id === data.vendorId);
                handleSave('inventorySafetyStock', modalMode === 'edit' ? { 
                  ...selectedItem, ...data, 
                  categoryName: category?.categoryName,
                  vendorName: vendor?.vendorName
                } : { 
                  ...data, 
                  categoryName: category?.categoryName,
                  vendorName: vendor?.vendorName
                }, modalMode);
              }}
              fields={[
                { name: 'spareName', label: 'Spare Name', type: 'text', required: true, placeholder: 'e.g., Piston Ring' },
                { name: 'categoryId', label: 'Category', type: 'select', required: true, options: getOptions(store.categories, 'categoryName'), showLink: true },
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
