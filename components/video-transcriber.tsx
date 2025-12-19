"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { transcribeVideo } from "@/app/actions/transcribe"
import { Spinner } from "@/components/ui/spinner"

export function VideoTranscriber() {
  const [file, setFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string>("")
  const [videoUrl, setVideoUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 25MB for Whisper API)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("File size must be less than 25MB")
        return
      }

      setFile(selectedFile)
      setError("")
      setTranscription("")

      // Create video preview URL
      const url = URL.createObjectURL(selectedFile)
      setVideoUrl(url)
    }
  }

  const handleTranscribe = async () => {
    if (!file) return

    setIsTranscribing(true)
    setError("")
    setTranscription("")

    try {
      const formData = new FormData()
      formData.append("video", file)

      const result = await transcribeVideo(formData)

      if (result.success && result.transcription) {
        setTranscription(result.transcription)
      } else {
        setError(result.error || "Failed to transcribe video")
      }
    } catch (err) {
      setError("An error occurred during transcription")
      console.error(err)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleCopyTranscription = () => {
    navigator.clipboard.writeText(transcription)
  }

  const handleDownloadTranscription = () => {
    const blob = new Blob([transcription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcript-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setTranscription("")
    setError("")
    setVideoUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="space-y-6">
          {!file ? (
            <div
              className="relative cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-colors hover:border-accent hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Video</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports MP4, MOV, AVI, WebM (max 25MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {videoUrl && <video src={videoUrl} controls className="w-full rounded-lg mb-4 max-h-64" />}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 flex-shrink-0">
                        <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} disabled={isTranscribing}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              <Button onClick={handleTranscribe} disabled={isTranscribing} className="w-full" size="lg">
                {isTranscribing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Start Transcription
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {transcription && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Transcription</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyTranscription}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadTranscription}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{transcription}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
