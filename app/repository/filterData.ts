// repository/filterData.js

export const filterData = [
  "Empresa",
  "Icone",
  "Nome",
  "Convidados",
  "Criado em",
  "Ações",
];

export const users = [
  {
    name: "User 01",
    email: "user@hotmail.com",
    telefone: "2199999999",
    status: "pendente",
    createAt: "16/06/2024",
  },
];

export const infos = {
  users: 405,
  places: 10,
  reservation: 600, // Número total de reservas
  points: 1200,

  // --- NOVOS DADOS ADICIONADOS PARA OS GRÁFICOS ---
  totalApprovedReserves: 450, // Exemplo: 450 reservas aprovadas
  totalRejectedReserves: 50,  // Exemplo: 50 reservas reprovadas

  reservesByMonth: [
    { name: 'Jan', Aprovadas: 30, Reprovadas: 5 },
    { name: 'Fev', Aprovadas: 45, Reprovadas: 8 },
    { name: 'Mar', Aprovadas: 60, Reprovadas: 10 },
    { name: 'Abr', Aprovadas: 70, Reprovadas: 12 },
    { name: 'Mai', Aprovadas: 80, Reprovadas: 15 },
    { name: 'Jun', Aprovadas: 75, Reprovadas: 10 },
    { name: 'Jul', Aprovadas: 90, Reprovadas: 18 }, // Mês atual
  ],
  reservesStatusDistribution: [
    { name: 'Aprovadas', value: 450 },
    { name: 'Aguardando', value: 100 },
    { name: 'Reprovadas', value: 50 },
  ],
  // --- FIM DOS NOVOS DADOS ---
};