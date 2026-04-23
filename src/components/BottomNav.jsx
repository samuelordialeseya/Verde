const nav = ["Home", "EcoMissions", "Wallet", "Rankings", "Profile"];

function BottomNav({ active = "Home", onSelect }) {
  const icons = {
    Home: "⌂",
    EcoMissions: "✓",
    Wallet: "▣",
    Rankings: "▥",
    Profile: "◦",
  };

  return (
    <nav className="sticky bottom-0 z-50 grid grid-cols-5 border-t border-zinc-200 bg-white px-1 py-2 text-center text-[10px] text-[#7f8b95]">
      {nav.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect?.(item)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 ${item === active ? "bg-[#e9f9ef] font-semibold text-[#00a15e]" : ""}`}
        >
          <span className="text-[12px] leading-none">{icons[item]}</span>
          <span>{item}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
