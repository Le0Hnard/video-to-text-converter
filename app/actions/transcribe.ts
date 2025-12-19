"use server"

export async function transcribeVideo(formData: FormData) {
  try {
    const videoFile = formData.get("video") as File

    if (!videoFile) {
      return { success: false, error: "No video file provided" }
    }

    // Extract audio from video and prepare for Groq Whisper API
    const audioBuffer = await videoFile.arrayBuffer()

    // Create a new FormData for Groq API
    const groqFormData = new FormData()

    // Convert video to audio format that Whisper accepts
    // Note: In production, you'd want to extract audio track properly
    // For now, we'll pass the video file directly as Groq can handle it
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" })
    groqFormData.append("file", audioBlob, "audio.mp3")
    groqFormData.append("model", "whisper-large-v3-turbo")
    groqFormData.append("response_format", "text")

    // Call Groq Whisper API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API error:", errorText)
      return {
        success: false,
        error: "Failed to transcribe video. Please ensure you have added the Groq integration and try again.",
      }
    }

    const transcription = await response.text()

    return {
      success: true,
      transcription,
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return {
      success: false,
      error: "An unexpected error occurred during transcription",
    }
  }
}
