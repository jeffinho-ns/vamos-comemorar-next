"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded: () => void;
  eventId: number;
  userId: number;
}

export default function AddGuestModal({
  isOpen,
  onClose,
  onGuestAdded,
  eventId,
  userId,
}: AddGuestModalProps) {
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [lista, setLista] = useState("Geral");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async () => {
    const token = localStorage.getItem('authToken'); // <-- Pega o token salvo
    console.log('Token atual:', token);
    if (!token) {
      setErro('Você precisa estar logado para adicionar convidados.');
      setLoading(false);
      return;
    }

    if (!nome) {
      setErro("O nome é obrigatório.");
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const res = await fetch("https://vamos-comemorar-api.onrender.com/api/convidados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          documento,
          lista,
          event_id: eventId,
          adicionado_por: userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao adicionar convidado.");
      }

      setNome("");
      setDocumento("");
      setLista("Geral");
      onGuestAdded(); // Atualiza a lista
      onClose(); // Fecha o modal
    } catch (err) {
      console.error(err);
      setErro("Erro ao adicionar convidado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">
                  Adicionar Convidado
                </Dialog.Title>

                <div className="space-y-4">
                  <Input
                    placeholder="Nome do convidado"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <Input
                    placeholder="Documento (opcional)"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                  />
                  <Input
                    placeholder="Lista (ex: VIP, Backstage)"
                    value={lista}
                    onChange={(e) => setLista(e.target.value)}
                  />
                </div>

                {erro && <p className="text-sm text-red-500 mt-3">{erro}</p>}

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
