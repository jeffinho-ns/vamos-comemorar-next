"use client";

import { Component, type ReactNode } from "react";

/** Impede que um erro de uma sub-aba derrube o BI inteiro. */
export class FalhaAba extends Component<{ children: ReactNode; nome: string }, { msg: string | null }> {
  state = { msg: null as string | null };

  static getDerivedStateFromError(erro: Error) {
    return { msg: erro && erro.message ? erro.message : "falha" };
  }

  render() {
    if (this.state.msg) {
      return (
        <section className="sjCard sjBloco">
          <p className="sjAlert r">Não consegui abrir {this.props.nome}. Recarregue a página.</p>
        </section>
      );
    }
    return this.props.children;
  }
}
