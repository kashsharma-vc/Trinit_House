import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Package,
  X,
  ChevronDown,
  Upload,
  FileText,
  Image,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Save,
  CheckCircle,
  Link2,
  Download,
  Share2,
  Box,
  Wrench,
  Droplets,
  Settings,
  DollarSign,
  Shield,
  Paperclip,
  BarChart3,
  History,
  Eye,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddInventoryItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttachmentFile {
  id: string;
  name: string;
  type: "image" | "document" | "msds" | "quotation" | "certificate";
  size: string;
  uploadedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

// Generate unique item ID
const generateItemId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `ITEM-${year}-${random}`;
};

// Section Header Component
const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}) => (
  <CollapsibleTrigger
    onClick={onToggle}
    className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group"
  >
    <div className="flex items-center gap-3">
      <motion.div
        className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
      >
        <Icon className="w-5 h-5 text-primary" />
      </motion.div>
      <div className="text-left">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          {title}
          {badge && (
            <Badge variant="outline" className="text-xs">
              {badge}
            </Badge>
          )}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
    <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
    </motion.div>
  </CollapsibleTrigger>
);

// Form Field Component
const FormField = ({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export function AddInventoryItem({ open, onOpenChange }: AddInventoryItemProps) {
  const [itemId] = useState(generateItemId());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    metadata: true,
    details: true,
    pricing: false,
    safety: false,
    attachments: false,
    stock: false,
    audit: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    itemType: "",
    status: "active",
    partNumber: "",
    compatibleEquipment: "",
    unitOfMeasure: "",
    minimumStock: "",
    reorderLevel: "",
    shelfLife: "",
    storageLocation: "",
    unitCost: "",
    currency: "INR",
    gstPercent: "",
    lastPurchasePrice: "",
    preferredVendor: "",
    safetyInstructions: "",
    handlingPrecautions: "",
    ppeRequirement: "",
    msdsRequired: false,
    usageContext: "",
    sopReferenceId: "",
    hazardLevel: "",
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([
    {
      id: "1",
      name: "item-photo.jpg",
      type: "image",
      size: "2.4 MB",
      uploadedAt: "Just now",
    },
  ]);

  const [auditTrail] = useState<AuditEntry[]>([
    {
      id: "1",
      action: "Item Created",
      user: "System",
      timestamp: new Date().toLocaleString(),
      details: "Draft initiated",
    },
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showSafetySection =
    formData.category === "consumable" || formData.category === "chemical";

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Package className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    📦 Add Inventory Item
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Create and manage inventory items for workshop operations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 font-mono"
                >
                  {itemId}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Section 1: Item Metadata */}
            <Collapsible open={openSections.metadata}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SectionHeader
                  icon={Package}
                  title="Item Metadata"
                  subtitle="Core identity of the inventory item"
                  isOpen={openSections.metadata}
                  onToggle={() => toggleSection("metadata")}
                />
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 space-y-4 bg-card rounded-b-xl border border-t-0"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Item ID" required>
                        <Input
                          value={itemId}
                          disabled
                          className="bg-muted font-mono"
                        />
                      </FormField>
                      <FormField label="Item Name" required>
                        <Input
                          placeholder="Enter item name"
                          value={formData.itemName}
                          onChange={(e) =>
                            handleInputChange("itemName", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="Item Category" required>
                        <Select
                          value={formData.category}
                          onValueChange={(v) => handleInputChange("category", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spare">🔧 Spare</SelectItem>
                            <SelectItem value="tool">🛠️ Tool</SelectItem>
                            <SelectItem value="consumable">💧 Consumable</SelectItem>
                            <SelectItem value="chemical">🧪 Chemical</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Item Type" required>
                        <Select
                          value={formData.itemType}
                          onValueChange={(v) => handleInputChange("itemType", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mechanical">⚙️ Mechanical</SelectItem>
                            <SelectItem value="electrical">⚡ Electrical</SelectItem>
                            <SelectItem value="chemical">🧪 Chemical</SelectItem>
                            <SelectItem value="general">📦 General</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Created By">
                        <Input
                          value="Admin User"
                          disabled
                          className="bg-muted"
                        />
                      </FormField>
                      <FormField label="Status">
                        <Select
                          value={formData.status}
                          onValueChange={(v) => handleInputChange("status", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-success" />
                                Active
                              </span>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                                Inactive
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>

            {/* Section 2: Item Details */}
            <Collapsible open={openSections.details}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionHeader
                  icon={Settings}
                  title="Item Details"
                  subtitle="Technical & operational definition"
                  isOpen={openSections.details}
                  onToggle={() => toggleSection("details")}
                />
                <CollapsibleContent>
                  <motion.div className="p-4 space-y-4 bg-card rounded-b-xl border border-t-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Part Number / SKU">
                        <Input
                          placeholder="e.g. SKU-12345"
                          value={formData.partNumber}
                          onChange={(e) =>
                            handleInputChange("partNumber", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="Compatible Equipment">
                        <Select
                          value={formData.compatibleEquipment}
                          onValueChange={(v) =>
                            handleInputChange("compatibleEquipment", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="elgi-w-type">ELGi W-Type</SelectItem>
                            <SelectItem value="screw-type">Screw Type</SelectItem>
                            <SelectItem value="reciprocating">Reciprocating</SelectItem>
                            <SelectItem value="all-types">All Types</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Unit of Measure" required>
                        <Select
                          value={formData.unitOfMeasure}
                          onValueChange={(v) =>
                            handleInputChange("unitOfMeasure", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nos">Nos</SelectItem>
                            <SelectItem value="litre">Litre</SelectItem>
                            <SelectItem value="kg">Kg</SelectItem>
                            <SelectItem value="set">Set</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Minimum Stock Level" required>
                        <Input
                          type="number"
                          placeholder="e.g. 10"
                          value={formData.minimumStock}
                          onChange={(e) =>
                            handleInputChange("minimumStock", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="Reorder Level" required>
                        <Input
                          type="number"
                          placeholder="e.g. 25"
                          value={formData.reorderLevel}
                          onChange={(e) =>
                            handleInputChange("reorderLevel", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField
                        label="Shelf Life"
                        hint="Optional – for chemicals"
                      >
                        <Input
                          placeholder="e.g. 12 months"
                          value={formData.shelfLife}
                          onChange={(e) =>
                            handleInputChange("shelfLife", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="Storage Location" required>
                        <Input
                          placeholder="e.g. Rack A-12 / Bin 5"
                          value={formData.storageLocation}
                          onChange={(e) =>
                            handleInputChange("storageLocation", e.target.value)
                          }
                        />
                      </FormField>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>

            {/* Section 3: Pricing & Tax */}
            <Collapsible open={openSections.pricing}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionHeader
                  icon={DollarSign}
                  title="Pricing & Tax"
                  subtitle="Commercial tracking"
                  isOpen={openSections.pricing}
                  onToggle={() => toggleSection("pricing")}
                />
                <CollapsibleContent>
                  <motion.div className="p-4 space-y-4 bg-card rounded-b-xl border border-t-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Unit Cost" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ₹
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-8"
                            value={formData.unitCost}
                            onChange={(e) =>
                              handleInputChange("unitCost", e.target.value)
                            }
                          />
                        </div>
                      </FormField>
                      <FormField label="Currency">
                        <Select
                          value={formData.currency}
                          onValueChange={(v) => handleInputChange("currency", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">🇮🇳 INR</SelectItem>
                            <SelectItem value="USD">🇺🇸 USD</SelectItem>
                            <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="GST / Tax %">
                        <Select
                          value={formData.gstPercent}
                          onValueChange={(v) =>
                            handleInputChange("gstPercent", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select GST rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Last Purchase Price">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ₹
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-8"
                            value={formData.lastPurchasePrice}
                            onChange={(e) =>
                              handleInputChange("lastPurchasePrice", e.target.value)
                            }
                          />
                        </div>
                      </FormField>
                      <FormField label="Preferred Vendor">
                        <Select
                          value={formData.preferredVendor}
                          onValueChange={(v) =>
                            handleInputChange("preferredVendor", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abc-spares">ABC Spares</SelectItem>
                            <SelectItem value="xyz-parts">XYZ Parts</SelectItem>
                            <SelectItem value="filter-pro">Filter Pro</SelectItem>
                            <SelectItem value="seal-master">Seal Master</SelectItem>
                            <SelectItem value="bearing-hub">Bearing Hub</SelectItem>
                            <SelectItem value="castrol-india">Castrol India</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>

            {/* Section 4: Usage & Safety (Context-Aware) */}
            <AnimatePresence>
              {(showSafetySection || openSections.safety) && (
                <Collapsible open={openSections.safety}>
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <SectionHeader
                      icon={Shield}
                      title="Usage & Safety"
                      subtitle="SOP & compliance integration"
                      isOpen={openSections.safety}
                      onToggle={() => toggleSection("safety")}
                      badge={showSafetySection ? "Required" : undefined}
                    />
                    <CollapsibleContent>
                      <motion.div className="p-4 space-y-4 bg-card rounded-b-xl border border-t-0">
                        {showSafetySection && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3"
                          >
                            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-warning">
                                Safety Information Required
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Consumable and chemical items require safety details
                              </p>
                            </div>
                          </motion.div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="Safety Instructions">
                            <Textarea
                              placeholder="Enter safety instructions..."
                              rows={3}
                              value={formData.safetyInstructions}
                              onChange={(e) =>
                                handleInputChange(
                                  "safetyInstructions",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>
                          <FormField label="Handling Precautions">
                            <Textarea
                              placeholder="Enter handling precautions..."
                              rows={3}
                              value={formData.handlingPrecautions}
                              onChange={(e) =>
                                handleInputChange(
                                  "handlingPrecautions",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>
                          <FormField label="PPE Requirement">
                            <Input
                              placeholder="e.g. Gloves, Safety Glasses, Mask"
                              value={formData.ppeRequirement}
                              onChange={(e) =>
                                handleInputChange("ppeRequirement", e.target.value)
                              }
                            />
                          </FormField>
                          <FormField label="MSDS Required">
                            <div className="flex items-center gap-3 h-10">
                              <Switch
                                checked={formData.msdsRequired}
                                onCheckedChange={(v) =>
                                  handleInputChange("msdsRequired", v)
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {formData.msdsRequired ? "Yes" : "No"}
                              </span>
                            </div>
                          </FormField>
                          <FormField label="Usage Context">
                            <Select
                              value={formData.usageContext}
                              onValueChange={(v) =>
                                handleInputChange("usageContext", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select context" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cleaning">🧼 Cleaning</SelectItem>
                                <SelectItem value="assembly">🛠️ Assembly</SelectItem>
                                <SelectItem value="testing">🧪 Testing</SelectItem>
                                <SelectItem value="maintenance">⚙️ Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="SOP Reference ID">
                            <Input
                              placeholder="e.g. SOP-CLN-001"
                              value={formData.sopReferenceId}
                              onChange={(e) =>
                                handleInputChange("sopReferenceId", e.target.value)
                              }
                            />
                          </FormField>
                          <FormField label="Hazard Level">
                            <Select
                              value={formData.hazardLevel}
                              onValueChange={(v) =>
                                handleInputChange("hazardLevel", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success" />
                                    Low
                                  </span>
                                </SelectItem>
                                <SelectItem value="medium">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-warning" />
                                    Medium
                                  </span>
                                </SelectItem>
                                <SelectItem value="high">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-danger" />
                                    High
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                      </motion.div>
                    </CollapsibleContent>
                  </motion.div>
                </Collapsible>
              )}
            </AnimatePresence>

            {/* Section 5: Attachments */}
            <Collapsible open={openSections.attachments}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SectionHeader
                  icon={Paperclip}
                  title="Attachments"
                  subtitle="Documentation inside item record"
                  isOpen={openSections.attachments}
                  onToggle={() => toggleSection("attachments")}
                  badge={attachments.length > 0 ? `${attachments.length}` : undefined}
                />
                <CollapsibleContent>
                  <motion.div className="p-4 space-y-4 bg-card rounded-b-xl border border-t-0">
                    {/* Upload Zone */}
                    <motion.div
                      className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <motion.div
                        className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="w-7 h-7 text-primary" />
                      </motion.div>
                      <p className="font-medium text-foreground mb-1">
                        Drag & drop files here
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        or click to browse
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Image className="w-3 h-3 mr-1" /> Images
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" /> Datasheets
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" /> MSDS
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="w-3 h-3 mr-1" /> Quotations
                        </Badge>
                      </div>
                    </motion.div>

                    {/* Uploaded Files */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Uploaded Files
                        </p>
                        <div className="space-y-2">
                          {attachments.map((file, index) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  {file.type === "image" ? (
                                    <Image className="w-5 h-5 text-primary" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.size} • {file.uploadedAt}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeAttachment(file.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>

            {/* Section 6: Stock Summary (Read-Only) */}
            <Collapsible open={openSections.stock}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <SectionHeader
                  icon={BarChart3}
                  title="Stock Summary"
                  subtitle="Immediate visibility (for existing items)"
                  isOpen={openSections.stock}
                  onToggle={() => toggleSection("stock")}
                  badge="Read-Only"
                />
                <CollapsibleContent>
                  <motion.div className="p-4 bg-card rounded-b-xl border border-t-0">
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <motion.div
                        className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </motion.div>
                      <p className="text-muted-foreground font-medium">
                        Stock data will appear after item is saved
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Available, Reserved, and Issued quantities will be tracked here
                      </p>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>

            {/* Section 7: Audit Trail */}
            <Collapsible open={openSections.audit}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SectionHeader
                  icon={History}
                  title="Audit Trail"
                  subtitle="Traceability & accountability"
                  isOpen={openSections.audit}
                  onToggle={() => toggleSection("audit")}
                />
                <CollapsibleContent>
                  <motion.div className="p-4 bg-card rounded-b-xl border border-t-0">
                    <div className="space-y-3">
                      {auditTrail.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{entry.action}</p>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {entry.timestamp}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {entry.user}
                              </span>
                              {entry.details && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {entry.details}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>
          </div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-0 bg-card border-t px-6 py-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button variant="outline" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                    <CheckCircle className="w-4 h-4" />
                    Save & Activate
                  </Button>
                </motion.div>
                <Button variant="outline" className="gap-2" disabled>
                  <Link2 className="w-4 h-4" />
                  Link to PO
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
