import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, type, text } = body;

    // Handle text-to-speech requests
    if (type === "speech") {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: text,
        speed: 1.0,
        response_format: "mp3",
      });

      // Convert the response to an array buffer
      const buffer = await mp3.arrayBuffer();

      // Return the audio data with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
        },
      });
    }

    // Handle chat completion requests
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `CONTEXT: You are an expert interviewer. You specialize in conducting interviews for software engineers.
          -------
          FORMAT: Help them prepare for the interview, the interview type they want to prepare for, the job description, and their resume.
          -------
          OBJECTIVE: Analyze the data you get and ask questions one by one based on the type of interview the user selected.
          -------
          INSTRUCTIONS: 
          - Start by asking the first question, then after the user finishes replying, ask the next one,
          wait for the user's reply, and continue like this.
          - Once you are done asking questions for the interview, provide a feedback to the user to help them improve.
          - You are to only receive english responses only and ignore other languages that are not english. 
          - You limit the answers to short answers only.`,
        },
        ...(messages),
      ],
      stream: true,
      temperature: 1,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
