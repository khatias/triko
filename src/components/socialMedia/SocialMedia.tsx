import Link from "next/link";
import Image from "next/image";
import tiktok from "../../assets/svgs/tiktok.png";
import fb from "../../assets/svgs/fb.png";
import instagram from "../../assets/svgs/instagram.png";

const socials = [
  { href: "https://facebook.com/yourpage", label: "Facebook", icon: fb },
  { href: "https://instagram.com/yourpage", label: "Instagram", icon: instagram },
  { href: "https://tiktok.com/@yourpage", label: "TikTok", icon: tiktok },
];

export default function SocialMedia() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="mt-4 flex justify-start gap-4">
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
