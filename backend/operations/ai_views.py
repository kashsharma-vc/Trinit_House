import os
from dotenv import load_dotenv

# Load .env and override any existing environment variables (essential for Django runserver reloader)
load_dotenv(override=True)

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication

from operations.models import ServiceRequest, PenaltyCase
from finance.models import Invoice
from inventory.models import InventoryItem
from warranty.models import WarrantyCall

from django.db.models import Sum

# ─── Gemini SDK ───────────────────────────────────────────────────────────────
# The new google-genai SDK replaces the deprecated google-generativeai package
try:
    from google import genai
    from google.genai import types as genai_types
    USE_NEW_SDK = True
except ImportError:
    import google.generativeai as genai  # type: ignore[no-redef]
    USE_NEW_SDK = False

api_key = os.getenv("GEMINI_API_KEY", "")

if USE_NEW_SDK:
    _genai_client = genai.Client(api_key=api_key)
else:
    genai.configure(api_key=api_key)
    _genai_client = None
# ──────────────────────────────────────────────────────────────────────────────


# ─── Tool Functions (called by Gemini) ───────────────────────────────────────

def get_dashboard_summary():
    """Returns a summary of all operations, invoices, inventory, and warranties."""
    requests_count = ServiceRequest.objects.count()
    penalties_count = PenaltyCase.objects.count()
    invoices_count = Invoice.objects.count()
    inventory_count = InventoryItem.objects.count()
    warranties_count = WarrantyCall.objects.count()

    total_billed = Invoice.objects.aggregate(total=Sum('final_amount'))['total'] or 0.00

    return {
        "service_requests_total": requests_count,
        "penalties_total": penalties_count,
        "invoices_total": invoices_count,
        "total_billed_amount": float(total_billed),
        "inventory_items_total": inventory_count,
        "warranty_calls_total": warranties_count,
    }


def create_service_request(request_type: str, priority: str, compressor_model: str, assigned_to: str = None, assigned_role: str = None):
    """Creates a new service request."""
    sr = ServiceRequest.objects.create(
        request_type=request_type,
        priority=priority,
        compressor_model=compressor_model,
        assigned_to=assigned_to,
        assigned_role=assigned_role
    )
    return {"status": "success", "request_id": sr.request_id}


def update_service_request(request_id: str, status: str):
    """Updates the status of a service request."""
    try:
        sr = ServiceRequest.objects.get(request_id=request_id)
        sr.status = status
        sr.save()
        return {"status": "success", "message": f"Service Request {request_id} updated to {status}"}
    except ServiceRequest.DoesNotExist:
        return {"status": "error", "message": "Service request not found"}


def create_penalty(vendor: str, reason: str, delayed: int, penaltyRisk: int, zone: str = "Northern", workshop: str = "Main"):
    """Logs a new penalty breach."""
    penalty = PenaltyCase.objects.create(
        vendor=vendor,
        reason=reason,
        delayed=delayed,
        penaltyRisk=penaltyRisk,
        zone=zone,
        workshop=workshop,
        status="Open"
    )
    return {"status": "success", "penalty_id": penalty.id}


def assign_warranty_role(warranty_id: str, role: str):
    """Assigns a role to a warranty call."""
    try:
        w = WarrantyCall.objects.get(id=warranty_id)
        w.assigned_role = role
        w.save()
        return {"status": "success", "message": f"Assigned {role} to {warranty_id}"}
    except WarrantyCall.DoesNotExist:
        return {"status": "error", "message": "Warranty call not found"}


def update_invoice_status(invoice_id: str, status: str):
    """Updates an invoice status (e.g., 'Pending Review', 'Closed')."""
    try:
        inv = Invoice.objects.get(invoice_id=invoice_id)
        inv.status = status
        inv.save()
        return {"status": "success", "message": f"Invoice {invoice_id} updated to {status}"}
    except Invoice.DoesNotExist:
        return {"status": "error", "message": "Invoice not found"}


def update_inventory_stock(sku: str, new_stock: int):
    """Updates the stock level of an inventory item by SKU."""
    try:
        item = InventoryItem.objects.get(sku=sku)
        item.current_stock = new_stock
        item.save()
        return {"status": "success", "message": f"Inventory item {sku} updated to stock {new_stock}"}
    except InventoryItem.DoesNotExist:
        return {"status": "error", "message": "Inventory item not found"}


def get_sop_stages():
    """Returns a list of all Standard Operating Procedure (SOP) stages configured in the system."""
    from setups.models import SOPStageTemplate
    stages = list(SOPStageTemplate.objects.values('name', 'purpose', 'sequence').order_by('sequence'))
    return {"status": "success", "stages": stages}


# List of available admin tools
admin_tools = [
    get_dashboard_summary,
    create_service_request,
    update_service_request,
    create_penalty,
    assign_warranty_role,
    update_invoice_status,
    update_inventory_stock,
    get_sop_stages
]

# ─── Chat session cache (in-memory; use Redis/DB in production) ───────────────
chat_sessions = {}


def _build_chat_session(is_superuser: bool):
    """Creates a new Gemini chat session with role-appropriate system instruction and tools."""
    if is_superuser:
        sys_instruct = (
            "You are an AI Assistant for Trinity House. Greet the user as 'Namaste! Trinity Assistant here.' "
            "You have full administrative access. Use the provided tools to fetch data and automate tasks. "
            "Be concise, professional, and data-driven."
        )
        tools_to_use = admin_tools
    else:
        sys_instruct = (
            "You are an AI Assistant for Trinity House. Greet the user as 'Namaste! Trinity Assistant here.' "
            "You are assisting a Technician. You can discuss their assigned tasks, SOP stages, and work status. "
            "Do NOT share company-wide statistics or administrative data. Be concise and professional."
        )
        tools_to_use = [get_sop_stages]

    if USE_NEW_SDK:
        # google-genai SDK: sessions are managed differently; return config dict
        return {"sys_instruct": sys_instruct, "tools": tools_to_use, "history": []}
    else:
        role_model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            tools=tools_to_use,
            system_instruction=sys_instruct
        )
        return role_model.start_chat(enable_automatic_function_calling=True)


@api_view(["POST"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def chat_with_assistant(request):
    if not api_key:
        return Response(
            {"error": "GEMINI_API_KEY is not configured. Please add it to your backend/.env file."},
            status=500
        )

    user_id = request.user.id
    message = request.data.get("message", "").strip()

    if not message:
        return Response({"error": "Message cannot be empty."}, status=400)

    if user_id not in chat_sessions:
        chat_sessions[user_id] = _build_chat_session(request.user.is_superuser)

    chat = chat_sessions[user_id]

    try:
        if USE_NEW_SDK:
            # google-genai SDK path
            chat["history"].append({"role": "user", "parts": [{"text": message}]})
            response = _genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=chat["history"],
                config=genai_types.GenerateContentConfig(
                    system_instruction=chat["sys_instruct"],
                    tools=chat["tools"] if chat["tools"] else None,
                )
            )
            reply_text = response.text
            chat["history"].append({"role": "model", "parts": [{"text": reply_text}]})
        else:
            # Legacy google-generativeai SDK path
            response = chat.send_message(message)
            reply_text = response.text

        return Response({"reply": reply_text})

    except Exception as e:
        error_msg = str(e)
        # Clear the broken session so the next request starts fresh
        chat_sessions.pop(user_id, None)

        if any(kw in error_msg for kw in ["API key", "PermissionDenied", "403", "API_KEY_INVALID", "leaked"]):
            return Response(
                {"error": "Gemini API Key is invalid or revoked. Please update GEMINI_API_KEY in backend/.env."},
                status=500
            )

        import traceback
        traceback.print_exc()
        return Response({"error": f"AI Assistant Error: {error_msg}"}, status=500)
