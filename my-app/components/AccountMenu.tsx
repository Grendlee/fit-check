"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserInfo = {
  email?: string | null;
};

export default function AccountMenu() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser({ email: data.user?.email });
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser({ email: session?.user?.email ?? null });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.replace("/auth/login");
  };

  if (!user?.email) return null;

  const label =
    user.email.length > 24 ? `${user.email.slice(0, 24)}…` : user.email;

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center gap-2
          rounded-full
          border border-zinc-900
          bg-[#f4eadf]
          px-4 py-2
          text-sm
          shadow-[2px_2px_0_#00000012]
          hover:bg-[#eee2d5]
          transition
        "
      >
        <span className="h-2 w-2 rounded-full bg-zinc-900" />
        <span className="max-w-[180px] truncate [font-family:ui-serif,Georgia,serif]">
          {label}
        </span>
        <span className="text-zinc-700">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-52
            overflow-hidden
            rounded-2xl
            border border-zinc-900
            bg-[#f4eadf]
            shadow-[4px_4px_0_#00000015]
          "
        >
          <button
            onClick={() => {
              setOpen(false);
              router.push("/account");
            }}
            className="
              w-full px-4 py-3
              text-left text-sm
              hover:bg-[#eee2d5]
              transition
              [font-family:ui-serif,Georgia,serif]
            "
          >
            Account
          </button>

          <div className="h-px bg-zinc-900/20" />

          <button
            onClick={handleSignOut}
            className="
              w-full px-4 py-3
              text-left text-sm
              text-zinc-700
              hover:bg-[#eee2d5]
              transition
              [font-family:ui-serif,Georgia,serif]
            "
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
