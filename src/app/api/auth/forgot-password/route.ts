import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email }
    });

    // If user does not exist, return a generic success message to prevent user enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ success: true, message: "If this email exists, a reset link has been generated." });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

    // Save token and expiry in database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    // Log the clickable reset link to the console
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:4000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log("\n=========================================");
    console.log("🔑 PASSWORD RESET REQUEST");
    console.log(`User: ${user.name || "No Name"} (${user.email})`);
    console.log(`Link: ${resetUrl}`);
    console.log("=========================================\n");

    return NextResponse.json({
      success: true,
      message: "If this email exists, a reset link has been generated."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
