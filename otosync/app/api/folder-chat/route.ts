import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    message: "Folder AI chat is coming soon. Your items are being prepared for AI context.",
    coming_soon: true,
  })
}
