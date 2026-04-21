"use client";
import TrustCard from "./TrustCard";

const trustFeatures = [
  {
    title: "Devolución y Cambios Gratis",
    description:
      "Si no quedás conforme podés cambiarlo o te devolvemos el dinero.",
    badge: "Garantizado",
    colorScheme: "emerald" as const,
    rotation: "-rotate-3",
    hasWashiTape: true,
    tapePosition: "left",
    offset: "lg:translate-y-4",
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
        />
      </svg>
    ),
  },
  {
    title: "Atención 24 hs",
    description: "¿Dudas a las 3am? Estamos acá para vos.",
    badge: "SOPORTE REAL",
    colorScheme: "violet" as const,
    rotation: "rotate-2",
    hasWashiTape: false,
    pinPosition: "left",
    offset: "lg:translate-y-[-12px]",
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.023c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
    ),
  },
  {
    title: "Todos los Medios de Pago",
    description:
      "Mercado pago, transferencia, tarjetas de débito o crédito, efectivo.",
    badge: "100% SEGURO",
    colorScheme: "blue" as const,
    rotation: "-rotate-1",
    hasWashiTape: true,
    tapePosition: "right",
    offset: "lg:translate-y-8",
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6.11a11.99 11.99 0 003 9.274 12.146 12.146 0 005.402 3.123 12.146 12.146 0 005.403-3.122 11.99 11.99 0 003-9.274 11.959 11.959 0 01-8.402-3.386z"
        />
      </svg>
    ),
  },
  {
    title: "Envíos y Retiros",
    description: "Envío a domicilio o retiro sin cargo en sucursal.",
    badge: "A TODO EL PAÍS",
    colorScheme: "amber" as const,
    rotation: "rotate-3",
    hasWashiTape: false,
    pinPosition: "right",
    offset: "lg:translate-y-[-4px]",
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.806H9.75M12 4.5v14.25m0-14.25a1.125 1.125 0 011.125-1.125V3h-.75"
        />
      </svg>
    ),
  },
];

export default function TrustSection() {
  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      {/* Notebook Grid / Dots Pattern */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[linear-gradient(90deg,transparent_23px,rgba(0,0,0,0.5)_24px),linear-gradient(transparent_23px,rgba(0,0,0,0.5)_24px)] [background-size:24px_24px]" />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        {/* Thematic Header */}
        <div className="relative mb-24 text-center">
          <p className="mx-auto mb-4 w-fit -rotate-2 rounded-md bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-700 shadow-sm">
            Nuestros Valores
          </p>

          <h2 className="relative inline-block font-sans text-4xl font-black tracking-tight text-gray-900 sm:text-6xl">
            Comprar es fácil
            <div className="mt-2 text-violet-600 italic">y muy seguro</div>
            {/* Handdrawn underline circle */}
            <svg
              className="absolute -bottom-6 left-1/2 h-8 w-[120%] -translate-x-1/2 text-pink-400 opacity-30"
              viewBox="0 0 400 30"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M5 25C100 5 300 5 395 25"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </h2>
        </div>

        {/* Scattered Features Cloud */}
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => (
            <div
              key={index}
              className={`w-full sm:w-[270px] ${feature.offset || ""}`}
            >
              <TrustCard
                {...feature}
                tapePosition={feature.tapePosition}
                pinPosition={feature.pinPosition}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
