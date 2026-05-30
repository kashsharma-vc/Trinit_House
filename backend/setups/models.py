from django.db import models
from django.db.models import JSONField
from django.contrib.auth.models import User


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


class AppModule(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Core", "Operations"
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class AppFeature(models.Model):
    module = models.ForeignKey(AppModule, related_name='features', on_delete=models.CASCADE)
    feature_key = models.CharField(max_length=100, unique=True)  # e.g., "my_tickets"
    label = models.CharField(max_length=100)  # e.g., "My Tickets"

    def __str__(self):
        return self.label


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


class Compressor(SetupMaster):
    compressor_type = models.CharField(max_length=150)
    model_name = models.CharField(max_length=150, blank=True)
    # Links to the Category model
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='compressors')
    standard_tat = models.IntegerField(default=0, help_text="Standard TAT in days")
    penalty_applicable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.compressor_type} - {self.model_name}"


class RoleAccessMapping(SetupMaster):
    role = models.ForeignKey('Role', on_delete=models.CASCADE, related_name='access_mappings')
    site_id = models.CharField(max_length=50)  # Stores the ID of the selected site
    permissions = JSONField(default=dict, blank=True)  # Stores { "core:my_tickets": { "view": true, "create": false } }

    def __str__(self):
        return f"{self.role.role_name} - Site: {self.site_id}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)

    # role can be "Admin", "Technician", etc.
    role = models.CharField(max_length=50, blank=True, null=True)
    zone = models.ForeignKey('Zone', on_delete=models.SET_NULL, null=True, blank=True)

    # OTP fields for password recovery
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class SOPStageTemplate(SetupMaster):
    name = models.CharField(max_length=100)
    purpose = models.CharField(max_length=255, blank=True, null=True)
    sequence = models.IntegerField(default=1)
    applicable_request_type = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., Repair, Inspection. Leave blank for all.")

    def __str__(self):
        return f"Template: {self.name} (Seq {self.sequence})"


class ChecklistTemplate(SetupMaster):
    stage_template = models.ForeignKey(SOPStageTemplate, related_name='checklists', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    requires_doc = models.BooleanField(default=False)
    requires_photo = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text} (Doc: {self.requires_doc}, Photo: {self.requires_photo})"
