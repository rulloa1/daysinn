import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignIn } from "@/components/staff/sign-in";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Sign In — Days Inn Hub" },
      {
        name: "description",
        content: "Sign in with your staff account to reach the Days Inn Hub operations portal.",
      },
      { property: "og:title", content: "Staff Sign In — Days Inn Hub" },
      {
        property: "og:description",
        content: "Secure sign-in for Days Inn Hub staff and managers.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/staff" });
  },
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void navigate({ to: "/staff", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return <SignIn />;
}
