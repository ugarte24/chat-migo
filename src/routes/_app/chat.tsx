import { createFileRoute } from "@tanstack/react-router";
import { ChatWhatsApp, SUGERENCIAS_CHAT } from "@/components/ChatWhatsApp";
import { PageHeader } from "@/components/panel/PageHeader";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [
      { title: "Chat | Dilo" },
      {
        name: "description",
        content: "Simula una conversación con el asistente: texto, notas de voz e interpretación de IA.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { mensajes, enviarMensaje } = useAsistente();

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader
        titulo="Chat"
        descripcion="Escribe como lo harías por WhatsApp. La IA interpreta la instrucción, extrae los datos y registra la actividad."
      />
      <div className="min-h-0 flex-1">
        <ChatWhatsApp mensajes={mensajes} onEnviar={enviarMensaje} sugerencias={SUGERENCIAS_CHAT} />
      </div>
    </div>
  );
}
