import { NextResponse } from "next/server";


export async function GET() {
  
  const categories: unknown[] = [];
  
  return NextResponse.json(categories);
}
