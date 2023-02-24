import { render, screen } from "@testing-library/react";
import React from "react";
import Swap2 from ".";

jest.mock("./Navbar");
jest.mock("./Form");
jest.mock("./History");

describe("Swap Page", () => {
  it("renders the swap page", () => {
    render(<Swap2 />);

    expect(screen.getByText("Swap")).toBeTruthy();
  });
});
