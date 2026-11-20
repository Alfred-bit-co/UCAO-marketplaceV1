import { describe, expect, it } from "vitest";
import { isFedaPayCheckoutUrl } from "@/lib/subscriptions";

describe("isFedaPayCheckoutUrl", () => {
  it("accepte les pages de paiement FedaPay en https", () => {
    expect(isFedaPayCheckoutUrl("https://process.fedapay.com/abc123")).toBe(true);
    expect(isFedaPayCheckoutUrl("https://sandbox-process.fedapay.com/abc123")).toBe(true);
  });

  it("refuse tout autre site, le http et les adresses piégées", () => {
    expect(isFedaPayCheckoutUrl("http://process.fedapay.com/abc")).toBe(false);
    expect(isFedaPayCheckoutUrl("https://fedapay.com.evil.example/abc")).toBe(false);
    expect(isFedaPayCheckoutUrl("https://evilfedapay.com/abc")).toBe(false);
    expect(isFedaPayCheckoutUrl("https://user:pass@process.fedapay.com/abc")).toBe(false);
    expect(isFedaPayCheckoutUrl("javascript:alert(1)")).toBe(false);
    expect(isFedaPayCheckoutUrl(null)).toBe(false);
  });
});
