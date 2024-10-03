"use server";

import { NextResponse } from "next/server";
import { getSession } from "./lib/utils/utils";
import { Roles } from "./lib/utils/Roles";

const publicRoutes = [
  "/pages/login",
  "/pages/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/schedule-checker",
  "/pages/forgot-password",
  "/pages/reset-password",
];

const developingRoutes = ["/pages/dev-test"];

const SA = {
  ID: Roles.SUPER_ADMIN_ID,
  name: Roles.SUPER_ADMIN,
  accessible_pages: [
    "/pages/SA/create-role",
    "/pages/SA/create-workgroup",
    "/pages/SA/edit-role",
    "/pages/SA/edit-workgroup",
  ],
};

console.log("middle ware A");

export default async function middleware(req) {
  const endpoint = req.nextUrl.pathname;

  // Public and developing routes are accessible by anyone
  if (publicRoutes.includes(endpoint) || developingRoutes.includes(endpoint)) {
    return NextResponse.next();
  }
  console.log("middle ware B");
  // Get user session and role
  const token = await getSession();
  const userRoleId = token?.Role;

  if (!userRoleId) {
    return NextResponse.redirect(new URL("/pages/login", req.nextUrl));
  }
  console.log("middle ware C");

  // Check role-based access
  if (userRoleId !== SA.ID && SA.accessible_pages.includes(endpoint)) {
    return NextResponse.redirect(new URL("/pages/denied", req.nextUrl));
  }

  console.log("middle ware E");
  // Add CORS headers to all API responses
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|api/checker).*)"],
};
