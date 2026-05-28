from django.db import models

# Create your models here.
from operations.models import ServiceRequest

import uuid # Make sure this is imported at the top of your file!

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Pending Review', 'Pending Review'),
        ('Pending Sign-off', 'Pending Sign-off'),
        ('Closed', 'Closed'),
    ]

    ROLE_CHOICES = [
        ('Sales Head', 'Sales Head'),
        ('Financer', 'Financer'),
        ('Marketing', 'Marketing'),
    ]

    invoice_id = models.CharField(max_length=50, unique=True, blank=True)
    job_code = models.OneToOneField('operations.ServiceRequest', on_delete=models.CASCADE, related_name='invoice')
    department_role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Financer')
    
    # --- NEW MISSING FEATURES ---
    facility = models.CharField(max_length=100, default='Mumbai Main Plant')
    issued_by = models.CharField(max_length=100, default='System Admin')
    
    # Signature Tracking (Stores the canvas drawing as Base64 text)
    signature_data = models.TextField(blank=True, null=True) 
    signature_timestamp = models.CharField(max_length=100, blank=True, null=True)
    gps_location = models.CharField(max_length=255, blank=True, null=True)
    # ----------------------------
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Pending Review')
    date_created = models.DateField(auto_now_add=True)
    
    # Store dynamic invoice items
    costing_data = models.JSONField(default=dict, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.invoice_id:
            self.invoice_id = f"TEMP-{uuid.uuid4().hex[:8]}"
            super().save(*args, **kwargs)
            self.invoice_id = f"INV-2026-{self.id:04d}"
            kwargs.pop('force_insert', None)
            super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_id

class Penalty(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Review', 'In Review'),
        ('Resolved', 'Resolved'),
    ]

    # Link the penalty to the job where the SLA was breached
    job_code = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='penalties')
    
    breach_reason = models.CharField(max_length=200)
    days_delayed = models.IntegerField(default=0)
    penalty_risk_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    assigned_to = models.CharField(max_length=150)
    vendor_name = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')

    def __str__(self):
        return f"Penalty for {self.job_code.request_id}"