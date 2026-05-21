import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Edit, Trash2, ChevronDown, ChevronUp,
  LayoutGrid, LayoutList, MoreVertical, Eye, Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface MasterListProps {
  title: string;
  description?: string;
  data: any[];
  columns: Column[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onView?: (item: any) => void;
  addButtonText?: string;
  showCardView?: boolean;
  cardRender?: (item: any, onEdit: () => void, onDelete: () => void) => React.ReactNode;
  searchPlaceholder?: string;
  searchKeys?: string[];
  icon?: React.ReactNode;
}

const statusColors: Record<string, string> = {
  Active: 'status-safe',
  Inactive: 'status-warning',
  Draft: 'status-info',
  Retired: 'status-danger',
  Success: 'status-safe',
  Failure: 'status-danger',
};

export function MasterList({
  title,
  description,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onView,
  addButtonText = 'Add New',
  showCardView = false,
  cardRender,
  searchPlaceholder = 'Search...',
  searchKeys = ['name'],
  icon,
}: MasterListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' } 
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const renderCellValue = (column: Column, item: any) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    if (column.key === 'status' || column.key === 'sopStatus') {
      return (
        <span className={cn('status-badge', statusColors[value] || 'status-info')}>
          {value}
        </span>
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={cn('status-badge', value ? 'status-safe' : 'status-warning')}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value ?? '-';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {sortedData.length} of {data.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showCardView && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            {addButtonText}
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft-md overflow-hidden border border-border"
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        column.sortable && 'cursor-pointer hover:bg-muted/70',
                        column.width
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {sortedData.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.02 }}
                      className="group"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={column.key === columns[0].key ? 'font-medium' : ''}>
                          {renderCellValue(column, item)}
                        </td>
                      ))}
                      <td>
                        <div className="flex items-center gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onView(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-danger hover:text-danger"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Card View */}
      {viewMode === 'card' && showCardView && cardRender && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {sortedData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
              >
                {cardRender(
                  item,
                  () => onEdit(item),
                  () => handleDeleteClick(item)
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
