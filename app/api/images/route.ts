import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Campo "url" é obrigatório (string).' },
        { status: 400 },
      );
    }

    // A partir da migração para Firebase Storage, o upload acontece no client-side.
    // Esta rota passa a apenas validar e retornar a URL pública.
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: `Erro no upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
