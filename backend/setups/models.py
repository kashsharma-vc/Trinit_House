from django.db import models

class SetupMaster(models.Model):
    """
    Abstract base class containing common fields for all Setup Masters.
    """
    status = models.CharField(max_length=20, default='Active')
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=100, default='Admin')

    class Meta:
        abstract = True


class Role(SetupMaster):
    role_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
 
    def __str__(self):
        return self.role_name


class Zone(SetupMaster):
    zone_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.zone_name


class Workshop(SetupMaster):
    workshop_name = models.CharField(max_length=150)
    # Using ForeignKey to link Workshop to a specific Zone
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='workshops')
    location = models.CharField(max_length=200, blank=True, null=True)
    capacity = models.IntegerField(default=0)
    default_sla = models.IntegerField(default=0, help_text="Default SLA in days")

    def __str__(self):
        return f"{self.workshop_name} ({self.zone.zone_name})"

class Category(SetupMaster):
    category_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.category_name
    

# Add this to the bottom of setups/models.py

class Compressor(SetupMaster):
    compressor_type = models.CharField(max_length=150)
    model_name = models.CharField(max_length=150, blank=True)
    # Links to the Category model
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='compressors')
    standard_tat = models.IntegerField(default=0, help_text="Standard TAT in days")
    penalty_applicable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.compressor_type} - {self.model_name}"
    

from django.db.models import JSONField # To store the permission checkboxes

class RoleAccessMapping(SetupMaster):
    role = models.ForeignKey('Role', on_delete=models.CASCADE, related_name='access_mappings')
    site_id = models.CharField(max_length=50) # Stores the ID of the selected site
    permissions = JSONField(default=dict, blank=True) # Stores { "core:my_tickets": { "view": true, "create": false } }

    def __str__(self):
        return f"{self.role.role_name} - Site: {self.site_id}"

