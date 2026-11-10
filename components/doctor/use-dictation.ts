"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

// Minimal types for the browser's Web Speech API (TypeScript doesn't ship them).
type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }>>
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: SpeechResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as Record<
    string,
    SpeechRecognitionCtor | undefined
  >
  // Chrome, Edge and Safari support it (Chrome/Safari under the webkit prefix). Firefox doesn't.
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const noopSubscribe = () => () => {}

// Browser speech-to-text. While listening, `onText` gets the box's text plus everything said so far.
export function useDictation({
  onText,
  onError,
}: {
  onText: (text: string) => void
  onError: (message: string) => void
}) {
  // false on the server, real answer in the browser, without a hydration mismatch
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionCtor() !== null,
    () => false
  )
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const callbacks = useRef({ onText, onError })
  useEffect(() => {
    callbacks.current = { onText, onError }
  })

  // Stop listening but keep the last words the browser is still processing.
  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // Stop and throw away anything still in flight (used when the note is sent,
  // so late words don't reappear in the box that was just cleared).
  const cancel = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    recognition.onresult = null
    recognition.abort()
  }, [])

  const start = useCallback((existingText: string) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = "en-US"
    recognition.continuous = true // keep listening through pauses until the doctor stops it
    recognition.interimResults = true // show words as they're spoken, not only at the end

    const base = existingText.trim()
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("")
        .trim()
      callbacks.current.onText(
        base && spoken ? `${base} ${spoken}` : base || spoken
      )
    }
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return
      callbacks.current.onError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in the browser to dictate."
          : "Dictation stopped. Please try again."
      )
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  // Stop the microphone if the doctor leaves the page mid-dictation.
  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, start, stop, cancel }
}
