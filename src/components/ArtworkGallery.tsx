"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { fill } from "@/lib/dictionaries";
import { useDictionary } from "./DictionaryProvider";

type Props = { images: string[]; title: string; muted?: boolean };

export function ArtworkGallery({ images, title, muted }: Props) {
  const t = useDictionary().artwork;
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = images[index];
  if (!current) return <div className="aspect-[4/5] rounded-sm bg-line" />;

  return (
    <div>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden lg:aspect-square"
        aria-label={t.zoom}
      >
        <Image
          src={current}
          alt={index === 0 ? title : fill(t.viewOf, { title, n: index + 1 })}
          fill
          priority
          quality={90}
          sizes="(min-width: 1024px) 58vw, 100vw"
          className={`object-contain ${muted ? "opacity-80 grayscale-[35%]" : ""}`}
        />
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto" role="tablist" aria-label={t.otherViews}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={fill(t.view, { n: i + 1 })}
              onClick={() => setIndex(i)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-sm bg-white ring-offset-2 transition ${
                i === index ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialog}
        onClick={() => dialog.current?.close()}
        className="m-auto h-dvh max-h-none w-dvw max-w-none cursor-zoom-out bg-black/95 p-0 backdrop:bg-black/80"
      >
        <div className="relative size-full">
          <Image src={current} alt={title} fill quality={90} sizes="100vw" className="object-contain p-4" />
        </div>
        <button
          type="button"
          className="absolute top-4 right-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white"
          onClick={() => dialog.current?.close()}
        >
          {t.close}
        </button>
      </dialog>
    </div>
  );
}
