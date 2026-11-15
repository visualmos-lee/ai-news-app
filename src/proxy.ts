import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 페이지는 리다이렉트 없이 로그인 모달로 처리하고(AuthGate),
// API 라우트는 인증되지 않은 요청을 401로 막는다.
const isProtectedApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
