import axios from "axios";

const PAYSTACK_BASE = "https://api.paystack.co";

const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
  "Content-Type": "application/json",
});

export interface PaystackSubaccountInfo {
  provider: string; // bank code
  accountNumber: string;
}

export const createPaystackSubaccount = async (
  fullName: string,
  paymentInfo: PaystackSubaccountInfo
): Promise<string> => {
  const response = await axios.post(
    `${PAYSTACK_BASE}/subaccount`,
    {
      business_name: fullName,
      account_number: paymentInfo.accountNumber,
      bank_code: paymentInfo.provider,
      percentage_charge: 10,
    },
    { headers: paystackHeaders() }
  );
  return response.data.data.subaccount_code as string;
};

export const initializeTransaction = async (email: string, amountInPesewas: number, reference: string) => {
  const response = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount: amountInPesewas,
      callback_url: process.env.CLIENT_SIDE_URL,
      reference,
    },
    { headers: paystackHeaders() }
  );
  return response.data.data as { authorization_url: string };
};

export const verifyTransaction = async (reference: string) => {
  const response = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: paystackHeaders(),
  });
  return response.data.data;
};

export interface PaystackBank {
  name: string;
  code: string;
  type: string;
}

export const listBanks = async (): Promise<PaystackBank[]> => {
  const response = await axios.get(`${PAYSTACK_BASE}/bank`, {
    headers: paystackHeaders(),
    params: { currency: "GHS" },
  });
  return (response.data.data as PaystackBank[]).map(({ name, code, type }) => ({ name, code, type }));
};
