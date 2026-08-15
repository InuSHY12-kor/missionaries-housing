import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

function ImageCarousel({ images, alt }) {
  const [index, setIndex] = useState(0);
  const list = Array.isArray(images) ? images.filter(Boolean) : [];

  if (list.length === 0) {
    return (
      <div className="image-carousel empty">
        <div className="carousel-placeholder">
          <ImageOff size={40} />
          <span>등록된 사진이 없습니다</span>
        </div>
        <style>{carouselStyles}</style>
      </div>
    );
  }

  const prev = () => setIndex(i => (i === 0 ? list.length - 1 : i - 1));
  const next = () => setIndex(i => (i === list.length - 1 ? 0 : i + 1));

  return (
    <div className="image-carousel">
      <img src={list[index]} alt={alt} className="carousel-image" />

      {list.length > 1 && (
        <>
          <button type="button" className="carousel-arrow left" onClick={prev} aria-label="이전 사진">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="carousel-arrow right" onClick={next} aria-label="다음 사진">
            <ChevronRight size={22} />
          </button>
          <div className="carousel-counter">{index + 1} / {list.length}</div>
          <div className="carousel-dots">
            {list.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`carousel-dot ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 사진 보기`}
              />
            ))}
          </div>
        </>
      )}

      <style>{carouselStyles}</style>
    </div>
  );
}

const carouselStyles = `
  .image-carousel {
    position: relative;
    width: 100%;
    height: 100%;
    background: #ecf0f1;
    overflow: hidden;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .carousel-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #95a5a6;
  }

  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.85);
    color: #2c3e50;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: background 0.2s;
  }

  .carousel-arrow:hover {
    background: white;
  }

  .carousel-arrow.left {
    left: 12px;
  }

  .carousel-arrow.right {
    right: 12px;
  }

  .carousel-counter {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.55);
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  .carousel-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.4rem;
  }

  .carousel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.6);
    cursor: pointer;
    padding: 0;
  }

  .carousel-dot.active {
    background: white;
  }
`;

export default ImageCarousel;
