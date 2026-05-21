import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  PenTool,
  Calendar,
  MapPin,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Mail,
  Undo,
  Package,
  Wrench,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceRecord {
  id: string;
  jobCode: string;
  zone: string;
  totalAmount: string;
  finalAmount: string;
  status: string;
}

interface InvoiceClosureModalProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onClosureComplete?: () => void;
}

// Invoice line items
const invoiceLineItems = {
  spares: [
    { item: "Piston Ring Set", source: "Vendor - ABC", qty: 2, unitPrice: 3500, total: 7000 },
    { item: "Valve Plate Assembly", source: "Stock", qty: 1, unitPrice: 8500, total: 8500 },
    { item: "Gasket Kit", source: "Vendor - XYZ", qty: 1, unitPrice: 2200, total: 2200 },
  ],
  consumables: [
    { item: "Oil Filter", source: "Stock", qty: 2, unitPrice: 450, total: 900 },
    { item: "Lubricant (5L)", source: "Stock", qty: 3, unitPrice: 850, total: 2550 },
  ],
  travel: [
    { description: "Site Visit - Delhi to Workshop", cost: 1500 },
    { description: "Return Journey", cost: 1500 },
  ],
  labor: [
    { technician: "Rajesh Kumar", grade: "Senior", hours: 16, rate: 500, total: 8000 },
    { technician: "Amit Singh", grade: "Junior", hours: 24, rate: 350, total: 8400 },
  ],
};

const sectionIcons = {
  spares: Package,
  consumables: Wrench,
  travel: Truck,
  labor: Users,
};

export function InvoiceClosureModal({ open, onClose, invoice, onClosureComplete }: InvoiceClosureModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [openSections, setOpenSections] = useState<string[]>(["spares"]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [closureComplete, setClosureComplete] = useState(false);
  const [reopenNotes, setReopenNotes] = useState("");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "hsl(var(--muted))";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [open, currentStage]);

  if (!invoice) return null;

  const penaltyDeduction = 2500;
  const subtotal = Object.values(invoiceLineItems).flat().reduce((acc, item) => {
    if ('total' in item) return acc + item.total;
    if ('cost' in item) return acc + item.cost;
    return acc;
  }, 0);
  const finalAmount = subtotal - penaltyDeduction;

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Signature drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSignatureData(canvas.toDataURL());
    setTimestamp(new Date().toLocaleString());
    
    // Simulate GPS capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsLocation("Delhi Workshop (28.5485° N, 77.2505° E)"),
        () => setGpsLocation("Delhi Workshop")
      );
    } else {
      setGpsLocation("Delhi Workshop");
    }
  };

  const handleFinalizeClosure = () => {
    setClosureComplete(true);
    onClosureComplete?.();
  };

  const handleReopen = () => {
    setCurrentStage(1);
    setSignatureData(null);
    setTimestamp(null);
    setGpsLocation(null);
    setShowReopenDialog(false);
    setShowFinalizeModal(false);
    setReopenNotes("");
  };

  const stages = [
    { id: 1, name: "Review Invoice", description: "Verify line items" },
    { id: 2, name: "Sign-off", description: "Digital signature" },
    { id: 3, name: "Case Closed", description: "Audit complete" },
  ];

  const renderLineItems = (category: keyof typeof invoiceLineItems) => {
    const items = invoiceLineItems[category];
    const Icon = sectionIcons[category];

    return (
      <Collapsible
        open={openSections.includes(category)}
        onOpenChange={() => toggleSection(category)}
        className="border border-border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary" />
            <span className="font-medium capitalize">{category}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            openSections.includes(category) && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="border-b border-border">
                  {category === "travel" ? (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Cost</th>
                    </>
                  ) : category === "labor" ? (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground">Technician</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Grade</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Hours</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Rate</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground">Item</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-border/50">
                    {category === "travel" && 'description' in item ? (
                      <>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right font-medium">₹{item.cost.toLocaleString()}</td>
                      </>
                    ) : category === "labor" && 'technician' in item ? (
                      <>
                        <td className="py-2">{item.technician}</td>
                        <td className="py-2 text-muted-foreground">{item.grade}</td>
                        <td className="py-2 text-right">{item.hours}</td>
                        <td className="py-2 text-right">₹{item.rate}/hr</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    ) : 'item' in item ? (
                      <>
                        <td className="py-2">{item.item}</td>
                        <td className="py-2 text-muted-foreground">{item.source}</td>
                        <td className="py-2 text-right">{item.qty}</td>
                        <td className="py-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Closure Workflow</DialogTitle>
          </DialogHeader>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/30 rounded-xl p-4 border border-border"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-primary">{invoice.id}</h3>
                <p className="text-sm text-muted-foreground">
                  {invoice.jobCode} • {invoice.zone}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reference: {invoice.jobCode}-{invoice.zone.replace(" ", "")}-{invoice.id}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                currentStage === 3 && closureComplete ? "bg-success text-success-foreground" :
                currentStage === 2 && signatureData ? "bg-info text-info-foreground" :
                "bg-warning text-warning-foreground"
              )}>
                {currentStage === 3 && closureComplete ? "Closed" :
                 currentStage === 2 && signatureData ? "Pending Sign-off" :
                 "Pending Review"}
              </div>
            </div>
          </motion.div>

          {/* Workflow Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between py-4"
          >
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                      currentStage > stage.id ? "bg-success text-success-foreground" :
                      currentStage === stage.id ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStage > stage.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      stage.id
                    )}
                  </motion.div>
                  <p className="mt-2 font-medium text-xs">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
                {index < stages.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4",
                    currentStage > stage.id ? "bg-success" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Stage Content */}
          <AnimatePresence mode="wait">
            {currentStage === 1 && (
              <motion.div
                key="stage1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h4 className="font-semibold">Review Invoice Line Items</h4>
                
                {/* Collapsible sections */}
                <div className="space-y-3">
                  {renderLineItems("spares")}
                  {renderLineItems("consumables")}
                  {renderLineItems("travel")}
                  {renderLineItems("labor")}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Penalty Deduction</span>
                    <span className="text-danger">-₹{penaltyDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                    <span>Final Amount</span>
                    <span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={() => setCurrentStage(2)} className="gap-2">
                    Proceed to Sign-off
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStage === 2 && (
              <motion.div
                key="stage2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h4 className="font-semibold">Digital Sign-off</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Signature Panel */}
                  <div className="md:col-span-2 p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <PenTool className="w-4 h-4" />
                      <span className="text-sm font-medium">Signature Capture</span>
                    </div>
                    
                    {!signatureData ? (
                      <div className="space-y-3">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={150}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="w-full border-2 border-dashed border-border rounded-lg cursor-crosshair bg-muted"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Click and drag to sign
                        </p>
                        <Button onClick={captureSignature} className="w-full">
                          Capture Signature
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-[150px] border-2 border-success rounded-lg bg-success/5 flex items-center justify-center">
                          <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                            <p className="font-medium text-success">Signature Captured</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSignatureData(null)} className="gap-2">
                          <Undo className="w-4 h-4" />
                          Re-sign
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp & GPS */}
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Timestamp</span>
                      </div>
                      <p className={cn(
                        "font-medium text-sm",
                        timestamp ? "" : "text-muted-foreground"
                      )}>
                        {timestamp || "Will be captured on sign"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">GPS Location</span>
                      </div>
                      <p className={cn(
                        "font-medium text-sm",
                        gpsLocation ? "" : "text-muted-foreground"
                      )}>
                        {gpsLocation || "Will be auto-captured"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStage(1)}>
                    Back to Review
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    onClick={() => {
                      setCurrentStage(3);
                      setShowFinalizeModal(true);
                    }} 
                    className="gap-2"
                    disabled={!signatureData}
                  >
                    Proceed to Finalize
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStage === 3 && (
              <motion.div
                key="stage3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {closureComplete ? (
                  <div className="py-12 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-success mx-auto flex items-center justify-center mb-4"
                    >
                      <CheckCircle className="w-10 h-10 text-success-foreground" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-success mb-2">Case Closed</h3>
                    <p className="text-muted-foreground mb-6">
                      Audit trail recorded, ready for export
                    </p>
                    
                    {/* Export Options */}
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Export PDF
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Click "Finalize Closure" to complete the workflow.</p>
                    <Button onClick={() => setShowFinalizeModal(true)} className="mt-4">
                      Finalize Closure
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Finalize Confirmation Modal */}
      <Dialog open={showFinalizeModal && !closureComplete} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Closure</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {showReopenDialog ? (
              <motion.div
                key="reopen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Add notes for reopening this invoice:
                </p>
                <Textarea
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  placeholder="Reason for reopening..."
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowReopenDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleReopen}>
                    Confirm Reopen
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Invoice Summary */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice ID</span>
                    <span className="font-medium">{invoice.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Job Code</span>
                    <span className="font-medium">{invoice.jobCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Zone</span>
                    <span className="font-medium">{invoice.zone}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Final Amount</span>
                    <span className="font-bold text-primary">₹{finalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Penalty Deduction</span>
                    <span className="font-medium text-danger">-₹{penaltyDeduction.toLocaleString()}</span>
                  </div>
                </div>

                {/* Signature Info */}
                <div className="p-4 bg-success/10 rounded-xl border border-success/30 space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Signature Captured</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Timestamp: {timestamp}</p>
                    <p>GPS: {gpsLocation}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2" 
                    onClick={() => setShowReopenDialog(true)}
                  >
                    <Undo className="w-4 h-4" />
                    Reopen Invoice
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-success hover:bg-success/90" 
                    onClick={handleFinalizeClosure}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Closure
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
