import random
import datetime
from django.db import models
from django.utils import timezone
from django.conf import settings
from setups.models import Zone, Workshop, Compressor 

class ServiceRequest(models.Model):
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

    request_id = models.CharField(max_length=50, unique=True, blank=True)
    request_date = models.DateField(auto_now_add=True)
    
    # Linked setup masters
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True)
    workshop = models.ForeignKey(Workshop, on_delete=models.SET_NULL, null=True, blank=True)
    compressor = models.ForeignKey(Compressor, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Assigned Technician Field
    assigned_to = models.CharField(max_length=100, blank=True, null=True)
    
    # Request details
    request_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Repair')
    compressor_model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    
    # SLA Fields
    sla_tat_days = models.IntegerField(default=14)
    expected_date = models.DateField(blank=True, null=True)
    
    sla_days = models.IntegerField(default=3, help_text="SLA timeline limit in days")
    expected_completion_date = models.DateTimeField(blank=True, null=True)
    assigned_role = models.CharField(max_length=50, blank=True, null=True)

    def save(self, *args, **kwargs):
        # 1. Generate Request ID automatically
        if not self.request_id:
            year = timezone.now().year
            random_num = random.randint(1000, 9999)
            self.request_id = f"REQ-{year}-{random_num}"
        
        # 2. Calculate the Expected Date based on standard TAT
        if not self.expected_date:
            self.expected_date = timezone.now().date() + datetime.timedelta(days=int(self.sla_tat_days or 14))

        # 3. Calculate DateTime completion deadline
        if not self.expected_completion_date:
            self.expected_completion_date = timezone.now() + timezone.timedelta(days=int(self.sla_days or 3))

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.request_id} - {self.request_type}"


class PenaltyCase(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Review', 'In Review'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    ]
    id = models.CharField(primary_key=True, max_length=50, editable=False)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    zone = models.CharField(max_length=50, blank=True, null=True)
    workshop = models.CharField(max_length=100, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
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


class SOPStage(models.Model):
    service_request = models.ForeignKey(ServiceRequest, related_name='stages', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    purpose = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")
    sequence = models.IntegerField(default=1)
    labor_time = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - Stage {self.sequence} ({self.status})"
    

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.message}"


class ChecklistItem(models.Model):
    stage = models.ForeignKey(SOPStage, related_name='checklist', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='completed_checklist_items'
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    labor_time = models.CharField(max_length=50, blank=True, null=True)
    attachment_label = models.CharField(max_length=100, blank=True, null=True)
    requires_doc = models.BooleanField(default=False)
    requires_photo = models.BooleanField(default=False)
    attachment = models.FileField(upload_to='attachments/', blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.text} - Completed: {self.completed}"