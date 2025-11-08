
import React from 'react';
// Mock chat data
const mockChats = [
  {
    id: 'chat1',
    title: '¿Cuál es el mejor destino para viajar en diciembre?',
    status: 'En proceso',
  },
  {
    id: 'chat2',
    title: '¿Me puedes ayudar a planear mi viaje a París?',
    status: 'Finalizado',
  },
  {
    id: 'chat3',
    title: '¿Qué documentos necesito para viajar a Japón?',
    status: 'En proceso',
  },
];

const statusColors: Record<string, string> = {
  'En proceso': 'bg-yellow-100 text-yellow-800',
  'Finalizado': 'bg-green-100 text-green-800',
};

export default function ChatsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Mis Chats</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockChats.map(chat => (
          <div
            key={chat.id}
            className="rounded-lg shadow-md bg-white p-6 flex flex-col justify-between hover:shadow-lg transition-shadow"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{chat.title}</h2>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${statusColors[chat.status]}`}
              >
                {chat.status}
              </span>
            </div>
            <div className="mt-4 text-xs text-gray-500">ID: {chat.id}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
// ...existing code...
