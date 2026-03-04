import Link from "next/link";
import Image from "next/image";
// import tiktok from "../../assets/svgs/tiktok.png";
import fb from "../../assets/svgs/fb.png";
import instagram from "../../assets/svgs/instagram.png";

const socials = [
  { href: "https://www.facebook.com/triko0", label: "Facebook", icon: fb },
  {
    href: "https://www.instagram.com/triko00",
    label: "Instagram",
    icon: instagram,
  },
  // { href: "https://www.tiktok.com/@triko0", label: "TikTok", icon: tiktok },
];

export default function SocialMedia() {
  return (
    <div className="">
      <div className=" flex items-center justify-center gap-4">
        {socials.map(({ href, label, icon }) => (
          <Link key={label} href={href} target="_blank" aria-label={label}>
            <Image
              src={icon}
              alt={label}
              width={28}
              height={28}
              className="transition-transform hover:scale-110"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
