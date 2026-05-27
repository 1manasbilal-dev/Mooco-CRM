import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "User ID / Email is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { name: email }
        ]
      }
    });

    if (!user) {
      // For security, don't reveal if user doesn't exist. Just return success
      return NextResponse.json({
        message: "If the account exists, the password recovery details have been logged to the server console.",
        success: true
      });
    }

    // Print the plain-text password to the server console
    console.log("\n========================================");
    console.log(`🔑 [PASSWORD RECOVERY]`);
    console.log(`User ID / Email: ${user.email}`);
    console.log(`Full Name: ${user.name || "N/A"}`);
    console.log(`Password: ${user.password}`);
    console.log("========================================\n");

    return NextResponse.json({
      message: "If the account exists, the password recovery details have been logged to the server console.",
      success: true
    });
  } catch (error: any) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
