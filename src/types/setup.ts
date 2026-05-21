// Master Data Types for Setup Module

export interface BaseEntity {
  id: string;
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdOn: string;
  updatedBy?: string;
  updatedOn?: string;
}

// 1. Role Master
export interface Role extends BaseEntity {
  roleName: string;
  description: string;
  userCount?: number;
}

// 2. System Module Master
export interface SystemModule extends BaseEntity {
  moduleName: string;
  description: string;
}

// 3. Role Permission Master
export interface RolePermission extends BaseEntity {
  roleId: string;
  roleName: string;
  moduleId: string;
  moduleName: string;
  action: string;
  allowed: boolean;
}

// 4. Zone Master
export interface Zone extends BaseEntity {
  zoneName: string;
  description: string;
  workshopCount?: number;
}

// 5. Workshop Master
export interface Workshop extends BaseEntity {
  workshopName: string;
  zoneId: string;
  zoneName: string;
  location: string;
  capacity: number;
  defaultSLA: number;
}

// 6. Department Master
export interface Department extends BaseEntity {
  departmentName: string;
  description: string;
}

// 7. Designation Master
export interface Designation extends BaseEntity {
  title: string;
  departmentId: string;
  departmentName: string;
  description: string;
}

// 8. Access Level Master
export interface AccessLevel extends BaseEntity {
  levelName: string;
  privileges: string;
  roleId: string;
  roleName: string;
}

// 9. Compressor Master
export interface Compressor extends BaseEntity {
  compressorType: string;
  model: string;
  categoryId: string;
  categoryName: string;
  standardTAT: number;
  penaltyApplicable: boolean;
}

// 10. Category Master
export interface Category extends BaseEntity {
  categoryName: string;
}

// 11. Vendor Master
export interface Vendor extends BaseEntity {
  vendorName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  gstTaxId: string;
  paymentTerms: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  categoryId: string;
  categoryName: string;
  preferredCurrency: string;
}

// 12. Approval Type Master
export interface ApprovalType extends BaseEntity {
  approvalType: string;
  description: string;
}

// 13. Currency Master
export interface Currency extends BaseEntity {
  currencyCode: string;
  symbol: string;
}

// 14. Time Zone Master
export interface TimeZone extends BaseEntity {
  timeZoneName: string;
  offset: string;
}

// 15. Format Master
export interface Format extends BaseEntity {
  formatName: string;
}

// 16. Notification Channel Master
export interface NotificationChannel extends BaseEntity {
  channelName: string;
}

// 17. Sync Mode Master
export interface SyncMode extends BaseEntity {
  modeName: string;
}

// User & Role Management
export interface User extends BaseEntity {
  fullName: string;
  roleId: string;
  roleName: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationName: string;
  workshopIds: string[];
  workshopNames: string[];
  zoneId: string;
  zoneName: string;
  email: string;
  mobileNumber: string;
  lastLogin?: string;
}

// SLA Configuration
export interface SLAConfig extends BaseEntity {
  compressorId: string;
  compressorType: string;
  allowedTAT: number;
  gracePeriod: number;
  applicableFrom: string;
  applicableTo?: string;
}

// Penalty Rule
export interface PenaltyRule extends BaseEntity {
  compressorId: string;
  compressorType: string;
  penaltyPerDay: number;
  maxPenalty: number;
  currencyCode: string;
  escalationAfterDays: number;
}

// SOP Version Control
export interface SOP extends BaseEntity {
  sopReference: string;
  compressorId: string;
  compressorType: string;
  version: string;
  title: string;
  totalSteps: number;
  stepDetails: string;
  approvedBy: string;
  effectiveDate: string;
  reviewCycle: number;
  sopStatus: 'Draft' | 'Active' | 'Retired';
  lastUpdatedBy?: string;
  lastUpdatedOn?: string;
}

// Inventory Safety Stock
export interface InventorySafetyStock extends BaseEntity {
  spareName: string;
  categoryId: string;
  categoryName: string;
  unitOfMeasure: string;
  safetyStockLevel: number;
  avgConsumptionPerMonth: number;
  leadTimeDays: number;
  vendorId: string;
  vendorName: string;
  autoPOTrigger: boolean;
  reorderPoint: number;
  maxStockLevel: number;
  currencyCode: string;
}

// System Preferences
export interface SystemPreferences {
  defaultCurrency: string;
  defaultTimeZone: string;
  dateFormat: string;
  numberFormat: string;
  notificationChannels: string[];
  syncMode: string;
  languagePreference: string;
  autoLogoutTimer: number;
  theme: 'Light' | 'Dark';
  auditLogging: boolean;
  createdBy: string;
  createdOn: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  eventType: string;
  eventDescription: string;
  userId: string;
  userName: string;
  roleName: string;
  moduleName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  deviceType: string;
  browserOS: string;
  status: 'Success' | 'Failure';
  errorCode?: string;
  approvalReference?: string;
  complianceTag?: string;
  notes?: string;
}

// Field configuration for dynamic forms
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'toggle' | 'date' | 'textarea' | 'readonly';
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsFrom?: string; // Reference to another master for dynamic options
  placeholder?: string;
  description?: string;
  masked?: boolean;
}

// Master configuration
export interface MasterConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
  fields: FieldConfig[];
  listColumns: string[];
}
