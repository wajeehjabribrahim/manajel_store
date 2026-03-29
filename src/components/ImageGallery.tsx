"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useLanguage } from "@/contexts/LanguageContext";
import "swiper/css";
import "swiper/css/navigation";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

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
      if (swiperRef.current && imageCount > 0) {
        swiperRef.current.slideTo(0);
      }
    }
  }, [imageCount, selectedIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (imageCount <= 1) return;

      if (e.key === "ArrowLeft") {
        swiperRef.current?.slidePrev();
      } else if (e.key === "ArrowRight") {
        swiperRef.current?.slideNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [imageCount]);

  if (imageCount === 0) {
    return (
      <div className="w-full bg-gray-200 rounded-lg h-80 flex items-center justify-center">
        <span className="text-gray-700">لا توجد صور</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
        <Swiper
          modules={[Navigation]}
          navigation={imageCount > 1}
          spaceBetween={10}
          slidesPerView={1}
          resistance={true}
          resistanceRatio={0.85}
          speed={500}
          grabCursor={true}
          followFinger={true}
          touchRatio={1}
          simulateTouch={true}
          className="h-full w-full product-gallery-swiper"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setSelectedIndex(swiper.activeIndex || 0);
          }}
          onSlideChange={(swiper) => setSelectedIndex(swiper.activeIndex)}
        >
          {normalizedImages.map((image, index) => (
            <SwiperSlide key={`${image}-${index}`}>
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                className="w-full h-full object-cover object-center select-none bg-[#121416]"
                draggable={false}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbnails */}
      {imageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {normalizedImages.map((image, index) => (
            <button
              type="button"
              key={index}
              onClick={() => {
                swiperRef.current?.slideTo(index);
                setSelectedIndex(index);
              }}
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
           <p className="text-xs text-gray-600">{t("product.swipeToNavigate")}</p>
        </div>
      )}

      <style jsx global>{`
        .product-gallery-swiper .swiper-slide {
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}
