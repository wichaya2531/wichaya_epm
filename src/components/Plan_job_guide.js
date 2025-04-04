"use client";

import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

const Slideshow = () => {
  const swiperRef = useRef(null);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.swiper.params.navigation.prevEl = ".swiper-button-prev";
      swiperRef.current.swiper.params.navigation.nextEl = ".swiper-button-next";
      swiperRef.current.swiper.navigation.init();
      swiperRef.current.swiper.navigation.update();
    }
  }, []);

  return (
    <div className="relative w-full mx-auto">
      <center>
        <h1>&nbsp;</h1>
      </center>
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        pagination={{ clickable: true }}
        className="swiper-container"
      >
        <SwiperSlide>
          <center>
            <img
              src="/help_image/planning/1.png"
              alt="Slide 1"
              className="w-full h-auto max-w-[900px] mx-auto" // ขนาดรูปยืดหยุ่นตามขนาดหน้าจอ
            />
          </center>
        </SwiperSlide>
        <SwiperSlide>
          <center>
            <img
              src="/help_image/planning/2.png"
              alt="Slide 2"
              className="w-full h-auto max-w-[900px] mx-auto"
            />
          </center>
        </SwiperSlide>
        <SwiperSlide>
          <center>
            <img
              src="/help_image/planning/3.png"
              alt="Slide 3"
              className="w-full h-auto max-w-[900px] mx-auto"
            />
          </center>
        </SwiperSlide>
        <SwiperSlide>
          <center>
            <img
              src="/help_image/planning/4.png"
              alt="Slide 4"
              className="w-full h-auto max-w-[900px] mx-auto"
            />
          </center>
        </SwiperSlide>
        <SwiperSlide>
          <center>
            <img
              src="/help_image/planning/5.png"
              alt="Slide 5"
              className="w-full h-auto max-w-[900px] mx-auto"
            />
          </center>
        </SwiperSlide>
      </Swiper>

      {/* ปุ่ม Previous และ Next */}
      <button className="swiper-button-prev absolute left-1 top-1/8 transform -translate-y-2 bg-none-700 text-white px-3 py-1 rounded z-10 flex flex-row-reverse items-center">
        <span>Prev</span>
      </button>

      <button className="swiper-button-next absolute right-1 top-1/8 transform -translate-y-2 bg-none-700 text-white px-3 py-1 rounded z-10 ">
        Next
      </button>
    </div>
  );
};

export default Slideshow;
