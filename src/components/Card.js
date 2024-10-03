"use client";
import Link from "next/link";
import Image from "next/image";

const Card = ({ title = "", detail = "", link = "#", logo_path }) => {
  return (
    <Link
      className="size-52   bg-white drop-shadow-lg rounded-xl hover:shadow-2xl cursor-pointer flex flex-col gap-3 p-6 justify-center items-start"
      href={link[0]}
    >
      <Image
        src={logo_path || "/assets/card-logo/NotFound.png"}
        width={50}
        height={50}
      />
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-secondary max-h-48">{detail}</p>
      </div>
    </Link>
  );
};

export default Card;
