from django.db import models
from setups.models import Category, Compressor, Workshop  # Exact imports

class InventoryItem(models.Model):
    sku = models.CharField(max_length=50, unique=True, help_text="Unique Item Code/SKU", blank=True, null=True)
    name = models.CharField(max_length=200)
    
    # Linked exactly to your setup models
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='inventory_items')
    compressor = models.ForeignKey(Compressor, on_delete=models.SET_NULL, null=True, related_name='inventory_compressors')
    workshop = models.ForeignKey(Workshop, on_delete=models.SET_NULL, null=True, related_name='inventory_items_location')
    
    vendor = models.CharField(max_length=200, blank=True, null=True)
    current_stock = models.IntegerField(default=0)
    safety_stock = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def status(self):
        if self.current_stock <= 0:
            return "blocked"
        elif self.current_stock <= self.safety_stock:
            return "order"
        return "safe"

    def __str__(self):
        return f"{self.sku} - {self.name}" if self.sku else self.name