import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { isAdminEmail } from "@/lib/admin-emails";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No Supabase configured yet — public pages remain in demo mode and the
  // admin login page renders its setup notice.
  if (!supabaseUrl || !supabaseKey) {
    if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
      return NextResponse.next();
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  if (user && isAdminEmail(user.email) && pathname.startsWith("/admin")) {
    const { data } = await supabase.rpc("grainbuds_is_staff");
    isStaff = data === true;
  }

  if ((!user || !isStaff) && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isStaff && pathname === "/admin/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  // Refresh the Supabase cookie on public pages too so customer OTP sessions
  // remain signed in. Static assets never need auth work.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4)$).*)",
  ],
};
