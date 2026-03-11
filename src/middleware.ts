import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback"];
const ONBOARDING_PATH = "/onboarding";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 靜態資源與公開路徑跳過
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登入 → 導向 /login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 驗證 tenant_id 存在於 app_metadata
  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return NextResponse.json(
      { error: "No tenant assigned to this user" },
      { status: 403 }
    );
  }

  // 檢查是否已完善個人資料
  const profileCompleted = user.user_metadata?.profile_completed;

  if (!profileCompleted && !pathname.startsWith(ONBOARDING_PATH)) {
    // 尚未完善資料 → 導向 /onboarding
    return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
  }

  if (profileCompleted && pathname.startsWith(ONBOARDING_PATH)) {
    // 已完成但又訪問 onboarding → 導回 dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 注入 tenant_id 到 request header 供 Server Components 使用
  response.headers.set("x-tenant-id", tenantId);
  response.headers.set("x-user-id", user.id);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|auth).*)",
  ],
};
