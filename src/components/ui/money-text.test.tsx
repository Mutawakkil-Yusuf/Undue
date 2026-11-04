// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoneyText } from "./money-text";

describe("MoneyText", () => {
  it("formats a currency amount with tabular figures", () => {
    render(<MoneyText amount={4400} currency="NGN" />);
    const value = screen.getByText(/4,400/);
    expect(value).toHaveClass("font-tabular");
  });

  it("rounds when asked", () => {
    render(<MoneyText amount={1234.56} currency="USD" rounded />);
    expect(screen.getByText("$1,235")).toBeInTheDocument();
  });
});
