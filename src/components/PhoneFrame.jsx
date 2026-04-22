function PhoneFrame({ title, children }) {
  return (
    <section className="mx-auto w-full min-h-screen sm:w-[316px] sm:min-h-0 sm:rounded-[2px] sm:bg-[#16181c] sm:p-3 sm:shadow-2xl">
      <div className="min-h-screen overflow-hidden sm:min-h-0 sm:border sm:border-zinc-200 bg-[#f8faf9]">
        {title && <header className="px-4 pt-3 pb-2 text-[36px] leading-none font-semibold tracking-[-0.02em] text-zinc-700">{title}</header>}
        {children}
      </div>
    </section>
  );
}

export default PhoneFrame;
