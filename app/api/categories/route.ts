import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();
export async function GET() {
    const categories = await prisma.category.findMany();
          
    return NextResponse.json(categories);
  
  }
