import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processHtmlContent } from "@/app/utils/processHtmlContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return new NextResponse(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    try {
      const textContent = await processHtmlContent(url);

      if (!textContent) {
        console.error("No text content extracted from URL:", url);
        return new NextResponse(
          JSON.stringify({
            error: "Failed to extract text content",
            details: "The URL returned no text content",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new NextResponse(JSON.stringify({ textContent }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error processing content:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to scrape the text content",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Invalid request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
