import { useState } from "react";

function NameModal({ onSave }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45">
      <div className="w-[300px] rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-800">Welcome to Verde</h2>
        <p className="mt-1 text-sm text-zinc-500">Set your display name to start earning eco coins.</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter display name"
          className="mt-4 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-verde-500"
        />
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          className="mt-3 w-full rounded-xl bg-verde-600 py-2 text-sm font-semibold text-white"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default NameModal;
