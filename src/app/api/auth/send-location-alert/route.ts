import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{
			ok: false,
			message: "Location alert endpoint is disabled.",
		},
		{ status: 410 }
	);
}

