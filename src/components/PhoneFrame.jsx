function PhoneFrame({ title, children }) {
  return (
    <section className="mx-auto w-[316px] rounded-[2px] bg-[#16181c] p-3 shadow-2xl">
      <div className="overflow-hidden border border-zinc-200 bg-[#f8faf9]">
        {title && <header className="px-4 pt-3 pb-2 text-[36px] leading-none font-semibold tracking-[-0.02em] text-zinc-700">{title}</header>}
        {children}
      </div>
    </section>
  );
}

export default PhoneFrame;
