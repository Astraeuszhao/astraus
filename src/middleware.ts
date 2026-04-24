import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

function authSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const secret = authSecret();

  if (!secret) {
    console.error("middleware: set NEXTAUTH_SECRET or JWT_SECRET in .env");
    return new NextResponse("服务器配置错误：请在 .env 中设置 NEXTAUTH_SECRET 或 JWT_SECRET", {
      status: 500,
    });
  }

  if (PUBLIC_PATHS.has(pathname)) {
    const token = await getToken({ req, secret });
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
