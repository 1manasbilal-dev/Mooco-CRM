import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    // Protect dashboard home
    "/",
    // Protect settings page
    "/settings/:path*",
    // Protect dashboard APIs (exclude next-auth endpoints and register endpoint)
    "/api/((?!auth|register).*)",
  ],
};
