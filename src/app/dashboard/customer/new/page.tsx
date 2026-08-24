"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type FormState = {
  pickupAddress: string;
  pickupPincode: string;
  dropAddress: string;
  dropPincode: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  actualWeightKg: string;
  orderType: "B2C" | "B2B";
  paymentType: "PREPAID" | "COD";
};

const EMPTY: FormState = {
  pickupAddress: "",
  pickupPincode: "",
  dropAddress: "",
  dropPincode: "",
  lengthCm: "",
  breadthCm: "",
  heightCm: "",
  actualWeightKg: "",
  orderType: "B2C",
  paymentType: "PREPAID",
};

type Quote = {
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  baseFee: string;
  weightCharge: string;
  codSurcharge: string;
  totalCharge: string;
  zoneRelation: "INTRA" | "INTER";
};

function numericPayload(form: FormState) {
  return {
    pickupPincode: form.pickupPincode,
    dropPincode: form.dropPincode,
    lengthCm: Number(form.lengthCm),
    breadthCm: Number(form.breadthCm),
    heightCm: Number(form.heightCm),
    actualWeightKg: Number(form.actualWeightKg),
    orderType: form.orderType,
    paymentType: form.paymentType,
  };
}

export default function NewOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setQuote(null);
  }

  async function getQuote() {
    setError(null);
    setQuoting(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(numericPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not calculate charge");
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate charge");
    } finally {
      setQuoting(false);
    }
  }

  async function placeOrder() {
    setError(null);
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...numericPayload(form),
          pickupAddress: form.pickupAddress,
          dropAddress: form.dropAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place order");
      router.push(`/dashboard/customer/orders/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-xl font-bold text-ink">New Order</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pickup &amp; Drop</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Pickup address</Label>
              <Textarea
                required
                value={form.pickupAddress}
                onChange={(e) => update("pickupAddress", e.target.value)}
              />
            </div>
            <div>
              <Label>Pickup pincode</Label>
              <Input
                required
                mono
                value={form.pickupPincode}
                onChange={(e) => update("pickupPincode", e.target.value)}
                placeholder="e.g. 560001"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Drop address</Label>
              <Textarea
                required
                value={form.dropAddress}
                onChange={(e) => update("dropAddress", e.target.value)}
              />
            </div>
            <div>
              <Label>Drop pincode</Label>
              <Input
                required
                mono
                value={form.dropPincode}
                onChange={(e) => update("dropPincode", e.target.value)}
                placeholder="e.g. 560034"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package</CardTitle>
            <CardDescription>Dimensions in cm, weight in kg</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label>Length</Label>
              <Input
                required
                mono
                type="number"
                min="0"
                step="0.1"
                value={form.lengthCm}
                onChange={(e) => update("lengthCm", e.target.value)}
              />
            </div>
            <div>
              <Label>Breadth</Label>
              <Input
                required
                mono
                type="number"
                min="0"
                step="0.1"
                value={form.breadthCm}
                onChange={(e) => update("breadthCm", e.target.value)}
              />
            </div>
            <div>
              <Label>Height</Label>
              <Input
                required
                mono
                type="number"
                min="0"
                step="0.1"
                value={form.heightCm}
                onChange={(e) => update("heightCm", e.target.value)}
              />
            </div>
            <div>
              <Label>Actual weight</Label>
              <Input
                required
                mono
                type="number"
                min="0"
                step="0.01"
                value={form.actualWeightKg}
                onChange={(e) => update("actualWeightKg", e.target.value)}
              />
            </div>
            <div>
              <Label>Order type</Label>
              <Select
                value={form.orderType}
                onChange={(e) => update("orderType", e.target.value as FormState["orderType"])}
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </Select>
            </div>
            <div>
              <Label>Payment</Label>
              <Select
                value={form.paymentType}
                onChange={(e) => update("paymentType", e.target.value as FormState["paymentType"])}
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COD">Cash on Delivery</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        {!quote ? (
          <Button size="lg" onClick={getQuote} disabled={quoting}>
            {quoting ? "Calculating..." : "Calculate Charge"}
          </Button>
        ) : (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
              <div>
                <CardTitle>Charge Breakdown</CardTitle>
                <CardDescription>
                  Chargeable weight {quote.chargeableWeightKg.toFixed(2)}kg (volumetric{" "}
                  {quote.volumetricWeightKg.toFixed(2)}kg)
                </CardDescription>
              </div>
              <span className="ink-stamp text-route bg-route-soft">
                {quote.zoneRelation === "INTRA" ? "Intra-zone" : "Inter-zone"}
              </span>
            </div>
            <CardContent className="font-manifest space-y-1 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="font-body text-ink-soft">Base fee</span>
                <span>{formatCurrency(quote.baseFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-ink-soft">Weight charge</span>
                <span>{formatCurrency(quote.weightCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-ink-soft">COD surcharge</span>
                <span>{formatCurrency(quote.codSurcharge)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span className="font-body text-ink">Total</span>
                <span>{formatCurrency(quote.totalCharge)}</span>
              </div>
              <Button size="lg" className="mt-4 w-full" onClick={placeOrder} disabled={placing}>
                {placing ? "Placing order..." : "Confirm & Place Order"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
