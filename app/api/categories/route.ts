import { NextResponse } from "next/server";
import { FLOORING_PRODUCT } from "@/data/template";

const categories = [
  {id: 1, name: "cate 1", slug: "cate-1", description: "description 1"},
  {id: 2, name: "cate 2", slug: "cate-2", description: "description 2"}
  ];
//for category name (vinyl, carpet...)
export async function GET() {
  return NextResponse.json(FLOORING_PRODUCT);
  }
