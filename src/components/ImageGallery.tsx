"use client";

import { useState, useEffect, useMemo, useRef } from "react";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedImages = useMemo(() => {
    const safe = Array.isArray(images)
      ? images
          .map((img) => (typeof img === "string" ? img.trim() : ""))
          .filter(Boolean)
      : [];

    return Array.from(new Set(safe));
  }, [images]);

  const imageCount = normalizedImages.length;

  useEffect(() => {
    if (selectedIndex >= imageCount) {
      setSelectedIndex(0);
    }
  }, [imageCount, selectedIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (imageCount <= 1) return;

      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [imageCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe(e.targetTouches[0]?.clientX || e.changedTouches[0].clientX);
  };

  const handleSwipe = (endX: number) => {
    if (imageCount <= 1) return;

    const distance = touchStart - endX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // السحب لليسار = الصورة التالية
      setSelectedIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      // السحب لليمين = الصورة السابقة
      setSelectedIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
    }
  };

  const goToPrevious = () => {
    if (imageCount <= 1) return;
    setSelectedIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  const goToNext = () => {
    if (imageCount <= 1) return;
    setSelectedIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  if (imageCount === 0) {
    return (
      <div className="w-full bg-gray-200 rounded-lg h-80 flex items-center justify-center">
        <span className="text-gray-500">لا توجد صور</span>
      </div>
    );
  }

  const currentImage = normalizedImages[selectedIndex] || normalizedImages[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "1" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImage}
          alt={alt}
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        
        {/* Navigation Arrows */}
        {imageCount > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute z-10 left-2 top-1/2 -translate-y-1/2 bg-black/65 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Previous image"
            >
              <span className="text-xl leading-none">❮</span>
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute z-10 right-2 top-1/2 -translate-y-1/2 bg-black/65 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Next image"
            >
              <span className="text-xl leading-none">❯</span>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {normalizedImages.map((image, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                selectedIndex === index
                  ? "border-red-600"
                  : "border-gray-300"
              }`}
              style={{ cursor: "pointer" }}
            >
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                className="w-full h-full object-cover rounded select-none"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {imageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>{selectedIndex + 1} / {imageCount}</p>
          <p className="text-xs text-gray-500">اسحب للتنقل بين الصور</p>
        </div>
      )}
    </div>
  );
}
