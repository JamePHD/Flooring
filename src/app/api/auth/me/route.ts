import { NextRequest, NextResponse } from "next/server"; 
import { withAdminAuth } from "@/src/middleware/authMiddleware";

export const GET = withAdminAuth(async (requestAnimationFrame, admin) => {
    return NextResponse.json({
        id: admin.id, 
        email: admin.email, 
        full_name: admin.full_name, 
        role: admin.role, 
    });
});