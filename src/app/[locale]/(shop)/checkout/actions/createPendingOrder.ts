"use server";

export type CreateOrderInput = {
  full_name: string;
  phone: string;
  address: string;
};

export async function createPendingOrder(_input: CreateOrderInput) {
  console.log("Creating pending order with input:", _input);
  // Simulate order creation and return a mock order ID
  return { orderId: crypto.randomUUID() };
}
