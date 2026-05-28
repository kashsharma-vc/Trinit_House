import json
import google.generativeai as genai
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication

from operations.models import ServiceRequest, PenaltyCase
from finance.models import Invoice
from inventory.models import InventoryItem
from warranty.models import WarrantyCall

# The API key was provided by the user in the prompt.
# In a real production app, this should be in .env
genai.configure(api_key="AIzaSyC6rBzXH-rsm_OX4gE4wlT-YjGdD0zD0Kg")

from django.db.models import Sum

# Tools for Gemini to call
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
    # Assuming minimal required fields for now
    sr = ServiceRequest.objects.create(
        request_type=request_type,
        priority=priority,
        compressor_model=compressor_model,
        assigned_to=assigned_to,
        assigned_role=assigned_role
    )
    return {"status": "success", "request_id": sr.request_id}

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

# Initialize the model with tools
model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    tools=[get_dashboard_summary, create_service_request, create_penalty, assign_warranty_role],
    system_instruction="You are a helpful AI Assistant for an operations admin. Use the provided tools to fetch data and create records. Be concise in your answers. Always tell the user what action you took."
)

# Store chat sessions in memory for simplicity (In production, use DB or cache)
chat_sessions = {}

@api_view(["POST"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def chat_with_assistant(request):
    user_id = request.user.id
    message = request.data.get("message", "")
    
    if user_id not in chat_sessions:
        chat_sessions[user_id] = model.start_chat(enable_automatic_function_calling=True)
    
    chat = chat_sessions[user_id]
    
    try:
        response = chat.send_message(message)
        return Response({"reply": response.text})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
