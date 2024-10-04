import { NextResponse } from 'next/server';

let users: { nome: string; email: string; telefone: string; status: string; createdAt: string }[] = [];

// Handle GET requests
export async function GET() {
  return NextResponse.json(users);
}

// Handle POST requests
export async function POST(request: Request) {
  const user = await request.json();
  const newUser = { ...user, createdAt: new Date().toISOString() };
  users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}
