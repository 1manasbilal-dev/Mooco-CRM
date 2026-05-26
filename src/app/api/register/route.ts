import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, password)" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // If this is the first user in the database, make them ADMIN, otherwise USER
    const usersCount = await db.user.count();
    const role = usersCount === 0 ? "ADMIN" : "USER";

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
