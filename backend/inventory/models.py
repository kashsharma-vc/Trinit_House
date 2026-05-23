from django.db import models
from setups.models import Category

class InventoryItem(models.Model):
    name = models.CharField(max_length=200)
    
    # Links to the Category master you built earlier
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='inventory_items')
    
    compressor_type = models.CharField(max_length=150)
    current_stock = models.IntegerField(default=0)
    safety_stock = models.IntegerField(default=0)
    vendor = models.CharField(max_length=200)

    # We don't need to save "status" to the database. 
    # We can calculate it on the fly based on current vs safety stock!
    @property
    def status(self):
        if self.current_stock <= 0:
            return "blocked"
        elif self.current_stock <= self.safety_stock:
            return "order"
        return "safe"

    def __str__(self):
        return self.name