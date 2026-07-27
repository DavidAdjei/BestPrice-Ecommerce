import type { Address } from "../types";

interface AddressFormProps {
  address: Address;
  onChange: (address: Address) => void;
}

const fields: { key: keyof Address; label: string }[] = [
  { key: "houseNumber", label: "House number" },
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
  { key: "ghanaPost", label: "Ghana Post GPS address" },
];

export function AddressForm({ address, onChange }: AddressFormProps) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="input-label" htmlFor={`address-${key}`}>{label}</label>
          <input
            id={`address-${key}`}
            value={address[key]}
            onChange={(e) => onChange({ ...address, [key]: e.target.value })}
            className="input"
          />
        </div>
      ))}
    </div>
  );
}
