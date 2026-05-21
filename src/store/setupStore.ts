import { create } from 'zustand';
import type {
  Role, SystemModule, RolePermission, Zone, Workshop, Department,
  Designation, AccessLevel, Compressor, Category, Vendor, ApprovalType,
  Currency, TimeZone, Format, NotificationChannel, SyncMode, User,
  SLAConfig, PenaltyRule, SOP, InventorySafetyStock, SystemPreferences, AuditLog
} from '@/types/setup';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Current timestamp
const now = () => new Date().toISOString();

// Initial data
const initialRoles: Role[] = [
  { id: '1', roleName: 'Super Admin', description: 'Full system access', userCount: 2, status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', roleName: 'Admin', description: 'Administrative access', userCount: 5, status: 'Active', createdBy: 'Super Admin', createdOn: '2026-01-01' },
  { id: '3', roleName: 'Workshop Manager', description: 'Workshop operations management', userCount: 12, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
  { id: '4', roleName: 'Technician', description: 'Field operations and SOP execution', userCount: 45, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
  { id: '5', roleName: 'Viewer', description: 'Read-only access', userCount: 8, status: 'Inactive', createdBy: 'Admin', createdOn: '2026-01-03' },
];

const initialModules: SystemModule[] = [
  { id: '1', moduleName: 'Requests', description: 'Request logging and management', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', moduleName: 'Inventory', description: 'Stock and spare parts management', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '3', moduleName: 'SOP', description: 'Standard Operating Procedures', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '4', moduleName: 'Dashboard', description: 'Analytics and KPIs', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '5', moduleName: 'Setup', description: 'System configuration', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '6', moduleName: 'Reports', description: 'Report generation', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialZones: Zone[] = [
  { id: '1', zoneName: 'Northern', description: 'Northern Railway Zone', workshopCount: 8, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', zoneName: 'Southern', description: 'Southern Railway Zone', workshopCount: 6, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', zoneName: 'Eastern', description: 'Eastern Railway Zone', workshopCount: 5, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '4', zoneName: 'Western', description: 'Western Railway Zone', workshopCount: 7, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '5', zoneName: 'Central', description: 'Central Railway Zone', workshopCount: 4, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialWorkshops: Workshop[] = [
  { id: '1', workshopName: 'Delhi Workshop', zoneId: '1', zoneName: 'Northern', location: 'Okhla', capacity: 30, defaultSLA: 15, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', workshopName: 'Mumbai Workshop', zoneId: '4', zoneName: 'Western', location: 'Andheri', capacity: 25, defaultSLA: 14, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', workshopName: 'Chennai Workshop', zoneId: '2', zoneName: 'Southern', location: 'Perungudi', capacity: 20, defaultSLA: 14, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
  { id: '4', workshopName: 'Kolkata Workshop', zoneId: '3', zoneName: 'Eastern', location: 'Salt Lake', capacity: 22, defaultSLA: 15, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
];

const initialDepartments: Department[] = [
  { id: '1', departmentName: 'Maintenance', description: 'Mechanical repairs and maintenance', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', departmentName: 'Operations', description: 'Day-to-day operations', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', departmentName: 'Quality Assurance', description: 'QC and compliance', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '4', departmentName: 'Procurement', description: 'Purchasing and vendor management', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialDesignations: Designation[] = [
  { id: '1', title: 'Supervisor', departmentId: '1', departmentName: 'Maintenance', description: 'Oversees maintenance staff', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', title: 'Sr. Technician', departmentId: '1', departmentName: 'Maintenance', description: 'Senior technical role', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', title: 'QC Inspector', departmentId: '3', departmentName: 'Quality Assurance', description: 'Quality control', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialCategories: Category[] = [
  { id: '1', categoryName: 'Mechanical', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', categoryName: 'Electrical', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', categoryName: 'Consumable', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '4', categoryName: 'Chemical', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialCompressors: Compressor[] = [
  { id: '1', compressorType: 'ELGi W-Type', model: '15HP', categoryId: '1', categoryName: 'Mechanical', standardTAT: 14, penaltyApplicable: true, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', compressorType: 'ELGi Screw Type', model: '20HP', categoryId: '1', categoryName: 'Mechanical', standardTAT: 12, penaltyApplicable: true, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', compressorType: 'Atlas Copco GA', model: '30HP', categoryId: '1', categoryName: 'Mechanical', standardTAT: 16, penaltyApplicable: true, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
];

const initialVendors: Vendor[] = [
  { id: '1', vendorName: 'ABC Spares', contactPerson: 'Ramesh Gupta', contactEmail: 'ramesh@abcspares.com', contactPhone: '9876543210', address: 'Okhla, Delhi 110020', gstTaxId: '27ABCDE1234F1Z5', paymentTerms: 'Net 30', bankName: 'HDFC Bank', accountNumber: 'XXXX123456789', ifscCode: 'HDFC0001234', categoryId: '1', categoryName: 'Mechanical', preferredCurrency: 'INR', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', vendorName: 'XYZ Electronics', contactPerson: 'Suresh Kumar', contactEmail: 'suresh@xyzelectronics.com', contactPhone: '9876543211', address: 'Andheri, Mumbai 400053', gstTaxId: '27XYZAB5678G2Z4', paymentTerms: 'Net 45', bankName: 'ICICI Bank', accountNumber: 'XXXX987654321', ifscCode: 'ICIC0002345', categoryId: '2', categoryName: 'Electrical', preferredCurrency: 'INR', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
];

const initialCurrencies: Currency[] = [
  { id: '1', currencyCode: 'INR', symbol: '₹', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', currencyCode: 'USD', symbol: '$', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '3', currencyCode: 'EUR', symbol: '€', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialTimeZones: TimeZone[] = [
  { id: '1', timeZoneName: 'IST', offset: '+05:30', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', timeZoneName: 'UTC', offset: '+00:00', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '3', timeZoneName: 'EST', offset: '-05:00', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialFormats: Format[] = [
  { id: '1', formatName: 'DD-MM-YYYY', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', formatName: 'MM-DD-YYYY', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '3', formatName: 'YYYY-MM-DD', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialNotificationChannels: NotificationChannel[] = [
  { id: '1', channelName: 'In-App', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', channelName: 'Email', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '3', channelName: 'SMS', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialSyncModes: SyncMode[] = [
  { id: '1', modeName: 'Online', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
  { id: '2', modeName: 'Offline-First', status: 'Active', createdBy: 'System', createdOn: '2026-01-01' },
];

const initialUsers: User[] = [
  { id: '1', fullName: 'Rajesh Kumar', roleId: '2', roleName: 'Admin', departmentId: '1', departmentName: 'Maintenance', designationId: '1', designationName: 'Supervisor', workshopIds: ['1'], workshopNames: ['Delhi Workshop'], zoneId: '1', zoneName: 'Northern', email: 'rajesh@company.com', mobileNumber: '9876543210', lastLogin: '2026-01-28 10:24 AM', status: 'Active', createdBy: 'Super Admin', createdOn: '2026-01-01' },
  { id: '2', fullName: 'Amit Singh', roleId: '4', roleName: 'Technician', departmentId: '2', departmentName: 'Operations', designationId: '2', designationName: 'Sr. Technician', workshopIds: ['2'], workshopNames: ['Mumbai Workshop'], zoneId: '4', zoneName: 'Western', email: 'amit@company.com', mobileNumber: '9876543211', lastLogin: '2026-01-28 09:15 AM', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
  { id: '3', fullName: 'Priya Sharma', roleId: '3', roleName: 'Workshop Manager', departmentId: '1', departmentName: 'Maintenance', designationId: '1', designationName: 'Supervisor', workshopIds: ['3'], workshopNames: ['Chennai Workshop'], zoneId: '2', zoneName: 'Southern', email: 'priya@company.com', mobileNumber: '9876543212', lastLogin: '2026-01-27 04:30 PM', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
];

const initialApprovalTypes: ApprovalType[] = [
  { id: '1', approvalType: 'PO', description: 'Purchase Order approval', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', approvalType: 'SOP', description: 'SOP version approval', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', approvalType: 'Penalty Waiver', description: 'Penalty waiver approval', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialAccessLevels: AccessLevel[] = [
  { id: '1', levelName: 'Level 1', privileges: 'Can view requests', roleId: '5', roleName: 'Viewer', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', levelName: 'Level 2', privileges: 'Can create/edit requests', roleId: '4', roleName: 'Technician', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '3', levelName: 'Level 3', privileges: 'Full workshop access', roleId: '3', roleName: 'Workshop Manager', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialRolePermissions: RolePermission[] = [
  { id: '1', roleId: '2', roleName: 'Admin', moduleId: '1', moduleName: 'Requests', action: 'Create Request', allowed: true, status: 'Active', createdBy: 'Super Admin', createdOn: '2026-01-01' },
  { id: '2', roleId: '2', roleName: 'Admin', moduleId: '1', moduleName: 'Requests', action: 'Edit Request', allowed: true, status: 'Active', createdBy: 'Super Admin', createdOn: '2026-01-01' },
  { id: '3', roleId: '4', roleName: 'Technician', moduleId: '3', moduleName: 'SOP', action: 'Execute SOP', allowed: true, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-02' },
];

const initialSLAConfigs: SLAConfig[] = [
  { id: '1', compressorId: '1', compressorType: 'ELGi W-Type', allowedTAT: 14, gracePeriod: 2, applicableFrom: '2026-02-01', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-15' },
  { id: '2', compressorId: '2', compressorType: 'ELGi Screw Type', allowedTAT: 12, gracePeriod: 1, applicableFrom: '2026-02-01', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-15' },
];

const initialPenaltyRules: PenaltyRule[] = [
  { id: '1', compressorId: '1', compressorType: 'ELGi W-Type', penaltyPerDay: 5000, maxPenalty: 50000, currencyCode: 'INR', escalationAfterDays: 3, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-15' },
  { id: '2', compressorId: '2', compressorType: 'ELGi Screw Type', penaltyPerDay: 6000, maxPenalty: 60000, currencyCode: 'INR', escalationAfterDays: 2, status: 'Active', createdBy: 'Admin', createdOn: '2026-01-15' },
];

const initialSOPs: SOP[] = [
  { id: '1', sopReference: 'SOP-ELG-01', compressorId: '1', compressorType: 'ELGi W-Type', version: 'v2.1', title: 'ELGi W-Type Maintenance SOP', totalSteps: 12, stepDetails: 'Step 1: Disconnect power...\nStep 2: Drain oil...', approvedBy: 'Ops Head', effectiveDate: '2026-01-10', reviewCycle: 12, sopStatus: 'Active', status: 'Active', createdBy: 'QA Manager', createdOn: '2026-01-08' },
];

const initialInventorySafetyStock: InventorySafetyStock[] = [
  { id: '1', spareName: 'Piston Ring', categoryId: '1', categoryName: 'Mechanical', unitOfMeasure: 'pcs', safetyStockLevel: 25, avgConsumptionPerMonth: 40, leadTimeDays: 10, vendorId: '1', vendorName: 'ABC Spares', autoPOTrigger: true, reorderPoint: 30, maxStockLevel: 100, currencyCode: 'INR', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
  { id: '2', spareName: 'Oil Filter', categoryId: '1', categoryName: 'Mechanical', unitOfMeasure: 'pcs', safetyStockLevel: 50, avgConsumptionPerMonth: 80, leadTimeDays: 7, vendorId: '1', vendorName: 'ABC Spares', autoPOTrigger: true, reorderPoint: 60, maxStockLevel: 200, currencyCode: 'INR', status: 'Active', createdBy: 'Admin', createdOn: '2026-01-01' },
];

const initialAuditLogs: AuditLog[] = [
  { id: '1', eventType: 'Login', eventDescription: 'User logged in successfully', userId: '1', userName: 'Rajesh Kumar', roleName: 'Admin', moduleName: 'Authentication', action: 'Login', timestamp: '2026-01-28 10:24:00', ipAddress: '192.168.1.45', deviceType: 'Desktop', browserOS: 'Edge / Windows 11', status: 'Success' },
  { id: '2', eventType: 'Data Change', eventDescription: 'User updated Vendor record', userId: '1', userName: 'Rajesh Kumar', roleName: 'Admin', moduleName: 'Vendor Setup', action: 'Edit Record', timestamp: '2026-01-28 11:15:00', ipAddress: '192.168.1.45', deviceType: 'Desktop', browserOS: 'Edge / Windows 11', status: 'Success', complianceTag: 'ISO 9001' },
];

interface SetupStore {
  // Data
  roles: Role[];
  systemModules: SystemModule[];
  rolePermissions: RolePermission[];
  zones: Zone[];
  workshops: Workshop[];
  departments: Department[];
  designations: Designation[];
  accessLevels: AccessLevel[];
  compressors: Compressor[];
  categories: Category[];
  vendors: Vendor[];
  approvalTypes: ApprovalType[];
  currencies: Currency[];
  timeZones: TimeZone[];
  formats: Format[];
  notificationChannels: NotificationChannel[];
  syncModes: SyncMode[];
  users: User[];
  slaConfigs: SLAConfig[];
  penaltyRules: PenaltyRule[];
  sops: SOP[];
  inventorySafetyStock: InventorySafetyStock[];
  auditLogs: AuditLog[];
  
  // CRUD Operations
  addItem: <T extends { id: string }>(collection: keyof SetupStore, item: Omit<T, 'id'>) => void;
  updateItem: <T extends { id: string }>(collection: keyof SetupStore, id: string, updates: Partial<T>) => void;
  deleteItem: (collection: keyof SetupStore, id: string) => void;
  
  // Audit logging
  logAction: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useSetupStore = create<SetupStore>((set, get) => ({
  // Initial data
  roles: initialRoles,
  systemModules: initialModules,
  rolePermissions: initialRolePermissions,
  zones: initialZones,
  workshops: initialWorkshops,
  departments: initialDepartments,
  designations: initialDesignations,
  accessLevels: initialAccessLevels,
  compressors: initialCompressors,
  categories: initialCategories,
  vendors: initialVendors,
  approvalTypes: initialApprovalTypes,
  currencies: initialCurrencies,
  timeZones: initialTimeZones,
  formats: initialFormats,
  notificationChannels: initialNotificationChannels,
  syncModes: initialSyncModes,
  users: initialUsers,
  slaConfigs: initialSLAConfigs,
  penaltyRules: initialPenaltyRules,
  sops: initialSOPs,
  inventorySafetyStock: initialInventorySafetyStock,
  auditLogs: initialAuditLogs,
  
  addItem: (collection, item) => {
    const newItem = { ...item, id: generateId() };
    set((state) => ({
      [collection]: [...(state[collection] as any[]), newItem]
    }));
  },
  
  updateItem: (collection, id, updates) => {
    set((state) => ({
      [collection]: (state[collection] as any[]).map((item) =>
        item.id === id ? { ...item, ...updates, updatedOn: now() } : item
      )
    }));
  },
  
  deleteItem: (collection, id) => {
    set((state) => ({
      [collection]: (state[collection] as any[]).filter((item) => item.id !== id)
    }));
  },
  
  logAction: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: generateId(),
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs]
    }));
  }
}));
