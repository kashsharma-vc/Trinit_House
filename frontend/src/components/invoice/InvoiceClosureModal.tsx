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
  FileSpreadsheet,
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

export interface InvoiceRecord {
  id?: string;
  invoice_id?: string;
  job_code: string | number; // ServiceRequest ID
  facility?: string;
  total_amount?: string | number;
  final_amount?: string | number;
  amount_paid?: string | number;
  status?: string;
  costing_data?: any;
  signature_data?: string;
  signature_timestamp?: string;
  gps_location?: string;
}

interface InvoiceClosureModalProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  mode: "technician" | "admin" | "view";
  onClosureComplete?: () => void;
  authToken?: string;
}

const sectionIcons = {
  rawMaterials: Package,
  packaging: Box,
  logistics: Truck,
  crew: Users,
};

const DEFAULT_COSTING_DATA = {
  rawMaterials: [],
  packaging: [],
  logistics: [],
  crew: [],
};

export function InvoiceClosureModal({ open, onClose, invoice, mode, onClosureComplete, authToken }: InvoiceClosureModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [openSections, setOpenSections] = useState<string[]>(["rawMaterials", "packaging", "logistics", "crew"]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [closureComplete, setClosureComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [costingData, setCostingData] = useState<any>(DEFAULT_COSTING_DATA);

  useEffect(() => {
    if (open && invoice) {
      if (invoice.costing_data && Object.keys(invoice.costing_data).length > 0) {
        setCostingData(invoice.costing_data);
      } else {
        setCostingData({
          rawMaterials: [{ id: "1", item: "Sample Material", source: "Vendor", qty: 1, unitPrice: 500, total: 500 }],
          packaging: [],
          logistics: [],
          crew: [{ id: "4", technician: "Tech", grade: "Lead", hours: 2, rate: 500, total: 1000 }],
        });
      }
      
      setSignatureData(invoice.signature_data || null);
      setTimestamp(invoice.signature_timestamp || null);
      setGpsLocation(invoice.gps_location || null);
      setAmountPaid(invoice.amount_paid ? String(invoice.amount_paid) : "");

      if (mode === "view" || invoice.status === "Closed") {
        setClosureComplete(true);
        setCurrentStage(3);
      } else {
        setClosureComplete(false);
        setCurrentStage(1);
      }
    }
  }, [open, invoice, mode]);

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

  const wasteDeduction = 0; 
  const subtotal = Object.values(costingData).flat().reduce((acc: number, item: any) => {
    if ('total' in item) return acc + Number(item.total);
    if ('cost' in item) return acc + Number(item.cost);
    return acc;
  }, 0);
  const finalAmount = subtotal - wasteDeduction;

  const updateItem = (category: keyof typeof costingData, id: string, field: string, value: string | number) => {
    setCostingData((prev: any) => {
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
    setCostingData((prev: any) => {
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
    setCostingData((prev: any) => ({
      ...prev,
      [category]: prev[category].filter((item: any) => item.id !== id)
    }));
  };

  const handleExportExcel = () => {
    let csv = "Category,Item/Description/Technician,Source/Role,Qty/Hours,Unit Price/Rate,Total\n";
    
    costingData.rawMaterials.forEach((i: any) => csv += `Raw Material,${i.item},${i.source},${i.qty},${i.unitPrice},${i.total}\n`);
    costingData.packaging.forEach((i: any) => csv += `Packaging,${i.item},${i.source},${i.qty},${i.unitPrice},${i.total}\n`);
    costingData.logistics.forEach((i: any) => csv += `Logistics,${i.description},,,${i.cost}\n`);
    costingData.crew.forEach((i: any) => csv += `Crew,${i.technician},${i.grade},${i.hours},${i.rate},${i.total}\n`);
    
    csv += `\nSubtotal,,,,,${subtotal}\n`;
    csv += `Waste Deduction,,,,,-${wasteDeduction}\n`;
    csv += `FINAL TOTAL,,,,,${finalAmount}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoice_id || 'Draft'}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

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
    setGpsLocation("Corporate Office");
  };

  const handleTechSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        job_code: invoice.job_code,
        facility: "Main Plant",
        total_amount: subtotal,
        final_amount: finalAmount,
        status: "Pending Review",
        costing_data: costingData
      };

      const response = await fetch(`${API_BASE_URL}/finance/invoices/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Token ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      setClosureComplete(true);
      setCurrentStage(3);
      onClosureComplete?.(); 
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminFinalize = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        status: "Closed",
        amount_paid: Number(amountPaid),
        signature_data: signatureData, 
        signature_timestamp: timestamp,
        gps_location: gpsLocation,
      };

      const response = await fetch(`${API_BASE_URL}/finance/invoices/${invoice.id}/`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Token ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      setClosureComplete(true);
      setCurrentStage(3);
      onClosureComplete?.(); 
      setShowFinalizeModal(false);
    } catch (error) {
      console.error("Network Error during closure:", error);
      alert("Failed to close invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const isEditable = mode === "technician" && !closureComplete;
  const stages = mode === "technician" 
    ? [{ id: 1, name: "Draft Invoice", description: "Edit Details" }, { id: 3, name: "Generated", description: "Sent to Admin" }]
    : [
        { id: 1, name: "Review Invoice", description: "Verify Details" },
        { id: 2, name: "Sign-off", description: "Digital authorization & Payment" },
        { id: 3, name: "Closed", description: "Invoice processed" },
      ];

  const renderLineItems = (category: keyof typeof costingData) => {
    const items = costingData[category];
    const Icon = sectionIcons[category as keyof typeof sectionIcons];

    return (
      <Collapsible open={openSections.includes(category)} onOpenChange={() => toggleSection(category)} className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-primary" />
            <span className="font-medium capitalize text-sm">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", openSections.includes(category) && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 overflow-x-auto">
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="border-b border-border">
                  {category === "logistics" ? (
                    <>
                      <th className="text-left py-2 text-muted-foreground w-2/3">Description</th>
                      <th className="text-right py-2 text-muted-foreground">Cost</th>
                    </>
                  ) : category === "crew" ? (
                    <>
                      <th className="text-left py-2 text-muted-foreground">Crew Member</th>
                      <th className="text-left py-2 text-muted-foreground">Role</th>
                      <th className="text-right py-2 text-muted-foreground w-16">Hours</th>
                      <th className="text-right py-2 text-muted-foreground w-20">Rate (₹)</th>
                      <th className="text-right py-2 text-muted-foreground">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-2 text-muted-foreground">Item</th>
                      <th className="text-left py-2 text-muted-foreground">Source</th>
                      <th className="text-right py-2 text-muted-foreground w-16">Qty</th>
                      <th className="text-right py-2 text-muted-foreground w-20">Price (₹)</th>
                      <th className="text-right py-2 text-muted-foreground">Total</th>
                    </>
                  )}
                  {isEditable && <th className="w-8 print:hidden"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border/50">
                    {category === "logistics" ? (
                      <>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.description} onChange={e => updateItem(category, item.id, 'description', e.target.value)} className="h-7 text-xs" /> : item.description}</td>
                        <td className="py-2 text-right">{isEditable ? <Input type="number" value={item.cost || ''} onChange={e => updateItem(category, item.id, 'cost', e.target.value)} className="h-7 text-xs text-right" /> : `₹${item.cost}`}</td>
                      </>
                    ) : category === "crew" ? (
                      <>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.technician} onChange={e => updateItem(category, item.id, 'technician', e.target.value)} className="h-7 text-xs" /> : item.technician}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.grade} onChange={e => updateItem(category, item.id, 'grade', e.target.value)} className="h-7 text-xs" /> : item.grade}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.hours || ''} onChange={e => updateItem(category, item.id, 'hours', e.target.value)} className="h-7 text-xs text-right" /> : item.hours}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.rate || ''} onChange={e => updateItem(category, item.id, 'rate', e.target.value)} className="h-7 text-xs text-right" /> : `₹${item.rate}`}</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.item} onChange={e => updateItem(category, item.id, 'item', e.target.value)} className="h-7 text-xs" /> : item.item}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input value={item.source} onChange={e => updateItem(category, item.id, 'source', e.target.value)} className="h-7 text-xs" /> : item.source}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.qty || ''} onChange={e => updateItem(category, item.id, 'qty', e.target.value)} className="h-7 text-xs text-right" /> : item.qty}</td>
                        <td className="py-2 pr-2">{isEditable ? <Input type="number" value={item.unitPrice || ''} onChange={e => updateItem(category, item.id, 'unitPrice', e.target.value)} className="h-7 text-xs text-right" /> : `₹${item.unitPrice}`}</td>
                        <td className="py-2 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </>
                    )}
                    {isEditable && (
                      <td className="py-2 pl-2 text-right print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(category, item.id)} className="h-7 w-7 text-danger">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditable && (
              <Button variant="outline" size="sm" onClick={() => addItem(category)} className="mt-2 text-xs h-7 w-full border-dashed print:hidden">
                <PlusCircle className="w-3 h-3 mr-2" /> Add Row
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-primary">{invoice.invoice_id || 'Draft Invoice'}</h3>
                <p className="text-sm text-muted-foreground">Job Code: {invoice.job_code}</p>
              </div>
              <div className={cn("px-3 py-1 rounded-full text-xs font-medium print:hidden", closureComplete ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground")}>
                {closureComplete ? "Closed" : mode === "technician" ? "Drafting" : "Pending Review"}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between py-4 print:hidden">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold", currentStage > stage.id ? "bg-success text-white" : currentStage === stage.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    {currentStage > stage.id ? <CheckCircle className="w-4 h-4" /> : stage.id}
                  </div>
                  <p className="mt-1 font-medium text-[10px]">{stage.name}</p>
                </div>
                {index < stages.length - 1 && <div className={cn("flex-1 h-0.5 mx-2", currentStage > stage.id ? "bg-success" : "bg-muted")} />}
              </div>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {currentStage === 1 && !closureComplete && (
              <motion.div key="stage1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                <div className="space-y-2">
                  {renderLineItems("rawMaterials")}
                  {renderLineItems("packaging")}
                  {renderLineItems("logistics")}
                  {renderLineItems("crew")}
                </div>

                <div className="border-t border-border pt-3 space-y-1 bg-muted/20 p-4 rounded-xl mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border mt-2">
                    <span>Final Calculated Cost</span>
                    <span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 print:hidden">
                  <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-3 h-3 mr-2" /> Print</Button>
                  <Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet className="w-3 h-3 mr-2" /> Export</Button>
                  <div className="flex-1" />
                  {mode === "technician" ? (
                    <Button onClick={handleTechSubmit} disabled={isSubmitting}>
                      {isSubmitting ? "Generating..." : "Generate & Send to Admin"}
                    </Button>
                  ) : mode === "admin" ? (
                    <Button onClick={() => setCurrentStage(2)}>Proceed to Sign-off <CheckCircle className="w-4 h-4 ml-2" /></Button>
                  ) : null}
                </div>
              </motion.div>
            )}

            {currentStage === 2 && !closureComplete && mode === "admin" && (
              <motion.div key="stage2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-3"><PenTool className="w-4 h-4" /><span className="text-sm font-medium">Signature</span></div>
                    {!signatureData ? (
                      <div className="space-y-2">
                        <canvas ref={canvasRef} width={350} height={120} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="w-full border-2 border-dashed rounded-lg bg-muted cursor-crosshair" />
                        <Button size="sm" onClick={captureSignature} className="w-full">Capture Signature</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-[120px] border-2 border-success rounded-lg bg-success/5 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSignatureData(null)} className="w-full"><Undo className="w-3 h-3 mr-2" /> Re-sign</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <span className="text-sm font-medium">Payment Details</span>
                      </div>
                      <p className="text-xs mb-2">Total Billed: <strong className="text-lg">₹{finalAmount.toLocaleString()}</strong></p>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount Paid by Admin (₹)</label>
                      <Input type="number" placeholder="Enter amount..." value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={() => setCurrentStage(1)}>Back</Button>
                  <div className="flex-1" />
                  <Button onClick={() => setShowFinalizeModal(true)} disabled={!signatureData || !amountPaid}>Finalize Invoice</Button>
                </div>
              </motion.div>
            )}

            {currentStage === 3 && closureComplete && (
              <motion.div key="stage3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="py-6 text-center print:hidden">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-success mb-2">Invoice Generated & Closed</h3>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print PDF</Button>
                  </div>
                </div>

                <div className="space-y-2 hidden print:block">
                  <h2 className="text-2xl font-bold border-b pb-2 mb-4">TRINITY HOUSE - INVOICE</h2>
                  <p><strong>Invoice ID:</strong> {invoice.invoice_id}</p>
                  <p><strong>Job Code:</strong> {invoice.job_code}</p>
                  <p><strong>Total Amount:</strong> ₹{finalAmount.toLocaleString()}</p>
                  {amountPaid && <p><strong>Amount Paid:</strong> ₹{Number(amountPaid).toLocaleString()}</p>}
                  {signatureData && (
                    <div className="mt-8 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Authorized Signatory:</p>
                      <img src={signatureData} alt="Signature" className="h-16" />
                      <p className="text-xs mt-1">{timestamp}</p>
                    </div>
                  )}
                </div>

                {/* Always show line items read-only in closed state */}
                <div className="print:block">
                  {renderLineItems("rawMaterials")}
                  {renderLineItems("packaging")}
                  {renderLineItems("logistics")}
                  {renderLineItems("crew")}
                </div>
                
                <div className="p-4 bg-muted/20 rounded-xl mt-4 flex justify-between items-center print:bg-transparent print:p-0 print:mt-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Billed</p>
                    <p className="text-xl font-bold">₹{finalAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Amount Paid</p>
                    <p className="text-xl font-bold text-success">₹{Number(amountPaid || 0).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirm Closure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Total Billed: ₹{finalAmount.toLocaleString()}</p>
            <p className="text-sm font-bold text-success">Amount Paid: ₹{Number(amountPaid).toLocaleString()}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowFinalizeModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-success hover:bg-success/90" onClick={handleAdminFinalize} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Lock & Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}