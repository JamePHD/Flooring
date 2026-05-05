import { NextRequest, NextResponse } from "next/server"; 
import { loginAdmin } from "@/src/controllers/authController";

export async function POST(req: NextRequest){
    try {
        const body = await req.json(); 
        const { email, password } = body; 

        const result = await loginAdmin({ email , password }); 

        return NextResponse.json({
            user: {
                id: result.user.id, 
                email: result.user.email, 
                full_name: result.user.full_name, 
                role: result.user.role, 
            }, 

            access_token: result.access_token,
            refresh_token: result.refresh_token,
        });
    } catch (error: any){
        return NextResponse.json(
            { error: error.message || "Login failed" }, 
            { status: error.status || 500 }
        );
    }
}