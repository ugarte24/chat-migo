import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  CalendarDays,
  Check,
  FolderKanban,
  Layers3,
  ListTodo,
  Lock,
  Mic,
  Monitor,
  Repeat,
  Shield,
  Smartphone,
  Sparkles,
  Timer,
  UserRound,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomationPreview } from "@/components/landing/AutomationPreview";
import { HeroConversation } from "@/components/landing/HeroConversation";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { LandingNav } from "@/components/landing/LandingNav";
import { MemoryPreview } from "@/components/landing/MemoryPreview";
import { Reveal } from "@/components/landing/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dilo" },
      {
        name: "description",
        content:
          "Toca el orbe y dilo. Dilo convierte tu voz en tareas, recordatorios, eventos y automatizaciones. Los avisos llegan al celular.",
      },
      { property: "og:title", content: "Dilo | Organiza, recuerda y automatiza" },
      {
        property: "og:description",
        content:
          "Toca el orbe y dilo. Dilo convierte tu voz en tareas, recordatorios, eventos y automatizaciones. Los avisos llegan al celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap",
      },
    ],
  }),
  component: Landing,
});

const FUNCIONES: { titulo: string; texto: string; icono: LucideIcon }[] = [
  { titulo: "Orbe", texto: "Toca la esfera en el celular. Habla o escribe; Dilo escucha y actúa.", icono: Sparkles },
  { titulo: "Tareas", texto: "Organiza lo que tienes pendiente.", icono: ListTodo },
  { titulo: "Recordatorios", texto: "Te avisa a la hora, en el teléfono, aunque Dilo esté cerrado.", icono: Bell },
  { titulo: "Eventos", texto: "Gestiona reuniones y compromisos.", icono: CalendarDays },
  { titulo: "Memoria", texto: "Conserva información autorizada para futuras conversaciones.", icono: Brain },
  { titulo: "Automatizaciones", texto: "Programa acciones que se ejecutarán solas.", icono: Repeat },
];

const BENEFICIOS: { texto: string; icono: LucideIcon }[] = [
  { texto: "Ahorra tiempo", icono: Timer },
  { texto: "Reduce tareas repetitivas", icono: Repeat },
  { texto: "Evita olvidos", icono: Bell },
  { texto: "Centraliza tus actividades", icono: Layers3 },
  { texto: "Utiliza texto o voz", icono: Mic },
  { texto: "Automatiza tareas", icono: Workflow },
  { texto: "Mantén información organizada", icono: FolderKanban },
];

const AUDIENCIA: { titulo: string; texto: string; icono: LucideIcon }[] = [
  { titulo: "Profesionales", texto: "Gestiona reuniones, tareas y compromisos.", icono: Briefcase },
  { titulo: "Emprendedores", texto: "Organiza actividades y recordatorios de tu día.", icono: Zap },
  { titulo: "Estudiantes", texto: "Controla tareas, fechas y actividades académicas.", icono: BookOpen },
  { titulo: "Personas ocupadas", texto: "Delega parte de la organización diaria.", icono: UserRound },
];

const PRIVACIDAD: { texto: string; icono: LucideIcon }[] = [
  { texto: "Control de memoria", icono: Brain },
  { texto: "Gestión de información", icono: FolderKanban },
  { texto: "Privacidad", icono: Lock },
  { texto: "Seguridad", icono: Shield },
];

const PLANES = [
  {
    nombre: "Básico",
    precio: "49",
    destacado: false,
    items: ["Orbe y voz en el celular", "Tareas y recordatorios", "Avisos en el teléfono"],
  },
  {
    nombre: "Pro",
    precio: "99",
    destacado: true,
    items: ["Todo lo de Básico", "Eventos", "Memoria autorizada", "Automatizaciones"],
  },
  {
    nombre: "Premium",
    precio: "179",
    destacado: false,
    items: ["Todo lo de Pro", "Más capacidad de automatización", "Prioridad de atención"],
  },
];

function Landing() {
  return (
    <div className="font-landing bg-[#F8FAFC] text-[#0F172A] antialiased">
      <LandingNav />

      <main>
        <section
          id="inicio"
          className="relative scroll-mt-24 overflow-hidden px-5 pb-24 pt-28 md:px-8 md:pb-32 md:pt-36"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_12%_-10%,rgb(79_70_229/0.14),transparent_55%),radial-gradient(70%_60%_at_92%_8%,rgb(124_58_237/0.10),transparent_50%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="max-w-xl text-4xl font-extrabold tracking-tight md:text-6xl md:leading-[1.05]">
                Tu día organizado. Tú solo tienes que decirlo.
              </h1>
              <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-[#64748B] md:text-lg">
                Toca el orbe y dilo. Dilo convierte tu voz o tu texto en tareas, recordatorios,
                eventos y automatizaciones. Los avisos llegan al celular.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-7 text-[15px]">
                  <Link to="/iniciar-sesion">Acceso de administración</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 text-[15px]">
                  <a href="#como-funciona">Ver cómo funciona</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-[#64748B]">
                ¿Usas Dilo? Pide el APK a quien administra e instálalo en el teléfono.
              </p>
            </div>
            <HeroConversation />
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
            <Reveal>
              <article className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-8">
                <MarcaIcono icono={Smartphone} />
                <h2 className="mt-6 text-2xl font-extrabold">En el celular</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  El orbe, la voz, las tareas y los avisos viven en la app Android. Toca la
                  esfera, dilo, y Dilo organiza el resto. Los recordatorios llegan aunque la
                  app esté cerrada.
                </p>
              </article>
            </Reveal>
            <Reveal delay={80}>
              <article className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-8">
                <MarcaIcono icono={Monitor} />
                <h2 className="mt-6 text-2xl font-extrabold">En esta web</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  Aquí se presenta el producto y se administra: cuentas, APK y servicios. El
                  orbe no se abre en el navegador.
                </p>
              </article>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Demasiadas cosas que recordar. Demasiadas aplicaciones que abrir.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#64748B] md:text-lg">
                Reuniones, tareas, llamadas, compromisos y recordatorios forman parte de nuestro día.
                Organizarlos manualmente puede consumir tiempo y hacer que algunas actividades
                importantes se olviden.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-14 text-2xl font-extrabold tracking-tight text-primary md:text-4xl">
                ¿Y si simplemente pudieras decirlo?
              </p>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
                Tú lo dices. Dilo se encarga.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#64748B] md:text-lg">
                Habla o escribe al orbe con tus palabras. La inteligencia artificial interpreta
                lo que necesitas y lo convierte en una acción.
              </p>
            </Reveal>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Memoria",
                  d: "Recuerda la información que autorizas.",
                  icono: Brain,
                },
                {
                  n: "02",
                  t: "Acción",
                  d: "Convierte tus instrucciones en acciones concretas.",
                  icono: Zap,
                },
                {
                  n: "03",
                  t: "Automatización",
                  d: "Programa acciones para que ocurran cuando las necesites.",
                  icono: Repeat,
                },
              ].map((item, i) => (
                <Reveal key={item.t} delay={i * 90}>
                  <article className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-8">
                    <div className="flex items-center justify-between">
                      <MarcaIcono icono={item.icono} />
                      <p className="text-sm font-semibold tracking-[0.18em] text-primary">{item.n}</p>
                    </div>
                    <h3 className="mt-8 text-2xl font-extrabold">{item.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{item.d}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                De una frase a una acción.
              </h2>
            </Reveal>
            <ol className="mt-16 grid gap-10 md:grid-cols-4">
              {[
                { n: "01", t: "Toca", d: "Abre Dilo en el celular y toca el orbe.", icono: Smartphone },
                { n: "02", t: "Dilo", d: "Habla o escribe con tus palabras.", icono: Mic },
                { n: "03", t: "Organiza", d: "Dilo registra tareas, recordatorios y eventos.", icono: FolderKanban },
                { n: "04", t: "Avisa", d: "Cuando toca, el aviso llega al teléfono.", icono: Bell },
              ].map((paso, i) => (
                <Reveal key={paso.n} delay={i * 100}>
                  <li>
                    <MarcaIcono icono={paso.icono} />
                    <p className="mt-5 text-4xl font-extrabold text-primary/20">{paso.n}</p>
                    <h3 className="mt-4 text-lg font-extrabold uppercase tracking-wide">{paso.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{paso.d}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
                Habla como siempre. El sistema entiende.
              </h2>
            </Reveal>
            <div className="mt-12">
              <Reveal>
                <InteractiveDemo />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="funciones" className="scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
                Todo lo que necesitas para organizar tu día.
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FUNCIONES.map((f, i) => (
                <Reveal key={f.titulo} delay={i * 60}>
                  <article className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-7">
                    <MarcaIcono icono={f.icono} />
                    <h3 className="mt-6 text-lg font-extrabold">{f.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{f.texto}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <MarcaIcono icono={Brain} />
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-5xl">
                No tienes que repetirlo todo.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#64748B] md:text-lg">
                Dilo puede conservar información que tú autorices para hacer más útiles
                las próximas conversaciones.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <MemoryPreview />
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <MarcaIcono icono={Repeat} />
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-5xl">
                Hazlo una vez. Déjalo programado.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#64748B] md:text-lg">
                Dilo no solo conversa: ejecuta. Programa una acción y recíbela en el celular
                cuando corresponde, sin volver a pedirla.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <AutomationPreview />
            </Reveal>
          </div>
        </section>

        <section id="beneficios" className="scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Más organización. Menos esfuerzo.
              </h2>
            </Reveal>
            <ul className="mt-14 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
              {BENEFICIOS.map((b, i) => (
                <Reveal
                  key={b.texto}
                  as="li"
                  delay={i * 40}
                  className="flex items-center gap-4 py-4 text-lg font-medium md:text-xl"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icono className="size-4" aria-hidden />
                  </span>
                  {b.texto}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
                Diseñado para personas que tienen mucho que hacer.
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-5 sm:grid-cols-2">
              {AUDIENCIA.map((a, i) => (
                <Reveal key={a.titulo} delay={i * 70}>
                  <article className="rounded-2xl border border-[#E2E8F0] bg-white p-8">
                    <MarcaIcono icono={a.icono} />
                    <h3 className="mt-6 text-xl font-extrabold">{a.titulo}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{a.texto}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Empieza a organizar tu día.
              </h2>
              <p className="mt-4 text-sm text-[#64748B]">
                Precios mensuales en bolivianos. Los planes se usan en la app Android. El acceso
                web es para quien administra.
              </p>
            </Reveal>
            <div className="mt-16 grid gap-5 lg:grid-cols-3">
              {PLANES.map((plan, i) => (
                <Reveal key={plan.nombre} delay={i * 80}>
                  <article
                    className={`flex h-full flex-col rounded-2xl border p-8 ${
                      plan.destacado
                        ? "border-primary/20 bg-white shadow-[0_24px_50px_-28px_rgb(79_70_229/0.55)]"
                        : "border-[#E2E8F0] bg-white"
                    }`}
                  >
                    {plan.destacado && (
                      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Recomendado
                      </p>
                    )}
                    <h3 className="text-2xl font-extrabold">{plan.nombre}</h3>
                    <p className="mt-3 flex items-baseline gap-1">
                      <span className="text-sm font-medium text-[#64748B]">Bs</span>
                      <span className="text-4xl font-extrabold tracking-tight">{plan.precio}</span>
                      <span className="text-sm text-[#64748B]">/mes</span>
                    </p>
                    <ul className="mt-8 flex-1 space-y-3 text-sm text-[#64748B]">
                      {plan.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-8" variant={plan.destacado ? "default" : "outline"}>
                      <Link to="/iniciar-sesion">Acceso de administración</Link>
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="privacidad" className="scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Tu información, bajo tu control.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#64748B] md:text-lg">
                Diseñamos Dilo para que puedas gestionar la información que autorizas
                almacenar y decidir qué quieres conservar o eliminar.
              </p>
            </Reveal>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {PRIVACIDAD.map((item, i) => (
                <Reveal
                  key={item.texto}
                  as="li"
                  delay={i * 60}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm font-medium"
                >
                  <item.icono className="size-4 text-primary" aria-hidden />
                  {item.texto}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 pb-24 md:px-8 md:pb-32">
          <Reveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-accent px-8 py-16 text-white md:px-16 md:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgb(255_255_255/0.16),transparent_40%)]" />
              <div className="relative max-w-2xl">
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Deja de intentar recordarlo todo.
                </h2>
                <p className="mt-5 text-base text-white/80 md:text-lg">
                  Toca el orbe, dilo, y deja que Dilo lo organice. Los avisos llegan al celular.
                </p>
                <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-7">
                  <Link to="/iniciar-sesion">Acceso de administración</Link>
                </Button>
                <p className="mt-5 text-sm text-white/70">
                  El producto se usa en la app Android. Esta web es presentación y administración.
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#E2E8F0] px-5 py-16 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-extrabold">
              Dilo
            </p>
            <p className="mt-2 text-sm text-[#64748B]">
              Toca el orbe. Organiza. Recuerda. Automatiza.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#64748B]" aria-label="Pie de página">
            <a href="#funciones" className="hover:text-foreground">
              Producto
            </a>
            <a href="#funciones" className="hover:text-foreground">
              Funciones
            </a>
            <a href="#precios" className="hover:text-foreground">
              Precios
            </a>
            <a href="#privacidad" className="hover:text-foreground">
              Privacidad
            </a>
            <span>Términos</span>
            <span>Contacto</span>
            <Link to="/admin" className="hover:text-foreground">
              Administración
            </Link>
          </nav>
        </div>
        <p className="mx-auto mt-12 max-w-6xl text-xs text-[#64748B]">
          © {new Date().getFullYear()} Dilo. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

function MarcaIcono({ icono: Icono }: { icono: LucideIcon }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icono className="size-5" aria-hidden />
    </span>
  );
}
