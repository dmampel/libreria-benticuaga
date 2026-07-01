import Image from "next/image";
import headerImg from "@/public/header.png";
import HeroGreeting from "@/components/HeroGreeting";

export default function Hero({ hideButtons = false }: { hideButtons?: boolean } = {}) {
  return (
    <section className="bg-white">
      <Image
        src={headerImg}
        alt=""
        priority
        sizes="100vw"
        className="h-auto w-full"
      />
      <HeroGreeting hideButtons={hideButtons} />
    </section>
  );
}
