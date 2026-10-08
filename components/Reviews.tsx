import { prisma } from "@/lib/prisma";

export default async function Reviews() {
  const reviews = await prisma.review.findMany({
    where: { approved: true, comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-widest text-gray-400">
        Lo que dicen nuestros clientes
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-amber-400" aria-label={`${r.rating} de 5`}>
              {"★".repeat(r.rating)}
              <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
            </div>
            <blockquote className="mt-2 text-sm text-gray-700">{r.comment}</blockquote>
            <figcaption className="mt-3 text-xs font-semibold text-gray-500">
              {r.customerName ?? "Cliente"}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
