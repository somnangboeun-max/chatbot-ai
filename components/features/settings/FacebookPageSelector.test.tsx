/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FacebookPageSelector } from "./FacebookPageSelector";

describe("FacebookPageSelector", () => {
  const mockPages = [
    {
      id: "page-1",
      name: "Business Page 1",
      access_token: "token-1",
      picture: { data: { url: "https://example.com/pic1.jpg" } },
    },
    {
      id: "page-2",
      name: "Business Page 2",
      access_token: "token-2",
      picture: { data: { url: "https://example.com/pic2.jpg" } },
    },
  ];

  const defaultProps = {
    pages: mockPages,
    connectingPageId: null,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all pages", () => {
    render(<FacebookPageSelector {...defaultProps} />);

    expect(screen.getByText("Business Page 1")).toBeInTheDocument();
    expect(screen.getByText("Business Page 2")).toBeInTheDocument();
  });

  it("renders page IDs", () => {
    render(<FacebookPageSelector {...defaultProps} />);

    expect(screen.getByText("ID: page-1")).toBeInTheDocument();
    expect(screen.getByText("ID: page-2")).toBeInTheDocument();
  });

  it("renders connect buttons for each page", () => {
    render(<FacebookPageSelector {...defaultProps} />);

    const connectButtons = screen.getAllByText("Connect");
    expect(connectButtons).toHaveLength(2);
  });

  it("calls onSelect when connect button is clicked", () => {
    const onSelect = vi.fn();
    render(<FacebookPageSelector {...defaultProps} onSelect={onSelect} />);

    const connectButtons = screen.getAllByText("Connect");
    fireEvent.click(connectButtons[0]);

    expect(onSelect).toHaveBeenCalledWith("page-1");
  });

  it("shows loading state on connecting page", () => {
    render(
      <FacebookPageSelector {...defaultProps} connectingPageId="page-1" />
    );

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("disables all buttons while connecting", () => {
    render(
      <FacebookPageSelector {...defaultProps} connectingPageId="page-1" />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("renders header text", () => {
    render(<FacebookPageSelector {...defaultProps} />);

    expect(screen.getByText("Select a Page to Connect")).toBeInTheDocument();
    expect(
      screen.getByText(/Choose which Facebook Page will receive/)
    ).toBeInTheDocument();
  });

  it("renders avatar fallback when no picture", () => {
    const pagesWithoutPicture = [
      {
        id: "page-3",
        name: "No Picture Page",
        access_token: "token-3",
      },
    ];

    render(
      <FacebookPageSelector
        {...defaultProps}
        pages={pagesWithoutPicture}
      />
    );

    // Avatar fallback shows first letter
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("has accessible aria-labels on connect buttons", () => {
    render(<FacebookPageSelector {...defaultProps} />);

    expect(screen.getByLabelText("Connect Business Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Connect Business Page 2")).toBeInTheDocument();
  });

  it("updates aria-label when connecting", () => {
    render(
      <FacebookPageSelector {...defaultProps} connectingPageId="page-1" />
    );

    expect(screen.getByLabelText("Connecting to Business Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Connect Business Page 2")).toBeInTheDocument();
  });
});
