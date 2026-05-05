import { NextResponse } from "next/server"; 
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { logoutAdmin } from "@/src/controllers/authController";

export const POST = withAdminAuth(async (req, admin) => {
    try {
        await logoutAdmin(); 
        return NextResponse.json({ message : "Logged out Successfully" }); 
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Logout failed" }, 
            { status: error.status || 500}
        );
    }
});