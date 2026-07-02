'use client';

import { useEffect, useState } from 'react';
import { MdLink, MdOndemandVideo, MdDescription, MdOpenInNew } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { getApiUrl } from '@/app/config/api';

type TrainingMaterial = {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  url: string | null;
  module_key: string | null;
};

function iconForType(type: string) {
  if (type === 'video') return MdOndemandVideo;
  if (type === 'doc') return MdDescription;
  return MdLink;
}

export default function MateriaisSaasSection() {
  const [items, setItems] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${getApiUrl()}/api/me/training-materials`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((body) => setItems(body.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="materiais-saas" className="mb-8">
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Carregando materiais de treinamento…
          </CardContent>
        </Card>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="materiais-saas" className="mb-8">
      <Card className="border-amber-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 Materiais e treinamentos
          </CardTitle>
          <p className="text-sm text-gray-500 font-normal">
            Links e recursos liberados para o seu plano e módulos contratados.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const Icon = iconForType(item.content_type);
            const href = item.url?.startsWith('http')
              ? item.url
              : item.url
                ? item.url
                : null;
            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <Icon className="mt-1 shrink-0 text-amber-600" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.module_key && (
                    <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {item.module_key}
                    </span>
                  )}
                  {href && (
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noreferrer' : undefined}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Abrir material
                      <MdOpenInNew size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
