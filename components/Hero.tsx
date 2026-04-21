import Image from "next/image";
import Link from "next/link";
import headerImg from "@/public/header.png";
import { cookies } from "next/headers";

export default async function Hero({ hideButtons = false }: { hideButtons?: boolean } = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let userName = "";
  if (token) {
    try {
      const payload = token.split(".")[1];
      if (payload) {
        const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
        userName = decoded.firstName || decoded.email || "amigo";
      }
    } catch (e) {}
  }

  return (
    <section className="bg-white">
      {/* Background image — shown in full, natural proportions */}
      <Image
        src={headerImg}
        alt=""
        priority
        sizes="100vw"
        className="h-auto w-full"
      />

      {/* Center content: logo + buttons */}
      <div className="flex flex-col items-center gap-5 px-4 py-6 my-3">
        {!userName ? (
          <p className="md:text-2xl text-lg text-center font-light text-gray-600">
            ¡Bienvenido a nuestra nueva tienda online!
            <br />
            Te invitamos a explorar nuestro catálogo de productos premium.
          </p>
        ) : (
          <p className="text-xl md:text-3xl font-sans text-center text-gray-600">
            ¡Estas devuelta, <span className="text-violet-600 font-semibold">{userName}</span>!
          </p>
        )}

        {/* CTA buttons + link */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {!userName && (
            <>
              <Link
                href="/auth/register"
                id="home-register-btn"
                className="rounded-xl bg-violet-400 px-7 py-2.5 text-md font-semibold text-white shadow-md transition-all duration-200 hover:bg-violet-600 hover:shadow-lg active:scale-95"
              >
                Crear una cuenta
              </Link>
              <Link
                href="/auth/login"
                id="home-login-btn"
                className="rounded-xl bg-blue-400 px-7 py-2.5 text-md font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-600 hover:shadow-lg active:scale-95"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {!hideButtons && (
            <Link
              href="/products"
              id="home-products-link"
              className="text-2xl text-gray-700 mt-3 transition-colors hover:text-blue-600 sm:ml-4"
            >
              Ir a la tienda →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}