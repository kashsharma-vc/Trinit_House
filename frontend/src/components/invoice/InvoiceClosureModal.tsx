import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  ChevronDown,
  PenTool,
  Calendar,
  MapPin,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Undo,
  Package,
  Box,
  Truck,
  Users,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchCostingRecord {
  id: string;
  displayId: string;
  batchId: string;
  facility: string;
  totalAmount: string;
  status: string;
}

interface BatchClosureModalProps {
  open: boolean;
  onClose: () => void;
  invoice: BatchCostingRecord | null;
  onClosureComplete?: () => void;
}

const sectionIcons = {
  rawMaterials: Package,
  packaging: Box,
  logistics: Truck,
  crew: Users,
};

export function InvoiceClosureModal({ open, onClose, invoice, onClosureComplete }: BatchClosureModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [openSections, setOpenSections] = useState<string[]>(["rawMaterials"]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [closureComplete, setClosureComplete] = useState(false);
  const [reopenNotes, setReopenNotes] = useState("");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [costingData, setCostingData] = useState({
    rawMaterials: [
      { id: "1", item: "Whey Protein Isolate 90%", source: "Vendor - DairyCo", qty: 500, unitPrice: 850, total: 425000 },
    ],
    packaging: [
      { id: "2", item: "2kg Matte Finish Tubs", source: "Stock", qty: 250, unitPrice: 45, total: 11250 },
    ],
    logistics: [
      { id: "3", description: "Freight - Plant to Hub", cost: 15000 },
    ],
    crew: [
      { id: "4", technician: "Rajesh Kumar", grade: "Lead Mixer", hours: 16, rate: 500, total: 8000 },
    ],
  });

  // FIX 1: Split useEffects to stop the infinite reset loop
  useEffect(() => {
    if (open && invoice) {
      if (invoice.status === "Closed") {
        setClosureComplete(true);
        setCurrentStage(3);
      } else {
        setClosureComplete(false);
        setCurrentStage(1);
        setSignatureData(null);
      }
    }
  }, [open, invoice]);

  useEffect(() => {
    if (open && canvasRef.current && currentStage === 2) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "hsl(var(--muted))";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [open, currentStage]);

  if (!invoice) return null;

  const wasteDeduction = 2500; 
  const subtotal = Object.values(costingData).flat().reduce((acc, item) => {
    if ('total' in item) return acc + Number(item.total);
    if ('cost' in item) return acc + Number(item.cost);
    return acc;
  }, 0);
  const finalAmount = subtotal - wasteDeduction;

  const updateItem = (category: keyof typeof costingData, id: string, field: string, value: string | number) => {
    setCostingData(prev => {
      const newData = { ...prev };
      const list = [...newData[category]] as any[];
      const index = list.findIndex(i => i.id === id);
      
      if (index > -1) {
        list[index] = { ...list[index], [field]: value };
        if (category === 'rawMaterials' || category === 'packaging') {
          list[index].total = (Number(list[index].qty) || 0) * (Number(list[index].unitPrice) || 0);
        } else if (category === 'crew') {
          list[index].total = (Number(list[index].hours) || 0) * (Number(list[index].rate) || 0);
        }
      }
      newData[category] = list as any;
      return newData;
    });
  };

  const addItem = (category: keyof typeof costingData) => {
    const newId = Date.now().toString();
    setCostingData(prev => {
      const newData = { ...prev };
      if (category === 'rawMaterials' || category === 'packaging') {
        newData[category] = [...newData[category], { id: newId, item: "", source: "", qty: 0, unitPrice: 0, total: 0 }];
      } else if (category === 'logistics') {
        newData.logistics = [...newData.logistics, { id: newId, description: "", cost: 0 }];
      } else if (category === 'crew') {
        newData.crew = [...newData.crew, { id: newId, technician: "", grade: "", hours: 0, rate: 0, total: 0 }];
      }
      return newData;
    });
  };

  const removeItem = (category: keyof typeof costingData, id: string) => {
    setCostingData(prev => ({
      ...prev,
      [category]: prev[category].filter((item: any) => item.id !== id)
    }));
  };

  // --- EXPORT & PRINT FUNCTIONS ---
  const handleExportExcel = () => {
    let csv = "Category,Item/Description/Technician,Source/Role,Qty/Hours,Unit Price/Rate,Total\n";
    
    costingData.rawMaterials.forEach(i => csv += `Raw Material,${i.item},${i.source},${i.qty},${i.unitPrice},${i.total}\n`);
    costingData.packaging.forEach(i => csv += `Packaging,${i.item},${i.source},${i.qty},${i.unitPrice},${i.total}\n`);
    costingData.logistics.forEach(i => csv += `Logistics,${i.description},,,${i.cost}\n`);
    costingData.crew.forEach(i => csv += `Crew,${i.technician},${i.grade},${i.hours},${i.rate},${i.total}\n`);
    
    csv += `\nSubtotal,,,,,${subtotal}\n`;
    csv += `Waste Deduction,,,,,-${wasteDeduction}\n`;
    csv += `FINAL TOTAL,,,,,${finalAmount}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Costing_${invoice.displayId}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // --- SIGNATURE HANDLERS ---
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

  const stopDrawing = () => setIsDrawing(false);

  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL());
    setTimestamp(new Date().toLocaleString());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsLocation("Manufacturing Facility (28.5485° N, 77.2505° E)"),
        () => setGpsLocation("Manufacturing Facility")
      );
    } else {
      setGpsLocation("Manufacturing Facility");
    }
  };

  const handleFinalizeClosure = async () => {
    try {
      const payload = {
        final_amount: finalAmount,
        status: "Closed",
        signature_data: signatureData, 
        signature_timestamp: timestamp,
        gps_location: gpsLocation,
      };

      const response = await fetch(`${API_BASE_URL}/finance/invoices/${invoice.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Backend rejection:", await response.text());
        alert("Failed to close invoice in the database.");
      } else {
        setClosureComplete(true);
        onClosureComplete?.(); 
      }
    } catch (error) {
      console.error("Network Error during closure:", error);
    }
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

  const toggleSection = (section: string) => {
    setOpenSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const stages = [
    { id: 1, name: "Review Costing", description: "Verify & Edit Details" },
    { id: 2, name: "QA Sign-off", description: "Digital authorization" },
    { id: 3, name: "Batch Closed", description: "Costing audit complete" },
  ];

  const renderLineItems = (category: keyof typeof costingData) => {
    const items = costingData[category];
    const Icon = sectionIcons[category];
    const isEditable = currentStage === 1 && !closureComplete; 

    return (
      <Collapsible
        open={openSections.includes(category)}
        onOpenChange={() => toggleSection(category)}
        className="border border-border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary" />
            <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", openSections.includes(category) && "rotate-180")} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 overflow-x-auto">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="border-b border-border">
                  {category === "logistics" ? (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground w-2/3">Description</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Cost</th>
                    </>
                  ) : category === "crew" ? (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground">Crew Member</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-20">Hours</th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-24">Rate (₹)</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-2 font-medium text-muted-foreground">Item</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-20">Qty</th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-24">Unit Price (₹)</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </>
                  )}
                  {isEditable && <th className="w-10 print:hidden"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border/50">
                    {category === "logistics" ? (
                      <>
                        <td className="py-2 pr-2">
                          {isEditable ? <Input value={item.description} onChange={e => updateItem(category, item.id, 'description', e.target.value)} className="h-8" /> : item.description}
                        </td>
                        <td className="py-2 text-right">
                          {isEditable ? <Input type="number" value={item.cost || ''} onChange={e => updateItem(category, item.id, 'cost', e.target.value)} className="h-8 text-right" /> : `₹${item.cost}`}
                        </td>
                      </>
                    ) : category === "crew" ? (
                      <>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.technician} onChange={e => updateItem(category, item.id, 'technician', e.target.value)} className="h-8" /> : item.technician}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.grade} onChange={e => updateItem(category, item.id, 'grade', e.target.value)} className="h-8" /> : item.grade}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.hours || ''} onChange={e => updateItem(category, item.id, 'hours', e.target.value)} className="h-8 text-right" /> : item.hours}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.rate || ''} onChange={e => updateItem(category, item.id, 'rate', e.target.value)} className="h-8 text-right" /> : `₹${item.rate}`}</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.item} onChange={e => updateItem(category, item.id, 'item', e.target.value)} className="h-8" /> : item.item}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.source} onChange={e => updateItem(category, item.id, 'source', e.target.value)} className="h-8" /> : item.source}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.qty || ''} onChange={e => updateItem(category, item.id, 'qty', e.target.value)} className="h-8 text-right" /> : item.qty}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.unitPrice || ''} onChange={e => updateItem(category, item.id, 'unitPrice', e.target.value)} className="h-8 text-right" /> : `₹${item.unitPrice}`}</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    )}
                    {isEditable && (
                      <td className="py-2 pl-2 text-right print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(category, item.id)} className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {isEditable && (
              <Button variant="outline" size="sm" onClick={() => addItem(category)} className="mt-3 gap-2 w-full border-dashed print:hidden">
                <PlusCircle className="w-4 h-4" /> Add Row
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Batch Costing & Closure Workflow</DialogTitle>
          </DialogHeader>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/30 rounded-xl p-4 border border-border"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-primary">{invoice.displayId}</h3>
                <p className="text-sm text-muted-foreground">
                  Batch: {invoice.batchId} • {invoice.facility}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium print:hidden",
                currentStage === 3 && closureComplete ? "bg-success text-success-foreground" :
                currentStage === 2 && signatureData ? "bg-info text-info-foreground" :
                "bg-warning text-warning-foreground"
              )}>
                {currentStage === 3 && closureComplete ? "Closed" :
                 currentStage === 2 && signatureData ? "Pending QA Sign-off" :
                 "Pending Costing Review"}
              </div>
            </div>
          </motion.div>

          {/* Workflow Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between py-4 print:hidden"
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
                    {currentStage > stage.id ? <CheckCircle className="w-5 h-5" /> : stage.id}
                  </motion.div>
                  <p className="mt-2 font-medium text-xs">{stage.name}</p>
                </div>
                {index < stages.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-4", currentStage > stage.id ? "bg-success" : "bg-muted")} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Stage Content */}
          <AnimatePresence mode="wait">
            {currentStage === 1 && !closureComplete && (
              <motion.div key="stage1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <h4 className="font-semibold text-lg print:hidden">Edit Batch Costing Details</h4>
                <p className="text-sm text-muted-foreground mb-4 print:hidden">Input all used materials, labor, and freight costs to generate the final bill.</p>
                
                <div className="space-y-3">
                  {renderLineItems("rawMaterials")}
                  {renderLineItems("packaging")}
                  {renderLineItems("logistics")}
                  {renderLineItems("crew")}
                </div>

                <div className="border-t border-border pt-4 space-y-2 bg-muted/20 p-4 rounded-xl mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Production Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">QA Rejection / Waste Deduction</span>
                    <span className="text-danger">-₹{wasteDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-border mt-2">
                    <span>Final Calculated Cost</span>
                    <span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* FIX 2: Added Export/Print buttons to Stage 1 */}
                <div className="flex items-center gap-3 pt-4 print:hidden">
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <Button onClick={() => setCurrentStage(2)} className="gap-2">
                    Save Details & Proceed to Sign-off
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStage === 2 && !closureComplete && (
              <motion.div key="stage2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <h4 className="font-semibold">QA Manager Digital Sign-off</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-xs text-muted-foreground text-center">Click and drag to sign</p>
                        <Button onClick={captureSignature} className="w-full">Capture Signature</Button>
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
                          <Undo className="w-4 h-4" /> Re-sign
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Timestamp</span>
                      </div>
                      <p className={cn("font-medium text-sm", timestamp ? "" : "text-muted-foreground")}>{timestamp || "Will be captured on sign"}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">GPS Location</span>
                      </div>
                      <p className={cn("font-medium text-sm", gpsLocation ? "" : "text-muted-foreground")}>{gpsLocation || "Will be auto-captured"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStage(1)}>Back to Costing</Button>
                  <div className="flex-1" />
                  <Button onClick={() => setShowFinalizeModal(true)} className="gap-2" disabled={!signatureData}>
                    Proceed to Finalize <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStage === 3 && closureComplete && (
              <motion.div key="stage3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="py-12 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-success mx-auto flex items-center justify-center mb-4"
                    >
                      <CheckCircle className="w-10 h-10 text-success-foreground" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-success mb-2">Batch Officially Closed</h3>
                    <p className="text-muted-foreground mb-6">Costing calculations and QA signatures permanently recorded.</p>
                    
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" className="gap-2" onClick={handlePrint}>
                        <Printer className="w-4 h-4" /> Print / Save PDF
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                        <FileSpreadsheet className="w-4 h-4" /> Download Excel CSV
                      </Button>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeModal && !closureComplete} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Final Batch Closure</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {showReopenDialog ? (
              <motion.div key="reopen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-sm text-muted-foreground">Add notes for reopening this batch costing:</p>
                <Textarea value={reopenNotes} onChange={(e) => setReopenNotes(e.target.value)} placeholder="Reason for reopening..." rows={3} />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowReopenDialog(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleReopen}>Confirm Reopen</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice ID</span>
                    <span className="font-medium">{invoice.displayId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facility</span>
                    <span className="font-medium">{invoice.facility}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Final Batch Cost</span>
                    <span className="font-bold text-primary">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-success/10 rounded-xl border border-success/30 space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">QA Signature Captured</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Timestamp: {timestamp}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowReopenDialog(true)}>
                    <Undo className="w-4 h-4" /> Reopen Costing
                  </Button>
                  <Button className="flex-1 gap-2 bg-success hover:bg-success/90" onClick={handleFinalizeClosure}>
                    <CheckCircle className="w-4 h-4" /> Lock & Submit
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