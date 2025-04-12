'use client'

import { useState } from 'react'
//import * as XLSX from 'xlsx'

interface Props {
  eventId: string
}

export default function ImportarConvidados({ eventId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      setMensagem('Por favor, selecione um arquivo.')
      return
    }

    setLoading(true)
    setMensagem('')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const nomes = jsonData.map((row) => row[0]).filter((nome) => nome && typeof nome === 'string')

      const res = await fetch(`https://vamos-comemorar-api.onrender.com/api/convidados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, nomes }),
      })

      if (!res.ok) throw new Error('Erro ao enviar convidados')

      setMensagem('Convidados importados com sucesso!')
      setFile(null)
    } catch (error) {
      console.error(error)
      setMensagem('Erro ao importar convidados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="w-full"
      />

      <button
        onClick={handleImport}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !file}
      >
        {loading ? 'Importando...' : 'Importar convidados'}
      </button>

      {mensagem && <p className="text-sm text-gray-600">{mensagem}</p>}
    </div>
  )
}
