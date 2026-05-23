# Create your models here.
from django.db import models
from setups.models import Zone, Workshop, Compressor 
from django.conf import settings
import uuid
class ServiceRequest(models.Model):
    # Standard choice definitions for dropdowns
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Closed', 'Closed'),
    ]
    TYPE_CHOICES = [
        ('Repair', 'Repair'),
        ('Inspection', 'Inspection'),
        ('Warranty', 'Warranty'),
    ]

    # Auto-generate a unique ID string (like REQ-2024-0456)
    request_id = models.CharField(max_length=50, unique=True, blank=True)
    request_date = models.DateField(auto_now_add=True)
    
    # Linking to your Setup Masters!
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True)
    workshop = models.ForeignKey(Workshop, on_delete=models.SET_NULL, null=True)
    compressor = models.ForeignKey(Compressor, on_delete=models.SET_NULL, null=True)
    
    # Request Details
    request_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    description = models.TextField(blank=True, null=True)
    
    # Equipment specifics
    compressor_model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    
    # SLA Tracking
    expected_date = models.DateField(null=True, blank=True)
    sla_tat_days = models.IntegerField(default=14)

    def save(self, *args, **kwargs):
        # If the request_id is empty, we are creating a brand new record
        if not self.request_id:
            # 1. Generate a random, temporary ID to bypass the Unique constraint
            self.request_id = f"TEMP-{uuid.uuid4().hex[:8]}"
            
            # 2. First save to get the real database primary key (self.id)
            super().save(*args, **kwargs) 
            
            # 3. Generate the real, formatted ID string
            self.request_id = f"REQ-2026-{self.id:04d}"
            
            # 4. Remove force_insert so Django updates the row instead of creating a new one
            kwargs.pop('force_insert', None)
            super().save(*args, **kwargs)
        else:
            # Normal save if we are just editing an existing request
            super().save(*args, **kwargs)

from django.conf import settings

class Notification(models.Model):
    # If you have custom users, use settings.AUTH_USER_MODEL
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.message} - {'Read' if self.is_read else 'Unread'}"


class WarrantyCall(models.Model):
    # Statuses
    STATUS_CHOICES = [('Urgent', 'Urgent'), ('Normal', 'Normal'), ('Pending', 'Pending'), ('Closed', 'Closed')]
    ROLE_CHOICES = [('Financer', 'Financer'), ('Sales', 'Sales'), ('Marketing', 'Marketing'), ('Technician', 'Technician')]

    call_id = models.CharField(max_length=50, unique=True)
    equipment = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100)
    vendor = models.CharField(max_length=100)
    issue = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    stage = models.CharField(max_length=50, default='Logged')
    
    # Assignment Fields
    assigned_role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)
    assigned_to = models.CharField(max_length=100, null=True, blank=True) # Name of person
    
    created_at = models.DateTimeField(auto_now_add=True)

from django.db import models
from django.utils import timezone
import random

# ... [Your existing Invoice models are up here] ...

class PenaltyCase(models.Model):
    ZONE_CHOICES = [('Northern', 'Northern'), ('Southern', 'Southern'), ('Western', 'Western'), ('Eastern', 'Eastern'), ('Central', 'Central')]
    STATUS_CHOICES = [('Open', 'Open'), ('In Review', 'In Review'), ('Resolved', 'Resolved')]

    id = models.CharField(max_length=20, primary_key=True, editable=False) # e.g., JOB-2024-0123
    zone = models.CharField(max_length=50, choices=ZONE_CHOICES, default='Northern')
    location = models.CharField(max_length=100, blank=True, null=True)
    workshop = models.CharField(max_length=100)
    vendor = models.CharField(max_length=100)
    reason = models.TextField()
    
    delayed = models.IntegerField(default=0, help_text="Number of days delayed")
    penaltyRisk = models.IntegerField(default=0, help_text="Amount at risk in Rupees")
    
    assignedTo = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    loggedDate = models.DateField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            random_num = random.randint(1000, 9999)
            self.id = f"JOB-{year}-{random_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.vendor}"