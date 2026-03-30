import { NextRequest, NextResponse } from "next/server"; 
import { getCurrentAdmin } from "../controllers/authController";
import { AdminProfile } from "../models/adminModel";

export function withAdminAuth(
    handler: (
        req: NextRequest,
        admin: AdminProfile
    ) => Promise<NextResponse> 
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        // step 1 - extract bearer token 
        const authHeader = req.headers.get("authorization"); 

        if (!authHeader || !authHeader.startsWith("Bearer ")){
            return NextResponse.json(
                { error: "Missing auth token" }, 
                { status: 401 }
            );
        }

    const token = authHeader.split(" ")[1];
    
    try {
        const admin = await getCurrentAdmin(token); 

        return handler(req, admin); 
    } catch (error: any){
        return NextResponse.json(
            { error : error.message || "Authentification failed" },
            { status: error.status || 401 } 
        );
    }

    };
}

export function requireRole (
    role: "admin" | "super_admin", 
    handler: (req: NextRequest, admin: AdminProfile) => Promise<NextResponse> 
) {
    return async (
        req: NextRequest, 
        admin: AdminProfile
    ): Promise<NextResponse> => { 
        if (role == "super_admin" && admin.role !== "super_admin") {
            return NextResponse.json(
                {error: "forbidden: super admin access required"}, 
                { status: 403 }
            );
        }

        return handler(req, admin);
    };


    }
