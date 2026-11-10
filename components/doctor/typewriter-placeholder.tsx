"use client"

import { useEffect, useState, type RefObject } from "react"

const TYPE_MS = 45
const DELETE_MS = 20
const HOLD_MS = 1800

// Types each example out, holds it, deletes it, then moves to the next.
// Lives in its own component so the 45 ms ticks don't re-render the whole chat.
// `currentRef` always holds the full example on screen, so Tab can fill it in.
// Only shown on devices with a mouse/trackpad (they have a Tab key); touch devices get a plain placeholder.
export function TypewriterPlaceholder({
  examples,
  currentRef,
}: {
  examples: string[]
  currentRef: RefObject<string>
}) {
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const example = examples[index]

  useEffect(() => {
    currentRef.current = example
  }, [currentRef, example])

  useEffect(() => {
    let delay = deleting ? DELETE_MS : TYPE_MS
    if (!deleting && length === example.length) delay = HOLD_MS

    const t = setTimeout(() => {
      if (!deleting && length < example.length) setLength(length + 1)
      else if (!deleting) setDeleting(true)
      else if (length > 0) setLength(length - 1)
      else {
        setDeleting(false)
        setIndex((i) => (i + 1) % examples.length)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [deleting, example, examples.length, length])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden px-2.5 py-2 text-base text-muted-foreground pointer-fine:block md:text-sm"
    >
      {/* People who turned off animations in their OS see the full text instead */}
      <span className="motion-reduce:hidden">{example.slice(0, length)}</span>
      <span className="hidden motion-reduce:inline">{example}</span>
      <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-muted-foreground" />
      {length > 0 && (
        <kbd className="ml-2 rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground">
          Tab
        </kbd>
      )}
    </div>
  )
}
