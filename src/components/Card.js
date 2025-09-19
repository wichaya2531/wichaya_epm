"use client";
import Link from "next/link";
import Image from "next/image";

const Card = ({ title = "", detail = "", link = "#", logo_path }) => {
  return (
    <Link
      className="size-42 bg-white drop-shadow-md rounded-xl hover:shadow-2xl cursor-pointer flex flex-col gap-3 p-6 justify-center transition-transform duration-300 transform hover:scale-105"
      href={link[0]}
      style={{ maxWidth: "200px" }}
    >
      <div className="flex justify-center items-center">
        <Image
          src={logo_path || "/assets/card-logo/NotFound.png"}
          width={50}
          height={50}
          alt="card-logo"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-1xl font-bold text-primary">{title}</h1>
        <div className="overflow-hidden max-h-48">
          {/* แสดง detail เป็น 2 บรรทัด */}
          <p className="text-sm text-secondary line-clamp-2">{detail}</p>
        </div>
      </div>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Link>
  );
};

export default Card;
