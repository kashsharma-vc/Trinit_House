from django.db import models
from django.utils import timezone
import random

class WarrantyCall(models.Model):
    # Choices
    STATUS_CHOICES = [('Urgent', 'Urgent'), ('Normal', 'Normal'), ('Pending', 'Pending'), ('Closed', 'Closed')]
    WARRANTY_CHOICES = [('Active', 'Active'), ('Expired', 'Expired')]
    STAGE_CHOICES = [('Logged', 'Logged'), ('Assigned', 'Assigned'), ('Joint Note', 'Joint Note'), ('Closure', 'Closure')]
    ROLE_CHOICES = [('Financer', 'Financer'), ('Sales', 'Sales'), ('Marketing', 'Marketing'), ('Technician', 'Technician')]

    # Core Fields
    id = models.CharField(max_length=20, primary_key=True, editable=False) # e.g., WC-2024-0034
    equipment = models.CharField(max_length=255)
    vendor = models.CharField(max_length=255)
    serial = models.CharField(max_length=100, blank=True, null=True)
    issue = models.TextField()
    
    # Statuses
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    warrantyStatus = models.CharField(max_length=20, choices=WARRANTY_CHOICES, default='Active')
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default='Logged')
    
    # Dates
    loggedDate = models.DateField(default=timezone.now)
    slaDue = models.DateField(blank=True, null=True)
    
    # Assignment
    assigned_role = models.CharField(max_length=50, choices=ROLE_CHOICES, blank=True, null=True)
    
    # Optional: Technician details (using JSONField for simplicity to match frontend object)
    technician = models.JSONField(blank=True, null=True, help_text="Store name, grade, and contact")

    def save(self, *args, **kwargs):
        # Auto-generate an ID like "WC-2024-1234" if it doesn't exist
        if not self.id:
            year = timezone.now().year
            random_num = random.randint(1000, 9999)
            self.id = f"WC-{year}-{random_num}"
            
        # Auto-set SLA due date to 3 days from logged date if empty
        if not self.slaDue:
            self.slaDue = self.loggedDate + timezone.timedelta(days=3)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id