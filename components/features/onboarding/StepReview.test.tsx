/**
 * @vitest-environment happy-dom
 * Component tests for StepReview
 * Story: 2.3 Onboarding Review and Completion
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StepReview } from "./StepReview";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock server actions
const mockCompleteOnboarding = vi.fn();
vi.mock("@/actions/onboarding", () => ({
  completeOnboarding: () => mockCompleteOnboarding(),
}));

// Mock OnboardingContext
const mockOnboardingData = {
  name: "Test Business",
  opening_hours: {
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { closed: true },
    sunday: { closed: true },
  },
  address: "123 Test Street",
  city: "Phnom Penh",
  landmarks: "Near Central Market",
  phone: "+855 12 345 678",
  products: [
    { id: "1", name: "Lok Lak", price: 5.0, currency: "USD" as const },
    { id: "2", name: "Fried Rice", price: 12000, currency: "KHR" as const },
  ],
};

vi.mock("./OnboardingContext", () => ({
  useOnboarding: () => ({
    data: mockOnboardingData,
  }),
}));

// Mock validation utilities
vi.mock("@/lib/validations/onboarding", () => ({
  formatPrice: (price: number, currency: string) =>
    currency === "USD" ? `$${price.toFixed(2)}` : `${price.toLocaleString()}៛`,
  DAYS_OF_WEEK: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ],
  formatTime12Hour: (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  },
}));

describe("StepReview Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteOnboarding.mockResolvedValue({ success: true, data: undefined });
  });

  it("renders all business information sections", () => {
    render(<StepReview />);

    // Check section headers
    expect(screen.getByText("Business Name")).toBeInTheDocument();
    expect(screen.getByText("Business Hours")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Contact Phone")).toBeInTheDocument();
    expect(screen.getByText("Products & Prices")).toBeInTheDocument();
  });

  it("displays business name from context", () => {
    render(<StepReview />);
    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });

  it("displays business address, city, and landmarks", () => {
    render(<StepReview />);
    expect(screen.getByText("123 Test Street")).toBeInTheDocument();
    expect(screen.getByText("Phnom Penh")).toBeInTheDocument();
    expect(screen.getByText("Near Central Market")).toBeInTheDocument();
  });

  it("displays contact phone number", () => {
    render(<StepReview />);
    expect(screen.getByText("+855 12 345 678")).toBeInTheDocument();
  });

  it("displays products with formatted prices", () => {
    render(<StepReview />);
    expect(screen.getByText("Lok Lak")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("Fried Rice")).toBeInTheDocument();
    expect(screen.getByText("12,000៛")).toBeInTheDocument();
  });

  it("shows edit buttons for each section with 44px touch targets", () => {
    render(<StepReview />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons).toHaveLength(5); // One for each section

    // Verify touch target size
    editButtons.forEach((button) => {
      expect(button).toHaveClass("min-h-[44px]");
      expect(button).toHaveClass("min-w-[44px]");
    });
  });

  it("navigates to step 1 with returnTo param when editing business name", () => {
    render(<StepReview />);

    const editButton = screen.getByRole("button", { name: /edit business name/i });
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/1?returnTo=review");
  });

  it("navigates to step 2 with returnTo param when editing business hours", () => {
    render(<StepReview />);

    const editButton = screen.getByRole("button", { name: /edit business hours/i });
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/2?returnTo=review");
  });

  it("navigates to step 3 with returnTo param when editing location", () => {
    render(<StepReview />);

    const editButton = screen.getByRole("button", { name: /edit location/i });
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/3?returnTo=review");
  });

  it("navigates to step 4 with returnTo param when editing contact phone", () => {
    render(<StepReview />);

    const editButton = screen.getByRole("button", { name: /edit contact phone/i });
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/4?returnTo=review");
  });

  it("navigates to step 5 with returnTo param when editing products", () => {
    render(<StepReview />);

    const editButton = screen.getByRole("button", { name: /edit products/i });
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/5?returnTo=review");
  });

  it("shows Activate Bot button", () => {
    render(<StepReview />);

    const activateButton = screen.getByRole("button", { name: /activate bot/i });
    expect(activateButton).toBeInTheDocument();
  });

  it("calls completeOnboarding and navigates to celebration on success", async () => {
    render(<StepReview />);

    const activateButton = screen.getByRole("button", { name: /activate bot/i });
    fireEvent.click(activateButton);

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/onboarding/celebration");
    });
  });

  it("shows error toast when completeOnboarding fails", async () => {
    const { toast } = await import("sonner");
    mockCompleteOnboarding.mockResolvedValue({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to complete" },
    });

    render(<StepReview />);

    const activateButton = screen.getByRole("button", { name: /activate bot/i });
    fireEvent.click(activateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to complete");
    });
  });

  it("disables button and shows loading text during submission", async () => {
    // Delay the promise to capture the loading state
    mockCompleteOnboarding.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<StepReview />);

    const activateButton = screen.getByRole("button", { name: /activate bot/i });
    fireEvent.click(activateButton);

    // Button should be disabled and show loading text
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /activating/i })).toBeDisabled();
    });
  });

  it("displays business hours with open/closed status", () => {
    render(<StepReview />);

    // Saturday and Sunday should show "Closed"
    const closedTexts = screen.getAllByText("Closed");
    expect(closedTexts.length).toBeGreaterThanOrEqual(2);
  });
});
