// Inside the existing DELETE export, parse the force query param:
export const DELETE = withAdminAuth(async (req: Request, context: RouteContext) => {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  try {
    await handleDeleteCategory(id, force);
    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as { message?: string; status?: number; details?: unknown };
    return NextResponse.json(
      { error: e.message, ...(e.details ? { details: e.details } : {}) },
      { status: e.status || 500 }
    );
  }
});