import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { X, Loader2, AlertCircle, Link2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'toggle' | 'date' | 'textarea' | 'readonly' | 'password';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  masked?: boolean;
  section?: string;
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
  defaultValue?: any;
  showLink?: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface MasterDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  mode: 'add' | 'edit' | 'view';
  fields: FieldConfig[];
  sections?: FormSection[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  isLoading?: boolean;
  idPrefix?: string;
  showId?: boolean;
}

export function MasterDetailModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  mode,
  fields,
  sections,
  initialData = {},
  onSave,
  isLoading = false,
  idPrefix = 'ID',
  showId = false,
}: MasterDetailModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize form data
  useEffect(() => {
    if (open) {
      const defaultData: Record<string, any> = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaultData[field.name] = field.defaultValue;
        } else if (field.type === 'toggle') {
          defaultData[field.name] = true;
        } else if (field.type === 'multiselect') {
          defaultData[field.name] = [];
        }
      });
      
      // Process initialData to convert 'Active'/'Inactive' strings to booleans for toggle fields
      const processedInitialData = { ...initialData };
      fields.forEach((field) => {
        if (field.type === 'toggle' && field.name === 'status' && initialData[field.name]) {
          processedInitialData[field.name] = initialData[field.name] === 'Active';
        }
      });
      
      setFormData({ ...defaultData, ...processedInitialData });
      setErrors({});
      
      // Initialize sections
      if (sections) {
        const sectionState: Record<string, boolean> = {};
        sections.forEach((section) => {
          sectionState[section.id] = section.defaultOpen !== false;
        });
        setExpandedSections(sectionState);
      }
    }
  }, [open, initialData, fields, sections]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && (formData[field.name] === undefined || formData[field.name] === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Invalid email format';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (mode === 'view') {
      onClose();
      return;
    }
    if (validate()) {
      onSave(formData);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const renderField = (field: FieldConfig) => {
    const isDisabled = mode === 'view' || field.type === 'readonly';
    const hasError = !!errors[field.name];

    // Handle toggle type separately with inline label
    if (field.type === 'toggle') {
      return (
        <div key={field.name} className={cn('space-y-2', field.colSpan === 2 ? 'md:col-span-2' : '')}>
          <Label className="text-sm font-medium text-foreground">{field.label}</Label>
          <div className="flex items-center gap-3">
            <Switch
              id={field.name}
              checked={formData[field.name] ?? true}
              onCheckedChange={(checked) => handleChange(field.name, checked)}
              disabled={isDisabled}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor={field.name} className="text-sm font-normal text-muted-foreground cursor-pointer">
              {formData[field.name] ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>
      );
    }

    return (
      <div
        key={field.name}
        className={cn(
          'space-y-2',
          field.colSpan === 2 ? 'md:col-span-2' : ''
        )}
      >
        <Label htmlFor={field.name} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-primary">*</span>}
          {field.showLink && <Link2 className="w-3.5 h-3.5 text-muted-foreground" />}
        </Label>

        {(field.type === 'text' || field.type === 'email' || field.type === 'password') && (
          <Input
            id={field.name}
            type={field.type === 'password' && !field.masked ? 'password' : 'text'}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            className={cn(
              'h-11 border-2 transition-colors focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              hasError ? 'border-danger' : 'border-input hover:border-primary/50'
            )}
          />
        )}

        {field.type === 'number' && (
          <Input
            id={field.name}
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            min={field.min}
            max={field.max}
            className={cn(
              'h-11 border-2 transition-colors focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              hasError ? 'border-danger' : 'border-input hover:border-primary/50'
            )}
          />
        )}

        {field.type === 'date' && (
          <Input
            id={field.name}
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isDisabled}
            className={cn(
              'h-11 border-2 transition-colors focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              hasError ? 'border-danger' : 'border-input hover:border-primary/50'
            )}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            rows={3}
            className={cn(
              'border-2 transition-colors resize-none focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              hasError ? 'border-danger' : 'border-input hover:border-primary/50'
            )}
          />
        )}

        {field.type === 'select' && (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleChange(field.name, value)}
            disabled={isDisabled}
          >
            <SelectTrigger 
              className={cn(
                'h-11 border-2 transition-colors focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                hasError ? 'border-danger' : 'border-input hover:border-primary/50'
              )}
            >
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'multiselect' && (
          <div className="space-y-2 p-3 border-2 rounded-lg bg-muted/20 border-input hover:border-primary/50 transition-colors">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.name}-${option.value}`}
                  checked={(formData[field.name] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const current = formData[field.name] || [];
                    if (checked) {
                      handleChange(field.name, [...current, option.value]);
                    } else {
                      handleChange(field.name, current.filter((v: string) => v !== option.value));
                    }
                  }}
                  disabled={isDisabled}
                />
                <Label
                  htmlFor={`${field.name}-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {field.type === 'readonly' && (
          <div className="px-3 py-2.5 bg-muted/50 rounded-md text-sm text-muted-foreground border-2 border-input h-11 flex items-center">
            {formData[field.name] || '-'}
          </div>
        )}

        {hasError && (
          <p className="text-xs text-danger flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            {errors[field.name]}
          </p>
        )}
      </div>
    );
  };

  const renderFieldsBySection = () => {
    if (!sections || sections.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map(renderField)}
        </div>
      );
    }

    const fieldsBySection: Record<string, FieldConfig[]> = {};
    const unsectionedFields: FieldConfig[] = [];

    fields.forEach((field) => {
      if (field.section) {
        if (!fieldsBySection[field.section]) {
          fieldsBySection[field.section] = [];
        }
        fieldsBySection[field.section].push(field);
      } else {
        unsectionedFields.push(field);
      }
    });

    return (
      <div className="space-y-5">
        {unsectionedFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {unsectionedFields.map(renderField)}
          </div>
        )}

        {sections.map((section) => {
          const sectionFields = fieldsBySection[section.id] || [];
          if (sectionFields.length === 0) return null;

          return (
            <Collapsible
              key={section.id}
              open={expandedSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors border border-border">
                  <div className="flex items-center gap-3">
                    {section.icon && <span className="text-primary">{section.icon}</span>}
                    <div>
                      <h4 className="font-medium text-sm">{section.title}</h4>
                      {section.description && (
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      )}
                    </div>
                  </div>
                  {expandedSections[section.id] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 px-1"
                >
                  {sectionFields.map(renderField)}
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  const modalTitle = mode === 'add' 
    ? `Add New ${title}` 
    : mode === 'edit' 
      ? `Edit ${title}` 
      : `View ${title}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b bg-card">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-5 space-y-5">
            {renderFieldsBySection()}

            {/* System Fields Section */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Info className="w-4 h-4" />
                <span className="text-sm">System fields (auto-generated)</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created By</p>
                  <p className="text-sm font-medium text-foreground">
                    {mode === 'edit' ? (initialData.createdBy || 'Current Admin') : 'Current Admin'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created On</p>
                  <p className="text-sm font-medium text-foreground">
                    {mode === 'edit' ? (initialData.createdOn || currentDate) : currentDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="min-w-[100px] h-11"
          >
            Cancel
          </Button>
          {mode !== 'view' && (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading} 
              className="min-w-[140px] h-11 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                mode === 'add' ? 'Create Entry' : 'Save Changes'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
