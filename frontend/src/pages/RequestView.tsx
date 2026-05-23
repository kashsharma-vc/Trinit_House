import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Check,
  Circle,
  Camera,
  Clock,
  User,
  FileText,
  Download,
  Share2,
  Lock,
  Droplets,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Package,
  Search,
  Cog,
  Sparkles,
  ClipboardCheck,
  FlaskConical,
  ShieldCheck,
  Timer,
  ChevronDown,
  Image,
  Paperclip,
  StickyNote,
  Box,
  Gauge,
  Eye,
  FileCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Sample request data (matching Requests.tsx)
const requestsData: Record<string, {
  id: string;
  date: string;
  zone: string;
  workshop: string;
  type: string;
  compressor: string;
  priority: string;
  status: string;
  expectedDate: string;
  slaTat: string;
  daysRemaining: number;
  serialNumber: string;
  model: string;
}> = {
  "REQ-2024-0456": {
    id: "REQ-2024-0456",
    date: "2024-01-28",
    zone: "Northern",
    workshop: "Delhi Workshop",
    type: "Repair",
    compressor: "ELGi W-Type",
    priority: "High",
    status: "Open",
    expectedDate: "2024-02-11",
    slaTat: "14 days",
    daysRemaining: 14,
    serialNumber: "ELG-W-2024-1234",
    model: "15HP",
  },
  "REQ-2024-0455": {
    id: "REQ-2024-0455",
    date: "2024-01-27",
    zone: "Southern",
    workshop: "Chennai Workshop",
    type: "Inspection",
    compressor: "ELGi 15HP",
    priority: "Medium",
    status: "In Progress",
    expectedDate: "2024-02-10",
    slaTat: "14 days",
    daysRemaining: 8,
    serialNumber: "ELG-15HP-2023-5678",
    model: "15HP Industrial",
  },
  "REQ-2024-0454": {
    id: "REQ-2024-0454",
    date: "2024-01-26",
    zone: "Western",
    workshop: "Mumbai Workshop",
    type: "Warranty",
    compressor: "Reciprocating",
    priority: "Low",
    status: "Closed",
    expectedDate: "2024-02-05",
    slaTat: "10 days",
    daysRemaining: 0,
    serialNumber: "REC-2022-9012",
    model: "5HP Standard",
  },
  "REQ-2024-0453": {
    id: "REQ-2024-0453",
    date: "2024-01-25",
    zone: "Eastern",
    workshop: "Kolkata Workshop",
    type: "Repair",
    compressor: "Screw Type",
    priority: "High",
    status: "Open",
    expectedDate: "2024-02-08",
    slaTat: "14 days",
    daysRemaining: 5,
    serialNumber: "SCR-2023-3456",
    model: "20HP Industrial",
  },
  "REQ-2024-0452": {
    id: "REQ-2024-0452",
    date: "2024-01-24",
    zone: "Central",
    workshop: "Bhopal Workshop",
    type: "Inspection",
    compressor: "ELGi W-Type",
    priority: "Medium",
    status: "In Progress",
    expectedDate: "2024-02-07",
    slaTat: "14 days",
    daysRemaining: 3,
    serialNumber: "ELG-W-2023-7890",
    model: "10HP",
  },
};

// Enhanced checklist item with detailed data
interface ChecklistItemData {
  id: number;
  text: string;
  completed: boolean;
  note?: string;
  attachmentLabel?: string;
  // Completed data for view
  completedBy?: string;
  completedAt?: string;
  laborTime?: string;
  delayMessage?: string;
  photoUrl?: string;
  photoDescription?: string;
  documentName?: string;
  documentUrl?: string;
  selectedValue?: string;
  inputValue?: string;
  consumableInfo?: string;
  spareInfo?: string;
}

interface SopStage {
  id: number;
  name: string;
  icon: string;
  purpose: string;
  status: "completed" | "active" | "pending";
  stageLock: string;
  checklist: ChecklistItemData[];
  laborTime?: string;
  technician?: string;
  completedAt?: string;
  trackConsumables?: boolean;
  trackSpares?: boolean;
  consumablesInfo?: string;
  sparesInfo?: string;
}

// Enhanced SOP Stages with new detailed checklists for REQ-2024-0454
const getSopStagesForRequest = (requestId: string): SopStage[] => {
  if (requestId === "REQ-2024-0454") {
    return [
      {
        id: 1,
        name: "Pre-Inspection",
        icon: "🟢",
        purpose: "Ensure safety compliance before any physical handling",
        status: "completed",
        stageLock: "Transit stage locked until all items complete",
        checklist: [
          { 
            id: 1, 
            text: "Verify lifting points condition", 
            completed: true, 
            note: "Visual check as per SOP",
            attachmentLabel: "Pre-lift photos, SOP reference",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 08:30 AM", 
            laborTime: "12 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Lifting points inspected - all secure"
          },
          { 
            id: 2, 
            text: "Check lifting equipment certification validity", 
            completed: true, 
            note: "Certificate number & expiry verified",
            attachmentLabel: "Safety certificate",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 08:45 AM", 
            laborTime: "8 mins",
            documentName: "lifting_certificate_jan2024.pdf"
          },
          { 
            id: 3, 
            text: "Inspect slings, hooks, shackles", 
            completed: true, 
            note: "Wear and damage check",
            attachmentLabel: "Inspection photos",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 09:00 AM", 
            laborTime: "18 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "All slings and hooks in good condition, certified for 2-ton load"
          },
          { 
            id: 4, 
            text: "Confirm PPE compliance", 
            completed: true, 
            note: "Helmet, gloves, shoes verified",
            attachmentLabel: "PPE compliance photo",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 09:10 AM", 
            laborTime: "5 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Full PPE compliance - helmet, gloves, safety boots"
          },
          { 
            id: 5, 
            text: "Verify load weight vs lifting capacity", 
            completed: true, 
            note: "Load rating matched",
            attachmentLabel: "Load chart / document",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 09:20 AM", 
            laborTime: "10 mins",
            documentName: "weight_verification_report.pdf"
          },
          { 
            id: 6, 
            text: "Capture pre-inspection safety record", 
            completed: true, 
            attachmentLabel: "Safety document / photos",
            completedBy: "Suresh Verma", 
            completedAt: "26 Jan, 09:35 AM", 
            laborTime: "15 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Equipment ready for lifting - all safety checks passed",
            documentName: "pre_inspection_form_0454.pdf"
          },
        ],
        laborTime: "1h 8m",
        technician: "Suresh Verma",
        completedAt: "26 Jan 2024, 09:35 AM",
      },
      {
        id: 2,
        name: "Transit",
        icon: "🚚",
        purpose: "Ensure safe and traceable transport",
        status: "completed",
        stageLock: "Receiving stage locked until all items complete",
        checklist: [
          { 
            id: 1, 
            text: "Verify dispatch details", 
            completed: true, 
            note: "Dispatch ID and date confirmed",
            attachmentLabel: "Dispatch document",
            completedBy: "Vikram Patel", 
            completedAt: "26 Jan, 10:00 AM", 
            laborTime: "8 mins",
            documentName: "dispatch_log_0454.pdf"
          },
          { 
            id: 2, 
            text: "Confirm transport vehicle suitability", 
            completed: true, 
            note: "Vehicle type approved",
            attachmentLabel: "Vehicle photo",
            completedBy: "Vikram Patel", 
            completedAt: "26 Jan, 10:15 AM", 
            laborTime: "10 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Vehicle MH-02-AB-1234 inspected and cleared"
          },
          { 
            id: 3, 
            text: "Document handling instructions", 
            completed: true, 
            note: "Fragile / tilt instructions",
            attachmentLabel: "Instruction sheet",
            completedBy: "Vikram Patel", 
            completedAt: "26 Jan, 10:30 AM", 
            laborTime: "12 mins",
            documentName: "handling_instructions.pdf"
          },
          { 
            id: 4, 
            text: "Record expected arrival", 
            completed: true, 
            note: "ETA logged",
            attachmentLabel: "Transport manifest",
            completedBy: "Vikram Patel", 
            completedAt: "26 Jan, 11:00 AM", 
            laborTime: "5 mins",
            documentName: "transport_manifest_0454.pdf"
          },
        ],
        laborTime: "35m",
        technician: "Vikram Patel",
        completedAt: "26 Jan 2024, 11:00 AM",
      },
      {
        id: 3,
        name: "Receiving",
        icon: "🟢",
        purpose: "Confirm item integrity on arrival",
        status: "completed",
        stageLock: "Inspection stage locked until all items complete",
        checklist: [
          { 
            id: 1, 
            text: "Verify delivery challan", 
            completed: true, 
            note: "Document matched",
            attachmentLabel: "Delivery challan",
            completedBy: "Anita Desai", 
            completedAt: "26 Jan, 02:30 PM", 
            laborTime: "12 mins",
            documentName: "delivery_challan_0454.pdf"
          },
          { 
            id: 2, 
            text: "Match serial / DWL number", 
            completed: true, 
            note: "Numbers verified",
            attachmentLabel: "Nameplate photo",
            completedBy: "Anita Desai", 
            completedAt: "26 Jan, 02:45 PM", 
            laborTime: "10 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Serial number REC-2022-9012 verified and matched"
          },
          { 
            id: 3, 
            text: "Inspect packaging condition", 
            completed: true, 
            note: "Damage check",
            attachmentLabel: "Packaging photos",
            completedBy: "Anita Desai", 
            completedAt: "26 Jan, 03:00 PM", 
            laborTime: "15 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "No visible damage, packaging intact"
          },
          { 
            id: 4, 
            text: "Check for transport damage", 
            completed: true, 
            note: "Visual inspection notes",
            attachmentLabel: "Damage photos",
            completedBy: "Anita Desai", 
            completedAt: "26 Jan, 03:15 PM", 
            laborTime: "20 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "No transport damage detected"
          },
          { 
            id: 5, 
            text: "Create & link job card", 
            completed: true, 
            note: "Job card ID generated",
            completedBy: "Anita Desai", 
            completedAt: "26 Jan, 03:40 PM", 
            laborTime: "18 mins",
            documentName: "job_card_JC-MUM-2024-0454.pdf"
          },
        ],
        laborTime: "1h 15m",
        technician: "Anita Desai",
        completedAt: "26 Jan 2024, 03:40 PM",
      },
      {
        id: 4,
        name: "Inspection",
        icon: "🔵",
        purpose: "Identify faults and scope of work",
        status: "completed",
        stageLock: "Disassembly stage locked until all items complete",
        checklist: [
          { 
            id: 1, 
            text: "Perform visual inspection", 
            completed: true, 
            note: "External condition noted",
            attachmentLabel: "Inspection photos",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "27 Jan, 09:00 AM", 
            laborTime: "35 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Visual inspection complete - valve plate showing wear marks"
          },
          { 
            id: 2, 
            text: "Check leaks / abnormal noise", 
            completed: true, 
            note: "Observations recorded",
            attachmentLabel: "Evidence images",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "27 Jan, 09:40 AM", 
            laborTime: "30 mins",
            documentName: "noise_analysis_report.pdf"
          },
          { 
            id: 3, 
            text: "Measure key parameters", 
            completed: true, 
            note: "Values recorded",
            attachmentLabel: "Measurement sheet",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "27 Jan, 10:15 AM", 
            laborTime: "25 mins",
            documentName: "operational_params_0454.pdf"
          },
          { 
            id: 4, 
            text: "Assign technician", 
            completed: true, 
            note: "Technician confirmed",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "27 Jan, 11:00 AM", 
            laborTime: "10 mins"
          },
        ],
        laborTime: "1h 40m",
        technician: "Mahesh Kulkarni",
        completedAt: "27 Jan 2024, 11:00 AM",
      },
      {
        id: 5,
        name: "Disassembly",
        icon: "⚪",
        purpose: "Safe and traceable dismantling",
        status: "completed",
        stageLock: "Cleaning stage locked until all items complete",
        checklist: [
          { 
            id: 1, 
            text: "Disconnect electrical connections", 
            completed: true, 
            note: "Isolation confirmed",
            attachmentLabel: "Safety photo",
            completedBy: "Ravi Nair", 
            completedAt: "27 Jan, 01:00 PM", 
            laborTime: "25 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "All electrical connections safely disconnected and labeled"
          },
          { 
            id: 2, 
            text: "Remove covers / housing", 
            completed: true, 
            note: "Steps followed",
            attachmentLabel: "Disassembly photos",
            completedBy: "Ravi Nair", 
            completedAt: "27 Jan, 01:30 PM", 
            laborTime: "30 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Housing cover removed - 12 bolts extracted"
          },
          { 
            id: 3, 
            text: "Extract internal assemblies", 
            completed: true, 
            note: "Parts identified",
            attachmentLabel: "Assembly photos",
            completedBy: "Ravi Nair", 
            completedAt: "27 Jan, 02:30 PM", 
            laborTime: "55 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Piston and valve assemblies extracted carefully"
          },
          { 
            id: 4, 
            text: "Tag and document removed parts", 
            completed: true, 
            note: "Part IDs recorded",
            attachmentLabel: "Parts list",
            completedBy: "Ravi Nair", 
            completedAt: "27 Jan, 03:30 PM", 
            laborTime: "45 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "All 24 parts tagged with unique identifiers",
            documentName: "parts_inventory_0454.pdf"
          },
        ],
        laborTime: "2h 35m",
        technician: "Ravi Nair",
        completedAt: "27 Jan 2024, 03:30 PM",
      },
      {
        id: 6,
        name: "Cleaning",
        icon: "🧼",
        purpose: "Prepare parts for accurate inspection",
        status: "completed",
        stageLock: "Parts Inspection stage locked until all items complete",
        trackConsumables: true,
        consumablesInfo: "Petrol: 2.5L, Industrial Solvent: 1L",
        checklist: [
          { 
            id: 1, 
            text: "Select approved cleaning method", 
            completed: true, 
            note: "Method as per SOP",
            completedBy: "Deepak Sharma", 
            completedAt: "28 Jan, 09:00 AM", 
            laborTime: "10 mins"
          },
          { 
            id: 2, 
            text: "Record cleaning liquid used", 
            completed: true, 
            note: "Petrol / Diesel / Solvent",
            attachmentLabel: "Chemical usage record",
            completedBy: "Deepak Sharma", 
            completedAt: "28 Jan, 09:15 AM", 
            laborTime: "8 mins",
            selectedValue: "Industrial Solvent + Petrol"
          },
          { 
            id: 3, 
            text: "Record quantity consumed", 
            completed: true, 
            consumableInfo: "Consumable panel (read-only, inventory linked)",
            completedBy: "Deepak Sharma", 
            completedAt: "28 Jan, 09:25 AM", 
            laborTime: "5 mins",
            inputValue: "3.5 Liters total"
          },
          { 
            id: 4, 
            text: "Verify cleanliness & drying", 
            completed: true, 
            note: "Inspection notes",
            attachmentLabel: "Cleaning photos",
            completedBy: "Deepak Sharma", 
            completedAt: "28 Jan, 11:00 AM", 
            laborTime: "95 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "All components cleaned and dried completely"
          },
        ],
        laborTime: "1h 58m",
        technician: "Deepak Sharma",
        completedAt: "28 Jan 2024, 11:00 AM",
      },
      {
        id: 7,
        name: "Parts Inspection",
        icon: "🔍",
        purpose: "Decide Reuse / Repair / Replace",
        status: "completed",
        stageLock: "Assembly stage locked until all items complete",
        trackSpares: true,
        sparesInfo: "Piston Ring Set, Valve Plate, Gasket Kit",
        checklist: [
          { 
            id: 1, 
            text: "Measure dimensional tolerances", 
            completed: true, 
            note: "Values logged",
            attachmentLabel: "Measurement images",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "28 Jan, 01:00 PM", 
            laborTime: "35 mins",
            documentName: "tolerance_measurements_0454.pdf"
          },
          { 
            id: 2, 
            text: "Check wear limits vs SOP", 
            completed: true, 
            note: "Pass / fail noted",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "28 Jan, 01:40 PM", 
            laborTime: "30 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Wear comparison chart - piston rings exceed limit"
          },
          { 
            id: 3, 
            text: "Inspect seals & gaskets", 
            completed: true, 
            note: "Condition recorded",
            attachmentLabel: "Part photos",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "28 Jan, 02:00 PM", 
            laborTime: "20 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Seals showing cracks, gaskets worn - replacement needed"
          },
          { 
            id: 4, 
            text: "Mark part decision", 
            completed: true, 
            note: "Reuse / Repair / Replace",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "28 Jan, 02:30 PM", 
            laborTime: "15 mins",
            selectedValue: "12 Reuse, 3 Replace, 2 Repair"
          },
          { 
            id: 5, 
            text: "Identify required spares / tools", 
            completed: true, 
            spareInfo: "Spares panel (read-only)",
            note: "PO auto-triggered if unavailable",
            completedBy: "Mahesh Kulkarni", 
            completedAt: "28 Jan, 03:00 PM", 
            laborTime: "20 mins",
            documentName: "spare_parts_order.pdf"
          },
        ],
        laborTime: "2h 0m",
        technician: "Mahesh Kulkarni",
        completedAt: "28 Jan 2024, 03:00 PM",
      },
      {
        id: 8,
        name: "Assembly",
        icon: "🛠️",
        purpose: "Restore equipment to SOP standards",
        status: "completed",
        stageLock: "Testing stage locked until all items complete",
        trackConsumables: true,
        trackSpares: true,
        consumablesInfo: "Compressor Oil: 1.5L, Grease: 200g",
        sparesInfo: "Piston Ring Set, Valve Plate, Gasket Kit installed",
        checklist: [
          { 
            id: 1, 
            text: "Verify repair plan", 
            completed: true, 
            note: "Plan approved",
            completedBy: "Ravi Nair", 
            completedAt: "29 Jan, 09:00 AM", 
            laborTime: "15 mins",
            documentName: "repair_plan_approved_0454.pdf"
          },
          { 
            id: 2, 
            text: "Install correct spare parts", 
            completed: true, 
            spareInfo: "Parts used (inventory linked)",
            completedBy: "Ravi Nair", 
            completedAt: "29 Jan, 10:30 AM", 
            laborTime: "85 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "New parts installed as per warranty"
          },
          { 
            id: 3, 
            text: "Apply torque as per SOP", 
            completed: true, 
            note: "Torque values recorded",
            completedBy: "Ravi Nair", 
            completedAt: "29 Jan, 11:15 AM", 
            laborTime: "35 mins",
            documentName: "torque_log.pdf"
          },
          { 
            id: 4, 
            text: "Apply lubrication", 
            completed: true, 
            note: "Oil / grease type",
            attachmentLabel: "Lubrication record",
            completedBy: "Ravi Nair", 
            completedAt: "29 Jan, 11:45 AM", 
            laborTime: "25 mins",
            selectedValue: "SAE 30 Compressor Oil, Lithium Grease"
          },
          { 
            id: 5, 
            text: "Verify fitment", 
            completed: true, 
            attachmentLabel: "Assembly photos",
            completedBy: "Ravi Nair", 
            completedAt: "29 Jan, 12:30 PM", 
            laborTime: "30 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "All components fitted and aligned correctly"
          },
        ],
        laborTime: "3h 10m",
        technician: "Ravi Nair",
        completedAt: "29 Jan 2024, 12:30 PM",
      },
      {
        id: 9,
        name: "Testing",
        icon: "🧪",
        purpose: "Ensure functional reliability",
        status: "completed",
        stageLock: "QC stage locked until all items complete",
        trackConsumables: true,
        consumablesInfo: "Test bench consumables logged",
        checklist: [
          { 
            id: 1, 
            text: "Verify test bench setup", 
            completed: true, 
            note: "Setup confirmed",
            completedBy: "Amit Joshi", 
            completedAt: "29 Jan, 02:00 PM", 
            laborTime: "30 mins",
            photoUrl: "/placeholder.svg",
            photoDescription: "Test bench configured for 5HP reciprocating compressor"
          },
          { 
            id: 2, 
            text: "Execute functional tests", 
            completed: true, 
            note: "Test steps recorded",
            completedBy: "Amit Joshi", 
            completedAt: "29 Jan, 02:45 PM", 
            laborTime: "40 mins",
            documentName: "functional_test_results.pdf"
          },
          { 
            id: 3, 
            text: "Record performance readings", 
            completed: true, 
            attachmentLabel: "Test report",
            completedBy: "Amit Joshi", 
            completedAt: "29 Jan, 03:15 PM", 
            laborTime: "25 mins",
            inputValue: "Pressure: 125 PSI, RPM: 1450, Temp: 68°C",
            documentName: "test_readings_0454.pdf"
          },
          { 
            id: 4, 
            text: "Confirm parameters within limits", 
            completed: true, 
            note: "Pass / fail noted",
            completedBy: "Amit Joshi", 
            completedAt: "29 Jan, 03:45 PM", 
            laborTime: "18 mins"
          },
        ],
        laborTime: "1h 53m",
        technician: "Amit Joshi",
        completedAt: "29 Jan 2024, 03:45 PM",
      },
      {
        id: 10,
        name: "QC Checklist",
        icon: "🧾",
        purpose: "Audit, compliance, and closure readiness",
        status: "completed",
        stageLock: "Invoice & Closure unlock only after QC approval",
        checklist: [
          { 
            id: 1, 
            text: "Verify job card & documents", 
            completed: true, 
            attachmentLabel: "Job card",
            completedBy: "Supervisor - Nitin Mehta", 
            completedAt: "30 Jan, 09:30 AM", 
            laborTime: "35 mins",
            documentName: "job_card_final.pdf"
          },
          { 
            id: 2, 
            text: "Confirm SOP adherence", 
            completed: true, 
            note: "Audit notes",
            completedBy: "Supervisor - Nitin Mehta", 
            completedAt: "30 Jan, 10:15 AM", 
            laborTime: "40 mins",
            documentName: "sop_adherence_check.pdf"
          },
          { 
            id: 3, 
            text: "Review inspection, assembly & test records", 
            completed: true, 
            attachmentLabel: "Consolidated reports",
            completedBy: "Supervisor - Nitin Mehta", 
            completedAt: "30 Jan, 10:45 AM", 
            laborTime: "25 mins",
            documentName: "consolidated_reports.pdf"
          },
          { 
            id: 4, 
            text: "Supervisor / QA approval", 
            completed: true, 
            note: "Approval recorded",
            attachmentLabel: "QC certificate",
            completedBy: "Supervisor - Nitin Mehta", 
            completedAt: "30 Jan, 11:30 AM", 
            laborTime: "35 mins",
            documentName: "qc_certificate_0454.pdf"
          },
        ],
        laborTime: "2h 15m",
        technician: "Supervisor - Nitin Mehta",
        completedAt: "30 Jan 2024, 11:30 AM",
      },
    ];
  }

  // Default stages for other requests
  return [
    {
      id: 1,
      name: "Pre-Inspection",
      icon: "🟢",
      purpose: "Ensure safety compliance before any physical handling",
      status: "completed" as const,
      stageLock: "Transit stage locked until all items complete",
      checklist: [
        { id: 1, text: "Verify lifting points condition", completed: true, note: "Visual check as per SOP", attachmentLabel: "Pre-lift photos, SOP reference", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 09:15 AM", laborTime: "15 mins" },
        { id: 2, text: "Check lifting equipment certification validity", completed: true, note: "Certificate number & expiry verified", attachmentLabel: "Safety certificate", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 09:30 AM", laborTime: "10 mins", documentName: "lifting_cert.pdf" },
        { id: 3, text: "Inspect slings, hooks, shackles", completed: true, note: "Wear and damage check", attachmentLabel: "Inspection photos", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 09:45 AM", laborTime: "20 mins" },
        { id: 4, text: "Confirm PPE compliance", completed: true, note: "Helmet, gloves, shoes verified", attachmentLabel: "PPE compliance photo", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 10:00 AM", laborTime: "5 mins" },
        { id: 5, text: "Verify load weight vs lifting capacity", completed: true, note: "Load rating matched", attachmentLabel: "Load chart / document", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 10:15 AM", laborTime: "10 mins" },
        { id: 6, text: "Capture pre-inspection safety record", completed: true, attachmentLabel: "Safety document / photos", completedBy: "Rajesh Kumar", completedAt: "28 Jan, 10:30 AM", laborTime: "15 mins", photoUrl: "/placeholder.svg", photoDescription: "Pre-inspection complete" },
      ],
      laborTime: "1h 15m",
      technician: "Rajesh Kumar",
      completedAt: "28 Jan 2024, 10:30 AM",
    },
    {
      id: 2,
      name: "Transit",
      icon: "🚚",
      purpose: "Ensure safe and traceable transport",
      status: "completed" as const,
      stageLock: "Receiving stage locked until all items complete",
      checklist: [
        { id: 1, text: "Verify dispatch details", completed: true, note: "Dispatch ID and date confirmed", attachmentLabel: "Dispatch document", completedBy: "Amit Singh", completedAt: "28 Jan, 12:00 PM", laborTime: "10 mins" },
        { id: 2, text: "Confirm transport vehicle suitability", completed: true, note: "Vehicle type approved", attachmentLabel: "Vehicle photo", completedBy: "Amit Singh", completedAt: "28 Jan, 12:15 PM", laborTime: "15 mins" },
        { id: 3, text: "Document handling instructions", completed: true, note: "Fragile / tilt instructions", attachmentLabel: "Instruction sheet", completedBy: "Amit Singh", completedAt: "28 Jan, 12:30 PM", laborTime: "10 mins" },
        { id: 4, text: "Record expected arrival", completed: true, note: "ETA logged", attachmentLabel: "Transport manifest", completedBy: "Amit Singh", completedAt: "28 Jan, 01:00 PM", laborTime: "5 mins", documentName: "transport_manifest.pdf" },
      ],
      laborTime: "40m",
      technician: "Amit Singh",
      completedAt: "28 Jan 2024, 01:00 PM",
    },
    {
      id: 3,
      name: "Receiving",
      icon: "🟢",
      purpose: "Confirm item integrity on arrival",
      status: "completed" as const,
      stageLock: "Inspection stage locked until all items complete",
      checklist: [
        { id: 1, text: "Verify delivery challan", completed: true, note: "Document matched", attachmentLabel: "Delivery challan", completedBy: "Priya Sharma", completedAt: "29 Jan, 08:30 AM", laborTime: "15 mins", documentName: "delivery_challan.pdf" },
        { id: 2, text: "Match serial / DWL number", completed: true, note: "Numbers verified", attachmentLabel: "Nameplate photo", completedBy: "Priya Sharma", completedAt: "29 Jan, 08:45 AM", laborTime: "10 mins" },
        { id: 3, text: "Inspect packaging condition", completed: true, note: "Damage check", attachmentLabel: "Packaging photos", completedBy: "Priya Sharma", completedAt: "29 Jan, 09:00 AM", laborTime: "20 mins" },
        { id: 4, text: "Check for transport damage", completed: true, note: "Visual inspection notes", attachmentLabel: "Damage photos", completedBy: "Priya Sharma", completedAt: "29 Jan, 09:20 AM", laborTime: "15 mins" },
        { id: 5, text: "Create & link job card", completed: true, note: "Job card ID generated", completedBy: "Priya Sharma", completedAt: "29 Jan, 09:45 AM", laborTime: "20 mins" },
      ],
      laborTime: "1h 20m",
      technician: "Priya Sharma",
      completedAt: "29 Jan 2024, 09:45 AM",
    },
    {
      id: 4,
      name: "Inspection",
      icon: "🔵",
      purpose: "Identify faults and scope of work",
      status: "active" as const,
      stageLock: "Disassembly stage locked until all items complete",
      checklist: [
        { id: 1, text: "Perform visual inspection", completed: true, note: "External condition noted", attachmentLabel: "Inspection photos", completedBy: "Rajesh Kumar", completedAt: "29 Jan, 11:00 AM", laborTime: "30 mins", photoUrl: "/placeholder.svg", photoDescription: "Visual inspection complete" },
        { id: 2, text: "Check leaks / abnormal noise", completed: true, note: "Observations recorded", attachmentLabel: "Evidence images", completedBy: "Rajesh Kumar", completedAt: "29 Jan, 11:30 AM", laborTime: "20 mins" },
        { id: 3, text: "Measure key parameters", completed: false, note: "Values recorded", attachmentLabel: "Measurement sheet" },
        { id: 4, text: "Assign technician", completed: false, note: "Technician confirmed" },
      ],
      laborTime: "50m",
      technician: "Rajesh Kumar",
    },
    {
      id: 5,
      name: "Disassembly",
      icon: "⚪",
      purpose: "Safe and traceable dismantling",
      status: "pending" as const,
      stageLock: "Cleaning stage locked until all items complete",
      checklist: [
        { id: 1, text: "Disconnect electrical connections", completed: false, note: "Isolation confirmed", attachmentLabel: "Safety photo" },
        { id: 2, text: "Remove covers / housing", completed: false, note: "Steps followed", attachmentLabel: "Disassembly photos" },
        { id: 3, text: "Extract internal assemblies", completed: false, note: "Parts identified", attachmentLabel: "Assembly photos" },
        { id: 4, text: "Tag and document removed parts", completed: false, note: "Part IDs recorded", attachmentLabel: "Parts list" },
      ],
    },
    {
      id: 6,
      name: "Cleaning",
      icon: "🧼",
      purpose: "Prepare parts for accurate inspection",
      status: "pending" as const,
      stageLock: "Parts Inspection stage locked until all items complete",
      trackConsumables: true,
      consumablesInfo: "Petrol / Diesel / Cleaning agent",
      checklist: [
        { id: 1, text: "Select approved cleaning method", completed: false, note: "Method as per SOP" },
        { id: 2, text: "Record cleaning liquid used", completed: false, note: "Petrol / Diesel / Solvent", attachmentLabel: "Chemical usage record" },
        { id: 3, text: "Record quantity consumed", completed: false, consumableInfo: "Consumable panel (read-only, inventory linked)" },
        { id: 4, text: "Verify cleanliness & drying", completed: false, note: "Inspection notes", attachmentLabel: "Cleaning photos" },
      ],
    },
    {
      id: 7,
      name: "Parts Inspection",
      icon: "🔍",
      purpose: "Decide Reuse / Repair / Replace",
      status: "pending" as const,
      stageLock: "Assembly stage locked until all items complete",
      trackSpares: true,
      sparesInfo: "Record spares needed",
      checklist: [
        { id: 1, text: "Measure dimensional tolerances", completed: false, note: "Values logged", attachmentLabel: "Measurement images" },
        { id: 2, text: "Check wear limits vs SOP", completed: false, note: "Pass / fail noted" },
        { id: 3, text: "Inspect seals & gaskets", completed: false, note: "Condition recorded", attachmentLabel: "Part photos" },
        { id: 4, text: "Mark part decision", completed: false, note: "Reuse / Repair / Replace" },
        { id: 5, text: "Identify required spares / tools", completed: false, spareInfo: "Spares panel (read-only)", note: "PO auto-triggered if unavailable" },
      ],
    },
    {
      id: 8,
      name: "Assembly",
      icon: "🛠️",
      purpose: "Restore equipment to SOP standards",
      status: "pending" as const,
      stageLock: "Testing stage locked until all items complete",
      trackConsumables: true,
      trackSpares: true,
      consumablesInfo: "Oil, grease, lubrication",
      sparesInfo: "Parts used (inventory linked)",
      checklist: [
        { id: 1, text: "Verify repair plan", completed: false, note: "Plan approved" },
        { id: 2, text: "Install correct spare parts", completed: false, spareInfo: "Parts used (inventory linked)" },
        { id: 3, text: "Apply torque as per SOP", completed: false, note: "Torque values recorded" },
        { id: 4, text: "Apply lubrication", completed: false, note: "Oil / grease type", attachmentLabel: "Lubrication record" },
        { id: 5, text: "Verify fitment", completed: false, attachmentLabel: "Assembly photos" },
      ],
    },
    {
      id: 9,
      name: "Testing",
      icon: "🧪",
      purpose: "Ensure functional reliability",
      status: "pending" as const,
      stageLock: "QC stage locked until all items complete",
      trackConsumables: true,
      consumablesInfo: "Test consumables (if any)",
      checklist: [
        { id: 1, text: "Verify test bench setup", completed: false, note: "Setup confirmed" },
        { id: 2, text: "Execute functional tests", completed: false, note: "Test steps recorded" },
        { id: 3, text: "Record performance readings", completed: false, attachmentLabel: "Test report" },
        { id: 4, text: "Confirm parameters within limits", completed: false, note: "Pass / fail noted" },
      ],
    },
    {
      id: 10,
      name: "QC Checklist",
      icon: "🧾",
      purpose: "Audit, compliance, and closure readiness",
      status: "pending" as const,
      stageLock: "Invoice & Closure unlock only after QC approval",
      checklist: [
        { id: 1, text: "Verify job card & documents", completed: false, attachmentLabel: "Job card" },
        { id: 2, text: "Confirm SOP adherence", completed: false, note: "Audit notes" },
        { id: 3, text: "Review inspection, assembly & test records", completed: false, attachmentLabel: "Consolidated reports" },
        { id: 4, text: "Supervisor / QA approval", completed: false, note: "Approval recorded", attachmentLabel: "QC certificate" },
      ],
    },
  ];
};

const statusColors = {
  completed: "bg-success text-success-foreground border-success",
  active: "bg-primary text-primary-foreground border-primary",
  pending: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const stageIconMap: Record<string, React.ReactNode> = {
  "Pre-Inspection": <Shield className="w-5 h-5" />,
  "Transit": <Truck className="w-5 h-5" />,
  "Receiving": <Package className="w-5 h-5" />,
  "Inspection": <Eye className="w-5 h-5" />,
  "Disassembly": <Cog className="w-5 h-5" />,
  "Cleaning": <Sparkles className="w-5 h-5" />,
  "Parts Inspection": <Search className="w-5 h-5" />,
  "Assembly": <Wrench className="w-5 h-5" />,
  "Testing": <FlaskConical className="w-5 h-5" />,
  "QC Checklist": <FileCheck className="w-5 h-5" />,
};

// Animated icon component
const AnimatedIcon = ({ children, isActive, isCompleted }: { children: React.ReactNode; isActive?: boolean; isCompleted?: boolean }) => (
  <motion.div
    initial={{ scale: 0.8 }}
    animate={{ 
      scale: isActive ? [1, 1.1, 1] : 1,
      rotate: isCompleted ? [0, 10, -10, 0] : 0
    }}
    transition={{ 
      duration: isActive ? 2 : 0.3,
      repeat: isActive ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

export default function RequestView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expandedStage, setExpandedStage] = useState<number | null>(1);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const requestData = id ? requestsData[id] : null;
  const sopStages = getSopStagesForRequest(id || "");

  const toggleItemExpanded = (stageId: number, itemId: number) => {
    const key = `${stageId}-${itemId}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStageProgress = (stage: SopStage) => {
    const completed = stage.checklist.filter((c) => c.completed).length;
    return { completed, total: stage.checklist.length, percentage: Math.round((completed / stage.checklist.length) * 100) };
  };

  const isStageAccessible = (stageIndex: number) => {
    if (stageIndex === 0) return true;
    const prevStage = sopStages[stageIndex - 1];
    return prevStage.checklist.every((item) => item.completed);
  };

  // Calculate overall progress
  const completedStages = sopStages.filter(s => s.status === "completed").length;
  const progressPercentage = (completedStages / sopStages.length) * 100;

  if (!requestData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Request not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Request {requestData.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {requestData.compressor} • {requestData.workshop} • {requestData.zone} Zone
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="gap-2">
              <FileText className="w-4 h-4" />
              View Job Card
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Request Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 shadow-soft-md mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Request Date</p>
            <p className="font-medium">{requestData.date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Request Type</p>
            <p className="font-medium">{requestData.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Priority</p>
            <p className={cn(
              "font-medium",
              requestData.priority === "High" && "text-danger",
              requestData.priority === "Medium" && "text-warning",
              requestData.priority === "Low" && "text-muted-foreground"
            )}>{requestData.priority}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SLA TAT</p>
            <p className="font-medium">{requestData.slaTat}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Completion</p>
            <p className="font-medium">{requestData.expectedDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Days Remaining</p>
            <p className={cn(
              "font-medium",
              requestData.daysRemaining <= 3 && "text-danger",
              requestData.daysRemaining > 3 && requestData.daysRemaining <= 7 && "text-warning",
              requestData.daysRemaining > 7 && "text-success"
            )}>{requestData.daysRemaining} days</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Serial Number</p>
            <p className="font-medium">{requestData.serialNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Model</p>
            <p className="font-medium">{requestData.model}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={cn(
              requestData.status === "Open" && "bg-info/20 text-info",
              requestData.status === "In Progress" && "bg-warning/20 text-warning",
              requestData.status === "Closed" && "bg-success/20 text-success"
            )}>{requestData.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Workshop</p>
            <p className="font-medium">{requestData.workshop}</p>
          </div>
        </div>
      </motion.div>

      {/* Horizontal Stage Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 shadow-soft-md mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">SOP Stage Tracker</h3>
          <div className="flex items-center gap-4 text-sm">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-3 h-3 rounded-full bg-success"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-muted-foreground">Completed</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-3 h-3 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-muted-foreground">Active</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Locked</span>
            </motion.div>
          </div>
        </div>
        
        {/* Professional Horizontal Timeline */}
        <div className="relative overflow-x-auto pb-6 pt-4 px-4 bg-[#f8f9fa] rounded-2xl">
          {/* Dashed Connecting Line */}
          <div className="absolute top-[calc(50%-12px)] left-8 right-8 flex items-center z-0">
            <svg className="w-full h-2" preserveAspectRatio="none">
              <line 
                x1="0" 
                y1="4" 
                x2="100%" 
                y2="4" 
                stroke="#d1d5db" 
                strokeWidth="2" 
                strokeDasharray="8 8"
              />
            </svg>
          </div>

          {/* Stages */}
          <div className="relative flex justify-between min-w-[900px] lg:min-w-0 z-10">
            {sopStages.map((stage, index) => {
              const progress = getStageProgress(stage);
              const accessible = isStageAccessible(index);
              const isCompleted = stage.status === "completed";
              const isActive = stage.status === "active";
              const isPending = stage.status === "pending";
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex flex-col items-center flex-1"
                >
                  <motion.button
                    whileHover={accessible ? { scale: 1.1, y: -3 } : {}}
                    whileTap={accessible ? { scale: 0.95 } : {}}
                    onClick={() => accessible && setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                    disabled={!accessible}
                    className="relative"
                  >
                    {/* Step Circle */}
                    {isCompleted ? (
                      // Completed: Solid green with checkmark
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "bg-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.4),0_4px_12px_rgba(0,0,0,0.15)]",
                          expandedStage === stage.id && "ring-4 ring-[#22c55e]/30"
                        )}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-8 h-8 lg:w-10 lg:h-10 text-white stroke-[3]" />
                        </motion.div>
                      </motion.div>
                    ) : isActive ? (
                      // Active: Green outline with pulsing center
                      <motion.div
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "border-4 border-[#22c55e] bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5",
                          "shadow-[0_0_25px_rgba(34,197,94,0.3),0_6px_16px_rgba(0,0,0,0.12)]",
                          expandedStage === stage.id && "ring-4 ring-[#22c55e]/20"
                        )}
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(34,197,94,0.3), 0 6px 16px rgba(0,0,0,0.12)",
                            "0 0 30px rgba(34,197,94,0.5), 0 6px 16px rgba(0,0,0,0.12)",
                            "0 0 20px rgba(34,197,94,0.3), 0 6px 16px rgba(0,0,0,0.12)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div 
                          className="w-4 h-4 bg-white rounded-full shadow-inner"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.8, 1]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    ) : (
                      // Pending: Grey outline with number
                      <div
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "border-2 border-[#d1d5db] bg-white",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                        )}
                      >
                        <span className="text-[#9ca3af] font-semibold text-lg lg:text-xl">
                          {index + 1}
                        </span>
                      </div>
                    )}
                    
                    {/* Progress indicator badge for active stage */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md border-2 border-white"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        {progress.completed}
                      </motion.div>
                    )}
                  </motion.button>
                  
                  {/* Stage Label */}
                  <motion.p 
                    className={cn(
                      "text-[11px] mt-3 text-center font-semibold max-w-[80px] leading-tight",
                      isCompleted ? "text-[#22c55e]" : 
                      isActive ? "text-[#22c55e]" : "text-[#9ca3af]"
                    )}
                    animate={isActive ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {stage.name}
                  </motion.p>
                  
                  {/* Mini progress bar for non-pending stages */}
                  {!isPending && (
                    <motion.div 
                      className="mt-2 w-14 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div 
                        className={cn(
                          "h-full rounded-full",
                          isCompleted ? "bg-[#22c55e]" : "bg-[#22c55e]/60"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Stage Checklist - View Only for Admin */}
      <AnimatePresence mode="wait">
        {expandedStage && (
          <motion.div
            key={expandedStage}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl shadow-soft-md mb-6 overflow-hidden"
          >
            {(() => {
              const currentStage = sopStages.find((s) => s.id === expandedStage);
              if (!currentStage) return null;
              const progress = getStageProgress(currentStage);
              
              return (
                <>
                  {/* Stage Header */}
                  <motion.div 
                    className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center shadow-md",
                            currentStage.status === "completed" ? "bg-success text-success-foreground" :
                            currentStage.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                          animate={currentStage.status === "active" ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AnimatedIcon isActive={currentStage.status === "active"}>
                            {stageIconMap[currentStage.name]}
                          </AnimatedIcon>
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <span className="text-2xl">{currentStage.icon}</span> {currentStage.name}
                            {currentStage.status === "completed" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                                </Badge>
                              </motion.div>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Gauge className="w-4 h-4" />
                            <span className="font-medium">Purpose:</span> {currentStage.purpose}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Badge variant="outline" className={cn(
                            "text-sm py-1 px-3",
                            progress.percentage === 100 ? "bg-success/10 text-success border-success/30" :
                            progress.percentage > 50 ? "bg-primary/10 text-primary border-primary/30" :
                            "bg-warning/10 text-warning border-warning/30"
                          )}>
                            {progress.completed} / {progress.total} items
                          </Badge>
                        </motion.div>
                        {currentStage.laborTime && (
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Badge variant="outline" className="bg-muted text-sm py-1 px-3">
                              <Timer className="w-3 h-3 mr-1" />
                              {currentStage.laborTime}
                            </Badge>
                          </motion.div>
                        )}
                        {currentStage.technician && (
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Badge variant="outline" className="bg-muted text-sm py-1 px-3">
                              <User className="w-3 h-3 mr-1" />
                              {currentStage.technician}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Badges */}
                    {(currentStage.trackConsumables || currentStage.trackSpares) && (
                      <motion.div 
                        className="flex flex-wrap gap-2 mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {currentStage.trackConsumables && (
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Badge className="bg-info/20 text-info border border-info/30 hover:bg-info/30 py-1.5 px-3">
                              <Droplets className="w-4 h-4 mr-2" />
                              <span className="font-medium">Consumables:</span> {currentStage.consumablesInfo}
                            </Badge>
                          </motion.div>
                        )}
                        {currentStage.trackSpares && (
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Badge className="bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 py-1.5 px-3">
                              <Box className="w-4 h-4 mr-2" />
                              <span className="font-medium">Spares/Tools:</span> {currentStage.sparesInfo}
                            </Badge>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Stage Lock Warning */}
                    <motion.div 
                      className="mt-4 flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3 border border-warning/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Lock className="w-4 h-4 text-warning shrink-0" />
                      </motion.div>
                      <span><strong className="text-warning">🔒 Stage Lock:</strong> {currentStage.stageLock}</span>
                    </motion.div>
                  </motion.div>

                  {/* Checklist Items - View Only with Expandable Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {currentStage.checklist.map((item, index) => {
                        const itemKey = `${currentStage.id}-${item.id}`;
                        const isExpanded = expandedItems[itemKey] || false;
                        const hasDetails = item.completed && (item.photoUrl || item.documentName || item.laborTime || item.delayMessage || item.note || item.selectedValue || item.inputValue);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Collapsible open={isExpanded} onOpenChange={() => hasDetails && toggleItemExpanded(currentStage.id, item.id)}>
                              <motion.div
                                className={cn(
                                  "flex flex-col rounded-xl border transition-all overflow-hidden",
                                  item.completed
                                    ? "bg-success/5 border-success/20"
                                    : "bg-muted/30 border-border"
                                )}
                                whileHover={hasDetails ? { scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } : {}}
                              >
                                <CollapsibleTrigger asChild disabled={!hasDetails}>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between p-4 gap-3",
                                      hasDetails && "cursor-pointer hover:bg-muted/50"
                                    )}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <motion.div 
                                        className={cn(
                                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                          item.completed 
                                            ? "bg-success border-success text-success-foreground" 
                                            : "border-muted-foreground/40"
                                        )}
                                        initial={item.completed ? { scale: 0 } : {}}
                                        animate={item.completed ? { scale: 1 } : {}}
                                        transition={{ type: "spring", stiffness: 500 }}
                                      >
                                        {item.completed && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                      <div className="flex-1">
                                        <span className={cn(
                                          "font-medium",
                                          item.completed && "text-foreground"
                                        )}>
                                          {item.text}
                                        </span>
                                        {item.note && (
                                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <StickyNote className="w-3 h-3" />
                                            {item.note}
                                          </p>
                                        )}
                                        {item.attachmentLabel && (
                                          <p className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                                            <Paperclip className="w-3 h-3" />
                                            Attach: {item.attachmentLabel}
                                          </p>
                                        )}
                                        {item.consumableInfo && (
                                          <p className="text-xs text-info mt-0.5 flex items-center gap-1">
                                            <Box className="w-3 h-3" />
                                            📦 {item.consumableInfo}
                                          </p>
                                        )}
                                        {item.spareInfo && (
                                          <p className="text-xs text-warning mt-0.5 flex items-center gap-1">
                                            <Wrench className="w-3 h-3" />
                                            📦 {item.spareInfo}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {item.photoUrl && (
                                        <motion.div whileHover={{ scale: 1.1 }}>
                                          <Badge variant="outline" className="text-xs gap-1 bg-primary/5">
                                            <Camera className="w-3 h-3" />
                                            📷
                                          </Badge>
                                        </motion.div>
                                      )}
                                      {item.documentName && (
                                        <motion.div whileHover={{ scale: 1.1 }}>
                                          <Badge variant="outline" className="text-xs gap-1 bg-primary/5">
                                            <FileText className="w-3 h-3" />
                                            📎
                                          </Badge>
                                        </motion.div>
                                      )}
                                      {hasDetails && (
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleTrigger>

                                {/* Expanded Details */}
                                <CollapsibleContent>
                                  {item.completed && hasDetails && (
                                    <motion.div 
                                      className="px-4 pb-4 pt-0 border-t border-border/50"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                        {/* Completion Info */}
                                        <motion.div 
                                          className="space-y-2"
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.1 }}
                                        >
                                          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                            <User className="w-3 h-3" /> Completion Details
                                          </p>
                                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                            {item.completedBy && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <User className="w-4 h-4 text-primary" />
                                                </motion.div>
                                                <span className="font-medium">👤 {item.completedBy}</span>
                                              </div>
                                            )}
                                            {item.completedAt && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Clock className="w-4 h-4 text-primary" />
                                                </motion.div>
                                                <span>🕒 {item.completedAt}</span>
                                              </div>
                                            )}
                                            {item.laborTime && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Timer className="w-4 h-4 text-success" />
                                                </motion.div>
                                                <span className="text-success font-medium">⏱️ Labor: {item.laborTime}</span>
                                              </div>
                                            )}
                                            {item.selectedValue && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Check className="w-4 h-4 text-info" />
                                                </motion.div>
                                                <span className="text-info">Selected: {item.selectedValue}</span>
                                              </div>
                                            )}
                                            {item.inputValue && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Gauge className="w-4 h-4 text-info" />
                                                </motion.div>
                                                <span className="text-info">Value: {item.inputValue}</span>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>

                                        {/* Photo */}
                                        {item.photoUrl && (
                                          <motion.div 
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <Camera className="w-3 h-3" /> 📷 Photo Evidence
                                            </p>
                                            <motion.div 
                                              className="bg-muted/50 rounded-lg p-3"
                                              whileHover={{ scale: 1.02 }}
                                            >
                                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-2 overflow-hidden border">
                                                <img src={item.photoUrl} alt="Checklist photo" className="w-full h-full object-cover" />
                                              </div>
                                              {item.photoDescription && (
                                                <p className="text-xs text-muted-foreground flex items-start gap-1">
                                                  <Image className="w-3 h-3 mt-0.5 shrink-0" />
                                                  {item.photoDescription}
                                                </p>
                                              )}
                                            </motion.div>
                                          </motion.div>
                                        )}

                                        {/* Document */}
                                        {item.documentName && (
                                          <motion.div 
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <FileText className="w-3 h-3" /> 📎 Document
                                            </p>
                                            <motion.div 
                                              className="bg-muted/50 rounded-lg p-3"
                                              whileHover={{ scale: 1.02 }}
                                            >
                                              <div className="flex items-center gap-3 p-2 bg-background rounded-lg border">
                                                <motion.div
                                                  whileHover={{ rotate: 10 }}
                                                >
                                                  <FileText className="w-8 h-8 text-primary" />
                                                </motion.div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{item.documentName}</p>
                                                  <p className="text-xs text-muted-foreground">Click to view</p>
                                                </div>
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Download className="w-4 h-4" />
                                                  </Button>
                                                </motion.div>
                                              </div>
                                            </motion.div>
                                          </motion.div>
                                        )}

                                        {/* Delay Message */}
                                        {item.delayMessage && (
                                          <motion.div 
                                            className="space-y-2 col-span-full"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" /> Delay Note
                                            </p>
                                            <motion.div 
                                              className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2"
                                              animate={{ x: [0, 2, -2, 0] }}
                                              transition={{ duration: 0.5, repeat: 2 }}
                                            >
                                              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                              <p className="text-sm text-warning">{item.delayMessage}</p>
                                            </motion.div>
                                          </motion.div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </CollapsibleContent>
                              </motion.div>
                            </Collapsible>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
