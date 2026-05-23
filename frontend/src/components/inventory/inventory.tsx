import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
// ... your other imports

export default function Inventory() {
  // 1. Create state to hold the live data from Django
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Optional: for loading spinners

  // 2. Fetch the data when the component mounts
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/items/`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        setInventoryItems(data); // 3. Inject the Django data into your React state!
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []); // The empty array ensures this only runs once when the page loads

  // ... the rest of your component renders exactly as it did before, 
  // but now it maps over the live `inventoryItems` state!
}