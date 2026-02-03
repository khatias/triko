// src/app/[locale]/(shop)/checkout/CheckoutFormClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPendingOrder, type CreateOrderInput } from "../actions/createPendingOrder";

type AddressPrefill = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  is_default_shipping: boolean;
  created_at: string;
};

type Props = {
  locale: string;
  savedAddresses: AddressPrefill[];
};

type SubmitLike = {
  preventDefault: () => void;
  currentTarget: HTMLFormElement;
};

function required(v: string) {
  return v.trim().length > 0;
}

export default function CheckoutFormClient({ locale, savedAddresses }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contact fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Address mode
  const hasSaved = savedAddresses.length > 0;
  const [useSaved, setUseSaved] = useState(false);
  const defaultId = useMemo(() => {
    const def = savedAddresses.find((a) => a.is_default_shipping);
    return def?.id ?? savedAddresses[0]?.id ?? "";
  }, [savedAddresses]);

  const [selectedAddressId, setSelectedAddressId] = useState(defaultId);

  // Address fields (controlled)
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  // Keep selectedAddressId in sync if addresses load / change
  useEffect(() => {
    if (!hasSaved) return;
    if (!selectedAddressId) setSelectedAddressId(defaultId);
  }, [hasSaved, defaultId, selectedAddressId]);

  // When user toggles "use saved"
  useEffect(() => {
    if (!useSaved) {
      // You asked: when not using saved, keep it empty
      setLine1("");
      setLine2("");
      setCity("");
      setRegion("");
      return;
    }

    // Using saved: apply selected (or default)
    const found =
      savedAddresses.find((a) => a.id === selectedAddressId) ??
      savedAddresses.find((a) => a.id === defaultId) ??
      savedAddresses[0];

    if (!found) return;

    setSelectedAddressId(found.id);
    setLine1(found.line1);
    setLine2(found.line2 ?? "");
    setCity(found.city);
    setRegion(found.region ?? "");
  }, [useSaved, selectedAddressId, savedAddresses, defaultId]);

  const savedOptions = useMemo(() => {
    return savedAddresses.map((a) => {
      const label =
        (a.is_default_shipping ? "Default — " : "") +
        [a.line1, a.city, a.region].filter(Boolean).join(", ");
      return { id: a.id, label };
    });
  }, [savedAddresses]);

  const onSubmit = async (e: SubmitLike) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (!required(fullName)) {
      setError("Please enter your full name.");
      return;
    }
    if (!required(phone)) {
      setError("Please enter your phone number.");
      return;
    }
    if (!required(line1) || !required(city)) {
      setError("Please enter your delivery address (line1 and city are required).");
      return;
    }

    const addressText =
      [line1, line2].filter((x) => x.trim().length > 0).join(", ") +
      `, ${city}` +
      (region.trim().length > 0 ? `, ${region}` : "");

    const input: CreateOrderInput = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: addressText,
    };

    setLoading(true);
    try {
      const { orderId } = await createPendingOrder(input);
      router.push(`/${locale}/orders/${orderId}`); // placeholder; we'll implement real page next
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium">Contact</h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              className="mt-1 w-full rounded-xl border p-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              className="mt-1 w-full rounded-xl border p-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium">Delivery address</h2>

        {hasSaved ? (
          <div className="mt-3 rounded-xl border p-3 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={useSaved}
                onChange={(e) => setUseSaved(e.target.checked)}
                disabled={loading}
              />
              <div>
                <div className="font-medium">Use a saved address</div>
                <div className="opacity-70">Choose from your saved shipping addresses</div>
              </div>
            </label>

            {useSaved ? (
              <select
                className="w-full rounded-xl border p-2"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                disabled={loading}
              >
                {savedOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm opacity-70">
            No saved address found. Please enter a new one.
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm" htmlFor="line1">
              Address line 1
            </label>
            <input
              id="line1"
              name="line1"
              className="mt-1 w-full rounded-xl border p-2"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Street, building, apartment"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm" htmlFor="line2">
              Address line 2
            </label>
            <input
              id="line2"
              name="line2"
              className="mt-1 w-full rounded-xl border p-2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Optional"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              className="mt-1 w-full rounded-xl border p-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm" htmlFor="region">
              Region
            </label>
            <input
              id="region"
              name="region"
              className="mt-1 w-full rounded-xl border p-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Optional"
              disabled={loading}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl border px-4 py-2"
            disabled={loading}
          >
            {loading ? "Creating order..." : "Place order"}
          </button>

          <p className="text-xs opacity-70">
            Next: implement real order creation (orders + order_items), then connect Bank of Georgia hosted payment.
          </p>
        </div>
      </section>
    </form>
  );
}
