import { NextRequest, NextResponse } from "next/server"; 
import { getCurrentAdmin } from "../controllers/authController";
import { AdminProfile } from "../models/adminModel";

// Generic over the dynamic-route param shape so handlers can read params like
// `{ id: string }` or `{ id: string; sheetId: string }`. Handlers that don't
// need params can ignore the third argument.
type RouteContext<P = Record<string, string>> = { params: Promise<P> };

export function withAdminAuth<P = Record<string, string>>(
    handler: (
        req: NextRequest,
        admin: AdminProfile,
        context: RouteContext<P>
    ) => Promise<NextResponse>
) {
    return async (
        req: NextRequest,
        context: RouteContext<P>
    ): Promise<NextResponse> => {
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

        return handler(req, admin, context);
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
