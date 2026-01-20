"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./InlineEditField";
import { BusinessHoursEditor } from "./BusinessHoursEditor";
import { updateBusinessInfo, updateBusinessHours } from "@/actions/business";
import type { BusinessHoursInput } from "@/lib/validations/business";

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  opening_hours: Record<string, DayHours> | null;
  address: string;
  city: string;
  landmarks: string;
  phone: string;
}

interface BusinessInfoFormProps {
  business: BusinessData;
}

/**
 * BusinessInfoForm Component
 *
 * Main form for editing business profile settings.
 * Uses inline editing pattern - tap any field to edit.
 * Auto-saves on blur with toast notifications.
 */
export function BusinessInfoForm({ business }: BusinessInfoFormProps) {
  const [, startTransition] = useTransition();

  // Current values (start with props, will be updated by successful saves)
  const currentValues = {
    name: business.name,
    address: business.address,
    city: business.city,
    landmarks: business.landmarks,
    phone: business.phone,
  };

  const handleSaveField = async (
    field: keyof typeof currentValues,
    value: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        // Build update payload with all required fields
        const data = {
          name: field === "name" ? value : currentValues.name,
          address: field === "address" ? value : currentValues.address,
          city: field === "city" ? value : currentValues.city,
          landmarks: field === "landmarks" ? value : currentValues.landmarks,
          phone: field === "phone" ? value : currentValues.phone,
        };

        const result = await updateBusinessInfo(data);

        if (result.success) {
          toast.success("Changes saved");
          resolve();
        } else {
          toast.error(result.error.message);
          reject(new Error(result.error.message));
        }
      });
    });
  };

  const handleSaveHours = async (hours: BusinessHoursInput): Promise<void> => {
    const result = await updateBusinessHours(hours);

    if (result.success) {
      toast.success("Business hours saved");
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Name */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Business Name</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InlineEditField
            value={business.name}
            onSave={(value) => handleSaveField("name", value)}
            label="Business name"
            placeholder="Enter business name"
          />
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Business Hours</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <BusinessHoursEditor
            hours={business.opening_hours}
            onSave={handleSaveHours}
          />
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div>
            <label className="text-sm text-muted-foreground">Address</label>
            <InlineEditField
              value={business.address}
              onSave={(value) => handleSaveField("address", value)}
              label="Address"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">City/District</label>
            <InlineEditField
              value={business.city}
              onSave={(value) => handleSaveField("city", value)}
              label="City"
              placeholder="Enter city or district"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Landmarks</label>
            <InlineEditField
              value={business.landmarks}
              onSave={(value) => handleSaveField("landmarks", value)}
              label="Landmarks"
              placeholder="Near..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Phone */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Contact Phone</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InlineEditField
            value={business.phone}
            onSave={(value) => handleSaveField("phone", value)}
            label="Phone"
            placeholder="Enter phone number"
          />
        </CardContent>
      </Card>
    </div>
  );
}
