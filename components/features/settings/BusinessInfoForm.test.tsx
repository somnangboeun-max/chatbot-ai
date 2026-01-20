/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BusinessInfoForm } from "./BusinessInfoForm";

// Mock the server actions
vi.mock("@/actions/business", () => ({
  updateBusinessInfo: vi.fn().mockResolvedValue({ success: true, data: {} }),
  updateBusinessHours: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("BusinessInfoForm", () => {
  const mockBusiness = {
    id: "test-tenant-id",
    name: "Test Business",
    opening_hours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: { closed: true },
    },
    address: "123 Test Street",
    city: "Phnom Penh",
    landmarks: "Near Central Market",
    phone: "012345678",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form sections", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    // Check section headers
    expect(screen.getByText("Business Name")).toBeInTheDocument();
    expect(screen.getByText("Business Hours")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Contact Phone")).toBeInTheDocument();
  });

  it("displays business name", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });

  it("displays address", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("123 Test Street")).toBeInTheDocument();
  });

  it("displays city", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("Phnom Penh")).toBeInTheDocument();
  });

  it("displays landmarks", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("Near Central Market")).toBeInTheDocument();
  });

  it("displays phone number", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("012345678")).toBeInTheDocument();
  });

  it("displays all 7 days in hours editor", () => {
    render(<BusinessInfoForm business={mockBusiness} />);

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
    expect(screen.getByText("Wednesday")).toBeInTheDocument();
    expect(screen.getByText("Thursday")).toBeInTheDocument();
    expect(screen.getByText("Friday")).toBeInTheDocument();
    expect(screen.getByText("Saturday")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
  });

  it("renders placeholders for empty values", () => {
    const emptyBusiness = {
      ...mockBusiness,
      address: "",
      city: "",
      landmarks: "",
      phone: "",
    };

    render(<BusinessInfoForm business={emptyBusiness} />);

    expect(screen.getByText("Enter address")).toBeInTheDocument();
    expect(screen.getByText("Enter city or district")).toBeInTheDocument();
    expect(screen.getByText("Near...")).toBeInTheDocument();
    expect(screen.getByText("Enter phone number")).toBeInTheDocument();
  });

  it("handles null opening_hours", () => {
    const businessWithNullHours = {
      ...mockBusiness,
      opening_hours: null,
    };

    render(<BusinessInfoForm business={businessWithNullHours} />);

    // Should still render without crashing
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });
});
