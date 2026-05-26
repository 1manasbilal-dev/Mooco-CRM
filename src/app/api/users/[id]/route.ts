import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const { name, email, password, role } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email is taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use by another user" }, { status: 400 });
    }

    const updateData: any = { name, email, role };
    
    // If password is provided, hash and update it
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User PUT error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent Super Admin from deleting themselves
    const userToDelete = await db.user.findUnique({ where: { id } });
    if (userToDelete?.email === "anasbilal" || userToDelete?.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot delete the Super Admin account" }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
