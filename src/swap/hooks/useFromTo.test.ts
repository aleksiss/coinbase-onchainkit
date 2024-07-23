import { describe, expect, it, vi } from "vitest";
import { useFromTo } from "./useFromTo";
import { renderHook } from "@testing-library/react";
import { useSwapBalances } from "./useSwapBalances";


vi.mock("./useSwapBalances", () => ({
  useSwapBalances: vi.fn(),
}));

vi.mock("../../internal/hooks/useValue", () => ({
  useValue: vi.fn(),
}));

describe("useFromTo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct values", () => {
    (useSwapBalances as vi.Mock).mockReturnValue({
      fromBalanceString: "100",
      fromTokenBalanceError: null,
      toBalanceString: "200",
      toTokenBalanceError: null,
    });

    const { result } = renderHook(() => useFromTo("0x123"));

    expect(result.current.from).toEqual({
      balance: "100",
      amount: "",
      setAmount: expect.any(Function),
      token: undefined,
      setToken: expect.any(Function),
      loading: false,
      setLoading: expect.any(Function),
      error: null,
    });

    expect(result.current.to).toEqual({
      balance: "200",
      amount: "",
      setAmount: expect.any(Function),
      token: undefined,
      setToken: expect.any(Function),
      loading: false,
      setLoading: expect.any(Function),
      error: null,
    });
  });
});
